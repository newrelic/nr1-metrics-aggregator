import React from "react";
import PropTypes from "prop-types";
import Switch from 'react-toggle-switch'

const EnableSwitch = ({ enabled, toggleClicked, metricName }) => {
  return (
    <td height="40" className="TableSwitch">
      <Switch onClick={() => toggleClicked(metricName)} on={enabled} />
    </td>
  );
};

EnableSwitch.propTypes = {
  enabled: PropTypes.bool.isRequired,
  toggleClicked: PropTypes.func.isRequired,
  metricName: PropTypes.string.isRequired
};

export default EnableSwitch;
