import QueueItem from './queue-item-room'

function QueueBox(props) {
  return (<div className="queue-box">
      Next up:
      <div className="scroll-view">
        {props.queue.map((x, i) => {
          if (i !== 0) {
            return (<QueueItem key={i} index={i} title={x.title} onClick={props.onClickItem} />)
          }
        })}
      </div>
      
    </div>
  )
}

export default QueueBox
