import React from 'react'
import YoutubeEmbedVideo from 'youtube-embed-video'

class Video extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            vidId: props.videoId
        }
    }

    render() {
        return (<YoutubeEmbedVideo videoId={this.state.vidId} autoplay={1} />)
    }
}

export default Video