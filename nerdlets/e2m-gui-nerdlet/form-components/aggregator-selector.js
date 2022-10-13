import React from 'react';
import PropTypes from 'prop-types';

import { RadioGroup, Radio } from 'nr1';

const AggregatorSelector = ({ setAggregator, selectedEventType, selectedAggregator }) => {
  /* TODO: Pull the disabledOrNotObj out to AddRule Component */
  const disabledOrNotObj = !selectedEventType ? { disabled: true } : {};
  return (
    <RadioGroup {...disabledOrNotObj}>
      <Radio
        {...disabledOrNotObj}
        label="Summary--use if the query's function is min, max, sum, count, or average"
        value="summary"
        checked={selectedAggregator == 'summary'}
        onClick={() => setAggregator('summary')}
      />
      <Radio
        {...disabledOrNotObj}
        label="Distribution--use if the query's function is percentile or histogram"
        value="distribution"
        checked={selectedAggregator == 'distribution'}
        onClick={() => setAggregator('distribution')}
      />
      <Radio
        {...disabledOrNotObj}
        label="Unique Count--use if the query's function is unique count"
        value="uniqueCount"
        checked={selectedAggregator == 'uniqueCount'}
        onClick={() => setAggregator('uniqueCount')}
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
