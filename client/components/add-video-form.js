import React from "react"

class AddVideoForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            url: ''
        }
        this.socket = props.socket;
    }

    onChange = (e) => {
        let target = e.target
        let value = target.value
        this.setState({ url: value })
    }

    onClickSubmit = (e) => {
        this.props.onClickSubmit({ url: this.state.url })
    }

    render() {
        return (
            <div className="component">
                <h2>Add a video to the queue:</h2>
                <input onChange={(e) => this.onChange(e)} />
                <button className="button" onClick={(e) => this.onClickSubmit(e)} >Submit video request</button>
            </div>
        )
    }
}

export default AddVideoForm