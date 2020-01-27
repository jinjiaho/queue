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
            room: null
        }

        this.ytplayer = React.createRef()
    }

    nextVideo() {
        this.sendMessage('Next', { room: this.state.room });
    }

    /* Move this video to the top of the queue and play it immediately. */
    onClickItem(index) {
        // let roomId = sessionStorage.getItem('room');
        this.sendMessage("PlayNow", { room: this.state.room, index: index })
    }

    sendMessage = (event, data) => {
        try {
            if (this.socket) {
                console.log('sending data:', event, data)
                this.socket.emit(event, data);
            } else {
                console.log('socket not yet ready', event, data)
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
        this.sendMessage("AddToQueue", { room: this.state.room, vidId: vidId });
        this.searchForm.current.clearSearchResults();
    }

    onSearchVideo = (query) => {
        this.sendMessage("Search", { query });
    }


    componentDidMount() {
        let Room = this

        this.socket = socketIOClient.connect(endpoint)
        
        let roomId = window.sessionStorage.getItem('room')
        if (roomId) {
            this.setState({ room: window.sessionStorage.getItem('room') })
            let clientId = window.localStorage.getItem('clientId')

            this.sendMessage("register", { room: roomId, clientID: clientId })

            // this.sendMessage('GetQueue', roomId)
        }

        this.socket.on('registered', function(id) {
            window.localStorage.setItem('clientId', id)
        })

        this.socket.on('RefreshQueue', function(queue) {
            if (queue[0] && queue[0].id !== Room.state.nowPlaying.id) {
                Room.setState({ nowPlaying: queue[0] })
                Room.ytplayer.current.playVideo(queue[0].id)
            }
            Room.setState({ items: queue });
        })

        this.socket.on('FoundVideos', function(items) {
            if (Room.searchForm.current) {
                Room.searchForm.current.setState({ searchResults: items, searchTerms: '' });
            }
        })

        this.socket.on("error", function(err) {
            console.error(
                "Socket encountered error: ",
                err.message
            );
        })
    }

    componentWillUnmount() {
        try {
            this.sendMessage('disconnect', null)
        } catch(error) {
            console.log(error)
        }
    }

    render() {
        return (
            <Layout>
                <div className="room-name">Join this room with the code <strong>{this.state.room}</strong></div>
                <br/>
                {this.state.nowPlaying.id ? <div>
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
