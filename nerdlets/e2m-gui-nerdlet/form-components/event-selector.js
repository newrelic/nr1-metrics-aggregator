import React from 'react';
import PropTypes from 'prop-types';
import { NerdGraphQuery, Spinner, Toast } from 'nr1';
import SelectSearch from 'react-select-search';
import { buildEventTypeQueries } from '../../util/graphqlbuilders';

class EventSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      eventTypes: [],
      fetching: false,
      error: null
    };
    this.fetchData = this.fetchData.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.selectedAccountID !== prevProps.selectedAccountID &&
      !this.state.fetching
    ) {
      this.fetchData(this.props.selectedAccountID);
    }
  }

  fetchData(selectedAccountID) {
    if (!selectedAccountID) {
      return;
    }
    this.setState({ fetching: true });
    NerdGraphQuery.query(buildEventTypeQueries(selectedAccountID))
      .then(({ data }) => {
        const eventTypeSet = new Set();
        Object.keys(data.actor)
          .filter(i => i.includes('query'))
          .forEach(query => {
            data.actor[query].nrql.results.forEach(eventTypeObj => {
              eventTypeSet.add(eventTypeObj.eventType);
            });
          });
        const eventTypes = Array.from(eventTypeSet).sort();
        this.setState({
          eventTypes,
          fetching: false,
          error: null
        });
      })
      .catch(error => {
        console.log(error);
        Toast.showToast({
          title: 'An error occured while downloading EventTypes',
          description: `You may not be able to select an event type. Please refresh. If this does not fix the issue, contact your account team.`,
          actions: [],
          type: Toast.TYPE.CRITICAL
        });
        this.setState({ error, fetching: false });
      });
  }

  render() {
    // Since multiple accounts are selected, the event types shown below are aggregated from
    //      all accounts. Each individual account may not have the event types here.
    if (this.state.error) {
      console.log(this.state.error);
      return <div>Check console for error</div>;
    } else if (this.state.fetching) {
      return <Spinner />;
    }

    /* TODO: Pull the disabledOrNotObj out to AddRule Component */
    const hide = !this.state.eventTypes.length;

    const { eventTypes } = this.state;
    const { selectedEventType, setEventType } = this.props;
    return hide ? null : (
      <SelectSearch
        options={eventTypes
          .filter(
            eventType =>
              eventType.toLowerCase() != 'metric' && !eventType.startsWith('Nr')
          )
          .map(eventType => ({
            name: eventType,
            value: eventType
          }))}
        placeholder={
          selectedEventType || 'Choose an Event to base the metric off of'
        }
        autoComplete="on"
        onChange={e => setEventType(e.value)}
        multiple={false}
        autofocus={false}
        value={selectedEventType || ''}
        search
        height={300}
      />
    );
  }
}

EventSelector.propTypes = {
  selectedAccountID: PropTypes.string,
  setEventType: PropTypes.func.isRequired,
  selectedEventType: PropTypes.string
};

export default EventSelector;
