import React from 'react';
import PropTypes from 'prop-types';
import { NerdGraphQuery, Spinner, TextField } from 'nr1';
import FilterAttributeSelector from './filter-attribute-selector';
import AddFilterIcon from '../../../images/add-filter-icon.png';
import { buildFilterValidationQuery } from '../../util/graphqlbuilders';

class FilterSelector extends React.Component {
  constructor(props) {
    super(props);
    /* eslint-disable react/no-unused-state */
    this.state = {
      filters: [],
      usingNRQL: false,
      nrqlQuery: '',
      valid: null,
      typingTimeout: 0,
      validating: false,
      error: null
    };
    /* eslint-enable */
    this.toggleFilterMode = this.toggleFilterMode.bind(this);
    this.setNRQL = this.setNRQL.bind(this);
    this.setAttributeForIndex = this.setAttributeForIndex.bind(this);
    this.setOperatorForIndex = this.setOperatorForIndex.bind(this);
    this.setValueForIndex = this.setValueForIndex.bind(this);
    this.validateFilter = this.validateFilter.bind(this);
    this.addFilter = this.addFilter.bind(this);
  }

  addFilter() {
    const { filters: oldFilters } = this.state;
    const filters = [...oldFilters];
    filters.push({ attribute: null, operator: null, value: null });
    /* eslint-disable react/no-unused-state */
    this.setState({
      filters,
      nrql: null
    });
    /* eslint-enable */
  }

  setAttributeForIndex(attribute, index) {
    const self = this;
    if (self.state.typingTimeout) {
      clearTimeout(self.state.typingTimeout);
    }
    const filters = [...self.state.filters];
    const filterObj = filters.length
      ? filters[index]
      : { attribute: null, operator: null, value: null };
    filterObj.attribute = attribute;
    filters.splice(index, 1, filterObj);
    const setState = self.setState.bind(this);
    const selectedAccountID = this.props.selectedAccountID;
    const selectedEventType = this.props.selectedEventType;
    const setValidatedFilterNRQL = this.props.setValidatedFilterNRQL;
    setState({
      filters,
      nrql: null,
      typingTimeout: setTimeout(() => {
        if (self.allFiltersCompleted(filters)) {
          self.validateFilter(
            self.getNRQLFromFilters(filters),
            setState,
            selectedAccountID,
            selectedEventType,
            setValidatedFilterNRQL
          );
        }
      }, 1000)
    });
  }

  setOperatorForIndex(op, index) {
    const self = this;
    if (self.state.typingTimeout) {
      clearTimeout(self.state.typingTimeout);
    }
    const filters = [...self.state.filters];
    const filterObj = filters.length
      ? filters[index]
      : { attribute: null, operator: null, value: null };
    filterObj.operator = op;
    filters.splice(index, 1, filterObj);
    const setState = self.setState.bind(this);
    const selectedAccountID = this.props.selectedAccountID;
    const selectedEventType = this.props.selectedEventType;
    const setValidatedFilterNRQL = this.props.setValidatedFilterNRQL;
    setState({
      filters,
      nrql: null,
      typingTimeout: setTimeout(() => {
        if (self.allFiltersCompleted(filters)) {
          self.validateFilter(
            self.getNRQLFromFilters(filters),
            setState,
            selectedAccountID,
            selectedEventType,
            setValidatedFilterNRQL
          );
        }
      }, 1000)
    });
  }

  setValueForIndex(value, index) {
    const self = this;
    if (self.state.typingTimeout) {
      clearTimeout(self.state.typingTimeout);
    }
    const filters = [...self.state.filters];
    const filterObj = filters.length
      ? filters[index]
      : { attribute: null, operator: null, value: null };
    filterObj.value = value;
    filters.splice(index, 1, filterObj);
    const setState = self.setState.bind(self);
    const selectedAccountID = this.props.selectedAccountID;
    const selectedEventType = this.props.selectedEventType;
    const setValidatedFilterNRQL = this.props.setValidatedFilterNRQL;
    setState({
      filters,
      nrql: null,
      typingTimeout: setTimeout(() => {
        if (self.allFiltersCompleted(filters)) {
          self.validateFilter(
            self.getNRQLFromFilters(filters),
            setState,
            selectedAccountID,
            selectedEventType,
            setValidatedFilterNRQL
          );
        }
      }, 1000)
    });
  }

  getNRQLFromFilters(filters) {
    let nrql = '';
    filters.forEach((filter, index) => {
      if (index !== 0) {
        nrql = `${nrql} AND `;
      } else {
        nrql = `${nrql} WHERE `;
      }

      if (filter.operator.toLowerCase().includes('is')) {
        nrql = `${nrql}\`${filter.attribute}\` ${filter.operator}`;
      } else {
        nrql = `${nrql}\`${filter.attribute}\` ${filter.operator} '${filter.value}'`;
      }
    });
    return nrql;
  }

  removeFilterAtIndex(index) {
    const self = this;
    const { filters } = { ...self.state };
    filters.splice(index, 1);

    const setState = self.setState.bind(this);
    const selectedAccountID = this.props.selectedAccountID;
    const selectedEventType = this.props.selectedEventType;
    const setValidatedFilterNRQL = this.props.setValidatedFilterNRQL;
    setState({
      filters,
      typingTimeout: setTimeout(() => {
        if (self.allFiltersCompleted(filters)) {
          self.validateFilter(
            self.getNRQLFromFilters(filters),
            setState,
            selectedAccountID,
            selectedEventType,
            setValidatedFilterNRQL
          );
        }
      }, 1000)
    });
  }

