import React from 'react'
import socketIOClient from "socket.io-client"
import Layout from '../components/layout'
import QueueBox from '../components/queue-box-client'
import AddVideoForm from '../components/add-video-form'

import './client.scss'

import { endpoint } from '../constants'

class RoomPage extends React.Component {
    
    constructor(props) {
        super(props)
        this.searchForm = React.createRef()

        this.state = {
            items: [],
            room: null
        }

    }

    onVideoRequest = (vidId) => {
        this.sendMessage("AddToQueue", { room: this.state.room, vidId: vidId });
        this.searchForm.current.clearSearchResults();
    }

    onSearchVideo = (query) => {
        this.sendMessage("Search", { query });
    }

    sendMessage = (event, data) => {
        try {
            if (this.socket) {
                console.log('sending data:', event, data)
                this.socket.emit(event, data)
            } else {
                console.log('socket not yet ready', event, data)
            }
        } catch(error) {
            console.log(error)
        }
    }

    componentDidMount() {

        let Room = this;

        this.socket = socketIOClient.connect(endpoint)

        this.socket.on("registered", function(data) {
            if (data) {
                window.localStorage.setItem('clientId', data)
            }
        })
        
        this.socket.on("RefreshQueue", function(data) {
            console.log('message received: RefreshQueue')
            if (data !== null && data !== undefined) {
                Room.setState({ items: data })
            }
        })

        this.socket.on("FoundVideos", function(items) {
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
        
        let roomId = window.sessionStorage.getItem('room')
        console.log(roomId);
        if (roomId) {
            this.setState({ room: window.sessionStorage.getItem('room') })
            let clientId = window.localStorage.getItem('clientId')

            this.sendMessage("register", { room: roomId, clientId: clientId })

            // this.sendMessage('GetQueue', roomId)
        }

    }

    componentWillUnmount() {
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
                    onSelectVideo={this.onVideoRequest.bind(this)} />
                <QueueBox queue={this.state.items} />
            </Layout>
        )
    }
    
}

export default RoomPage
