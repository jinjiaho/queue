var express = require('express');
var router = express.Router();
const randomWords = require('random-words');
const db = require('../redis')

router.get('/check-room-exists/:roomId', function(req, res, next) {
  console.log('checking room', req.params.roomId, 'exists');
  db.checkRoomExists(req.params.roomId).then(() => {
    res.status(200).end();
  }).catch(err => {
    res.status(404).end();
  })
})

router.get('/create-room', function(req, res, next) {
  generateNewRoomId().then(roomId => {
    console.log(roomId);
    db.updateQueue(roomId, [])
    res.status(200).send(roomId);
  }).then(err => {
    console.error(err)
    res.status(500).send(err);
  })
})

router.get('/delete-room/:roomId', function(req, res, next) {
  try {
    db.deleteRoom(req.params.roomId);
    res.status(200).end()
  } catch(err) {
    res.status(err.code).send(err.message)
  }
  
})

module.exports = router;

function generateNewRoomId() {
  return new Promise((resolve, reject) => {
    let roomId = randomWords({ exactly: 2, join: '-', maxLength: 6 });
    db.checkRoomExists(roomId).then(() => {
      roomId = generateNewRoomId();
    }).catch(() => {
      resolve(roomId);
    })
  })
}
