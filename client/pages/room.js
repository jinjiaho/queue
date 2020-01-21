import React from 'react'
// import { observer } from 'mobx-react'
import socketIOClient from "socket.io-client"

import Layout from '../components/layout'
import YTPlayer from '../components/yt-player'
import QueueBox from '../components/queue-box-room'

// import Queue from '../store/queue'

import './room.scss'

import { endpoint } from '../constants'
console.log(endpoint)

// @observer
class RoomPage extends React.Component {
    
    constructor(props) {
        super(props)

        this.state = {
            nowPlaying: '',
            items: [],
            address: ''
        }

        this.ytplayer = React.createRef()
    }

    nextVideo() {
        this.socket.emit('Next');
    }

    /* Move this video to the top of the queue and play it immediately. */
    onClickItem(index) {
        this.socket.emit("PlayNow", index)
    }

    componentDidMount() {
        this.socket = socketIOClient.connect(endpoint)
        
        this.socket.on("RefreshQueue", queue => {
            if (queue[0] && queue[0].id !== this.state.nowPlaying) {
                this.setState({ nowPlaying: queue[0].id })
                this.ytplayer.current.playVideo(queue[0].id)
            }
            this.setState({ items: queue });
        })

        this.socket.on("IP", function(address) {
            this.setState({ address: address });
        })
    }

    componentWillUnmount() {
        this.socket.emit("disconnect");
    }

    render() {
        return (
            <Layout>
                <div id="address">{this.state.address}</div>
                <YTPlayer 
                    videoId={this.state.nowPlaying || 'UfsbnewzIVE'} 
                    ref={this.ytplayer}
                    onVideoEnd={this.nextVideo.bind(this)} />
                <QueueBox queue={this.state.items} onClickItem={this.onClickItem.bind(this)} />
            </Layout>
        )
    }
    
}

export default RoomPage
