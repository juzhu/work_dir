var express = require('express');
var config = require('./config.js')
var router = express.Router();
var wxUtli = require('./tool/wx_utli.js');
var dbUser = require('./db_user_info.js').userDB;
var uuid = require('node-uuid');
var sms = require("./send_sms.js");
var prod_info = {};
var userSession = {};  // session key索引信息 基本信息
var loginUrl ="https://open.weixin.qq.com/connect/oauth2/authorize?appid="+ config.appID+ "&redirect_uri=http%3A%2F%2Fappmishu.cn%2Fwx_redirect&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect"

// 定时更新菜品信息到内存
function getProdInfo() {

}


router.get('/jifen_order', function(req, res, next) {
  var userInfo = validateSession(req, res);
  // var userInfo = {};
  // userInfo.openID = "o3GUCwb5mD7wGI9NYVZ2D2jscBOY";
  if (!userInfo) {
    return;
  }

  order_info = req.body
  // 检查产品信息
  console.log("jifen order with order info : " + JSON.stringify(order));
  // 1 计算需要的积分， 积分够就先扣除内存的 然后更新用户积分到数据库

  // 如果没绑定， 展示提示用户绑定手机号的页面
  dbUser.getUserInfoByOpenID(userInfo.openID, function(err, cbUserInfo) {
    // 如果是空 用户第一次用微信登录 记录这个openid
    if (cbUserInfo.length == 0) {
      dbUser.addWXUser(userInfo.openID, function(err, msg) {
        if (err) {
          console.log("error: " + msg);
        } else {
          res.render('index.html', {userInfo: userInfo});
        }
      });
    } else if (!(cbUserInfo[0].uid)){
      // 登陆过 但是还是没有绑定手机号的
      res.render('index.html', { userInfo:userInfo});
    } else {
      // 展示用户积分信息
      var baseInfo = cbUserInfo[0];
      for (key in baseInfo) {
        userInfo[key] = baseInfo[key];
      }
      userInfo.allPhone = [{"phone" : baseInfo.phone}];
      userInfo.pointRecCnt = 0;
    dbUser.getUserPointHistoryByPhone(baseInfo.phone, function(err, cbUserPointHistory) {
    if (!err) {
      userInfo.pointHistory = cbUserPointHistory;
      userInfo.pointRecCnt = cbUserPointHistory.length;
    }
    console.log("#################, userInfo");
    console.log(userInfo);
    res.render('index.html', {userInfo: userInfo });
    })
    }
  })
});

router.get('/point_test', function(req, res, next) {
  // var userInfo = validateSession(req, res);
  var userInfo = {};
  userInfo.openID = "o3GUCwb5mD7wGI9NYVZ2D2jscBOY";
  if (!userInfo) {
    return;
  }
  // 如果没绑定， 展示提示用户绑定手机号的页面
  dbUser.getUserInfoByOpenID(userInfo.openID, function(err, cbUserInfo) {
    // 如果是空 用户第一次用微信登录 记录这个openid
    if (cbUserInfo.length == 0) {
      dbUser.addWXUser(userInfo.openID, function(err, msg) {
        if (err) {
          console.log("error: " + msg);
        } else {
          res.render('index.html', {userInfo: userInfo});
        }
      });
    } else if (!(cbUserInfo[0].uid)){
      // 登陆过 但是还是没有绑定手机号的
      res.render('index.html', { userInfo:userInfo});
    } else {
      // 展示用户积分信息
      var baseInfo = cbUserInfo[0];
      for (key in baseInfo) {
        userInfo[key] = baseInfo[key];
      }
      userInfo.allPhone = [{"phone" : baseInfo.phone}];
      userInfo.pointRecCnt = 0;
      res.render('index.html', {userInfo: userInfo });
    }
  })
});

router.get('/point_record', function(req, res, next) {
  // var userInfo = validateSession(req, res);
  var userInfo = {};
  userInfo.openID = "o3GUCwb5mD7wGI9NYVZ2D2jscBOY";
  if (!userInfo) {
    return;
  }
  // 如果没绑定， 展示提示用户绑定手机号的页面
  dbUser.getUserInfoByOpenID(userInfo.openID, function(err, cbUserInfo) {
    // 如果是空 用户第一次用微信登录 记录这个openid
    if (cbUserInfo.length == 0) {
      dbUser.addWXUser(userInfo.openID, function(err, msg) {
        if (err) {
          console.log("error: " + msg);
        } else {
          res.render('index.html', {userInfo: userInfo});
        }
      });
    } else if (!(cbUserInfo[0].uid)){
      // 登陆过 但是还是没有绑定手机号的
      res.render('index.html', { userInfo:userInfo});
    } else {
      // 展示用户积分信息
      var baseInfo = cbUserInfo[0];
      for (key in baseInfo) {
        userInfo[key] = baseInfo[key];
      }
      userInfo.allPhone = [{"phone" : baseInfo.phone}];
      userInfo.pointRecCnt = 0;
      dbUser.getUserPointHistoryByPhone(baseInfo.phone, function(err, cbUserPointHistory) {
        if (!err) {
          userInfo.pointHistory = cbUserPointHistory;
          userInfo.pointRecCnt = cbUserPointHistory.length;
        }
        console.log("#################, userInfo");
        console.log(userInfo);
        res.render('point_record.html', {userInfo: userInfo });
      })
    }
  })
});




/*
   router.get('/', function(req, res, next) {
   console.log("session_key:" + req.session.session_key);
   res.render('index.html', { wxInfo: wxInfo, userInfo: userInfo });
   });
   */
router.get('/addPhone', function(req, res, next) {
  console.log("add_phone");
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  console.log(userInfo);
  res.render("add_phone.html", {});
});
router.get('/pointFAQ', function(req, res, next) {
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  res.render("point_faq.html", {});
});


router.get('/getVerifyCode', function(req, res, next) {
  userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var ret = {};
  var phone = req.query.phone;
  var codeInfo = generateSmsCodeInfo(phone);
  console.log("getVerifyCode for phone: " + phone + " code: " + JSON.stringify(codeInfo));
  if (codeInfo.err) {
    ret.err = codeInfo.err;
    ret.errMsg = codeInfo.errMsg;
    res.send(JSON.stringify(ret));
  } else {
    sms.codeNotice(phone, codeInfo.codeMsg, function(err) {
      console.log(err);
      verifyCodeMap[phone] = codeInfo;
      ret.err = false;
      res.send(JSON.stringify(ret));
    })
  }
})

router.get("/verifyPhone", function(req, res) {
  var phone = req.query.phone;
  var code = req.query.code;
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return ;
  }
  var bindRet = {};
  if (verifySmsCode(phone, code)) {
    // 验证码通过  将手机号绑定到userInfo.openID
    dbUser.bindUser(userInfo, phone, function(err) {
      if (err) {
        bindRet["err"] = true;
        bindRet["errMsg"] = JSON.stringify(err);
      } else {
        bindRet["err"] = false;
      }
      res.send(bindRet);
    });
  } else {
    bindRet.err = true;
    bindRet.errMsg = "验证码错误或者已经失效"
    res.send(bindRet);
  }
})

router.get("/jifen_prod_detail/:id", function(req, res) {
  // var userInfo = validateSession(req, res);
  // if (!userInfo) {
  //   return;
  // }
  res.render("jifen_prod.html", {});

})
module.exports = router;
