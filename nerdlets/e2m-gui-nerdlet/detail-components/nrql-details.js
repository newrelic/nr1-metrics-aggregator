import React from "react";
import PropTypes from "prop-types";

const NRQLDetails = ({ nrql }) => {
	return (
		<div className="NRQLDetailWrapper">
			<div className="Label">NRQL used to create this rule</div>
			<div className="NRQL">{nrql}</div>
		</div>
	);
};

NRQLDetails.propTypes = {
	nrql: PropTypes.string
};

export default NRQLDetails;
