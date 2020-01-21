function QueueItem(props) {
  return (
    <a onClick={e => props.onClick(props.index)} className="queue-item">{props.title}</a>
  )
}

export default QueueItem
