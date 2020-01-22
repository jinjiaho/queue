var express = require('express');
var router = express.Router();
const randomWords = require('random-words');
const redis = require('redis')

const redisClient = redis.createClient()
redisClient.on("error", function (err) {
  console.log("Error " + err);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/check-room-exists/:roomId', function(req, res, next) {
  console.log('checking room', req.params.roomId, 'exists');
  if (checkRoomExists(req.params.roomId)) {
    res.status(200).send(true);
  } else {
    res.status(200).send(false);
  }
})

router.get('/create-room', function(req, res, next) {
  let roomId = generateNewRoomId();
  console.log(roomId);
  redisClient.setItem(`room-${roomId}`, JSON.stringify([]));
  res.status(200).send(roomId);
})

module.exports = router;

function checkRoomExists(roomId) {
  redisClient.get(`room-${roomId}`, function(err, reply) {
    if (err || !reply) {
      return false;
    }
    return true;
  })
}

function generateNewRoomId() {
  let roomId = randomWords({ exactly: 2, join: '-', maxLength: 6 });
  if (checkRoomExists(roomId)) {
    roomId = generateNewRoomId();
  }
  return roomId;
}
