import React from 'react';
import PropTypes from 'prop-types';
import { TextField, Spinner } from 'nr1';

class RuleDescriptionValidator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ruleDescription: null,
      validationTimeout: null,
      validating: false,
      validated: null
    };
  }

  clear() {
    this.setState({
      ruleDescription: null,
      validationTimeout: null,
      validating: false,
      validated: null
    });
  }

  setDescription(userInputtedRuleDescription) {
    /* Remove dangerous characters from name */
    const ruleDescription = userInputtedRuleDescription.replace(
      /[^a-zA-Z0-9\.]/g,
      ''
    );

    if (this.validRuleDescription(ruleDescription)) {
      this.props.setValidatedDescription(ruleDescription);
      this.setState({ ruleDescription, valid: true });
    } else {
      this.setState({ ruleDescription, valid: false });
    }
  }

  validRuleDescription(name) {
    return true;
  }

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
  }
}

RuleDescriptionValidator.propTypes = {
  setValidatedDescription: PropTypes.func.isRequired,
  selectedEventType: PropTypes.string,
  selectedAttribute: PropTypes.string,
  selectedAggregator: PropTypes.string,
  validatedFilterNRQL: PropTypes.string,
  selectedFacetAttributes: PropTypes.array
};

export default RuleDescriptionValidator;
