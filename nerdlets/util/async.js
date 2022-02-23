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
  const query = buildRateReductionQueryForMetric(
    accountId,
    eventType,
    wheres,
    metricName
  );
  let { data, error } = await NerdGraphQuery.query(query);
  let eventRate = null;
  let metricRate = null;
  if (!error) {
    try {
      eventRate = data.actor.EventRate.nrql.results[0].eventrate;
      metricRate = data.actor.MetricRate.nrql.results[0].metricrate;
    } catch (err) {
      error = err;
    }
  }
  return { eventRate, metricRate, error };
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
    const errorMsg = data.eventsToMetricsCreateRule.failures.length
      ? JSON.stringify(data.eventsToMetricsCreateRule.failures)
      : `${error}`;
    return { result: null, error: errorMsg };
  }
  const newRule = data.eventsToMetricsCreateRule.successes[0];
  return storeRuleCardinalityIfOtherCardinalityStored(accountId, newRule);
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
  return AccountStorageMutation.mutate({
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
    () => true
  );

  // Add new cardinality to list
  cardinalitiesForAccount.cardinalities.push(
    newCardinalitiesForAccount.cardinalities[0]
  );
  return saveCardinalityForAccountToNerdStorage(
    accountId,
    cardinalitiesForAccount
  );
}

export async function getE2MRulesForAccountObj(accounts) {
  const BATCH_SIZE = 15;
  const accountBatchArray = chunk(accounts, BATCH_SIZE);
  let e2mRules = [];

  for (let i = 0; i < accountBatchArray.length; i++) {
    const { data, error } = await NerdGraphQuery.query(
      buildRulesQuery(accountBatchArray[i])
    );
    if (error) {
      throw error;
    }
    const rulesForBatch = parseE2MMetricRuleListFromResponse(data);
    e2mRules = e2mRules.concat(rulesForBatch);
  }
  return e2mRules;
}

// NOTE: There seems to be a bug in the SDK for AccountsQuery. I error when I try to
//       use it imperatively.
export async function getAccountsForUser() {
  const { data, error } = await AccountsQuery.query();
  if (error) {
    throw error;
  }
  // Convert accounts array to object for easier processing
  return data;
}

function parseAndAddNewCardinality(
  data,
  batchOfRules,
  cardinalitiesForAccount,
  onCardinalityAdded
) {
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
  }
  onCardinalityAdded(cardinalitiesForAccount);
  return cardinalitiesForAccount;
}

async function processBatchOfCardinalities(
  batchOfRules,
  accountId,
  errorCount,
  maxVisibileErrors,
  cardinalitiesForAccount,
  onCardinalityAdded,
  onError
) {
  let failedBatch = false;
  try {
    const { data, error } = await calculateCardinalityForRuleBatch(
      batchOfRules,
      accountId
    );
    if (error) {
      const errorStr = JSON.stringify(error.graphQLErrors);
      const isDbLimitError = errorStr.includes('limit exceeded');
      /* eslint-disable no-console */
      console.log('Error loading cardinality with batch: ', errorStr);
      /* eslint-enable */
      errorCount = errorCount + 1;
      if (!isDbLimitError && errorCount < maxVisibileErrors) {
        onError(JSON.stringify(error));
      }
      failedBatch = true;
    } else if (data) {
      cardinalitiesForAccount = parseAndAddNewCardinality(
        data,
        batchOfRules,
        cardinalitiesForAccount,
        onCardinalityAdded
      );
    }
  } catch (error) {
    console.log('Uncaught error processing cardinality', error); // eslint-disable-line no-console
    if (errorCount < maxVisibileErrors) {
      onError(error);
    }
  }
  return {
    cardinalitiesForAccount,
    processIndividually: failedBatch,
    errorCount
  };
}

async function calculateCardinalityForEnabledRulesForAccount(
  accountId,
  e2mRulesForAccount,
  onCardinalityAdded,
  onError
) {
  let cardinalitiesForAccount = {
    beginTimeSeconds: [],
    accountId,
    cardinalities: []
  };
  let processIndividually = false;
  let errorCount = 0;
  const batchSize = 5;
  const maxVisibileErrors = 1; // After displaying one error, we will silently log the remainder
  const ruleBatchArray = chunk(e2mRulesForAccount, batchSize);

  for (let i = 0; i < ruleBatchArray.length; i++) {
    if (!processIndividually) {
      const response = await processBatchOfCardinalities(
        ruleBatchArray[i],
        accountId,
        errorCount,
        maxVisibileErrors,
        cardinalitiesForAccount,
        onCardinalityAdded,
        onError
      );
      cardinalitiesForAccount = response.cardinalitiesForAccount;
      processIndividually = response.processIndividually;
      errorCount = response.errorCount;
    }
    // In the event that a batch fails (likely because of db limits)
    //    try  processing the cardinalities individually.
    if (processIndividually) {
      for (let j = 0; j < ruleBatchArray[i].length; j++) {
        const singleItemBatch = [ruleBatchArray[i][j]];
        const response = await processBatchOfCardinalities(
          singleItemBatch,
          accountId,
          errorCount,
          maxVisibileErrors,
          cardinalitiesForAccount,
          onCardinalityAdded,
          onError
        );
        cardinalitiesForAccount = response.cardinalitiesForAccount;
        errorCount = response.errorCount;
      }
    }

    /* eslint-disable no-console */
    console.log(
      `${accountId} rules ${i * batchSize + 1}-${(i + 1) * batchSize} / ${
        e2mRulesForAccount.length
      }`,
      `processed ${
        processIndividually ? 'individually' : `${batchSize} at a time`
      }`
    );
    /* eslint-enable */
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
    rule => `${rule.accountId}` === `${accountId}` && rule.enabled
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

const CARDINALITY_LIMIT_PER_RULE = 100000;
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
  whereClause,
  timerangeArray,
  cardinalityTotals
) {
  const { data, error } = await NerdGraphQuery.query(
    buildCardinalityTimeseriesQuery(
      selectedAccountID,
      selectedEventType,
      selectedFacetAttributes.map(attrObj => attrObj.key),
      whereClause
    )
  );
  if (error) {
    console.log('Error validating rule:', error); // eslint-disable-line no-console
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
  // console.log('mutation:', mutation);
  const res = await NerdGraphMutation.mutate(mutation);
  // console.log('res', res);
  return res;
}
