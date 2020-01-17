var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const axios = require('axios');
const gracefulExit = require('express-graceful-exit');

const secureEnv = require('secure-env');
process.env = Object.assign(process.env, secureEnv({secret:'IamtheQueueadmin'}));

var app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);
io.origins('*:*');

const whitelist = ['http://localhost:3000', 'http://localhost:3030'];

const corsOptions = {
  credentials: true, // This is important.
  origin: (origin, callback) => {
    if(whitelist.includes(origin)) {
			return callback(null, true)
		}
		callback(new Error('Not allowed by CORS'));
  }
}

app.use(cors(corsOptions));
app.use(gracefulExit.middleware(app));

let testQ = "8FZBwj81gGY,Mw7Gryt-rcc,kTzmVgGG5Bw";
let queue = []

getVideoInfo(testQ).then(q => {
	queue = q;
	io.emit("RefreshQueue", queue);
}).catch(err => {
	throw new Error(err);
})

io.on("connection", socket => {
	console.log('a user connected');
	io.emit("RefreshQueue", queue);

	socket.on("AddToQueue", function(data) {
		console.log('AddToQueue', data);
		// data could potentially include url, user, etc.
		if (data.url) {
			let url = data.url;
			let vid = extractVideoId(url);
			getVideoInfo(vid).then(q => {
				queue = [...queue, ...q];
				io.emit("RefreshQueue", queue);
			}).catch(err => {
				throw new Error(err);
			})
		} else if (data.vidId) {
			let id = data.vidId;
			queue = addVideoToQueue(io, queue, id)
			
		}
	});

	socket.on("NextSong", function() {
		queue.shift();
		console.log('Next Song:', queue);
		io.emit("RefreshQueue", queue);
	})

	socket.on("Search", function(query) {
		searchYoutube(query).then(searchResults => {
			// console.log(searchResults);
			io.emit("FoundVideos", searchResults);
		})
	})

	socket.on("PlayNow", function(index) {
		let toPlayNow = queue[index];
		queue.splice(index, 1);
		let newQ = [toPlayNow, ...queue.slice(1)];
		queue = newQ;
		io.emit("RefreshQueue", queue);
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

// app.use('/', indexRouter);
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

function addVideoToQueue(socket, queue, video) {
	getVideoInfo(video).then(q => {
		queue = [...queue, ...q];
		socket.emit("RefreshQueue", queue);
	}).catch(err => {
		throw new Error(err);
	})
}

function getVideoInfo(videos) {
	return new Promise((resolve, reject) => {
		let queue = [];
		axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videos}&key=${process.env.GOOGLE_API_KEY}&part=snippet`)
		.then(response => {
			let result = response.data.items;
			// console.log('get video info result:', result);
			let vidIds = videos.split(',');
			for (let i=0;i<result.length;i++) {
				queue.push({
					id: vidIds[i],
					title: result[i].snippet.title
				});
			}
			resolve(queue);
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
