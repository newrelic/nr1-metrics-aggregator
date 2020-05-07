import React from 'react';
import {
  Button,
  Grid,
  GridItem,
  HeadingText,
  Spinner,
  TextField,
  Toast
} from 'nr1';
import AddE2MRule from './add-rule';
import AccountDetails from './account-details';
import RuleTable from './rule-table';
import MetricDetails from './metric-details';

import icon from '../../launchers/e2m-gui-launcher/icon.png';

import { getCardinalityTotalsForAccount } from '../util/cardinality-helper';

import {
  loadCardinalityForAllEnabledRules,
  getAccountsForUser,
  getE2MRulesForAccountObj
} from '../util/async';

import { getTimeRangeFromCardinality } from '../util/chart-helper';

import {
  getE2MRulesByMetric,
  makeAccountArrayAnObject,
  getLastThreeDays
} from '../util/misc';

const DEFAULT_STATE = {
  accountsObj: null,
  cardinalities: null,
  cardinalityTotals: null,
  cardinalityFinishedLoading: null,
  e2mRules: null,
  e2mRulesByMetricName: null,
  filterText: null,
  hidden: true,
  metricSelection: null,
  rateReductions: {},
  tableDataLoading: true,
  cardinalityDataLoading: true,
  percentCompleteCardLoading: 0,
  error: null
};

export default class E2mGui extends React.Component {
  constructor(props) {
    super(props);
    this.state = DEFAULT_STATE;
    this.onCloseModalPressed = this.onCloseModalPressed.bind(this);
    this.addNewRuleAndCloseDialog = this.addNewRuleAndCloseDialog.bind(this);
    this.setCardinalities = this.setCardinalities.bind(this);
    this.setCardinalitiesForAccount = this.setCardinalitiesForAccount.bind(
      this
    );
    this.setMetricSelection = this.setMetricSelection.bind(this);
    this.loadCardinality = this.loadCardinality.bind(this);
    this.getTimeRange = this.getTimeRange.bind(this);
    this.reloadE2MRules = this.reloadE2MRules.bind(this);
  }

  componentDidMount() {
    this.reloadE2MRules();
  }

  addNewRuleAndCloseDialog(ruleCardinality) {
    this.onCloseModalPressed();
    this.addNewRuleCardinality(ruleCardinality);
    this.reloadE2MRules();
  }

  onCloseModalPressed() {
    this.setState({ hidden: true });
  }

  setCardinalities(cardinalities, cardinalityTotals, timerangeArray) {
    const { timerangeArray: stateTimerangeArray } = this.state;
    const timerange =
      !stateTimerangeArray || !stateTimerangeArray.length
        ? timerangeArray
        : stateTimerangeArray;
    this.setState({
      cardinalities,
      cardinalityTotals,
      timerangeArray: timerange
    });
  }

  setTableFilterTimeout(filterText) {
    const self = this;
    if (self.state.typingTimeout) {
      clearTimeout(self.state.typingTimeout);
    }
    self.setState({
      typingTimeout: setTimeout(() => {
        self.setState({ filterText });
      }, 1000)
    });
  }

  setCardinalitiesForAccount(cardinalitiesForAccount, accountId, e2mRules) {
    const copied =
      !this.state.cardinalities || !this.state.cardinalities.length
        ? []
        : [...this.state.cardinalities];
    const cardinalities = copied.filter(item => item.accountId !== accountId);
    const { timerangeArray: stateTimerangeArray } = this.state;
    const timerangeArray =
      !stateTimerangeArray || !stateTimerangeArray.length
        ? getTimeRangeFromCardinality(cardinalitiesForAccount)
        : stateTimerangeArray;
    cardinalities.push(cardinalitiesForAccount);
    const ruleCount = cardinalities.reduce(
      (total, cardinality) => total + cardinality.cardinalities.length,
      0
    );
    this.setState({
      cardinalities,
      timerangeArray,
      percentCompleteCardLoading: (ruleCount * 100) / e2mRules.length
    });
  }

