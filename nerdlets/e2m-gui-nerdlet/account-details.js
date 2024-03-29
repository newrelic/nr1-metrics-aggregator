import React from 'react';
import PropTypes from 'prop-types';
import { Spinner, LineChart } from 'nr1';

import {
  buildCardinalityChartData,
  buildCardinalityTotalsChartData
} from '../util/chart-helper';

import {
  filterCardinalitiesByFitleredMetricList,
  filterCardinalityTotalsByAccountIdFilter
} from '../util/misc';

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default class AccountDetails extends React.Component {
  getProgressDiv() {
    return (
      <div className="ProgressWrapper">
        Calculating cardinality for all rules.
        <div className="ProgressVisual">
          {!this.props.percentCompleteCardLoading ? (
            <Spinner />
          ) : (
            <CircularProgressbar
              styles={buildStyles({
                // Rotation of path and trail, in number of turns (0-1)
                rotation: 0,

                // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
                strokeLinecap: 'round',

                // Text size
                textSize: '26px',

                // How long animation takes to go from one percentage to another, in seconds
                pathTransitionDuration: 0.5,

                // Can specify path transition in more detail, or remove it entirely
                // pathTransition: 'none',

                // Colors
                pathColor: '#469990',
                textColor: '#f88',
                trailColor: '#d6d6d6',
                backgroundColor: '#3e98c7'
              })}
              value={this.props.percentCompleteCardLoading}
              text=""
            />
          )}
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.cardinalities || !this.props.cardinalities.length) {
      return this.getProgressDiv();
    }

    const {
      timerangeArray,
      filteredMetrics,
      accountIdFilter,
      cardinalities,
      cardinalityTotals,
      cardinalityDataLoading
    } = this.props;

    const filteredCardinalities = filterCardinalitiesByFitleredMetricList(
      JSON.parse(JSON.stringify(cardinalities)),
      filteredMetrics
    );
    const filteredCardinalityTotals = filterCardinalityTotalsByAccountIdFilter(
      JSON.parse(JSON.stringify(cardinalityTotals)),
      accountIdFilter
    );

    const dataByRule = buildCardinalityChartData(
      timerangeArray,
      filteredCardinalities
    );

    const dataByAccount = buildCardinalityTotalsChartData(
      timerangeArray,
      filteredCardinalityTotals
    );

    return (
      <div className="CardinalityDetailsPaneInner">
        {!dataByRule || !dataByRule.length ? null : (
          <div className="CardinalityDetailsChartWrapper">
            <h3>Limits Per Rule</h3>
            <LineChart data={dataByRule} fullWidth fullHeight />
          </div>
        )}
        {!dataByAccount || !dataByAccount.length || cardinalityDataLoading ? (
          this.getProgressDiv()
        ) : (
          <div className="CardinalityDetailsChartWrapper">
            <h3>Limits per Account</h3>
            <LineChart data={dataByAccount} fullWidth fullHeight />
          </div>
        )}
        <div className="refreshcache">
          You may be seeing cached data. To refresh click{' '}
          <span onClick={() => this.props.refreshCardinality()}>here</span>.
        </div>
      </div>
    );
  }
}

AccountDetails.propTypes = {
  filteredMetrics: PropTypes.array,
  accountIdFilter: PropTypes.number,
  cardinalities: PropTypes.array,
  cardinalityTotals: PropTypes.object,
  timerangeArray: PropTypes.array,
  percentCompleteCardLoading: PropTypes.number,
  cardinalityDataLoading: PropTypes.bool,
  refreshCardinality: PropTypes.func.isRequired
};
