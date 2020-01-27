import React from 'react'
// import { observer } from 'mobx-react'
import socketIOClient from "socket.io-client"
import Layout from '../components/layout'
import QueueBox from '../components/queue-box-client'
import AddVideoForm from '../components/add-video-form'

// import Queue from '../store/queue'

import './client.scss'

import { endpoint } from '../constants'

// @observer
class RoomPage extends React.Component {
    
    constructor(props) {
        super(props)
        this.searchForm = React.createRef()

        this.state = {
            // inRoom: false,
            items: [],
            ws: null,
            room: null
        }

    }

    // ws = new WebSocket('ws://localhost:8080/ws')
    timeout = 250

    onVideoRequest = (vidId) => {
        console.log(vidId);
        this.sendMessage("AddToQueue", JSON.stringify({ room: this.state.room, vidID: vidId }));
        this.searchForm.current.clearSearchResults();
    }

    onSearchVideo = (query) => {
        console.log(query);
        this.sendMessage("Search", JSON.stringify({ query }));
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
            // let roomName = location.href.split('/')[3]
            let clientId = window.localStorage.getItem('clientId')

            this.sendMessage("register", JSON.stringify({ room: this.state.room, clientID: clientId }))

            this.sendMessage('GetQueue', JSON.stringify({ room: this.state.room }))

            that.timeout = 250; // reset timer to 250 on open of websocket connection 
            clearTimeout(connectInterval); // clear Interval on on open of websocket connection
        };

        ws.onmessage = e => {
            console.log(e.data);
            let splitIndex = e.data.indexOf(' ')
            let event = e.data.slice(0, splitIndex)
            let data = e.data.slice(splitIndex + 1)
            switch (event) {
                case "registered":
                    window.localStorage.setItem('clientId', data)
                    break;
                case 'RefreshQueue':
                    data = JSON.parse(data)
                    console.log('RefreshQueue', data);
                    if (data) {
                        that.setState({ items: data })
                    }
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
                let msg = `${eventName} ${message}`
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

    componentDidMount() {
        this.setState({ room: window.sessionStorage.getItem('room') })
        this.connect()

        // this.socket = socketIOClient.connect(endpoint)

        // if (window.sessionStorage.getItem('room')) {
        //     let roomId = window.sessionStorage.getItem('room') || ''
        //     this.socket.emit('init', roomId)
        // }

        // let Room = this;
        
        // this.socket.on("RefreshQueue", function(data) {
        //     if (!this.state.inRoom) {
        //         Room.setState({ inRoom: true });
        //     }
        //     Room.setState({ items: data })
        // })

        // this.socket.on("FoundVideos", function(items) {
        //     if (Room.searchForm.current) {
        //         Room.searchForm.current.setState({ searchResults: items, searchTerms: '' });
        //     }
        // })

    }

    componentWillUnmount() {
        // this.socket.emit("disconnect");
        let ws = this.state.ws

        try {
            this.sendMessage('disconnect', null)
        } catch(error) {
            console.log(error)
        }
    }

    render() {
        let nowPlaying = (this.state.items.length > 0) ? this.state.items[0].id : ''
        return (
            <Layout>
                <AddVideoForm 
                    ref={this.searchForm} 
                    onClickSubmit={this.onSearchVideo.bind(this)}
                    onSelectVideo={this.onVideoRequest.bind(this)}
                    websocket={this.ws} />
                <QueueBox queue={this.state.items} />
            </Layout>
        )
    }
    
}

export default RoomPage
