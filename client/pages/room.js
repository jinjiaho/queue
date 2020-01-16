import React from 'react'
import { observer } from 'mobx-react'
import Layout from '../components/layout'
import QueueBox from '../components/queue-box'
import QueueItem from '../components/queue-item'
import AddVideoForm from '../components/add-video-form'

// import Queue from '../store/queue'

import './page-styles.scss'
import socketIOClient from "socket.io-client"

@observer
class RoomPage extends React.Component {
    
    constructor(props) {
        super(props)
        const endpoint = 'http://localhost:7003'
        this.socket = socketIOClient.connect(endpoint)
        this.state = {
          items: []
        }
        
        this.socket.on("RefreshQueue", data => {
            // Queue.items = data;
            this.setState({ items: data });
        })

        // this.socket.emit("AddToQueue", { url: "https://www.youtube.com/watch?v=WNQ0RN4c8ZY" });

        // this.socket.emit("NextSong");

    }

    onVideoRequest(data) {
        // Queue.addItem(data.url);
        this.socket.emit("AddToQueue", data);
    }

    render() {
        let nowPlaying = (this.state.items.length > 0) ? this.state.items[0].id : ''
        return (
            <Layout>
                <AddVideoForm onClickSubmit={this.onVideoRequest.bind(this)} />
                <QueueBox queue={this.state.items} />
            </Layout>
        )
    }
    
}

export default RoomPage