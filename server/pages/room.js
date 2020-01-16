import React from 'react'
import { observer } from 'mobx-react'
import Layout from '../components/layout'
import Video from '../components/video'
import QueueBox from '../components/queue-box'
import QueueItem from '../components/queue-item'

import Queue from '../store/queue'

import './page-styles.scss'
import socketIOClient from "socket.io-client"

@observer
class RoomPage extends React.Component {
    
    constructor(props) {
        super(props)
        const endpoint = 'http://localhost:7003'
        const socket = socketIOClient.connect(endpoint)
        
        socket.on("RefreshQueue", data => {
            Queue.items = data;
        })

        socket.emit("AddToQueue", { url: "https://www.youtube.com/watch?v=WNQ0RN4c8ZY" });

        socket.emit("NextSong");

    }

    render() {
        console.log(Queue.items);
        let nowPlaying = (Queue.items.length > 0) ? Queue.items[0].id : ''
        return (
            <Layout>
                <Video videoId={nowPlaying} autoplay />
                <QueueBox queue={Queue.items} />
            </Layout>
        )
    }
    
}

export default RoomPage