  async loadCardinality(e2mRules, accountsObj, noCache = false) {
    if (!this.state.cardinalityDataLoading) {
      this.setState({ cardinalityDataLoading: true });
    }
    try {
      const bustCache = noCache || e2mRules.length < 10;
      const accountIds = Object.keys(accountsObj);
      const cardinalities = [];
      const cardinalityTotals = {};
      for (let i = 0; i < accountIds.length; i++) {
        const accountId = accountIds[i];
        const cardinalitiesForAccount = await loadCardinalityForAllEnabledRules(
          e2mRules,
          accountId,
          cardinalities =>
            this.setCardinalitiesForAccount(cardinalities, accountId, e2mRules),
          e => {
            console.log(e); // eslint-disable-line no-console
            Toast.showToast({
              title: 'An error occured calculating cardinality',
              description: `The cardinality may not display properly.\n\nSee console for details.`,
              actions: [],
              type: Toast.TYPE.CRITICAL
            });
          },
          bustCache
        );
        cardinalities.push(cardinalitiesForAccount);
        cardinalityTotals[accountId] = getCardinalityTotalsForAccount(
          cardinalitiesForAccount
        );

        // TODO - add incremental progress updates
      }

      // Get the timerange from a nonempty cardinality if it hasnt already been defined
      // TODO - this could use a more robust solution.
      const { timerangeArray: stateTimerangeArray } = this.state;
      let timerangeArray = stateTimerangeArray;
      if (!timerangeArray || !timerangeArray.length) {
        const nonEmptyCardinalities = cardinalities.filter(
          card => card.cardinalities && card.cardinalities.length
        );
        if (nonEmptyCardinalities && nonEmptyCardinalities.length) {
          timerangeArray = getTimeRangeFromCardinality(
            nonEmptyCardinalities[0]
          );
        }
      }

      this.setState({
        cardinalities,
        cardinalityTotals,
        timerangeArray,
        cardinalityDataLoading: false
      });
    } catch (error) {
      console.log('error:', error); // eslint-disable-line no-console
      this.setState({ cardinalityDataLoading: false, error }); // eslint-disable-line react/no-unused-state
    }
  }

  setMetricSelection(metricSelection, cardinality) {
    metricSelection.cardinality = cardinality;
    this.setState({ metricSelection });
  }

  async reloadE2MRules() {
    try {
      const accounts = await getAccountsForUser();
      const accountsObj = makeAccountArrayAnObject(accounts);
      const e2mRules = await getE2MRulesForAccountObj(accounts);
      const e2mRulesByMetricName = getE2MRulesByMetric(e2mRules);
      this.setState({
        e2mRules,
        e2mRulesByMetricName,
        accountsObj,
        tableDataLoading: false
      });
      this.loadCardinality(e2mRules, accountsObj);
    } catch (error) {
      Toast.showToast({
        title: 'An error occured',
        description: `This nerdlet may not display properly.\n\nDetails: ${JSON.stringify(
          error
        )}`,
        actions: [],
        type: Toast.TYPE.CRITICAL
      });
      /* eslint-disable react/no-unused-state */
      this.setState({
        error: true,
        tableDataLoading: false,
        cardinalityDataLoading: false
      });
      /* eslint-enable */
    }
  }

  getTimeRange() {
    // If there's an existing timerange array then use it!
    // Otherwise, return an array of the timestamps over the last 3 days.

    // Note, the reason why we are doing this is because we may be caching
    // some of the results and we will need to perform this analysis against
    // the same timeframe
    if (this.state.timerangeArray && this.state.timerangeArray.length) {
      return this.state.timerangeArray;
    }
    return getLastThreeDays();
  }

