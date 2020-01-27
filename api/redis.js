const redis = require('redis')
const api = require('./api')

const redisClient = redis.createClient()
redisClient.on("error", function (err) {
  console.log("Redis Error " + err);
});

module.exports = {
    checkRoomExists: function(roomId) {
        return new Promise((resolve, reject) => {
            redisClient.get(`room-${roomId}`, function(err, reply) {
                if (err || !reply) {
                    reject()
                }
                resolve()
            })
        })
    },
    getQueue: function(roomId) {
        return new Promise((resolve, reject) => {
            redisClient.get(`room-${roomId}`, function(err, reply) {
                if (err) {
                    reject(err);
                }
                if (!reply) {
                    reject(404);
                }
                console.log('queue for room', roomId, ':', reply)
                let queue = JSON.parse(reply)
                resolve(queue);
            })
        })
    },
    updateQueue: function(roomId, queue) {
        redisClient.set(`room-${roomId}`, JSON.stringify(queue), function(v) {
            console.log('queue updated', queue)
        })
    },
    deleteRoom: function(roomId) {
        redisClient.del(`room-${roomId}`)
    }
}
