import React from 'react'

class JoinRoomForm extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            word1: '',
            word2: '',
            error: ''
        }
    }

    onWord1Change = (e) => {
        this.setState({ word1: e.target.value.trim() })
    }

    onWord2Change = (e) => {
        this.setState({ word2: e.target.value.trim() })
    }

    findRoom = (e) => {
        let roomId = `${this.state.word1}-${this.state.word2}`;
        fetch(`http://localhost:3001/check-room-exists/${roomId}`).then(response => {
            console.log(response);
            // window.location.href = `/client/${roomId}`;
        }).catch(err => {
            console.error(err);
            this.setState({ error: err })
        })
    }

    render() {
        return (
            <div id="join-room-form">
                <h2>Join a Room:</h2>
                <input pattern="/[a-zA-Z]/" onChange={(e) => this.onWord1Change} />-<input pattern="/[a-zA-Z]/" onChange={(e) => this.onWord2Change} />
                <button onClick={(e) =>  this.findRoom} >Join Room!</button>
                {this.state.error ? <p className="error">{this.state.error}</p> : false }
            </div>
        )
    }
}

export default JoinRoomForm