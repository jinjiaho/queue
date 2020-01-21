import React from 'react'
import { useCookies } from 'react-cookie'

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
        let roomId = `${this.state.word1.toLowerCase()}-${this.state.word2.toLowerCase()}`;
        fetch(`http://localhost:3001/check-room-exists/${roomId}`).then(response => {
            console.log(response);
            // const [cookies, setCookie] = useCookies(['room'])
            // setCookie('room', roomId, { path: '/', maxAge: 86400 })
            // window.location.href = '/client'
            window.sessionStorage.setItem('room', roomId);
        }).catch(err => {
            console.error(err);
            this.setState({ error: err })
        })
    }

    render() {
        return (
            <div id="join-room-form">
                <h2>Join a Room:</h2>
                <div className="join-room-inputs">
                    <input pattern="/[a-zA-Z]/" onChange={(e) => this.onWord1Change} />
                    <span className="dash">&nbsp;&#8213;&nbsp;</span>
                    <input pattern="/[a-zA-Z]/" onChange={(e) => this.onWord2Change} />
                </div>
                <button onClick={(e) =>  this.findRoom} >Join Room!</button>
                {this.state.error ? <p className="error">{this.state.error}</p> : false }
            </div>
        )
    }
}

export default JoinRoomForm