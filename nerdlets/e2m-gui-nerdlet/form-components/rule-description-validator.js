import React from 'react';
import PropTypes from 'prop-types';
import { TextField } from 'nr1';

class RuleDescriptionValidator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ruleDescription: null
    };
  }

  clear() {
    this.setState({
      ruleDescription: null
    });
  }

  setDescription(userInputtedRuleDescription) {
    /* Remove dangerous characters from name */
    /* eslint-disable no-useless-escape */
    const ruleDescription = userInputtedRuleDescription.replace(
      /[^a-zA-Z0-9\.]/g,
      ''
    );
    /* eslint-enable */

    if (this.validRuleDescription(ruleDescription)) {
      this.props.setValidatedDescription(ruleDescription);
      this.setState({ ruleDescription });
    } else {
      this.setState({ ruleDescription });
    }
  }

  /* eslint-disable no-unused-vars */
  validRuleDescription(name) {
    return true;
  }
  /* eslint-enable */

  readyToSetRuleDescription() {
    return (
      this.props.selectedAggregator &&
      this.props.selectedEventType &&
      this.props.selectedAttribute &&
      this.props.selectedFacetAttributes &&
      this.props.selectedFacetAttributes.length
    );
  }

  render() {
    /* TODO: Pull the disabledOrNotObj out to AddRule Component */
    const disabledOrNotObj = !this.readyToSetRuleDescription()
      ? { disabled: true }
      : {};
    /* eslint-disable no-useless-escape */
    return (
      <div className="RuleDescriptionWrapper">
        <TextField
          {...disabledOrNotObj}
          ref={this.props.myRef}
          label=""
          placeholder="eg. 'host cpu metric rule'"
          onChange={e => this.setDescription(e.target.value)}
          value={
            !this.state.ruleDescription
              ? ''
              : this.state.ruleDescription.replace(/[^a-zA-Z0-9\.\s ]/g, '')
          }
        />
      </div>
    );
    /* eslint-enable */
  }
}

RuleDescriptionValidator.propTypes = {
  myRef: PropTypes.string,
  setValidatedDescription: PropTypes.func.isRequired,
  selectedEventType: PropTypes.string,
  selectedAttribute: PropTypes.string,
  selectedAggregator: PropTypes.string,
  validatedFilterNRQL: PropTypes.string,
  selectedFacetAttributes: PropTypes.array
};

export default RuleDescriptionValidator;
