import React from 'react';
import PropTypes from 'prop-types';

import { Toast } from 'nr1';
import { calculateVolumeReductionForMetric } from '../util/async';

import MetricAttributes from './detail-components/attributes';
import VolumeReduction from './detail-components/volume-reduction';
import NRQLDetails from './detail-components/nrql-details';
import RuleHistory from './detail-components/rule-history';

export default class MetricDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      eventRate: null,
      metricRate: null
    };
  }

  componentDidMount() {
    if (!this.props.rateReduction) {
      this.calculateRateReduction();
    }
  }

  shouldComponentUpdate(nextProps) {
    if (JSON.stringify(this.state) !== JSON.stringify(this.props)) {
      if (!nextProps.rateReduction) {
        this.calculateRateReduction();
      }
      return true;
    }
    return false;
  }

  async calculateRateReduction() {
    const {
      eventRate,
      metricRate,
      errors
    } = await calculateVolumeReductionForMetric(this.props.metric);

    if (errors) {
      console.log(errors); // eslint-disable-line no-console
      Toast.showToast({
        title: 'Error',
        description:
          'An error occured while loading the rate reduction for this metric. See console for details.',
        type: Toast.TYPE.NORMAL
      });
    } else {
      this.props.addRateReductionsForMetric(
        eventRate,
        metricRate,
        this.props.metric
      );
    }
  }

  render() {
    const {
      metricName,
      id,
      name,
      description,
      nrql,
      accountId,
      enabled
    } = this.props.metric;
    const { rateReduction } = this.props;
    return (
      <div className="MetricDetailsWrapper">
        <div className="Close" onClick={this.props.clearSelectedMetric}>
          >
        </div>
        <div className="Heading">{metricName}</div>
        <div className="Description">{description}</div>
        {!enabled ? null : (
          <VolumeReduction
            eventRate={
              rateReduction ? rateReduction.eventRate : this.state.eventRate
            }
            metricRate={
              rateReduction ? rateReduction.metricRate : this.state.metricRate
            }
          />
        )}
        <div className="Label">
          Example query
          <div className="NRQL">
            FROM Metric SELECT average(<b>{metricName}</b>)
          </div>
        </div>
        <div className="AboutMetric">ABOUT THE RULE</div>
        <div className="Label">
          Rule Name <br />
          <span className="Value">{name}</span>
        </div>
        <MetricAttributes nrql={nrql} accountId={accountId} />
        <NRQLDetails nrql={nrql} />
        <br />
        <RuleHistory accountId={accountId} ruleId={id} />
      </div>
    );
  }
}

MetricDetails.propTypes = {
  metric: PropTypes.object.isRequired,
  rateReduction: PropTypes.object,
  addRateReductionsForMetric: PropTypes.func.isRequired,
  clearSelectedMetric: PropTypes.func.isRequired
};
