import React from 'react';
import PropTypes from 'prop-types';

import { HeadingText, Button } from 'nr1';

import RuleAliasValidator from './rule-alias-validator';
import MetricNameValidator from './metric-name-validator';
import RuleDescriptionValidator from './rule-description-validator';

import two from '../../../images/two.png';

const Section2 = ({
  activeStep,
  nameTextfield,
  aliasTextfield,
  descriptionTextfield,
  setActiveStep,
  selectedAccountID,
  selectedEventType,
  selectedAttribute,
  selectedAggregator,
  selectedFacetAttributes,
  validatedFilterNRQL,
  setValidatedMetricName,
  e2mRulesByMetricName,
  setValidatedRuleAlias,
  setValidatedDescription,
  readyForStepThree,
  cardinalityDataLoading
}) => {
  /* TODO: Pull the disabledOrNotObj out to AddRule Component */
  // const disabledOrNotObj = !selectedEventType ? { disabled: true } : {};
  return (
    <div
      className={`sectionWrapper ${activeStep === 2 ? 'expand' : 'collapse'}`}
    >
      <div className="numberWrapper">
        <img src={two} />
      </div>
      <div className="formWrapper">
        <div className="headingWrapper" onClick={() => setActiveStep(2)}>
          <HeadingText
            style={{
              color: '#434846 !important'
            }}
            spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
            type={HeadingText.TYPE.HEADING_2}
          >
            Name and describe your new rule
          </HeadingText>
        </div>
        <div className={`body ${activeStep === 2 ? 'expand' : 'collapse'}`}>
          <div className="section-heading">Metric name</div>
          <div className="section-description">
            Your metric name must be unique. We recommend using dot separation
            between sections of the name.
          </div>
          <MetricNameValidator
            ref={nameTextfield}
            selectedAccountID={selectedAccountID}
            selectedEventType={selectedEventType}
            selectedAttribute={selectedAttribute}
            selectedAggregator={selectedAggregator}
            selectedFacetAttributes={selectedFacetAttributes}
            validatedFilterNRQL={validatedFilterNRQL}
            setValidatedMetricName={validatedMetricName =>
              setValidatedMetricName(validatedMetricName)
            }
            e2mRulesByMetricName={e2mRulesByMetricName}
            cardinalityDataLoading={cardinalityDataLoading}
          />
          <div className="section-heading">Rule alias</div>
          <RuleAliasValidator
            ref={aliasTextfield}
            selectedAccountID={selectedAccountID}
            setValidatedRuleAlias={validatedRuleAlias =>
              setValidatedRuleAlias(validatedRuleAlias)
            }
            selectedEventType={selectedEventType}
            selectedAttribute={selectedAttribute}
            selectedAggregator={selectedAggregator}
            selectedFacetAttributes={selectedFacetAttributes}
            validatedFilterNRQL={validatedFilterNRQL}
            e2mRulesByMetricName={e2mRulesByMetricName}
            cardinalityDataLoading={cardinalityDataLoading}
          />
          <div className="section-heading">Rule description</div>
          <RuleDescriptionValidator
            ref={descriptionTextfield}
            e2mRulesByMetricName={e2mRulesByMetricName}
            selectedAccountID={selectedAccountID}
            selectedEventType={selectedEventType}
            selectedAttribute={selectedAttribute}
            selectedAggregator={selectedAggregator}
            selectedFacetAttributes={selectedFacetAttributes}
            validatedFilterNRQL={validatedFilterNRQL}
            setValidatedDescription={validatedRuleDescription =>
              setValidatedDescription(validatedRuleDescription)
            }
            cardinalityDataLoading={cardinalityDataLoading}
          />
          <Button className="next" onClick={() => setActiveStep(1)}>
            Previous Step
          </Button>
          {!readyForStepThree() ? null : (
            <Button
              className="next"
              onClick={() => setActiveStep(3)}
              type={Button.TYPE.PRIMARY}
            >
              Next Step
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

Section2.propTypes = {
  activeStep: PropTypes.number.isRequired,
  setActiveStep: PropTypes.func.isRequired,
  selectedAccountID: PropTypes.string,
  selectedEventType: PropTypes.string,
  selectedAttribute: PropTypes.string,
  selectedAggregator: PropTypes.string,
  selectedFacetAttributes: PropTypes.array,
  validatedFilterNRQL: PropTypes.string,
  setValidatedMetricName: PropTypes.func.isRequired,
  e2mRulesByMetricName: PropTypes.array,
  setValidatedRuleAlias: PropTypes.func.isRequired,
  setValidatedDescription: PropTypes.func.isRequired,
  readyForStepThree: PropTypes.func.isRequired,
  cardinalityDataLoading: PropTypes.bool.isRequired
};

export default Section2;
