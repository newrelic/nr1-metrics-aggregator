import React from 'react';
import PropTypes from 'prop-types';

import { HeadingText, Button } from 'nr1';

import three from '../../../images/three.png';

const Section3 = ({
  activeStep,
  setActiveStep,
  ruleIsCompletelyValidated,
  createValidatedRule
}) => {
  return (
    <div
      className={`sectionWrapper NewRuleButtonWrapper ${
        activeStep === 3 ? 'expand' : 'collapse'
      }`}
    >
      <div className="numberWrapper">
        <img src={three} />
      </div>
      <div className="formWrapper">
        <div className="headingWrapper" onClick={() => setActiveStep(3)}>
          <HeadingText
            style={{
              color: '#434846 !important'
            }}
            spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
            type={HeadingText.TYPE.HEADING_2}
          >
            Create Rule
          </HeadingText>
        </div>
        <div className={`body ${activeStep === 3 ? 'expand' : 'collapse'}`}>
          <br />

          <Button className="next" onClick={() => setActiveStep(2)}>
            Previous Step
          </Button>
          {!ruleIsCompletelyValidated() ? null : (
            <Button
              className="next"
              onClick={() => createValidatedRule()}
              type={Button.TYPE.PRIMARY}
            >
              Create Rule
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

Section3.propTypes = {
  activeStep: PropTypes.number,
  setActiveStep: PropTypes.func.isRequired,
  ruleIsCompletelyValidated: PropTypes.func.isRequired,
  validatedRuleAlias: PropTypes.string,
  validatedRuleDescription: PropTypes.string,
  createRuleNRQL: PropTypes.string.isRequired,
  selectedAccountID: PropTypes.string,
  showModal: PropTypes.bool,
  toggleModal: PropTypes.func.isRequired,
  closeAddRule: PropTypes.func.isRequired,
  createValidatedRule: PropTypes.func.isRequired
};

export default Section3;
