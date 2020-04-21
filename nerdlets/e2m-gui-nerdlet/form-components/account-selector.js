import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from 'nr1';

import SelectSearch from 'react-select-search';

const AccountSelector = ({ accountsObj, setAccountID, selectedAccountID }) => {
  if (!accountsObj) {
    return <Spinner />;
  }
  // sort keys based on their account names
  const accountKeysSorted = Object.keys(accountsObj);
  accountKeysSorted.sort((a, b) =>
    accountsObj[a].name.toLowerCase() < accountsObj[b].name.toLowerCase()
      ? -1
      : 1
  );

  return (
    <div className="checkboxWrapper">
      <SelectSearch
        options={accountKeysSorted.map(key => ({
          name: accountsObj[key].name,
          value: key
        }))}
        placeholder={
          selectedAccountID
            ? accountsObj[selectedAccountID].name
            : 'Choose an account to apply the rule'
        }
        autoComplete="on"
        onChange={e => setAccountID(e.value)}
        multiple={false}
        autofocus
        value={selectedAccountID || ''}
        search
        height={300}
      />
    </div>
  );
};

AccountSelector.propTypes = {
  accountsObj: PropTypes.object.isRequired,
  setAccountID: PropTypes.func.isRequired,
  selectedAccountID: PropTypes.string
};

export default AccountSelector;
