export function chunk(array, size) {
  const chunked_arr = [];
  const copied = [...array]; // ES6 destructuring
  const numOfChild = Math.ceil(copied.length / size); // Round up to the nearest integer
  for (let i = 0; i < numOfChild; i++) {
    chunked_arr.push(copied.splice(0, size));
  }
  return chunked_arr;
}

export function chunkByKey(array, key) {
  const chunked_arr = [];
  const copied = [...array]; // ES6 destructuring
  const usedKeys = [];
  for (let i = 0; i < copied.length; i++) {
    const value = copied[i][key];
    if (!usedKeys.find(value)) {
      chunked_arr.push(copied.filter(item => item[key] === value));
      usedKeys.push(value);
    }
  }
  return chunked_arr;
}

export function getLastThreeDays() {
  // If a date isn't set, get integer values for the last 3 days.
  const a = new Date(); // Today
  const b = new Date();
  b.setDate(b.getDate() - 1); // Yesterday
  const c = new Date();
  c.setDate(c.getDate() - 2); // Day before yesterday

  return [a.getTime(), b.getTime(), c.getTime()];
}

export function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function getE2MRulesByMetric(e2mRules) {
  if (!e2mRules || !e2mRules.length) {
    return [];
  }
  const rulesByMetric = [];
  e2mRules.forEach(rule => {
    /* eslint-disable no-useless-escape */
    const metricNames = rule.nrql.match(/\sas\s*\'([^\']*)\'/gi);

    metricNames.forEach(name => {
      const ruByMetric = { ...rule };
      ruByMetric.metricName = name
        .replace(' as ', '')
        .replace(
          ' AS ',
          ''
        ) /* TODO: I'm sure there's a better way to leverage regex capturing groups */
        .replace(/\s*\'/gi, '');
      rulesByMetric.push(ruByMetric);
    });
    /* eslint-enable */
  });
  return rulesByMetric;
}

const RESERVED_WORDS = [
  ' FACET ',
  ' LIMIT ',
  ' SINCE ',
  ' UNTIL ',
  ' WITH ',
  ' COMPARE ',
  ' TIMESERIES ',
  ' EXTRAPOLATE ',
  ' SELECT ',
  ' FROM '
];

function findReservedWordIndexInNRQL(nrql) {
  let smallest_index = nrql.length;
  for (let i = 0; i < RESERVED_WORDS.length; i++) {
    const reserved_word = RESERVED_WORDS[i].toUpperCase();
    const index = nrql.toUpperCase().indexOf(reserved_word);
    if (index > -1) {
      smallest_index = Math.min(smallest_index, index);
    }
  }
  return smallest_index;
}

function getWheres(nrql, matches = []) {
  // find index where 'where'begins in the nrql
  const whereStartIndex = nrql.toUpperCase().indexOf(' WHERE ');
  if (whereStartIndex !== -1) {
    const whereEndIndex =
      whereStartIndex +
      ' WHERE '.length +
      findReservedWordIndexInNRQL(
        nrql.substring(whereStartIndex + ' WHERE '.length)
      );

    // find the sub string that contains
    const whereContainingNrql = nrql.substring(whereStartIndex, whereEndIndex);
    // add this string to the matches
    matches.push(whereContainingNrql);

    // look at the remainder and see if there's another where clause inside
    const remainderNrql = nrql.substring(whereEndIndex, nrql.length);
    if (remainderNrql.length) {
      matches = getWheres(remainderNrql, matches);
    }
    return matches;
  }
  return matches;
}

export function parseNRQL(nrql) {
  if (!nrql) {
    return null;
  }
  const nrqlDict = {
    eventType: null,
    facets: null,
    wheres: null
  };
  /* eslint-disable no-useless-escape */
  const eventMatches = `${nrql}`.match(/from\s*([\`a-zA-Z\_0-9]*)/gi);
  nrqlDict.eventType =
    eventMatches && eventMatches.length
      ? eventMatches[0].replace(/\`/g, '').replace(/from(\s+)/gim, '')
      : null;

  const facetMatches = `${nrql}`.match(
    /facet\s*([\`a-z\_0-9]+)(\,\s*[\`a-z\_0-9]+)*/gim
  );
  nrqlDict.facets =
    facetMatches && facetMatches.length
      ? facetMatches[0]
          .replace(/facet(\s+)/gim, '')
          .replace(/\`/g, '')
          .split(',')
          .map(facet => facet.trim())
      : null;
  /* eslint-enable */
  const wherematches = getWheres(nrql).join(' ');
  nrqlDict.wheres = wherematches || '';

  return nrqlDict;
}

export function parseE2MMetricRuleListFromResponse(data) {
  const metricRuleList = [];
  if (data && 'actor' in data) {
    Object.keys(data.actor)
      .filter(item => item.includes('query'))
      .forEach(key => {
        if (data.actor[key].eventsToMetrics) {
          data.actor[key].eventsToMetrics.allRules.rules.forEach(rule => {
            metricRuleList.push(rule);
          });
        }
      });
  }

  return metricRuleList;
}

export function makeAccountArrayAnObject(data) {
  return data.reduce((obj, item) => {
    obj[item.id] = item;
    return obj;
  }, {});
}

export function commarize(number) {
  const min = 1e3;
  // Alter numbers larger than 1k
  if (number >= min) {
    const units = ['k', 'M', 'B', 'T'];

    const order = Math.floor(Math.log(number) / Math.log(1000));

    const unitname = units[order - 1];
    const num = Math.floor(number / 1000 ** order);

    // output number remainder + unitname
    return num + unitname;
  }

  // return formatted original number
  return Math.floor(number);
}
