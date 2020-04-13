import React from "react";
import PropTypes from "prop-types";
import { NerdGraphQuery, Spinner } from "nr1";
import SelectSearch from "react-select-search";
import { buildAttributeQueries } from "../../util/graphqlbuilders";

class AttributeDropdownSelector extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			attributes: [],
			fetching: false,
			error: null
		};
		this.fetchData = this.fetchData.bind(this);
	}

	componentDidUpdate(prevProps) {
		if (
			(this.props.selectedAccountID !== prevProps.selectedAccountID ||
				this.props.selectedAggregator !==
					prevProps.selectedAggregator ||
				this.props.selectedEventType !== prevProps.selectedEventType) &&
			!this.state.fetching
		) {
			this.fetchData(this.props.selectedAccountID);
		}
	}

	fetchData(selectedAccountID) {
		if (
			!selectedAccountID ||
			!this.props.selectedAggregator ||
			!this.props.selectedEventType
		) {
			return;
		}
		this.setState({ fetching: true });
		NerdGraphQuery.query(
			buildAttributeQueries(
				selectedAccountID,
				this.props.selectedEventType
			)
		)
			.then(({ data, error }) => {
				let attributeSet = new Set();
				Object.keys(data["actor"])
					.filter(i => i.includes("query"))
					.forEach(query => {
						try {
							data["actor"][query]["nrql"]["results"].forEach(
								attributeObj => attributeSet.add(attributeObj)
							);
						} catch (error) {
							this.setState({
								error: `${error}\n${JSON.stringify(data)}`
							});
						}
					});
				const attributes = Array.from(attributeSet).sort();

				this.setState({
					attributes,
					fetching: false,
					error: null
				});
			})
			.catch(error => this.setState({ error, fetching: false }));
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

		if (
			!this.props.selectedAggregator ||
			!this.props.selectedEventType ||
			!this.state.attributes ||
			!this.state.attributes.length) {
			return null
		}

		const attributeFilter = attr =>
			this.props.selectedAggregator &&
			(this.props.selectedAggregator.toLowerCase() == "uniquecount" ||
				(this.props.selectedAggregator.toLowerCase() == "summary" &&
					attr["type"] == "numeric"));

		const {selectedAttribute, setAttribute} = this.props
		const {attributes} = this.state

		return (
			<SelectSearch
				options={attributes
					.filter(attributeFilter)
					.map(attribute => ({
						name: attribute["key"],
						value: attribute["key"]
					}))}
				placeholder={
					selectedAttribute
						? selectedAttribute
						: "Choose an attribute to base the metric off of"
				}
				autoComplete={"on"}
				onChange={e => setAttribute(e["value"], attributes)}
				multiple={false}
				autofocus={false}
				value={selectedAttribute ? selectedAttribute : ""}
				search={true}
				height={300}
			/>
		);
	}
}

AttributeDropdownSelector.propTypes = {
	selectedAccountID: PropTypes.string,
	selectedEventType: PropTypes.string,
	setAttribute: PropTypes.func.isRequired,
	selectedAttribute: PropTypes.string,
	selectedAggregator: PropTypes.string
};

export default AttributeDropdownSelector;
