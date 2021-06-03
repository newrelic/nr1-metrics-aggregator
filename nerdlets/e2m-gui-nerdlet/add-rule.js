import React from 'react';
import PropTypes from 'prop-types';
import { HeadingText, Toast } from 'nr1';

import Section1 from './form-components/section1';
import Section2 from './form-components/section2';
import Section3 from './form-components/section3';

import RuleValidator from './form-components/rule-validator';

import { createAndSaveNewRule, findRuleViolations } from '../util/async';

const DEFAULT_STATE = {
  activeStep: 1,
  advancedMode: false,
  selectedAccountID: null,
  selectedEventType: null,
  selectedAggregator: 'summary',
  selectedAttribute: null,
  selectedFacetAttributes: [],
  availableAttributes: [],
  validatedFilterNRQL: null,
  validatedMetricName: null,
  validatedRuleDescription: '',
  validatedRuleAlias: null,
  cardinalityTimeseries: null,
  validatingCardinality: null,
  waitingToValidateCardinality: null,
  validationTimeout: null,
  hasValidatedRule: false,
  userGeneratedNRQL: null,
  showModal: false,
  error: null
};

export default class AddE2MRule extends React.Component {
  constructor(props) {
    super(props);
    this.state = DEFAULT_STATE;
    this.setAccountID = this.setAccountID.bind(this);
    this.setEventType = this.setEventType.bind(this);
    this.setAggregator = this.setAggregator.bind(this);
    this.setAttribute = this.setAttribute.bind(this);
    this.toggleFacetAttribute = this.toggleFacetAttribute.bind(this);
    this.readyToBeValidated = this.readyToBeValidated.bind(this);
    this.buildOrGetCreateRuleNRQL = this.buildOrGetCreateRuleNRQL.bind(this);
    this.ruleIsCompletelyValidated = this.ruleIsCompletelyValidated.bind(this);
    this.validateRule = this.validateRule.bind(this);
    this.setValidationTimeout = this.setValidationTimeout.bind(this);
    this.toggleAdvancedMode = this.toggleAdvancedMode.bind(this);
    this.readyForStepTwo = this.readyForStepTwo.bind(this);
    this.readyForStepThree = this.readyForStepThree.bind(this);
    this.closeAddRule = this.closeAddRule.bind(this);
    this.setAdvancedNRQL = this.setAdvancedNRQL.bind(this);
    this.createValidatedRule = this.createValidatedRule.bind(this);

    this.nameTextfield = React.createRef();
    this.aliasTextfield = React.createRef();
    this.descriptionTextfield = React.createRef();
  }

  toggleAdvancedMode() {
    const { advancedMode } = this.state;
    this.setState({ advancedMode: !advancedMode });
  }

  setAccountID(selectedAccountID) {
    this.setState({
      selectedAccountID,
      selectedEventType: null,
      selectedAttribute: null,
      selectedFacetAttributes: [],
      validatedFilterNRQL: null,
      validatedMetricName: null,
      validatedRuleDescription: '',
      validatedRuleAlias: null,
      cardinalityRuleViolation: null,
      cardinalityAccountViolation: null
    });
  }

  readyToBeValidated() {
    if (
      this.state.selectedAccountID &&
      this.state.selectedEventType &&
      this.state.selectedFacetAttributes &&
      this.state.selectedFacetAttributes.length
    ) {
      return true;
    }
    return false;
  }

  setEventType(selectedEventType) {
    this.setState({
      selectedEventType,
      selectedAttribute: null,
      selectedFacetAttributes: [],
      validatedFilterNRQL: null,
      validatedMetricName: null,
      validatedRuleDescription: '',
      validatedRuleAlias: null,
      cardinalityRuleViolation: null,
      cardinalityAccountViolation: null
    });
  }

  setAggregator(selectedAggregator) {
    this.setState({
      selectedAggregator,
      selectedAttribute: null,
      selectedFacetAttributes: [],
      validatedFilterNRQL: null,
      validatedMetricName: null,
      validatedRuleDescription: '',
      validatedRuleAlias: null,
      cardinalityRuleViolation: null,
      cardinalityAccountViolation: null
    });
  }

  setAttribute(selectedAttribute, availableAttributes = null) {
    if (availableAttributes) {
      this.setState({
        selectedAttribute,
        availableAttributes,
        selectedFacetAttributes: [],
        validatedMetricName: null,
        validatedRuleDescription: '',
        validatedRuleAlias: null,
        cardinalityRuleViolation: null,
        cardinalityAccountViolation: null
      });
    } else {
      this.setState({
        selectedAttribute,
        selectedFacetAttributes: [],
        validatedMetricName: null,
        validatedRuleDescription: '',
        validatedRuleAlias: null,
        cardinalityRuleViolation: null,
        cardinalityAccountViolation: null
      });
    }
  }

