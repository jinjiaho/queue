import YoutubeEmbedVideo from 'youtube-embed-video'

function Video(props) {
    console.log('autoplay: ', props.autoplay)
    return <YoutubeEmbedVideo videoId={props.videoId} autoplay={props.autoplay}/>
}

export default Video