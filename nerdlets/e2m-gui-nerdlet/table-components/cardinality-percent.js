import React from 'react';
import PropTypes from 'prop-types';

import { Spinner } from 'nr1';

const CardinalityPercent = ({ cardinality, limit, enabled, loading }) => {
  if (!enabled) {
    return <td>-</td>;
  }
  if (!cardinality) {
    // Only spin while cardinality is still loading; otherwise it isn't coming.
    return loading ? (
      <td>
        <Spinner />
      </td>
    ) : (
      <td height="40" title="Cardinality could not be calculated for this rule">
        N/A
      </td>
    );
  }

  const cardinality_percent = Math.round(
    (parseInt(`${cardinality}`) * 100) / limit
  );
  return (
    <td height="40">
      <span className={`cardinality ${cardinality > limit ? 'violation' : ''}`}>
        {cardinality_percent}%
      </span>
    </td>
  );
};

CardinalityPercent.propTypes = {
  cardinality: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  limit: PropTypes.number,
  enabled: PropTypes.bool.isRequired,
  loading: PropTypes.bool
};

export default CardinalityPercent;
