import React from 'react';
import PropTypes from 'prop-types';

import { DropdownItem, Dropdown, TextField, Button } from 'nr1';

const availableOperators = [
  '=',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  'LIKE',
  'IS NULL',
  'IS NOT NULL'
];

const FilterAttributeSelector = ({
  availableAttributes,
  setAttributeForIndex,
  setOperatorForIndex,
  setValueForIndex,
  attribute,
  operator,
  showRemove,
  removeFilterClicked
}) => {
  if (!availableAttributes || !availableAttributes.length) {
    return null;
  }
  return (
    <div className="filterAttributeWrapper">
      <Dropdown title={attribute || 'Attribute'} className="attributeWrapper">
        {availableAttributes.map((attr, index) => (
          <DropdownItem
            key={`${attr.key}-${index}`}
            onClick={() => setAttributeForIndex(attr.key)}
          >
            {attr.key}
          </DropdownItem>
        ))}
      </Dropdown>
      <Dropdown title={operator || 'operator'} className="operatorWrapper">
        {availableOperators.map((op, index) => (
          <DropdownItem
            key={`${op}-${index}`}
            onClick={() => setOperatorForIndex(op)}
          >
            {op}
          </DropdownItem>
        ))}
      </Dropdown>
      {operator && operator.toLowerCase().includes('is') ? null : (
        <TextField
          className="valueWrapper"
          label=""
          placeholder="Value"
          onChange={e => setValueForIndex(e.target.value)}
        />
      )}
      {!showRemove ? null : (
        <Button
          spacingType={[Button.SPACING_TYPE.SMALL]}
          className="RemoveFilter"
          onClick={removeFilterClicked}
        >
          Remove
        </Button>
      )}
    </div>
  );
};

FilterAttributeSelector.propTypes = {
  availableAttributes: PropTypes.array.isRequired,
  setAttributeForIndex: PropTypes.func.isRequired,
  setOperatorForIndex: PropTypes.func.isRequired,
  setValueForIndex: PropTypes.func,
  removeFilterClicked: PropTypes.func,
  showRemove: PropTypes.bool,
  attribute: PropTypes.string,
  operator: PropTypes.string
};

export default FilterAttributeSelector;