  render() {
    const {
      metricSelection,
      hidden,
      accountsObj,
      cardinalityTotals,
      e2mRules,
      e2mRulesByMetricName,
      tableDataLoading,
      filterText,
      cardinalities,
      percentCompleteCardLoading,
      cardinalityDataLoading,
      rateReductions
    } = this.state;

    const numEnabledRules = !e2mRulesByMetricName
      ? 0
      : Object.keys(
          e2mRulesByMetricName
            .filter(rule => rule.enabled)
            .reduce((result, rBM) => {
              result[rBM.id] = true;
              return result;
            }, {})
        ).length;
    /* eslint-disable no-nested-ternary */
    return (
      <div className="OuterMargins">
        <div>
          <div className={`AddE2MRuleSlider ${!hidden ? 'show' : ''}`}>
            {!accountsObj ? (
              'Account data did not load. Please contact account team for support.'
            ) : (
              <AddE2MRule
                onClose={this.onCloseModalPressed}
                accountsObj={accountsObj}
                e2mRulesByMetricName={e2mRulesByMetricName}
                cardinalityTotals={cardinalityTotals}
                cardinalityDataLoading={cardinalityDataLoading}
                timerangeArray={this.getTimeRange()}
                addNewRuleAndCloseDialog={this.addNewRuleAndCloseDialog}
              />
            )}
          </div>
          <Grid>
            <GridItem columnSpan={8}>
              <div className="MainPanel">
                <div className="heading-wrapper">
                  <Grid>
                    <GridItem columnSpan={10}>
                      <img className="NerdletLogo" src={icon} />
                      <HeadingText
                        className="NerdletHeading"
                        style={{
                          color: '#434846 !important'
                        }}
                        spacingType={[HeadingText.SPACING_TYPE.SMALL]}
                        type={HeadingText.TYPE.HEADING_2}
                      >
                        Create a new aggregated metric
                      </HeadingText>
                    </GridItem>
                    <GridItem columnSpan={2}>
                      <div className="pull-right">
                        <Button
                          onClick={() =>
                            this.setState({
                              hidden: false
                            })
                          }
                          type={Button.TYPE.PRIMARY}
                          iconType={
                            Button.ICON_TYPE.DOCUMENTS__DOCUMENTS__NOTES__A_ADD
                          }
                        >
                          Create Rule
                        </Button>
                      </div>
                    </GridItem>
                  </Grid>
                </div>
                <div className="subtitle">
                  Use aggregated metrics rules to reduce long-term storage costs
                  and increase query speed.
                </div>
                <div className={!hidden ? 'hidden' : ''}>
                  {/* When the rules finish loading, show the table if there are
												already e2m rules. Otherwise, show a warning that they either
												don't have e2m rules or do not have permissions. */}
                  {!tableDataLoading ? (
                    e2mRulesByMetricName && e2mRulesByMetricName.length ? (
                      <div className="table-container">
                        <div className="FilterBox">
                          <TextField
                            className="FilterTextfield"
                            onChange={e =>
                              this.setTableFilterTimeout(e.target.value)
                            }
                            placeholder="Enter filter text..."
                            type={TextField.TYPE.SEARCH}
                          />
                        </div>
                        <RuleTable
                          filterText={filterText}
                          e2mRulesByMetricName={e2mRulesByMetricName}
                          cardinalities={cardinalities}
                          setMetricSelection={this.setMetricSelection}
                          metricSelection={metricSelection}
                          accountsObj={this.state.accountsObj}
                          reloadE2MRules={this.reloadE2MRules}
                        />
                        Your accounts have{' '}
                        {e2mRulesByMetricName
                          ? e2mRulesByMetricName.filter(rule => rule.enabled)
                              .length
                          : 0}{' '}
                        metric aggregations from {numEnabledRules}
                        &nbsp;enabled rules.
                      </div>
                    ) : (
                      <div className="NoRulesFound">
                        <i>
                          We did not find any E2M rules for this account.
                          Possible reasons:
                        </i>
                        <br />
                        <br />
                        <ol className="norules">
                          <li>
                            Your accounts have not created any metric
                            aggregation rules yet.
                          </li>
                          <li>
                            Or, you do not have the necessary permission to
                            manage metric aggregation for your accounts.
                          </li>
                        </ol>{' '}
                        <br />
                        <br />
                        If you feel this is in error, please reach out to your
                        account team.
                      </div>
                    )
                  ) : (
                    <Spinner />
                  )}
                </div>
              </div>
            </GridItem>
            <GridItem columnSpan={4}>
              {!tableDataLoading &&
              (e2mRulesByMetricName == null || !e2mRulesByMetricName.length) ? (
                <div />
              ) : (
                <div className="DetailPanel">
                  {/* Show the overall account details by default
											and the indidvidual metric details after
											clicks on a table row. */}
                  {!metricSelection ? (
                    <AccountDetails
                      cardinalities={cardinalities}
                      cardinalityTotals={cardinalityTotals}
                      timerangeArray={this.getTimeRange()}
                      percentCompleteCardLoading={percentCompleteCardLoading}
                      cardinalityDataLoading={cardinalityDataLoading}
                      numberOfRules={
                        e2mRulesByMetricName ? e2mRulesByMetricName.length : 0
                      }
                      refreshCardinality={() =>
                        this.loadCardinality(e2mRules, accountsObj, true)
                      }
                    />
                  ) : (
                    <MetricDetails
                      metric={metricSelection}
                      rateReduction={
                        !rateReductions
                          ? null
                          : rateReductions[
                              `${metricSelection.id}${metricSelection.metricName}`
                            ]
                      }
                      clearSelectedMetric={() =>
                        this.setState({
                          metricSelection: null
                        })
                      }
                      addRateReductionsForMetric={(
                        eventRate,
                        metricRate,
                        metric
                      ) => {
                        // Add rate reduction with key:
                        //   ruleidmetricname
                        const theRateReductions = {
                          ...rateReductions
                        };
                        theRateReductions[
                          `${metric.id}${metric.metricName}`
                        ] = {
                          eventRate,
                          metricRate
                        };
                        this.setState({
                          rateReductions: theRateReductions
                        });
                      }}
                    />
                  )}
                </div>
              )}
            </GridItem>
          </Grid>
        </div>
      </div>
    );
    /* eslint-enable */
  }
}
