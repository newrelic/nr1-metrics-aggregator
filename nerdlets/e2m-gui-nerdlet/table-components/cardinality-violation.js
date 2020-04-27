import React from 'react';
import PropTypes from 'prop-types';

import { Spinner } from 'nr1';

const CardinalityViolationColor = ({ violation, noColor }) => {
  return noColor ? (
    <td height="40" width="10">
      <Spinner />
    </td>
  ) : (
    <td
      height="40"
      width="10"
      className={`CardinalityViolationColor ${
        violation ? 'Violation' : 'NoViolation'
      }`}
    />
  );
};

CardinalityViolationColor.propTypes = {
  noColor: PropTypes.bool.isRequired,
  violation: PropTypes.bool.isRequired
};

export default CardinalityViolationColor;
