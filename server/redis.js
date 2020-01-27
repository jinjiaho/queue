const redis = require('redis')
const api = require('./api')

const redisClient = redis.createClient()
redisClient.on("error", function (err) {
  console.log("Redis Error " + err);
});

module.exports = {
    checkRoomExists: function(roomId) {
        return new Promise((resolve, reject) => {
            redisClient.get(`queue-${roomId}`, function(err, reply) {
                if (err || !reply) {
                    reject()
                }
                resolve()
            })
        })
    },
    createRoom: function(roomId) {
        return new Promise((resolve, reject) => {
            redisClient.set(`queue-${roomId}`, JSON.stringify([]), resolve)
        })
    },
    getQueue: function(roomId) {
        return new Promise((resolve, reject) => {
            redisClient.get(`queue-${roomId}`, function(err, reply) {
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
        redisClient.set(`queue-${roomId}`, JSON.stringify(queue), function(v) {
            console.log('queue updated', queue)
        })
    },
    deleteQueue: function(roomId) {
        redisClient.del(`queue-${roomId}`)
    },
    AddUsersToRoom: function(roomId, clientId) {
        return new Promise((resolve, reject) => {
            redisClient.get(`room-${roomId}`, function(err, reply) {
                if (err) {
                    reject(err)
                }
                if (!reply) {
                    reject(404)
                }
                let clients = reply.split(',')
                if (!clients.includes(clientId)) {
                    clients.push(clientId)
                    redisClient.set(`room-${roomId}`, clients,join(','), resolve)
                } else {
                    resolve()
                }
            })
        })
    }
}
