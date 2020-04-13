export function getTimeRangeFromCardinality(cardinality) {
	return cardinality["beginTimeSeconds"];
}

const COLORS = [
	"#e6194b",
	"#3cb44b",
	"#ffe119",
	"#4363d8",
	"#f58231",
	"#911eb4",
	"#46f0f0",
	"#f032e6",
	"#bcf60c",
	"#fabebe",
	"#008080",
	"#e6beff",
	"#9a6324",
	"#fffac8",
	"#800000",
	"#aaffc3",
	"#808000",
	"#ffd8b1",
	"#000075",
	"#808080"
];
function getRandomColorHex() {
	const randomIndex = Math.floor(Math.random() * COLORS.length);
	return COLORS[randomIndex];
}

function getColorForAccountTotal(chartdata) {
	let violation = false;
	for (let i = 0; i < chartdata.length; i++) {
		if (chartdata[i]["y"] > 5000000) {
			violation = true;
			break;
		}
	}
	return violation ? "#e6194B" : "#469990";
}

function getColorForRule(chartdata) {
	let violation = false;
	for (let i = 0; i < chartdata.length; i++) {
		if (chartdata[i]["y"] > 20000) {
			violation = true;
			break;
		}
	}
	return violation ? "#e6194B" : "#469990";
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
	let chartData = [
		{
			metadata: {
				id: "limit",
				name: "limit (20k)",
				color: "#000000",
				viz: "main",
				units_data: {
					x: "TIMESTAMP",
					y: "COUNT"
				}
			},
			data: nrqlStoreDataFormat ? timerangeArray.map(x => ({
				x,
				y: 20000 /* This is the per rule max */
			})) : cardinalities[0].map((cardinality, index) => ({
				x: cardinality["beginTimeSeconds"],
				y: 20000
			}))
		}
	];
	if (nrqlStoreDataFormat) {
		/* I had to optimize the way the cardinality was stored for NRQL storage, 
		   otherwise the files were too large. One side effect is that now
		   there's two different ways to parse the data. TODO: I should separate
		   these into two separate functions to avoid confusion here.  */

		cardinalities.forEach(card => {
			card["cardinalities"].forEach(cardinalityForRule => {
				const data = cardinalityForRule["cardinality"].map(
					(cardinality, index) => ({
						x: card["beginTimeSeconds"][index],
						y: cardinality
					})
				);

				const metadata = {
					id: `Rule${cardinalityForRule["id"]}`,
					name: `Rule ${cardinalityForRule["id"]}`,
					color: getColorForRule(data),
					viz: "main",
					units_data: {
						x: "TIMESTAMP",
						y: "NUMBER"
					}
				};

				chartData.push({ metadata, data });
			});
		});
	} else {
		/* This data is expected to be (an array of) NR query format */
		cardinalities.forEach(card => {
			const data = card.map((cardinality, index) => ({
				x: cardinality["beginTimeSeconds"],
				y: cardinality["cardinality"]
			}));

			const metadata = {
				id: `New Rule`,
				name: `New Rule`,
				color: getColorForRule(data),
				viz: "main",
				units_data: {
					x: "TIMESTAMP",
					y: "NUMBER"
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
	let chartData = [
		{
			metadata: {
				id: "limit",
				name: "limit (5M)",
				color: "#000000",
				viz: "main",
				units_data: {
					x: "TIMESTAMP",
					y: "COUNT"
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
					  cardinalityRuleData[index]["cardinality"]
			}));

			const metadata = {
				id: `Account ${accountId}`,
				name: `Account ${accountId}`,
				color: getColorForAccountTotal(data),
				viz: "main",
				units_data: {
					x: "TIMESTAMP",
					y: "NUMBER"
				}
			};

			chartData.push({ metadata, data });
		}
	});
	return chartData;
}
