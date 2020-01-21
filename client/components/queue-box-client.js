import QueueItem from './queue-item-client'

function QueueBox(props) {
  return (
    <div className="queue-box component">
      <h2>Now playing:</h2>
      {props.queue.length > 0 ? <QueueItem key={0} title={props.queue[0].title} /> : 'Nothing right now'}
      <h3>Next up:</h3>
      {props.queue.map((x, i) => {
        if (i !== 0) {
          return (<QueueItem key={i} title={x.title} />)
        }
      })}
    </div>
  )
}

export default QueueBox