  allFiltersCompleted(filters, nrql) {
    if (nrql) {
      return true;
    }
    if (!filters || !filters.length) {
      return false;
    }
    for (let i = 0; i < filters.length; i++) {
      const filterObj = filters[i];
      if (
        !filterObj.attribute ||
        !filterObj.operator ||
        (!filterObj.value && !filterObj.operator.toLowerCase().includes('is'))
      ) {
        return false;
      }
    }
    return true;
  }

  noFiltersCompleted(filters) {
    for (let i = 0; i < filters.length; i++) {
      const filterObj = filters[i];
      if (filterObj.attribute || filterObj.operator || filterObj.value) {
        return false;
      }
    }
    return true;
  }

  setNRQL(nrqlQuery) {
    const self = this;
    if (self.state.typingTimeout) {
      clearTimeout(self.state.typingTimeout);
    }
    const setState = self.setState.bind(this);
    const selectedAccountID = this.props.selectedAccountID;
    const selectedEventType = this.props.selectedEventType;
    const setValidatedFilterNRQL = self.props.setValidatedFilterNRQL;
    setState({
      nrqlQuery,
      typingTimeout: setTimeout(() => {
        self.validateFilter(
          nrqlQuery,
          setState,
          selectedAccountID,
          selectedEventType,
          setValidatedFilterNRQL
        );
      }, 2000)
    });
  }

  toggleFilterMode() {
    const { usingNRQL } = this.state;
    this.setState({
      usingNRQL: !usingNRQL,
      nrqlQuery: '',
      filters: [],
      valid: false,
      error: null,
      validating: false
    });
  }

  async validateFilter(
    nrql,
    setState,
    selectedAccountID,
    selectedEventType,
    setValidatedFilterNRQL
  ) {
    if (!nrql) {
      setState({ valid: true });
      return;
    }
    setState({ validating: true });
    const { data } = await NerdGraphQuery.query(
      buildFilterValidationQuery(nrql, selectedAccountID, selectedEventType)
    );
    try {
      let valid = false;
      const queries = Object.keys(data.actor).filter(a => a.includes('query'));
      for (let i = 0; i < queries.length; i++) {
        try {
          // const allNum = data.actor[queries[i]].nrql.results[0].all;
          const filteredNum = data.actor[queries[i]].nrql.results[0].filtered;
          if (!isNaN(filteredNum)) {
            valid = true;
            break;
          }
        } catch (e) {
          console.log(e); // eslint-disable-line no-console
          valid = false;
          break;
        }
      }

      setState({
        valid,
        validating: false,
        error: null
      });

      if (valid) {
        setValidatedFilterNRQL(nrql);
      } else {
        setValidatedFilterNRQL('');
      }
    } catch (error) {
      console.log('error:', error); // eslint-disable-line no-console
      setState({ error, validating: false });
    }
  }

  renderStatus() {
    const { valid, validating, filters, nrqlQuery } = this.state;
    const allfilterscomplete = this.allFiltersCompleted(filters, nrqlQuery);

    if (validating) {
      return <Spinner />;
    }

    if (valid && allfilterscomplete) {
      return (
        <>
          {nrqlQuery ? null : (
            <div className="AddFilter" onClick={() => this.addFilter()}>
              <img src={AddFilterIcon} className="AddFilterIcon" />
              Add Filter
            </div>
          )}
          <div className="ValidFilter">Valid Filter</div>
        </>
      );
    }

    if (!valid && allfilterscomplete) {
      return <div className="NotValidFilter">Not Valid</div>;
    }

    return null;
  }

  render() {
    if (this.state.fetching) {
      return <Spinner />;
    }

    if (
      !this.props.availableAttributes ||
      !this.props.availableAttributes.length
    ) {
      return null;
    }
    /* eslint-disable no-nested-ternary */
    return (
      <div>
        {this.state.error ? (
          <div className="ErrorMessage">Check console for error</div>
        ) : null}
        <div className="SwapFilterMode" onClick={() => this.toggleFilterMode()}>
          {this.state.usingNRQL ? 'Basic' : 'Advanced (NRQL)'}
        </div>
        {this.state.usingNRQL ? (
          <TextField
            label=""
            placeholder="eg. WHERE pageUrl LIKE '%profile%'"
            onChange={e => this.setNRQL(e.target.value)}
          />
        ) : !this.state.filters.length ? (
          <FilterAttributeSelector
            key={0}
            availableAttributes={this.props.availableAttributes}
            setAttributeForIndex={attr => this.setAttributeForIndex(attr, 0)}
            setOperatorForIndex={op => this.setOperatorForIndex(op, 0)}
            setValueForIndex={val => this.setValueForIndex(val, 0)}
          />
        ) : (
          this.state.filters.map((filter, index) => (
            <FilterAttributeSelector
              className="FilterAttributeSelector"
              key={index}
              showRemove={this.state.filters.length > 1}
              removeFilterClicked={() => this.removeFilterAtIndex(index)}
              availableAttributes={this.props.availableAttributes}
              attribute={filter.attribute}
              operator={filter.operator}
              value={filter.value}
              setAttributeForIndex={attr =>
                this.setAttributeForIndex(attr, index)
              }
              setOperatorForIndex={op => this.setOperatorForIndex(op, index)}
              setValueForIndex={val => this.setValueForIndex(val, index)}
            />
          ))
        )}
        {this.renderStatus()}
      </div>
    );
    /* eslint-enable */
  }
}

FilterSelector.propTypes = {
  selectedAccountID: PropTypes.string,
  selectedEventType: PropTypes.string,
  availableAttributes: PropTypes.array,
  setValidatedFilterNRQL: PropTypes.func.isRequired
};

export default FilterSelector;
