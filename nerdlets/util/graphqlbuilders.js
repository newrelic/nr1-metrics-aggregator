import { NerdGraphQuery } from 'nr1';

export function buildEventTypeQueries(selectedAccountID) {
  const query = `{
    actor {
      query${selectedAccountID}: account(id: ${selectedAccountID}) {
        nrql(query: "show eventtypes since 1 month ago") {
          results
        }
      }
    }
  }`;
  return { query, fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE };
}

export function buildAttributeQueries(selectedAccountID, eventType) {
  const query = `{
    actor {
      query${selectedAccountID}: account(id: ${selectedAccountID}) {
        nrql(query: "SELECT keyset() FROM ${eventType} since 1 week ago", timeout: 200) {
          results
        }
      }
    }
  }`;
  return { query, fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE };
}

export function buildRulesQuery(accountArray) {
  const getRulesOuterQuery = `{
    actor {
      !!INNER_QUERIES!!
    }
  }`;
  const getRulesInnerQuery = `
  query!!ID!!: account(id: !!ID!!) {
      eventsToMetrics {
        allRules {
          rules {
            accountId
            id
            name
            enabled
            nrql
            description
          }
        }
      }
    }
 `;
  const innerQueriesArray = accountArray.map(d =>
    getRulesInnerQuery.replace(/!!ID!!/g, d.id)
  );
  const innerQueriesString = innerQueriesArray.join(' ');
  const getRulesQuery = getRulesOuterQuery.replace(
    '!!INNER_QUERIES!!',
    innerQueriesString
  );
  return {
    query: getRulesQuery,
    fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE
  };
}

export function buildFilterValidationQuery(
  whereNRQL,
  selectedAccountID,
  eventType
) {
  const query = `{
    actor {
      query${selectedAccountID}: account(id: ${selectedAccountID}) {
        nrql(query: "SELECT count(*) as 'all', filter(count(*), ${whereNRQL}) as 'filtered'  FROM ${eventType} SINCE 1 MONTH AGO") {
          results
        }
      }
    }
  }`;

  return { query, fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE };
}

export function buildCardinalityTimeseriesQuery(
  selectedAccountID,
  eventType,
  selectedFacetAttributes,
  whereClause
) {
  const wheresHttpEscaped = whereClause ? whereClause.replace(/"/g, '\\"') : '';
  const query = `{
    actor {
      query${selectedAccountID}: account(id: ${selectedAccountID}) {
        nrql(query: "FROM ${eventType} SELECT uniqueCount(${selectedFacetAttributes
    .map(facet => `\`${facet}\``)
    .join(
      ', '
    )}) AS 'cardinality' SINCE 3 days ago ${wheresHttpEscaped} TIMESERIES 1 day", timeout: 300) {
          results
        }
      }
    }
  }`;
  return { query, fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE };
}

export function buildCardinalityTimeseriesQueryForBatch(batchQueryInfo) {
  const query = `{
    actor {
      ${batchQueryInfo.map((queryInfo, index) => {
        const { accountId, eventType, facets, wheres } = queryInfo;
        const wheresHttpEscaped = wheres.replace(/"/g, '\\"');
        const selection = !facets
          ? '1'
          : `uniqueCount(${facets.map(facet => `\`${facet}\``).join(', ')})`;
        return `query${index}: account(id: ${accountId}) {
                  nrql(query: "FROM ${eventType} SELECT ${selection} AS 'cardinality' ${wheresHttpEscaped} SINCE 3 days ago TIMESERIES 1 day", timeout: 250) {
                                results
                              }
                            }`;
      })}

  }}`;
  return { query, fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE };
}

export function buildToggleRuleQuery(accountId, ruleId, enabled) {
  const mutation = `mutation {
  eventsToMetricsUpdateRule(updates: {accountId: ${accountId}, enabled: ${enabled}, ruleId: ${ruleId}}){
    failures {
      error {
        description
        reason
      }
      submitted {
        accountId
        enabled
        ruleId
      }
    }
    successes {
      accountId
      description
      enabled
      id
      name
      nrql
    }
  }
}`;
  return { mutation };
}

export function buildCreateNewRuleQuery(
  accountId,
  ruleNRQL,
  ruleAlias,
  ruleDescription = ''
) {
  const template = `mutation {
        eventsToMetricsCreateRule(rules: {
          name: "!!!ruleAlias!!!",
          description:"!!!ruleDescription!!!",
          nrql:"!!!ruleNRQL!!!",
          accountId: !!!accountId!!!
        })
        {
          successes {
            id
            name
            nrql
            enabled
          }
          failures {
            submitted {
              name
              nrql
              accountId
            }
            error {
              reason
              description
            }
          }
        }
      }
  `;
  const replacements = { accountId, ruleNRQL, ruleAlias, ruleDescription };
  let mutation = template;
  // Replace each variable in the template with the key/value.
  Object.keys(replacements).forEach(key => {
    mutation = mutation.replace(`!!!${key}!!!`, replacements[key]);
  });
  return { mutation };
}

export function buildRateReductionQueryForMetric(
  accountId,
  eventType,
  wheres,
  metricName
) {
  const wheresHttpEscaped = wheres.replace(/"/g, '\\"');
  const query = `{
    actor {
      EventRate: account(id: ${accountId}) {
        nrql(query: "FROM ${eventType} SELECT rate(count(*), 1 day) as 'eventrate' ${wheresHttpEscaped} since 1 day ago", timeout: 250) {
          results
        }
      }
      MetricRate: account(id: ${accountId}) {
        nrql(query: "FROM Metric SELECT rate(count(*), 1 day) as 'metricrate' WHERE  metricName = '${metricName}' since 1 day ago", timeout: 250) {
          results
        }
      }
    }
  }`;
  return { query, fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE };
}
