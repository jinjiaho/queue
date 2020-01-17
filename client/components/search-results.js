import SearchResultItem from './search-result-item'

function SearchResults(props) {
  console.log(props.vidId);
  return (
    <div className="component" id="search-results">
      {props.items ? 
        props.items.map((x, i) => {
          return (
            <SearchResultItem 
              key={i} 
              title={x.title} 
              vidId={x.id} 
              channel={x.channel} 
              thumbnail={x.thumbnail}
              onClick={props.onClickItem} />
            )
        }) : false
      }
    </div>
  )
}

export default SearchResults