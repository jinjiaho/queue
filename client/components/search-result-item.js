function SearchResultItem(props) {
  return (
    <a className="search-result-item" onClick={e => props.onClick(props.vidId)}>
      <img src={props.thumbnail} />
      <div>
        <h4>{props.title}</h4>
        <p>{props.channel}</p>
      </div>
    </a>
  )
}

export default SearchResultItem