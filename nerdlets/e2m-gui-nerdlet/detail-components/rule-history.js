import React from 'react';
import PropTypes from 'prop-types';

import { NrqlQuery, Spinner } from 'nr1';
import { NerdGraphError } from '@newrelic/nr1-community';

const ParseRuleHistoryFromAuditData = auditData => {
  let auditDataResponse = [];
  if (auditData && auditData[0] && 'data' in auditData[0]) {
    auditDataResponse = auditData[0].data;
  }
  return (
    <ul className="rulehistory">
      {auditDataResponse.map((data, i) => {
        const actorId = data.actorId;
        const action = data.actionIdentifier;
        const date = new Date(data.timestamp);

        return (
          <li key={i}>
            User {actorId}{' '}
            {action === 'e2m_rule.create'
              ? 'created this rule'
              : `performed action: ${action}`}{' '}
            on {date.getMonth() + 1}/{date.getUTCDate()}/{date.getYear()}
          </li>
        );
      })}
    </ul>
  );
};

const RuleHistory = ({ ruleId, accountId }) => {
  return (
    <div className="RuleHistoryWrapper">
      <div className="Label">Rule Audit Log</div>
      <NrqlQuery
        accountId={accountId}
        query={`FROM NrAuditEvent SELECT \`actorId\`, \`actionIdentifier\`, timestamp since 36 months ago WHERE actionIdentifier like 'e2m_rule%' and \`targetId\` = '${ruleId}'`}
      >
        {({ data, error, loading }) => {
          if (loading) {
            return <Spinner />;
          }
          if (error) {
            return <NerdGraphError error={error} />
          }

          return ParseRuleHistoryFromAuditData(data);
        }}
      </NrqlQuery>
    </div>
  );
};

RuleHistory.propTypes = {
  accountId: PropTypes.number.isRequired,
  ruleId: PropTypes.string.isRequired
};

export default RuleHistory;
