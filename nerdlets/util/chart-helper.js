export function getTimeRangeFromCardinality(cardinality) {
  return cardinality.beginTimeSeconds;
}

function getColorForAccountTotal(chartdata) {
  let violation = false;
  for (let i = 0; i < chartdata.length; i++) {
    if (chartdata[i].y > 5000000) {
      violation = true;
      break;
    }
  }
  return violation ? '#e6194B' : '#469990';
}

function getColorForRule(chartdata) {
  let violation = false;
  for (let i = 0; i < chartdata.length; i++) {
    if (chartdata[i].y > 100000) {
      violation = true;
      break;
    }
  }
  return violation ? '#e6194B' : '#469990';
}

export function buildCardinalityChartData(
  timerangeArray,
  cardinalities,
  nrqlStoreDataFormat = true
) {
  if (
    !cardinalities ||
    !cardinalities.length ||
    !timerangeArray ||
    !timerangeArray.length
  ) {
    return [];
  }

  // Add the per rule max as a guide
  const chartData = [
    {
      metadata: {
        id: 'limit',
        name: 'limit (20k)',
        color: '#000000',
        viz: 'main',
        units_data: {
          x: 'TIMESTAMP',
          y: 'COUNT'
        }
      },
      data: nrqlStoreDataFormat
        ? timerangeArray.map(x => ({
            x,
            y: 100000 /* This is the per rule max */
          }))
        : cardinalities[0].map(cardinality => ({
            x: cardinality.beginTimeSeconds,
            y: 100000
          }))
    }
  ];
  if (nrqlStoreDataFormat) {
    /* I had to optimize the way the cardinality was stored for NRQL storage,
		   otherwise the files were too large. One side effect is that now
		   there's two different ways to parse the data. TODO: I should separate
		   these into two separate functions to avoid confusion here.  */

    cardinalities.forEach(card => {
      card.cardinalities.forEach(cardinalityForRule => {
        const data = cardinalityForRule.cardinality.map(
          (cardinality, index) => ({
            x: card.beginTimeSeconds[index],
            y: cardinality
          })
        );

        const metadata = {
          id: `Rule${cardinalityForRule.id}`,
          name: `Rule ${cardinalityForRule.id}`,
          color: getColorForRule(data),
          viz: 'main',
          units_data: {
            x: 'TIMESTAMP',
            y: 'NUMBER'
          }
        };

        chartData.push({ metadata, data });
      });
    });
  } else {
    /* This data is expected to be (an array of) NR query format */
    cardinalities.forEach(card => {
      const data = card.map(cardinality => ({
        x: cardinality.beginTimeSeconds,
        y: cardinality.cardinality
      }));

      const metadata = {
        id: `New Rule`,
        name: `New Rule`,
        color: getColorForRule(data),
        viz: 'main',
        units_data: {
          x: 'TIMESTAMP',
          y: 'NUMBER'
        }
      };

      chartData.push({ metadata, data });
    });
  }

  return chartData;
}

export function buildCardinalityTotalsChartData(
  timerangeArray,
  cardinalityTotalsForAllAccounts,
  cardinalityRuleData = false
) {
  if (
    !cardinalityTotalsForAllAccounts ||
    !timerangeArray ||
    !timerangeArray.length
  ) {
    return [];
  }

  // Add the total amount max as a guide
  const chartData = [
    {
      metadata: {
        id: 'limit',
        name: 'limit (5M)',
        color: '#000000',
        viz: 'main',
        units_data: {
          x: 'TIMESTAMP',
          y: 'COUNT'
        }
      },
      data: timerangeArray.map(x => ({
        x,
        y: 5000000 /* This is the max total amount */
      }))
    }
  ];

  // Calculate the total cardinality by iterating through each account id
  Object.keys(cardinalityTotalsForAllAccounts).forEach(accountId => {
    const totalCardinalityForAccount =
      cardinalityTotalsForAllAccounts[accountId];

    if (totalCardinalityForAccount && totalCardinalityForAccount.length) {
      const data = timerangeArray.map((x, index) => ({
        x,
        y: !cardinalityRuleData
          ? totalCardinalityForAccount[index]
          : totalCardinalityForAccount[index] +
            cardinalityRuleData[index].cardinality
      }));

      const metadata = {
        id: `Account ${accountId}`,
        name: `Account ${accountId}`,
        color: getColorForAccountTotal(data),
        viz: 'main',
        units_data: {
          x: 'TIMESTAMP',
          y: 'NUMBER'
        }
      };

      chartData.push({ metadata, data });
    }
  });
  return chartData;
}
