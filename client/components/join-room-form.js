import React from 'react'
import { useCookies } from 'react-cookie'
import { server } from '../constants'

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
        let that = this
        console.log('find room', e)
        let roomId = `${this.state.word1.toLowerCase()}-${this.state.word2.toLowerCase()}`;
        let xhr = new XMLHttpRequest();
        console.log('checking if room', roomId, "exists")
        xhr.open('GET', `${server}/check-room-exists/${roomId}`)
        xhr.send();
        xhr.onreadystatechange = function(e) {
            let DONE = 4;
            let OK = 200
            if (xhr.readyState === DONE) {
                if (xhr.responseText === 'OK') {
                    window.sessionStorage.setItem('room', roomId);
                    window.location.href = '/client';
                } else {
                    console.log('Error:', xhr.status);
                    that.setState({ error: 'Room does not exist' })
                }
            }
        }
    }

    render() {
        return (
            <div id="join-room-form">
                <h2>Join a Room:</h2>
                <div className="join-room-inputs">
                    <input pattern="/[a-zA-Z]/" onChange={this.onWord1Change.bind(this)} />
                    <span className="dash">&nbsp;&#8213;&nbsp;</span>
                    <input pattern="/[a-zA-Z]/" onChange={this.onWord2Change.bind(this)} />
                </div>
                <button type="button" onClick={this.findRoom.bind(this)} >Join Room!</button>
                {this.state.error ? <p className="error">{this.state.error}</p> : false }
            </div>
        )
    }
}

export default JoinRoomForm