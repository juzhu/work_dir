var express = require('express');
var config = require('./config.js');
var wxUtli = require('./tool/wx_utli.js');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/user_info', function(req, res, next) {
  // 用户统一授权之后 获取用户基本信息  展示出来
  var redirect_url = encodeURIComponent("http://appmishu.cn/users/wechat_info");
  console.log(redirect_url);
  res.render('index.html', {appID:config.appID, redirect_url:redirect_url});
});

router.get('/wechat_info', function(req, res, next) {
  // 用户统一授权之后 获取用户基本信息  展示出来
  console.log("wechat_info");
  if (req.query.code !== undefined) {
    wxUtli.getUserAccessToken(req.query.code, function(err, userInfo) {
      if (!err) {
        res.send(userInfo);
      } else {
        res.send("getuserinfo error");
      }
    });
  } else {
    res.send("error");
  }
});




module.exports = router;
