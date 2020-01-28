var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const gracefulExit = require('express-graceful-exit');
const secureEnv = require('secure-env');
process.env = Object.assign(process.env, secureEnv({secret:'IamtheQueueadmin'}));

const indexRouter = require('./routes/index');
const socketIO = require('./socket');

var app = express();

const http = require('http').Server(app);

const whitelist = ['http://localhost:3003', 'http://localhost:3002', 'https://postwoman.io'];

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
app.set('view engine', 'ejs')
app.use(cors(corsOptions));
app.use(gracefulExit.middleware(app));

socketIO.startIo(http)

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
