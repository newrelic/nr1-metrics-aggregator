export function getCardinalityForRule(cardinalities, accountId, ruleId) {
	if (!cardinalities || !cardinalities.length || !accountId || !ruleId) {
		return null;
	}
	const cardinalityForAccount = cardinalities.find(
		cByAccount => accountId && cByAccount && cByAccount["accountId"] == accountId
	);
	if (!cardinalityForAccount) {
		return 0;
	}
	const cardinalityForRule = cardinalityForAccount["cardinalities"].find(
		card => card["id"] == ruleId && ruleId
	);
	// Note: since we must load the cardinality details, we may not have
	//       loaded the details for this one yet.
	if (!cardinalityForRule) {
		return 0;
	}
	/* NOTE - It's true that each rule can have multiple metrics
              but each metric has the same cardinality as the rule. */
	return `${Math.max(...cardinalityForRule["cardinality"])}`;
}

export function getCardinalityTotalsForAccount(cardinalityForAccount) {
	/* It'd be tempting to save this calculation in the storage
	     but we're limited by filesize so I think it's safer to
	     recalculate it. It's not that expensive. */

	if (
		!cardinalityForAccount ||
		!cardinalityForAccount["cardinalities"] ||
		!cardinalityForAccount["cardinalities"].length
	) {
		return null;
	}

	const cardinalities = cardinalityForAccount["cardinalities"];
	let totals = new Array(cardinalities[0]["cardinality"].length).fill(0);

	cardinalities.forEach((
		card /* This sums each index of the cardinality array */
	) =>
		card["cardinality"].forEach(
			(num, index) => (totals[index] = totals[index] + num)
		)
	);
	return totals;
}

export function parseCardinalityBatchResponse(data) {
	/* TODO make this expect a single response of queries (or group them on purpose) */
	const actorKeys = Object.keys(data["actor"]).filter(k =>
		k.includes("query")
	);
	let timeseriesArray = [];
	for (let i = 0; i < actorKeys.length; i++) {
		timeseriesArray.push(data["actor"][actorKeys[i]]["nrql"]["results"]);
	}
	return timeseriesArray;
}
