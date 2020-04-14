import React from 'react';
import PropTypes from 'prop-types';

import { parseNRQL } from '../../util/misc';

const MetricAttributes = ({ nrql }) => {
  const { facets } = parseNRQL(nrql);
  return (
    <div className="Label">
      Attributes available
      <ul className="Attributes">
        {facets.map((facet, i) => (
          <li key={i}>{facet}</li>
        ))}
      </ul>
    </div>
  );
};

MetricAttributes.propTypes = {
  nrql: PropTypes.string
};

export default MetricAttributes;
