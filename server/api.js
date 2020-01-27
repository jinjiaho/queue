const axios = require('axios')

module.exports = {
    getVideoInfo: function(video) {
        return new Promise((resolve, reject) => {
            axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${video}&key=${process.env.GOOGLE_API_KEY}&part=snippet`)
            .then(response => {
                let result = response.data.items;
                // console.log(result)
                let q = {
                    id: video,
                    title: result[0].snippet.title
                };
                resolve(q);
            })
            .catch(err => {
                reject(err)
            })
        })	
    }, searchYoutube: function(query) {
        return new Promise((resolve, reject) => {
            axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${query}&type=video&key=${process.env.GOOGLE_API_KEY}`)
            .then(response => {
                // console.log(response.data);
                let searchResults = [];
                for (let i=0;i<response.data.items.length;i++) {
                    let item = response.data.items[i];
                    searchResults.push({
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.medium.url,
                        channel: item.snippet.channelTitle,
                        id: item.id.videoId
                    });
                }
                resolve(searchResults);
            })
        }) 
    }
}