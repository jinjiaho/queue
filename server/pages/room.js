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
            items: []
        }

        const endpoint = 'http://localhost:7003'
        this.socket = socketIOClient.connect(endpoint)
        
        this.socket.on("RefreshQueue", data => {
            this.setState({ items: data });
        })

    }

    nextSong() {
        let currentQueue = this.state.items;
        this.setState({ items: currentQueue.shift() });
        console.log(this.state.items);
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
        let nowPlaying = (this.state.items.length > 0) ? this.state.items[0].id : ''
        return (
            <Layout>
                <YoutubeEmbedVideo id="now-playing" videoId={nowPlaying} autoplay />
                <QueueBox queue={this.state.items} />
            </Layout>
        )
    }
    
}

export default RoomPage