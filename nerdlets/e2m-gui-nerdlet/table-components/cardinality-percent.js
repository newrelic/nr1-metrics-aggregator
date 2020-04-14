import React from 'react';
import PropTypes from 'prop-types';
import Switch from 'react-toggle-switch';

import { Spinner } from 'nr1';

import { numberWithCommas } from '../../util/misc';

const CardinalityPercent = ({ cardinality, limit, enabled }) => {
  if (!enabled) {
    return <td>-</td>;
  }
  if (!cardinality) {
    return (
      <td>
        <Spinner />
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
  enabled: PropTypes.bool.isRequired
};

export default CardinalityPercent;
