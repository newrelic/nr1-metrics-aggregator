import React from 'react';
import PropTypes from 'prop-types';
import { TextField, Spinner } from 'nr1';

class MetricNameValidator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      metricName: '',
      valid: null
    };

    this.validMetricName = this.validMetricName.bind(this);
    this.setMetricName = this.setMetricName.bind(this);
  }

  clear() {
    this.setState({
      metricName: '',
      valid: null
    });
  }

  setMetricName(userInputtedMetricName) {
    /* Remove dangerous characters from name */
    /* eslint-disable no-useless-escape */
    const metricName = userInputtedMetricName.replace(/[^a-zA-Z0-9\.]/g, '');
    /* eslint-enable */
    if (this.validMetricName(metricName)) {
      this.props.setValidatedMetricName(metricName);
      this.setState({ metricName, valid: true });
    } else {
      this.setState({ metricName, valid: false });
    }
  }

  validMetricName(name) {
    const metricNames = this.getMetricNamesArrayFromE2MRulesList();
    /* Make sure name is not already in the list */
    return metricNames.indexOf(name) < 0;
  }

  getMetricNamesArrayFromE2MRulesList() {
    if (!this.props.e2mRulesByMetricName || !this.props.selectedAccountID) {
      return [];
    }

    return this.props.e2mRulesByMetricName
      .filter(
        rule =>
          rule.accountId &&
          `${rule.accountId}` === `${this.props.selectedAccountID}`
      )
      .map(ruleObj => ruleObj.metricName);
  }

  readyToSetMetricName() {
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

  getSuggestedMetricName() {
    if (!this.readyToSetMetricName()) return '';
    let name = `${this.props.selectedEventType}.${this.props.selectedAttribute}.${this.props.selectedAggregator}`;
    name = this.props.validatedFilterNRQL ? `${name}.Filtered` : name;

    /* If a suggested name has already been used then increment a number at the end */
    let iter = 2;
    while (!this.validMetricName(name)) {
      /* Give up after getting to 9 */
      if (iter > 9) {
        break;
      }
      const nextName = `${name}.${iter}`;
      if (this.validMetricName(nextName)) {
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
    const disabledOrNotObj = !this.readyToSetMetricName()
      ? { disabled: true }
      : {};
    const newMetricName = !this.state.metricName
      ? ''
      : this.state.metricName.replace(/[^a-zA-Z0-9\.]/g, ''); // eslint-disable-line no-useless-escape
    /* eslint-disable no-nested-ternary */
    return (
      <div className="validator">
        <TextField /* Don't display dangerous characters in name */
          {...disabledOrNotObj}
          ref={this.props.myRef}
          className="textfield"
          value={newMetricName}
          onChange={e => this.setMetricName(e.target.value)}
          placeholder={`eg. ${
            !this.readyToSetMetricName()
              ? this.getSuggestedMetricName()
              : 'database.connections'
          }`}
        />
        <div
          {...disabledOrNotObj}
          className="UseSuggestedItem"
          onClick={() => this.setMetricName(this.getSuggestedMetricName())}
        >
          Use suggested name
        </div>

        {!this.readyToSetMetricName() ||
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

MetricNameValidator.propTypes = {
  myRef: PropTypes.string,
  selectedAccountID: PropTypes.string,
  selectedEventType: PropTypes.string,
  selectedAttribute: PropTypes.string,
  selectedAggregator: PropTypes.string,
  validatedFilterNRQL: PropTypes.string,
  selectedFacetAttributes: PropTypes.array,
  e2mRulesByMetricName: PropTypes.array,
  setValidatedMetricName: PropTypes.func.isRequired,
  cardinalityDataLoading: PropTypes.bool.isRequired
};

export default MetricNameValidator;