  toggleFacetAttribute(facetAttribute) {
    const { selectedFacetAttributes: oldSelectedFacetAttributes } = this.state;
    const selectedFacetAttributes = oldSelectedFacetAttributes.slice(); // copy
    const index = selectedFacetAttributes.indexOf(facetAttribute);
    if (index !== -1) {
      // if id exists, remove it
      selectedFacetAttributes.splice(index, 1);
    } else {
      // else add it
      selectedFacetAttributes.push(facetAttribute);
    }
    this.setState({
      selectedFacetAttributes,
      validatedMetricName: null,
      validatedRuleDescription: '',
      validatedRuleAlias: null
    });
  }

  buildOrGetCreateRuleNRQL() {
    if (!this.ruleIsCompletelyValidated()) {
      return '';
    }
    if (this.state.advancedMode) {
      return this.state.userGeneratedNRQL;
    }
    // Wrap attribute in `'s if it's not '1'
    const optionallyEnclosedAttribute =
      this.state.selectedAttribute === '1'
        ? this.state.selectedAttribute
        : `\`${this.state.selectedAttribute}\``;
    return `FROM ${this.state.selectedEventType} SELECT ${
      this.state.selectedAggregator
    }(${optionallyEnclosedAttribute}) AS '${this.state.validatedMetricName}' ${
      this.state.validatedFilterNRQL ? this.state.validatedFilterNRQL : ''
    } FACET ${this.state.selectedFacetAttributes
      .map(attrObj => `\`${attrObj.key}\``)
      .join(', ')}`;
  }

  async createValidatedRule() {
    const {
      validatedRuleAlias,
      validatedRuleDescription,
      selectedAccountID
    } = this.state;
    const nrql = this.buildOrGetCreateRuleNRQL();
    const { error } = await createAndSaveNewRule(
      selectedAccountID,
      nrql,
      validatedRuleAlias,
      validatedRuleDescription
    );
    if (error) {
      console.log(error); // eslint-disable-line no-console
      Toast.showToast({
        title: 'An error occured while creating your rule',
        description: `This rule may not have been created.\n\nSee console for details.`,
        actions: [],
        type: Toast.TYPE.CRITICAL
      });
    } else {
      Toast.showToast({
        title: 'Your rule has been created!',
        description: ``,
        actions: [],
        type: Toast.TYPE.NORMAL
      });
      this.closeAddRule();
    }
  }

  ruleIsCompletelyValidated() {
    return (
      this.state.cardinalityRuleViolation === false &&
      !this.state.cardinalityAccountViolation &&
      !this.state.validatingCardinality &&
      !this.state.waitingToValidateCardinality &&
      this.state.validatedMetricName &&
      this.state.validatedRuleAlias &&
      this.props.cardinalityTotals &&
      this.props.timerangeArray &&
      this.props.timerangeArray.length &&
      this.state.cardinalityTimeseries &&
      ((this.state.advancedMode && this.state.userGeneratedNRQL) ||
        !this.state.advancedMode)
    );
  }

  setValidationTimeout() {
    const self = this;
    if (self.state.validationTimeout) {
      clearTimeout(self.state.validationTimeout);
    }
    /* eslint-disable react/no-unused-state */
    this.setState({
      validationTimeout: setTimeout(self.validateRule, 1500),
      waitingToValidateCardinality: true
    });
    /* eslint-enable */
  }

  readyForStepTwo() {
    const {
      validatingCardinality,
      cardinalityRuleViolation,
      cardinalityAccountViolation,
      hasValidatedRule
    } = this.state;

    return (
      this.readyToBeValidated() &&
      hasValidatedRule &&
      !validatingCardinality &&
      !cardinalityRuleViolation &&
      !cardinalityAccountViolation
    );
  }

  readyForStepThree() {
    const { validatedRuleAlias, validatedMetricName } = this.state;
    return this.readyForStepTwo() && validatedRuleAlias && validatedMetricName;
  }

  async validateRule() {
    if (!this.readyToBeValidated()) {
      this.setState({ waitingToValidateCardinality: false });
      return;
    }
    this.setState({
      validatingCardinality: true,
      waitingToValidateCardinality: false
    });
    try {
      const {
        cardinalityRuleViolation,
        cardinalityAccountViolation,
        cardinalityTimeseries
      } = await findRuleViolations(
        this.state.selectedAccountID,
        this.state.selectedEventType,
        this.state.selectedFacetAttributes,
        this.state.validatedFilterNRQL,
        this.props.timerangeArray,
        this.props.cardinalityTotals
      );

      this.setState({
        cardinalityRuleViolation,
        cardinalityAccountViolation,
        cardinalityTimeseries,
        hasValidatedRule: true,
        validatingCardinality: false
      });
    } catch (error) {
      console.log('error: ', error); // eslint-disable-line no-console
      this.setState({ error, validatingCardinality: false }); // eslint-disable-line react/no-unused-state
    }
  }

  closeAddRule() {
    this.props.reloadE2MRules();
    this.setState(DEFAULT_STATE);
    this.nameTextfield.current.clear();
    this.aliasTextfield.current.clear();
    this.descriptionTextfield.current.clear();
    this.props.onClose();
  }

  setAdvancedNRQL(userGeneratedNRQL) {
    this.setState({ userGeneratedNRQL });
  }

  render() {
    const {
      activeStep,
      advancedMode,
      selectedAccountID,
      selectedEventType,
      selectedAggregator,
      selectedAttribute,
      availableAttributes,
      selectedFacetAttributes,
      validatingCardinality,
      validatedFilterNRQL,
      validatedRuleAlias,
      validatedRuleDescription,
      cardinalityRuleViolation,
      cardinalityAccountViolation,
      cardinalityTimeseries,
      showModal
    } = this.state;
    const { accountsObj, e2mRulesByMetricName } = this.props;
    return (
      <div className="modalContainer">
        <div className="Close Float" onClick={this.closeAddRule}>
          >
        </div>
        <div
          className="Advanced Float hidden"
          onClick={this.toggleAdvancedMode}
        >
          {advancedMode ? 'Basic Mode' : 'Advanced Mode (NRQL)'}
        </div>
        <div className="outerMarginModal">
          <HeadingText
            className="AddRuleHeading"
            spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
            type={HeadingText.TYPE.HEADING_1}
          >
            Create a new aggregated metric
          </HeadingText>

          <div className="outerFormWrapper">
            <div className="innerFormWrapper">
              <Section1
                activeStep={activeStep}
                accountsObj={accountsObj}
                setAccountID={this.setAccountID}
                selectedAccountID={selectedAccountID}
                setEventType={this.setEventType}
                selectedEventType={selectedEventType}
                setAggregator={this.setAggregator}
                selectedAggregator={selectedAggregator}
                selectedAttribute={selectedAttribute}
                setAttribute={this.setAttribute}
                selectedFacetAttributes={selectedFacetAttributes}
                toggleFacetAttribute={this.toggleFacetAttribute}
                availableAttributes={availableAttributes}
                readyForStepTwo={this.readyForStepTwo}
                validatingCardinality={this.validatingCardinality}
                setActiveStep={num => this.setState({ activeStep: num })}
                violation={
                  cardinalityRuleViolation || cardinalityAccountViolation
                }
                setValidatedFilterNRQL={validatedFilterNRQL =>
                  this.setState({ validatedFilterNRQL })
                }
                validatedFilterNRQL={validatedFilterNRQL}
                advancedMode={advancedMode}
                setAdvancedNRQL={this.setAdvancedNRQL}
              />
              <Section2
                activeStep={activeStep}
                setActiveStep={num => this.setState({ activeStep: num })}
                nameTextfield={this.nameTextfield}
                aliasTextfield={this.aliasTextfield}
                descriptionTextfield={this.descriptionTextfield}
                selectedAccountID={selectedAccountID}
                selectedEventType={selectedEventType}
                selectedAttribute={selectedAttribute}
                selectedAggregator={selectedAggregator}
                selectedFacetAttributes={selectedFacetAttributes}
                validatedFilterNRQL={validatedFilterNRQL}
                setValidatedMetricName={validatedMetricName =>
                  this.setState({ validatedMetricName })
                }
                e2mRulesByMetricName={e2mRulesByMetricName}
                setValidatedRuleAlias={validatedRuleAlias =>
                  this.setState({ validatedRuleAlias })
                }
                setValidatedDescription={validatedRuleDescription =>
                  this.setState({ validatedRuleDescription })
                }
                readyForStepThree={this.readyForStepThree}
                cardinalityDataLoading={this.props.cardinalityDataLoading}
              />
              <Section3
                activeStep={activeStep}
                setActiveStep={num => this.setState({ activeStep: num })}
                selectedAccountID={selectedAccountID}
                ruleIsCompletelyValidated={this.ruleIsCompletelyValidated}
                validatedRuleAlias={validatedRuleAlias}
                validatedRuleDescription={validatedRuleDescription}
                createRuleNRQL={this.buildOrGetCreateRuleNRQL()}
                createValidatedRule={this.createValidatedRule}
                showModal={showModal}
                toggleModal={() => this.setState({ showModal: !showModal })}
                closeAddRule={this.closeAddRule}
              />
            </div>
          </div>
          {!this.readyToBeValidated() ? null : (
            <div className="RequirementsPane">
              <RuleValidator
                selectedAccountID={selectedAccountID}
                selectedEventType={selectedEventType}
                selectedFacetAttributes={selectedFacetAttributes}
                selectedAttribute={selectedAttribute}
                selectedAggregator={selectedAggregator}
                cardinalityTimeseries={cardinalityTimeseries}
                readyToBeValidated={this.readyToBeValidated}
                cardinalityTotals={this.props.cardinalityTotals}
                timerangeArray={this.props.timerangeArray}
                validatingCardinality={validatingCardinality}
                cardinalityRuleViolation={cardinalityRuleViolation}
                cardinalityAccountViolation={cardinalityAccountViolation}
                setValidationTimeout={this.setValidationTimeout}
                cardinalityDataLoading={this.props.cardinalityDataLoading}
                validatedFilterNRQL={validatedFilterNRQL}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

AddE2MRule.propTypes = {
  accountsObj: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  e2mRulesByMetricName: PropTypes.array,
  cardinalityTotals: PropTypes.object,
  timerangeArray: PropTypes.array,
  cardinalityDataLoading: PropTypes.bool.isRequired,
  reloadE2MRules: PropTypes.func.isRequired
};
