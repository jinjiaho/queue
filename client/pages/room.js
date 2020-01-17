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
        this.searchForm = React.createRef()

        this.state = {
          items: []
        }

    }

    onVideoRequest(vidId) {
        console.log(vidId);
        this.socket.emit("AddToQueue", { vidId: vidId });
    }

    onSearchVideo(query) {
        this.socket.emit("Search", query);
    }

    getKey(callback) {
        this.socket.emit("GetKey", callback)
    }

    componentDidMount() {
        const endpoint = 'http://localhost:7003'
        this.socket = socketIOClient.connect(endpoint)

        let Room = this;
        
        this.socket.on("RefreshQueue", function(data) {
            // Queue.items = data;
            // console.log('data:', data);
            Room.setState({ items: data })
        })

        this.socket.on("FoundVideos", function(items) {
            // console.log('items:', items)
            if (Room.searchForm.current) {
                Room.searchForm.current.setState({ searchResults: items, searchTerms: '' });
            }
        })

    }

    componentWillUnmount() {
        this.socket.emit("disconnect");
    }

    render() {
        let nowPlaying = (this.state.items.length > 0) ? this.state.items[0].id : ''
        return (
            <Layout>
                <QueueBox queue={this.state.items} />
                <AddVideoForm 
                    ref={this.searchForm} 
                    onClickSubmit={this.onSearchVideo.bind(this)}
                    onSelectVideo={this.onVideoRequest.bind(this)} />
            </Layout>
        )
    }
    
}

export default RoomPage