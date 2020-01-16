import QueueItem from './queue-item'

function QueueBox(props) {
  return (<div className="queue-box">
      Next up:
      {props.queue.map((x, i) => {
        if (i !== 0) {
          return (<QueueItem key={i} title={x.title} />)
        }
      })}
    </div>
  )
}

export default QueueBox