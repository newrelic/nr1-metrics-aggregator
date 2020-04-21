import {
  AccountsQuery,
  AccountStorageMutation,
  AccountStorageQuery,
  NerdGraphQuery,
  NerdGraphMutation
} from 'nr1';

import { parseCardinalityBatchResponse } from './cardinality-helper';

import { parseNRQL, chunk, parseE2MMetricRuleListFromResponse } from './misc';

import {
  buildCardinalityTimeseriesQueryForBatch,
  buildCardinalityTimeseriesQuery,
  buildRateReductionQueryForMetric,
  buildCreateNewRuleQuery,
  buildRulesQuery,
  buildToggleRuleQuery
} from './graphqlbuilders';

export async function calculateVolumeReductionForMetric(metric) {
  const { eventType, wheres } = parseNRQL(metric.nrql);
  const { accountId, metricName } = metric;
  let { data, errors } = await NerdGraphQuery.query(
    buildRateReductionQueryForMetric(accountId, eventType, wheres, metricName)
  );
  let eventRate = null;
  let metricRate = null;
  if (!errors) {
    try {
      eventRate = data.actor.EventRate.nrql.results[0].eventrate;
      metricRate = data.actor.MetricRate.nrql.results[0].metricrate;
    } catch (err) {
      errors = err;
    }
  }
  return { eventRate, metricRate, errors };
}

export function createNewRuleGraphQuery(
  accountId,
  nrql,
  ruleAlias,
  ruleDescription
) {
  return buildCreateNewRuleQuery(accountId, nrql, ruleAlias, ruleDescription);
}

async function createNewRule(accountId, nrql, ruleAlias, ruleDescription) {
  const mutation = buildCreateNewRuleQuery(
    accountId,
    nrql,
    ruleAlias,
    ruleDescription
  );
  const response = await NerdGraphMutation.mutate(mutation);
  return response;
}
export async function createAndSaveNewRule(
  accountId,
  nrql,
  ruleAlias,
  ruleDescription
) {
  const { data, error } = await createNewRule(
    accountId,
    nrql,
    ruleAlias,
    ruleDescription
  );
  if (error || data.eventsToMetricsCreateRule.failures.length) {
    return { result: null, error };
  }
  const newRule = data.eventsToMetricsCreateRule.successes[0];
  return await storeRuleCardinalityIfOtherCardinalityStored(accountId, newRule);
}

async function calculateCardinalityForRuleBatch(batchOfRules, accountId) {
  const batchQueryInfo = batchOfRules.map(rule => {
    const { eventType, facets, wheres } = parseNRQL(rule.nrql);
    return { eventType, facets, accountId, wheres };
  });

  const response = await NerdGraphQuery.query(
    buildCardinalityTimeseriesQueryForBatch(batchQueryInfo)
  );
  return response;
}

function getNextWeekInSeconds() {
  return Date.now() + 7 * 24 * 60 * 60 * 1000;
}

function cardinalityExpired(cardinalityStorageResponse) {
  // return true
  if (
    !cardinalityStorageResponse ||
    !cardinalityStorageResponse.data ||
    cardinalityStorageResponse.data.cardinalities < 10 ||
    !cardinalityStorageResponse.data.beginTimeSeconds
  ) {
    return true;
  } else {
    return cardinalityStorageResponse.data.expiration < Date.now();
  }
}

async function queryNerdStorageForCardinalityForAccount(accountId) {
  const result = await AccountStorageQuery.query({
    accountId: parseInt(accountId),
    collection: 'e2m',
    documentId: 'e2m'
  });

  return result;
}

async function saveCardinalityForAccountToNerdStorage(
  accountId,
  cardinalitiesForAccount
) {
  if (!cardinalitiesForAccount || !cardinalitiesForAccount.cardinalities) {
    return false;
  }
  cardinalitiesForAccount.expiration = getNextWeekInSeconds();
  return await AccountStorageMutation.mutate({
    accountId: accountId,
    actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection: 'e2m',
    documentId: 'e2m',
    document: JSON.stringify(cardinalitiesForAccount)
  });
}

async function storeRuleCardinalityIfOtherCardinalityStored(accountId, rule) {
  const cardinalityStorageResponse = await queryNerdStorageForCardinalityForAccount(
    accountId
  );
  // If other cardinalities aren't stored, no need to store this one
  if (!cardinalityStorageResponse || !cardinalityStorageResponse.data) {
    return { response: false, error: null };
  }
  const cardinalitiesForAccount = cardinalityStorageResponse.data;
  const newCardinalitiesForAccount = await calculateCardinalityForEnabledRulesForAccount(
    accountId,
    [rule],
    () => true,
    e => console.log(e)
  );

  // Add new cardinality to list
  cardinalitiesForAccount.cardinalities.push(
    newCardinalitiesForAccount.cardinalities[0]
  );
  return await saveCardinalityForAccountToNerdStorage(
    accountId,
    cardinalitiesForAccount
  );
}

export async function getE2MRulesForAccountObj(accounts) {
  const BATCH_SIZE = 15;
  const accountBatchArray = chunk(accounts, BATCH_SIZE);
  let e2mRules = [];

  for (let i = 0; i < accountBatchArray.length; i++) {
    const { data, errors } = await NerdGraphQuery.query(
      buildRulesQuery(accountBatchArray[i])
    );
    if (errors) {
      throw errors;
    }
    const rulesForBatch = parseE2MMetricRuleListFromResponse(data);
    e2mRules = e2mRules.concat(rulesForBatch);
  }
  return e2mRules;
}

