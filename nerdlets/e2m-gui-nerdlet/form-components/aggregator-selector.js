import React from 'react';
import PropTypes from 'prop-types';

import { RadioGroup, Radio } from 'nr1';

const AggregatorSelector = ({
  selectedAggregator,
  setAggregator,
  selectedEventType
}) => {
  /* TODO: Pull the disabledOrNotObj out to AddRule Component */
  const disabledOrNotObj = !selectedEventType ? { disabled: true } : {};
  return (
    <RadioGroup {...disabledOrNotObj}>
      <Radio
        {...disabledOrNotObj}
        label="Summary"
        value="summary"
        onChange={() => setAggregator('summary')}
      />
      <Radio
        {...disabledOrNotObj}
        label="Unique Count"
        value="uniqueCount"
        onChange={() => setAggregator('uniqueCount')}
      />
    </RadioGroup>
  );
};

AggregatorSelector.propTypes = {
  setAggregator: PropTypes.func.isRequired,
  selectedEventType: PropTypes.string,
  selectedAggregator: PropTypes.string
};

export default AggregatorSelector;
