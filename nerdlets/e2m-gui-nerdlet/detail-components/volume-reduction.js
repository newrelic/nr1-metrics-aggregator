import React from "react";
import PropTypes from "prop-types";

import { Spinner } from "nr1";
import { commarize } from "../../util/misc";

const VolumeReduction = ({ eventRate, metricRate }) => {
	let reduction = eventRate
		? ((eventRate - metricRate) * 100.0) / eventRate
		: 0;
	reduction = Math.min(99.9, reduction);
	return eventRate !== null && metricRate !== null ? (
		<div className="VolumeReductionWrapper">
			<div className="Title">Volume reduction of this rule:</div>
			{reduction < 0 ? (
				<div>No rate reduction in the last 24 hours.</div>
			) : (
				<>
					<div className="Rate Event">
						{commarize(eventRate)}
						<div className="Label">EVENT DPPD</div>
						{metricRate > 0 ? (
							<>
								<div className="Reduction">
									<b>{reduction.toFixed(1)}%</b> storage
									reduction
								</div>

								<div className="note">
									(based on last 24 hours)
								</div>
							</>
						) : null}
					</div>

					<div className="Rate Arrow">&nbsp;&rarr;&nbsp;</div>
					<div className="Rate Metric">
						{commarize(metricRate)}
						<div className="Label">METRIC DPPD</div>
					</div>
				</>
			)}
		</div>
	) : (
		<div className="VolumeReductionWrapper">
			<Spinner />
		</div>
	);
};

VolumeReduction.propTypes = {
	eventRate: PropTypes.number,
	metricRate: PropTypes.number
};

export default VolumeReduction;
