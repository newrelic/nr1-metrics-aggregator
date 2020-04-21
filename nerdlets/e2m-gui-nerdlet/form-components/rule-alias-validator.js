import React from 'react';
import PropTypes from 'prop-types';
import { TextField, Spinner } from 'nr1';

class RuleAliasValidator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ruleAlias: '',
      valid: null
    };
  }

  clear() {
    this.setState({
      ruleAlias: '',
      valid: null
    });
  }

  setRuleAlias(userInputtedRuleAlias) {
    /* Remove dangerous characters from name */
    const ruleAlias = userInputtedRuleAlias.replace(/[^a-zA-Z0-9\s]/g, '');

    if (this.validRuleAlias(ruleAlias)) {
      this.props.setValidatedRuleAlias(ruleAlias);
      this.setState({ ruleAlias, valid: true });
    } else {
      this.setState({ ruleAlias, valid: false });
    }
  }

  validRuleAlias(name) {
    const trimmed = name.trimLeft().trimRight();
    const rules = this.getRuleNamesArrayFromE2MRulesList();
    /* Make sure name is not already in the list */
    return trimmed.length && rules && rules.indexOf(trimmed) < 0;
  }

  getRuleNamesArrayFromE2MRulesList() {
    if (!this.props.e2mRulesByMetricName || !this.props.selectedAccountID)
      return [];
    return this.props.e2mRulesByMetricName
      .filter(
        rule =>
          rule.accountId && rule.accountId === this.props.selectedAccountID
      )
      .map(rule => rule.name);
  }

  readyToSetRuleAlias() {
    return (
      this.props.selectedAccountID &&
      !this.props.cardinalityDataLoading &&
      this.props.selectedAggregator &&
      this.props.selectedEventType &&
      this.props.selectedAttribute &&
      this.props.selectedFacetAttributes &&
      this.props.selectedFacetAttributes.length
    );
  }

  getSuggestedRuleAlias() {
    if (!this.readyToSetRuleAlias()) return '';
    let name = `${this.props.selectedEventType} ${this.props.selectedAttribute} ${this.props.selectedAggregator}`;
    name = this.props.validatedFilterNRQL ? `${name} Filtered` : name;

    /* If a suggested name has already been used then increment a number at the end */
    let iter = 2;
    while (!this.validRuleAlias(name)) {
      /* Give up after getting to 9 */
      if (iter > 9) {
        break;
      }
      const nextName = `${name}.${iter}`;
      if (this.validRuleAlias(nextName)) {
        name = nextName;
        break;
      }
      iter = iter + 1;
    }
    return name;
  }

  render() {
    if (
      this.props.cardinalityDataLoading &&
      (!this.props.e2mRulesByMetricName ||
        !this.props.e2mRulesByMetricName.length)
    ) {
      return (
        <div>
          Waiting for current E2M rules to finish loading...
          <Spinner />
        </div>
      );
    }
    /* TODO: Pull the disabledOrNotObj out to AddRule Component */
    const disabledOrNotObj = !this.readyToSetRuleAlias()
      ? { disabled: true }
      : {};
    /* eslint-disable no-nested-ternary */
    return (
      <div className="validator">
        <TextField
          {...disabledOrNotObj}
          ref={this.props.myRef}
          className="textfield"
          placeholder="eg. 'host cpu metric rule'"
          value={
            !this.state.ruleAlias
              ? ''
              : this.state.ruleAlias.replace(/[^a-zA-Z0-9\s]/g, '')
          }
          onChange={e => this.setRuleAlias(e.target.value)}
        />
        <div
          {...disabledOrNotObj}
          className="UseSuggestedItem"
          onClick={() => this.setRuleAlias(this.getSuggestedRuleAlias())}
        >
          Use suggested alias
        </div>

        {!this.readyToSetRuleAlias() ||
        (!(this.state.valid === true) &&
          !(this.state.valid === false)) ? null : this.state.valid ? (
          <div className="valid">Valid</div>
        ) : (
          <div className="notvalid">Not valid</div>
        )}
      </div>
    );
    /* eslint-enable */
  }
}

RuleAliasValidator.propTypes = {
  myRef: PropTypes.string,
  setValidatedRuleAlias: PropTypes.func.isRequired,
  e2mRulesByMetricName: PropTypes.array,
  selectedAccountID: PropTypes.string,
  selectedEventType: PropTypes.string,
  selectedAttribute: PropTypes.string,
  selectedAggregator: PropTypes.string,
  validatedFilterNRQL: PropTypes.string,
  selectedFacetAttributes: PropTypes.array,
  cardinalityDataLoading: PropTypes.bool.isRequired
};

export default RuleAliasValidator;
