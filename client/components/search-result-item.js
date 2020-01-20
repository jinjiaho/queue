function SearchResultItem(props) {
  return (
    <a className="search-result-item" onClick={e => props.onClick(props.vidId)}>
      <img src={props.thumbnail} />
      <div className="search-result-item-text">
        <h4>{props.title}</h4>
        <p className="mobile-hide">{props.channel}</p>
      </div>
    </a>
  )
}

export default SearchResultItem