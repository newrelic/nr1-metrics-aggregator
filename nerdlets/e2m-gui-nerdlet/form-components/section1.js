import React from 'react';
import PropTypes from 'prop-types';

import AccountSelector from './account-selector';
import EventSelector from './event-selector';
import AggregatorSelector from './aggregator-selector';
import AttributeDropdownSelector from './attribute-dropdown-selector';
import AttributeCheckboxSelector from './attribute-checkbox-selector';
import FilterSelector from './filter-selector';

import { Button, HeadingText, TextField, Spinner } from 'nr1';

import one from '../../../images/one.png';

const Section1 = ({
  activeStep,
  accountsObj,
  advancedMode,
  setAccountID,
  selectedAccountID,
  setEventType,
  selectedEventType,
  setAggregator,
  selectedAggregator,
  selectedAttribute,
  setAttribute,
  selectedFacetAttributes,
  setAdvancedNRQL,
  toggleFacetAttribute,
  availableAttributes,
  readyForStepTwo,
  validatingCardinality,
  setActiveStep,
  violation,
  setValidatedFilterNRQL,
  validatedFilterNRQL
}) => {
  return (
    <div
      className={`sectionWrapper ${activeStep === 1 ? 'expand' : 'collapse'}`}
    >
      <div className="numberWrapper">
        <img src={one} />
      </div>
      <div className="formWrapper">
        <div className="headingWrapper" onClick={() => setActiveStep(1)}>
          <HeadingText
            style={{
              color: '#434846 !important'
            }}
            spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
            type={HeadingText.TYPE.HEADING_2}
          >
            Define your rule
          </HeadingText>
        </div>
        <div className={`body ${activeStep === 1 ? 'expand' : 'collapse'}`}>
          <div className="section-heading">Select an account</div>
          <div className="section-description" />
          <AccountSelector
            accountsObj={accountsObj}
            setAccountID={setAccountID}
            selectedAccountID={selectedAccountID}
          />
          {advancedMode ? (
            <>
              <div className="section-heading">Rule NRQL</div>
              <TextField
                multiline
                label=""
                placeholder="Enter the rule NRQL here"
                onChange={e => setAdvancedNRQL(e.target.value)}
              />
            </>
          ) : (
            <>
              <div className="section-heading">
                Select an event to base your metric off of
              </div>
              <div className="section-description" />
              <EventSelector
                selectedAccountID={selectedAccountID}
                setEventType={setEventType}
                selectedEventType={selectedEventType}
              />

              <div className="section-heading">Select your query function</div>
              <div className="section-description" />
              <AggregatorSelector
                setAggregator={setAggregator}
                selectedAggregator={selectedAggregator}
                selectedEventType={selectedEventType}
              />
              <div className="section-heading">
                Select the attribute for your metric
              </div>
              <div className="section-description" />
              <AttributeDropdownSelector
                selectedAttribute={selectedAttribute}
                selectedAggregator={selectedAggregator}
                selectedAccountID={selectedAccountID}
                selectedEventType={selectedEventType}
                setAttribute={setAttribute}
              />
              <div
                className={`section-heading ${violation ? 'violation' : ''}`}
              >
                Narrow the scope <span className="unbold">(optional)</span>
              </div>

              <div className="section-description" />

              <FilterSelector
                selectedAccountID={selectedAccountID}
                selectedEventType={selectedEventType}
                setValidatedFilterNRQL={setValidatedFilterNRQL}
                validatedFilterNRQL={validatedFilterNRQL}
                availableAttributes={availableAttributes}
                selectedAttribute={selectedAttribute}
              />
              <div
                className={`section-heading ${violation ? 'violation' : ''}`}
              >
                Select additional attributes to facet on the metric{' '}
                <span className="attributeMax">Max 20 attributes</span>
              </div>

              <div className="section-description" />
              <AttributeCheckboxSelector
                selectedAttribute={selectedAttribute}
                selectedAggregator={selectedAggregator}
                selectedAccountID={selectedAccountID}
                selectedEventType={selectedEventType}
                selectedFacetAttributes={selectedFacetAttributes}
                toggleFacetAttribute={toggleFacetAttribute}
                availableAttributes={availableAttributes}
              />
            </>
          )}
          {validatingCardinality ? <Spinner /> : null}
          {!readyForStepTwo() ? (
            <div>
              <br />
              Select at least one facet to continue.
            </div>
          ) : (
            <Button
              className="next"
              onClick={() => setActiveStep(2)}
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

Section1.propTypes = {
  activeStep: PropTypes.number.isRequired,
  accountsObj: PropTypes.object.isRequired,
  advancedMode: PropTypes.bool.isRequired,
  setAccountID: PropTypes.func.isRequired,
  selectedAccountID: PropTypes.string,
  setEventType: PropTypes.func.isRequired,
  selectedEventType: PropTypes.string,
  setAggregator: PropTypes.func.isRequired,
  selectedAggregator: PropTypes.string,
  selectedAttribute: PropTypes.string,
  setAttribute: PropTypes.func.isRequired,
  selectedFacetAttributes: PropTypes.array,
  toggleFacetAttribute: PropTypes.func.isRequired,
  availableAttributes: PropTypes.array,
  readyForStepTwo: PropTypes.func.isRequired,
  validatingCardinality: PropTypes.bool,
  setActiveStep: PropTypes.func.isRequired,
  setAdvancedNRQL: PropTypes.func.isRequired,
  violation: PropTypes.bool,
  setValidatedFilterNRQL: PropTypes.func.isRequired,
  validatedFilterNRQL: PropTypes.string
};

export default Section1;
