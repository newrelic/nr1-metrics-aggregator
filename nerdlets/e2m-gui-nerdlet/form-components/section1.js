import React from 'react';
import PropTypes from 'prop-types';

import AccountSelector from './account-selector';
import EventSelector from './event-selector';
import AggregatorSelector from './aggregator-selector';
import AttributeDropdownSelector from './attribute-dropdown-selector';
import AttributeCheckboxSelector from './attribute-checkbox-selector';
import FilterSelector from './filter-selector';

import { Button, HeadingText, TextField } from 'nr1';

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
      className={`sectionWrapper ${activeStep == 1 ? 'expand' : 'collapse'}`}
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
            Select account data to aggregate
          </HeadingText>
        </div>
        <div className={`body ${activeStep == 1 ? 'expand' : 'collapse'}`}>
          <div className="section-heading">Account</div>
          <div className="section-description">
            Select the account(s) you'd like to create rules for.
          </div>
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
              <div className="section-heading">Events</div>
              <div className="section-description">
                Select which event type you'd like to aggegate (eg. 'PageView')
              </div>
              <EventSelector
                selectedAccountID={selectedAccountID}
                setEventType={setEventType}
                selectedEventType={selectedEventType}
              />

              <div className="section-heading">Aggregation function</div>
              <div className="section-description">
                This tells us what calculation to use when we aggregate the
                data. Do you want to produce a uniqueCount, average, etc.
              </div>
              <AggregatorSelector
                setAggregator={setAggregator}
                selectedAggregator={selectedAggregator}
                selectedEventType={selectedEventType}
              />
              <div className="section-heading">Attribute to aggregate</div>
              <div className="section-description">
                This is the attribute that you want to aggregate, it must have a
                numerical value (eg. 'Duration')
              </div>
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

              <div className="section-description">
                You can narrow the scope of this metric to only include data
                that matches on certain key values. (eg. appName is "myApp").
                Click the filter icon down to include more complex filters.
              </div>

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
                Select additional attributes to keep on the metric{' '}
                <span className="attributeMax">Max 20 attributes</span>
              </div>

              <div className="section-description">
                You can select additional addtributes to keep on the metric for
                further analysis.
              </div>
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
          {!readyForStepTwo() ? null : (
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
