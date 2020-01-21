import React from 'react'

class YTPlayer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            videoId: this.props.videoId
        }
    }

    componentDidMount() {
        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = this.loadVideo
    }

    loadVideo = () => {
        this.player = new window.YT.Player('ytplayer', {
            height: '390',
            width: '640',
            videoId: this.state.videoId,
            events: {
              'onReady': this.onPlayerReady,
              'onStateChange': this.onPlayerStateChange
            }
        });
    }

    playVideo = (videoId) => {
        this.setState({ videoId: videoId });
        if (this.player) {
            this.player.loadVideoById(videoId);
        }
    }

    onPlayerReady = () => {
        this.player.playVideo()
    }

    onPlayerStateChange = (e) => {
        switch (e.data) {
            case -1:
                // unstarted
                break;
            case 0: 
                // ended
                this.props.onVideoEnd()
                break;
            case 1: 
                // playing
                break;
            case 2: 
                // paused
                break;
            case 3:
                // buffering
                break;
            case 5: 
                // cued
        }
    }

    render() {
        return <div id="ytplayer" />
    }
}

export default YTPlayer