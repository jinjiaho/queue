import YoutubeEmbedVideo from 'youtube-embed-video'

function Video(props) {
    return <YoutubeEmbedVideo videoId={props.videoId} autoplay={props.autoplay}/>
}

export default Video