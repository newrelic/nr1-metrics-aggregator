import React from 'react';
import PropTypes from 'prop-types';

import { Spinner, LineChart } from 'nr1';

import {
  buildCardinalityChartData,
  buildCardinalityTotalsChartData
} from '../../util/chart-helper';

class RuleValidator extends React.Component {
  componentDidUpdate(prevProps) {
    const propsThatAffectCardinality = [
      'selectedAccountID',
      'selectedFacetAttributes',
      'selectedEventType',
      'selectedAggregator',
      'selectedAttribute',
      'cardinalityTotals'
    ];
    for (let i = 0; i < propsThatAffectCardinality.length; i++) {
      const prop = this.props[propsThatAffectCardinality[i]];
      const prevProp = prevProps[propsThatAffectCardinality[i]];
      if (prop !== prevProp) {
        this.props.setValidationTimeout();
      }
    }
  }

  componentDidMount() {
    this.props.setValidationTimeout();
  }

  render() {
    if (!this.props.selectedAccountID) {
      return null;
    }
    if (!this.props.cardinalityTimeseries || this.props.validatingCardinality) {
      return <Spinner />;
    }
    if (!this.props.cardinalityTotals && this.props.cardinalityDataLoading) {
      return (
        <div>
          Please wait... Still downloading cardinality details for all current
          rules on this account.
          <Spinner />
        </div>
      );
    }

    const accountId = this.props.selectedAccountID;
    const cardinalityTotalsForAccount = {};
    cardinalityTotalsForAccount[accountId] = this.props.cardinalityTotals
      ? this.props.cardinalityTotals[accountId]
      : null;

    return (
      <div className="CardinalityWrapperInner">
        <div
          className={`heading ${
            this.props.cardinalityRuleViolation ||
            this.props.cardinalityAccountViolation
              ? 'violation'
              : ''
          }`}
        >
          {this.props.cardinalityRuleViolation ||
          this.props.cardinalityAccountViolation
            ? 'We found a few things to fix. Edit your rule'
            : 'Looks good!'}
        </div>
        <ul className="violationList">
          {this.props.cardinalityRuleViolation ? (
            <li className="CardinalityViolation">
              <b>
                Your rule has more than 20,000 unique values (per-rule
                cardinality violation)!
              </b>
              <br />
              <span className="detail">
                You must remove attributes and/or narrow the scope to proceed.
              </span>
            </li>
          ) : (
            <li className="NoCardinalityViolation">
              Your rule is within the per-rule cardinality limit of 20,000 over
              the last week.
            </li>
          )}
          {this.props.cardinalityAccountViolation ? (
            <li className="CardinalityViolation">
              <b>
                Your account has over 5 million unique custom values (account
                cardinality violation)!
              </b>
              <br />
              <span className="detail">
                You must remove other rules or modify the attributes selected in
                this rule to proceed.
              </span>
            </li>
          ) : (
            <li className="NoCardinalityViolation">
              This rule does not push your account above the 5M total account
              cardinality limit.
            </li>
          )}
        </ul>

        <div className="chartcontainer">
          <div className="chart">
            <div className="charttitle">Per Rule Limit</div>
            <div className="CardinalityNewRuleChartContainer">
              <LineChart
                data={buildCardinalityChartData(
                  this.props.timerangeArray,
                  [this.props.cardinalityTimeseries],
                  false
                )}
                fullWidth
                fullHeight
              />
            </div>
          </div>
          {!cardinalityTotalsForAccount ? null : (
            <div className="chart">
              <div className="charttitle">Per Account Limit</div>
              <div className="CardinalityNewRuleChartContainer">
                <LineChart
                  data={buildCardinalityTotalsChartData(
                    this.props.timerangeArray,
                    cardinalityTotalsForAccount,
                    this.props.cardinalityTimeseries
                  )}
                  fullWidth
                  fullHeight
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

RuleValidator.propTypes = {
  selectedAccountID: PropTypes.string,
  timerangeArray: PropTypes.array,
  validatingCardinality: PropTypes.bool,
  cardinalityTotals: PropTypes.object,
  cardinalityRuleViolation: PropTypes.bool,
  cardinalityAccountViolation: PropTypes.bool,
  setValidationTimeout: PropTypes.func.isRequired,
  cardinalityDataLoading: PropTypes.bool.isRequired,
  cardinalityTimeseries: PropTypes.object
};

export default RuleValidator;
