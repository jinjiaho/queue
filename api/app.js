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

let testQ = "TxHm_Qm4e4k,Mw7Gryt-rcc,8llxefPibig";
let Queue = []

getVideoInfo(testQ).then(q => {
	Queue = q;
	io.emit("RefreshQueue", Queue);
}).catch(err => {
	throw new Error(err);
})

io.on("connection", socket => {
	// console.log('a user connected');
	io.emit("RefreshQueue", Queue);
	// console.log(http.address())

	socket.on("AddToQueue", function(data) {
		console.log('AddToQueue', data);
		let roomId = data.roomId;
		// data could potentially include url, user, etc.
		if (data.url) {
			let url = data.url;
			let vid = extractVideoId(url);
			addVideoToQueue(vid);
		} else if (data.vidId) {
			let id = data.vidId;
			addVideoToQueue(id)
		}
	});

	socket.on("Next", function(data) {
		Queue.shift();
		let roomId = data.roomId;
		// console.log('Next Song:', Queue);
		clientInformation.get(`room-${roomId}`, function(err, reply) {
			console.log(reply);
		});
		io.emit("RefreshQueue", Queue);
	})

	socket.on("Search", function(query) {
		searchYoutube(query).then(searchResults => {
			io.emit("FoundVideos", searchResults);
		})
	})

	socket.on("PlayNow", function(index) {
		let toPlayNow = Queue[index];
		Queue.splice(index, 1);
		let newQ = [toPlayNow, ...Queue.slice(1)];
		Queue = newQ;
		io.emit("RefreshQueue", Queue);
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

function addVideoToQueue(video) {
	getVideoInfo(video).then(q => {
		Queue = [...Queue, ...q];
		io.emit("RefreshQueue", Queue);
	}).catch(err => {
		throw new Error(err);
	})
}

function getVideoInfo(videos) {
	return new Promise((resolve, reject) => {
		let q = [];
		let vidIds = videos.split(',');
		for (let i of vidIds) {
			if (checkVideoInQueue(vidIds[i])) {
				vidIds.splice(i, 1)
			}
		}
		videos = vidIds.join(',');
		axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videos}&key=${process.env.GOOGLE_API_KEY}&part=snippet`)
		.then(response => {
			let result = response.data.items;
			for (let i=0;i<result.length;i++) {
				q.push({
					id: vidIds[i],
					title: result[i].snippet.title
				});
			}
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

function checkVideoInQueue(videoId) {
	for (let v of Queue) {
		if (v.id === videoId) {
			return true
		}
	}
	return false
}