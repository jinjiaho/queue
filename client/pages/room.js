import React from 'react'
// import { observer } from 'mobx-react'
import socketIOClient from "socket.io-client"

import Layout from '../components/layout'
import YTPlayer from '../components/yt-player'
import QueueBox from '../components/queue-box-room'

// import Queue from '../store/queue'

import './room.scss'

import { endpoint } from '../constants'
import AddVideoForm from '../components/add-video-form'
console.log(endpoint)

// @observer
class RoomPage extends React.Component {
    
    constructor(props) {
        super(props)
        this.searchForm = React.createRef()

        this.state = {
            nowPlaying: {},
            items: [],
            ws: null,
            room: null
        }

        this.ytplayer = React.createRef()
    }

    nextVideo() {
        this.sendMessage('Next', JSON.stringify({ room: this.state.room }));
    }

    /* Move this video to the top of the queue and play it immediately. */
    onClickItem(index) {
        // let roomId = sessionStorage.getItem('room');
        this.sendMessage("PlayNow", JSON.stringify({ room: this.state.room, index: index }))
    }

    /**
     * @function connect
     * This function establishes the connect with the websocket and also ensures constant reconnection if connection closes
     */
    connect = () => {
        var ws = new WebSocket("ws://localhost:8080/ws");
        let that = this; // cache the this
        var connectInterval;

        // websocket onopen event listener
        ws.onopen = () => {
            console.log("connected websocket main component");

            this.setState({ ws: ws });

            // register the client
            this.sendMessage("register", JSON.stringify({ clientID: window.localStorage.getItem('clientId') }))
            console.log('room', this.state.room)
            this.sendMessage('GetQueue', JSON.stringify({ room: this.state.room }))

            that.timeout = 250; // reset timer to 250 on open of websocket connection 
            clearTimeout(connectInterval); // clear Interval on on open of websocket connection
        };

        ws.onmessage = e => {
            let splitIndex = e.data.indexOf(' ')
            let event = e.data.slice(0, splitIndex)
            let data = e.data.slice(splitIndex + 1)
            switch (event) {
                case 'registered':
                    window.localStorage.setItem('clientId', data)
                    break;
                case 'RefreshQueue':
                    let queue = JSON.parse(data)
                    if (!queue) {
                        break;
                    }
                    if (queue[0] && queue[0].id !== this.state.nowPlaying.id) {
                        this.setState({ nowPlaying: queue[0] })
                        this.ytplayer.current.playVideo(queue[0].id)
                    }
                    this.setState({ items: queue });
                    break;
                case 'FoundVideos':
                    let items = JSON.parse(data)
                    if (this.searchForm.current) {
                        this.searchForm.current.setState({ searchResults: items, searchTerms: '' });
                    }
                    break;
            }
        }

        // websocket onclose event listener
        ws.onclose = e => {
            console.log(
                `Socket is closed. Reconnect will be attempted in ${Math.min(
                    10000 / 1000,
                    (that.timeout + that.timeout) / 1000
                )} second.`,
                e.reason
            );

            that.timeout = that.timeout + that.timeout; // increment retry interval
            connectInterval = setTimeout(this.check, Math.min(10000, that.timeout)); // call check function after timeout
        };

        // websocket onerror event listener
        ws.onerror = err => {
            console.error(
                "Socket encountered error: ",
                err.message,
                "Closing socket"
            );

            ws.close();
        };
    };

    sendMessage = (eventName, message) => {
        try {
            if (this.state.ws) {
                console.log('sending message:', eventName, message)
                let msg = message ? `${eventName} ${message}` : eventName
                this.state.ws.send(msg)
            } else {
                console.log('websocket not yet ready', eventName, message)
            }
        } catch(error) {
            console.log(error)
        }
    }

    /**
     * utilited by the @function connect to check if the connection is close, if so attempts to reconnect
     */
    check = () => {
        const { ws } = this.state;
        if (!ws || ws.readyState == WebSocket.CLOSED) this.connect(); //check if websocket instance is closed, if so call `connect` function.
    };

    onVideoRequest = (vidId) => {
        this.sendMessage("AddToQueue", JSON.stringify({ room: this.state.room, vidID: vidId }));
        this.searchForm.current.clearSearchResults();
    }

    onSearchVideo = (query) => {
        this.sendMessage("Search", JSON.stringify({ query }));
    }


    componentDidMount() {
        this.setState({ room: window.sessionStorage.getItem('room') })

        this.connect()
    }

    componentWillUnmount() {
        this.sendMessage("disconnect");
    }

    render() {
        return (
            <Layout>
                <div className="room-name">Join this room with <strong>{this.state.room}</strong></div>
                <br/>
                {this.state.nowPlaying ? <div>
                    <h2>Now playing: {this.state.nowPlaying.title}</h2>
                    <YTPlayer 
                        videoId={this.state.nowPlaying || 'UfsbnewzIVE'} 
                        ref={this.ytplayer}
                        onVideoEnd={this.nextVideo.bind(this)} />
                </div> : false }
                <QueueBox queue={this.state.items} onClickItem={this.onClickItem.bind(this)} />
                <AddVideoForm 
                    ref={this.searchForm} 
                    onClickSubmit={this.onSearchVideo.bind(this)}
                    onSelectVideo={this.onVideoRequest.bind(this)}
                    websocket={this.ws} />
            </Layout>
        )
    }
    
}

export default RoomPage
