import React from 'react'
import { observer } from 'mobx-react'
import YoutubeEmbedVideo from 'youtube-embed-video'
import socketIOClient from "socket.io-client"

import Layout from '../components/layout'
// import Video from '../components/video'
import YTPlayer from '../components/yt-player'
import QueueBox from '../components/queue-box'

// import Queue from '../store/queue'

import './page-styles.scss'

import endpoint from '../constants'

@observer
class RoomPage extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            nowPlaying: '',
            items: []
        }

        this.ytplayer = React.createRef()
    }

    nextVideo() {
        console.log('next video');
        this.socket.emit('Next');
    }

    /* Move this video to the top of the queue and play it immediately. */
    onClickItem(index) {
        this.socket.emit("PlayNow", index)
    }

    componentDidMount() {
        const endpoint = 'http://localhost:7003'
        this.socket = socketIOClient.connect(endpoint)
        
        this.socket.on("RefreshQueue", queue => {
            console.log('queue:', queue)
            if (queue[0] && queue[0].id !== this.state.nowPlaying) {
                this.setState({ nowPlaying: queue[0].id })
                this.ytplayer.current.playVideo(queue[0].id)
            }
            this.setState({ items: queue });
        })
    }

    componentWillUnmount() {
        this.socket.emit("disconnect");
    }

    render() {
        return (
            <Layout>
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