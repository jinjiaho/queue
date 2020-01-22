var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const axios = require('axios');
const gracefulExit = require('express-graceful-exit');
const redis = require('redis')

const redisClient = redis.createClient()

const secureEnv = require('secure-env');
process.env = Object.assign(process.env, secureEnv({secret:'IamtheQueueadmin'}));

const indexRouter = require('./routes/index.js');

var app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);
io.origins('*:*');

const whitelist = ['http://localhost:3000'];

const corsOptions = {
  credentials: true, // This is important.
  origin: (origin, callback) => {
	  console.log(origin);
    if (whitelist.includes(origin)) {
		return callback(null, true)
	}
	callback(new Error('Not allowed by CORS'));
  }
}

app.use(cors(corsOptions));
app.use(gracefulExit.middleware(app));

// let testQ = "TxHm_Qm4e4k";
// let Queue = []

// getVideoInfo(testQ).then(q => {
// 	Queue = q;
// 	io.emit("RefreshQueue", Queue);
// }).catch(err => {
// 	throw new Error(err);
// })

io.on("connection", socket => {
	socket.on('init', function(data) {
		if (!data.roomId) {
			console.error('no room id');
		}
		redisClient.get(`room-${data.roomId}`, function(err, reply) {
			if (err || !reply) {
				console.error(err || new Error(404))
			} else {
				io.emit('RefreshQueue', JSON.parse(reply));
			}
		})
	})

	socket.on("AddToQueue", function(data) {
		let roomId = data.roomId;
		// Get queue
		getRoomQueue(roomId).then(reply => {
			// data could potentially include url, user, etc.
			let vid;
			if (data.url) {
				let url = data.url;
				vid = extractVideoId(url);
			} else if (data.vidId) {
				vid = data.vidId;
			}
			addVideoToQueue(roomId, vid);
		})
		
	});

	socket.on("Next", function(data) {
		let roomId = data.roomId;
		// console.log('Next Song:', Queue);
		getRoomQueue(roomId).then(reply => {
			let queue = JSON.parse(reply)
			queue.shift();
			redisClient.set(`room-${roomId}`, JSON.stringify(queue), redis.print);
			io.emit('RefreshQueue', queue);
		})
	})

	socket.on("Search", function(query) {
		searchYoutube(query).then(searchResults => {
			io.emit("FoundVideos", searchResults);
		})
	})

	socket.on("PlayNow", function(data) {
		if (!data.roomId) {
			console.error('room id not provided');
		} else {
			let index = data.index || 0;
			getRoomQueue(data.roomId).then(reply => {
				let queue = JSON.parse(reply);
				let toPlayNow = queue[index];
				queue.splice(index, 1);
				let newQ = [toPlayNow, ...queue.slice(1)];
				queue = newQ;
				redisClient.set(`room-${roomId}`, JSON.stringify(queue), redis.print);
				io.emit("RefreshQueue", queue);
			}).catch(err => {
				console.error(err);
			})
		}	
	})

	socket.on("disconnect", () => console.log("Client disconnected"));
});


http.listen(7003, function() {
	console.log('listening on *:7003');
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

process.on('message', function(message) {
	if (message === 'shutdown') {
		gracefulExit.gracefulExitHandler(app, httpServer, {
			log: true,
			socketio: io
		})
	}
})

module.exports = app;

function addVideoToQueue(roomId, video) {
	let queue, rId = roomId;
	getRoomQueue(roomId).then(reply => {
		queue = JSON.parse(reply);
		if (!checkVideoInQueue(queue, video)) {
			return getVideoInfo(video)
		} else {
			throw new Error('video already in queue');
		}
	}).then(q => {
		queue = queue.concat(q);
		redisClient.set(`room-${rId}`, JSON.stringify(queue), redis.print)
		io.emit("RefreshQueue", queue);
	}).catch(err => {
		throw err
	})
}

function getVideoInfo(video) {
	return new Promise((resolve, reject) => {
		let q = [];
		axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${video}&key=${process.env.GOOGLE_API_KEY}&part=snippet`)
		.then(response => {
			let result = response.data.items;
			q.push({
				id: video,
				title: result[0].snippet.title
			});
			resolve(q);
		})
		.catch(err => {
			reject(err)
		})
	})	
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

function searchYoutube(query) {
	return new Promise((resolve, reject) => {
		let queryEncoded = encodeURI(query.replace(' ', '|'));
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

function checkVideoInQueue(queue, videoId) {
	for (let v of queue) {
		if (v.id === videoId) {
			return true
		}
	}
	return false
}

function getRoomQueue(roomId) {
	return new Promise((resolve, reject) => {
		redisClient.get(`room-${roomId}`, function(err, reply) {
			if (err) {
				reject(err);
			}
			if (!reply) {
				reject(404);
			}
			resolve(reply);
		})
	})
}

// function updateRoomQueue(roomId, queue) {
// 	return new Promise(async (resolve, reject) => {
// 		redisClient.set(`room-${roomId}`, JSON.stringify(queue), function(res) {

// 		})
// 	})
// }