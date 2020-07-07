import React from 'react';
import PropTypes from 'prop-types';

import { getCardinalityForRule } from '../util/cardinality-helper';
import { toggleMetric } from '../util/async';

import EnableSwitch from './table-components/enable-switch';
import CardinalityPercent from './table-components/cardinality-percent';

const CARDINALITY_LIMIT = 100000;

export default class TableWrapper extends React.Component {
  render() {
    const {
      filteredMetrics,
      cardinalities,
      metricSelection,
      reloadE2MRules
    } = this.props;

    // TODO - allow sorting by clicking column names
    const enabled = filteredMetrics.filter(m => m.enabled);
    enabled.sort((a, b) => (a.metricName < b.metricName ? 1 : -1));
    const disabled = filteredMetrics.filter(m => !m.enabled);
    disabled.sort((a, b) => (a.metricName < b.metricName ? 1 : -1));
    const metrics = enabled.concat(disabled);
    return (
      <div className="TableWrapper">
        <table className="Table">
          <thead>
            <tr className="HeaderRow">
              <th>Rule Id</th>
              <th width="400" className="TableMetricColumn">
                Metric Name
              </th>
              <th>Account</th>
              <th>RPM</th>
              <th>
                Cardinality
                <br />
                Limit
              </th>
              <th className="TableSwitch">Status</th>
            </tr>
          </thead>
          <tbody className="TableBody">
            {metrics.map((m, index) => {
              const cardinality = getCardinalityForRule(
                cardinalities,
                m.accountId,
                m.id
              );
              const violation = cardinality > CARDINALITY_LIMIT;
              const selected =
                metricSelection &&
                metricSelection.id === m.id &&
                metricSelection.metricName === m.metricName;
              return (
                <tr
                  className={`TableRow ${selected ? 'Selected' : ''}`}
                  key={index}
                  height="40"
                  onClick={e => {
                    this.props.setMetricSelection(m, cardinality);
                    e.stopPropagation();
                  }}
                >
                  <td
                    height="40"
                    className={`TableRuleId ${violation ? 'Red' : 'Green'}`}
                  >
                    {m.id}
                  </td>
                  <td height="40" className="TableMetricColumn" width="400">
                    {m.metricName}
                  </td>
                  <td height="40" className="TableAccountColumn">
                    {this.props.accountsObj[m.accountId].name}
                  </td>
                  <td height="40" className="TableAccountNameColumn">
                    {m.accountId}
                  </td>
                  <CardinalityPercent
                    cardinality={cardinality}
                    limit={CARDINALITY_LIMIT}
                    enabled={m.enabled}
                  />
                  <EnableSwitch
                    enabled={m.enabled}
                    toggleClicked={async () => {
                      toggleMetric(m.id, m.accountId, m.enabled);
                      await reloadE2MRules();
                    }}
                    metricName={m.metricName}
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

TableWrapper.propTypes = {
  filteredMetrics: PropTypes.array.isRequired,
  accountsObj: PropTypes.object,
  setMetricSelection: PropTypes.func.isRequired,
  cardinalities: PropTypes.array,
  metricSelection: PropTypes.object,
  reloadE2MRules: PropTypes.func.isRequired
};
