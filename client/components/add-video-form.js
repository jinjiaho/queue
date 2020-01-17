import React from "react"
import SearchResults from './search-results'

class AddVideoForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            url: '',
            targetUrl: '',
            searchTerms: '',
            searchResults: []
        }
    }

    onChange = (e) => {
        this.setState({ searchTerms: e.target.value.trim() })
    }

    onClickSubmit = (e) => {
        e.preventDefault();
        this.props.onClickSubmit(this.state.searchTerms)
    }

    render() {
        return (
            <div className="component">
                <h2>Add a video to the queue:</h2>
                <form className="search-form" onSubmit={this.onClickSubmit}>
                    <input name="search_query" onChange={(e) => this.onChange(e)} value={this.state.searchTerms} />
                    <button type="submit" className="button">Search</button>
                </form>
                
                <SearchResults items={this.state.searchResults} onClickItem={this.props.onSelectVideo} />
            </div>
        )
    }
}

export default AddVideoForm