// NOTE: There seems to be a bug in the SDK for AccountsQuery. I error when I try to
//       use it imperatively.
export async function getAccountsForUser() {
  const { data, errors } = await AccountsQuery.query();
  if (errors) {
    throw errors;
  }
  // Convert accounts array to object for easier processing
  return data;
}

async function calculateCardinalityForEnabledRulesForAccount(
  accountId,
  e2mRulesForAccount,
  addBatchOfCardinalitiesForAccount,
  onError
) {
  const cardinalitiesForAccount = {
    beginTimeSeconds: [],
    accountId,
    cardinalities: []
  };
  const BATCH_SIZE = 5;
  const ruleBatchArray = chunk(e2mRulesForAccount, BATCH_SIZE);
  for (let i = 0; i < ruleBatchArray.length; i++) {
    try {
      const batchOfRules = ruleBatchArray[i];
      const { data, errors } = await calculateCardinalityForRuleBatch(
        batchOfRules,
        accountId
      );
      if (errors) {
        onError(JSON.stringify(errors));
      } else if (!data) {
        onError('No cardinality data returned');
      } else {
        const timeseriesArray = parseCardinalityBatchResponse(data);
        for (let j = 0; j < timeseriesArray.length; j++) {
          const cardinalityTimeseries = timeseriesArray[j];
          const rule = batchOfRules[j];
          const beginTimeSeconds = cardinalityTimeseries.map(
            obj => obj.beginTimeSeconds
          );
          const cardinality = cardinalityTimeseries.map(
            cardinalityObj => cardinalityObj.cardinality
          );
          cardinalitiesForAccount.beginTimeSeconds = beginTimeSeconds;
          cardinalitiesForAccount.cardinalities.push({
            id: rule.id,
            cardinality
          });
          console.log(
            `${accountId} rule ${i * BATCH_SIZE + 1 + j} / ${
              e2mRulesForAccount.length
            }`
          );
        }
        addBatchOfCardinalitiesForAccount(cardinalitiesForAccount);
      }
    } catch (error) {
      onError(error);
    }
  }
  return cardinalitiesForAccount;
}

export async function loadCardinalityForAllEnabledRules(
  e2mRules,
  accountId,
  addBatchOfCardinalitiesForAccount,
  onError,
  bustCache = false
) {
  // If there are no e2mRules, you can return early
  if (!e2mRules || !e2mRules.length) {
    const result = {};
    result[accountId] = null;
    return result;
  }
  const e2mRulesForAccount = e2mRules.filter(
    rule => rule.accountId == accountId && rule.enabled
  );
  if (!e2mRulesForAccount || !e2mRulesForAccount.length) {
    return { beginTimeSeconds: [], accountId, cardinalities: [] };
  }

  const cardinalityStorageResponse = await queryNerdStorageForCardinalityForAccount(
    accountId
  );
  let cardinalitiesForAccount;
  if (
    !bustCache &&
    !cardinalityExpired(cardinalityStorageResponse) &&
    cardinalityStorageResponse.data.cardinalities
  ) {
    cardinalitiesForAccount = cardinalityStorageResponse.data;
  } else {
    cardinalitiesForAccount = await calculateCardinalityForEnabledRulesForAccount(
      accountId,
      e2mRulesForAccount,
      addBatchOfCardinalitiesForAccount,
      onError
    );
    await saveCardinalityForAccountToNerdStorage(
      accountId,
      cardinalitiesForAccount
    );
  }

  return cardinalitiesForAccount;
}

const CARDINALITY_LIMIT_PER_RULE = 20000;
const CARDINALITY_LIMIT_PER_ACCOUNT = 5000000;

function determineRuleCardinalityViolation(results) {
  const cardinalityArray = results.map(i => i.cardinality);
  const timeseriesMax = Math.max(...cardinalityArray);
  return timeseriesMax > CARDINALITY_LIMIT_PER_RULE;
}

function deterineAccountCardinalityViolationFromData(
  results,
  cardinalityTotals
) {
  if (!cardinalityTotals) {
    return null;
  }
  const totalMax = Math.max(...cardinalityTotals);
  const cardinalityArray = results.map(i => i.cardinality);
  const timeseriesMax = Math.max(...cardinalityArray);
  return totalMax + timeseriesMax > CARDINALITY_LIMIT_PER_ACCOUNT;
}

export async function findRuleViolations(
  selectedAccountID,
  selectedEventType,
  selectedFacetAttributes,
  timerangeArray,
  cardinalityTotals
) {
  const since = timerangeArray[0];
  const until = timerangeArray[timerangeArray.length - 1];
  const { data, error } = await NerdGraphQuery.query(
    buildCardinalityTimeseriesQuery(
      selectedAccountID,
      selectedEventType,
      selectedFacetAttributes.map(attrObj => attrObj.key),
      since,
      until
    )
  );
  if (error) {
    console.log('Error validating rule:', error);
    return;
  }
  // Note: cannot use 'forEach' methods when needingn to break out of loops
  const results = data.actor[`query${selectedAccountID}`].nrql.results;
  const cardinalityRuleViolation = determineRuleCardinalityViolation(results);
  const cardinalityAccountViolation = cardinalityTotals
    ? deterineAccountCardinalityViolationFromData(
        results,
        cardinalityTotals[selectedAccountID]
      )
    : false;
  return {
    cardinalityRuleViolation,
    cardinalityAccountViolation,
    cardinalityTimeseries: [...results]
  };
}

export async function toggleMetric(ruleId, accountId, enabled) {
  const mutation = buildToggleRuleQuery(accountId, ruleId, !enabled);
  console.log('mutation:', mutation);
  const res = await NerdGraphMutation.mutate(mutation);
  console.log('res', res);
  return res;
}
