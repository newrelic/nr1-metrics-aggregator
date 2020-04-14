import React from 'react';
import PropTypes from 'prop-types';
import { Grid, GridItem, Checkbox, NerdGraphQuery, Spinner } from 'nr1';
import { chunk } from '../../util/misc';

class AttributeCheckboxSelector extends React.Component {
  render() {
    // Since multiple accounts are selected, the event types shown below are aggregated from
    //      all accounts. Each individual account may not have the event types here.

    /* TODO: Pull the disabledOrNotObj out to AddRule Component */
    const disabledOrNotObj =
      !this.props.selectedAggregator ||
      !this.props.selectedEventType ||
      !this.props.selectedAttribute
        ? { disabled: true }
        : {};

    const attributeFilter = attr => attr.key !== this.props.selectedAttribute;

    const attrs = this.props.availableAttributes.filter(attributeFilter);
    const attrChunksOf3 = chunk(attrs, 3);

    return (
      <div>
        {attrChunksOf3.map((attrChunk, i) => (
          <Grid key={`grid-${i}`}>
            {attrChunk.map((attr, j) => (
              <GridItem
                columnSpan={4}
                key={`griditem-${j}-${i}`}
                className="NoWordWrap"
              >
                <Checkbox
                  {...disabledOrNotObj}
                  checked={
                    this.props.selectedFacetAttributes &&
                    this.props.selectedFacetAttributes.indexOf(attr) !== -1
                  }
                  onChange={() => this.props.toggleFacetAttribute(attr)}
                  label={attr.key.substring(0, 40)}
                />
              </GridItem>
            ))}
          </Grid>
        ))}
      </div>
    );
  }
}

AttributeCheckboxSelector.propTypes = {
  selectedAccountID: PropTypes.string,
  selectedEventType: PropTypes.string,
  selectedAggregator: PropTypes.string,
  selectedAttribute: PropTypes.string,
  selectedFacetAttributes: PropTypes.array.isRequired,
  availableAttributes: PropTypes.array,
  toggleFacetAttribute: PropTypes.func.isRequired
};

export default AttributeCheckboxSelector;
