const db = require('./redis')
const api = require('./api')

module.exports = function (socket) {
	socket.on('register', function(data) {
		console.log('registering client:', data);
		if (!data.room) {
			console.error('no room id');
		} else {
			db.getQueue(data.room).then(queue => {
				socket.emit('RefreshQueue', queue);
			}).catch(err => {
				console.error('Error getting queue:', err)
			})
		}
	})

	socket.on("AddToQueue", function(data) {
		let roomId = data.room;
		// Get queue
		db.getQueue(roomId).then(queue => {
			// data could potentially include url, user, etc.
			let vid;
			if (data.url) {
				let url = data.url;
				vid = extractVideoId(url);
			} else if (data.vidId) {
				vid = data.vidId;
			}
			console.log(vid);
			if (!checkVideoInQueue(queue, vid)) {
				api.getVideoInfo(vid).then(queueItem => {
					queue.push(queueItem)
					db.updateQueue(roomId, queue)
					socket.emit('RefreshQueue', queue)
				}).catch(err => {
					console.error('Error getting video info:', err)
				})
			}
		}).catch(err => {
			console.error("Error getting queue:", err)
		})
		
	});

	socket.on("Next", function(data) {
		let roomId = data.room;
		// console.log('Next Song:', Queue);
		db.getQueue(roomId).then(queue => {
			queue.shift();
			db.updateQueue(roomId, queue)
			socket.emit('RefreshQueue', queue);
		}).catch(err => {
			console.error("Error getting queue:", err)
		})
	})

	socket.on("Search", function(data) {
		api.searchYoutube(data.query).then(searchResults => {
			socket.emit("FoundVideos", searchResults);
		}).catch(err => {
			console.error("Error searching YouTube", err)
		})
	})

	socket.on("PlayNow", function(data) {
		if (!data.room) {
			console.error('room id not provided');
		} else {
			let roomId = data.room
			let index = data.index || 0;
			db.getQueue(roomId).then(queue => {
				let toPlayNow = queue[index];
				queue.splice(index, 1);
				let newQ = [toPlayNow, ...queue.slice(1)];
				queue = newQ;
				db.updateQueue(roomId, queue)
				socket.emit("RefreshQueue", queue);
			}).catch(err => {
				console.error("Error getting queue:", err)
			})
		}	
	})

	socket.on("disconnect", () => console.log("Client disconnected"));
}

function extractVideoId(url) {
	// shortened urls have different structure
	if (url.includes('youtu.be')) {
		let splitUrl = url.split('/');
		// remove queries
		let lastItem = splitUrl[splitUrl.length-1];
		let removedQueries = lastItem.split('?')[0];
		return removedQueries;
	} else {
		let splitQueries = url.split('&');
		for (let section of splitQueries) {
			if (section.includes('v=')) {
				return section.split('v=')[1];
			}
		}
	}
}

function checkVideoInQueue(queue, videoId) {
	for (let v of queue) {
		if (v.id === videoId) {
			return true
		}
	}
	return false
}