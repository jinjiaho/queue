import React from 'react'
import { observer } from 'mobx-react'
import YoutubeEmbedVideo from 'youtube-embed-video'
import Layout from '../components/layout'
// import Video from '../components/video'
import QueueBox from '../components/queue-box'
import QueueItem from '../components/queue-item'

// import Queue from '../store/queue'

import './page-styles.scss'
import socketIOClient from "socket.io-client"

@observer
class RoomPage extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            nowPlaying: '',
            items: []
        }

        const endpoint = 'http://localhost:7003'
        this.socket = socketIOClient.connect(endpoint)
        
        this.socket.on("RefreshQueue", data => {
            if (data[0] && data[0].id !== this.state.nowPlaying) {
                this.setState({ nowPlaying: data[0].id })
            }
            this.setState({ items: data });
        })

    }

    nextSong() {
        let currentQueue = this.state.items;
        this.setState({ items: currentQueue.shift() });
    }

    /* Move this video to the top of the queue and play it immediately. */
    onClickItem(index) {
        this.socket.emit("PlayNow", index)
    }

    componentDidMount() {
        let iframe = document.getElementById('now-playing')
        console.log(iframe);
        let iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        let videoPlayer = iframeDoc.querySelectorAll('video')[0]
        console.log(videoPlayer)
        // videoPlayer.addEventListener('ended', this.nextSong, false);
    }

    componentWillUnmount() {
        this.socket.emit("disconnect");
    }

    render() {
        // console.log(Queue.items);
        return (
            <Layout>
                <YoutubeEmbedVideo id="now-playing" videoId={this.state.nowPlaying} autoplay />
                <QueueBox queue={this.state.items} onClickItem={this.onClickItem.bind(this)} />
            </Layout>
        )
    }
    
}

export default RoomPage