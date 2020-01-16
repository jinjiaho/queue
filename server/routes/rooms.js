var express = require('express');
var router = express.Router();

let queue = [
    {
        title: "New Laws, Who Dis?",
        videoId: "2ODNIsfIba0"
    }
]

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
