var ticketManager = require("./session_manager.js").ticketManager;
var errorCode = require("../errcode.js");
var PostmanUser = require('./post_user.js');
var express = require('express');
var router = express.Router();
var orderDB = require("./db_orders.js").orderDB
var checkPri = require("./pri_manage.js").checkPri
var priChecker = require("./primanager_oa.js").priManager

var storeGps = {
  "前进店" : {lat:22.605990,lng:113.863893},
  "坪洲店" : {lat:22.566597,lng:113.870534},
  "all" : {lat:22.605990,lng:113.863893},
};
function validateSession(req, res, redirect) {
  var sessionOK = false;
  var ret = {error:true, msg:'登录后再操作'};
  if (req.session.userName && req.session.ticketID) {
    sessionOK = ticketManager.checkTicket(req.session.userName, req.session.ticketID)
  }
  if (!sessionOK && redirect) {
    console.log("session error");
    res.redirect("/login.html");
  } else if (!sessionOK) {
    res.send(ret);
  }
  return sessionOK;
}

router.get("/logout", function(req, res) {
  if (req.session.userName) {
    console.log("logout for user: " + req.session.userName);
    ticketManager.ticketLogout(req.session.userName, delete req.session.ticketID);
  }
  res.send("ok");
});


router.post('/login', function(req, res, next) {
  //check user name pass..
  var login_ret = {};
  var userName = req.body.user_name;
  var passwd = req.body.passwd;

  PostmanUser.login(userName, passwd, function(err, login_ok, userInfo) {
    if (!err && login_ok) {
      console.log(userInfo);
      var ticket = ticketManager.newTicket(userName);
      login_ret['ret'] = true;
      login_ret['ticket'] = ticket;
      var userPriInfo = {"userName" : userName, "userPri":userInfo.user_pri};
      req.session.userInfo = userPriInfo;
      req.session.userName = userName;
      req.session.ticketID = ticket.ticketID;
      req.session.storeName = userInfo.work_store;
    } else {
      if (err) {
        login_ret['ret'] = errorCode.dbError;
        login_ret['msg'] = "system error";
      } else {
        login_ret['ret'] = errorCode.passwdError;
        login_ret['msg'] = "账号不匹配";
      }
    }
    console.log(req.session);
    res.send(JSON.stringify(login_ret));
  });
});


/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("start");
  if (!validateSession(req, res, true)) {
    return;
  }
  res.render('index.html', { title: 'Express' });
});

router.get("/today_all/:last_index/:limit", function(req, res) {
  /*if (!checkPri(req. res)) {
    return;
  }
 */
  var last_index = req.params.last_index;
  var limit = req.params.limit;
  orderDB.getTodayOrder(req.session.storeName, 1, last_index, limit, function(err, data) {
    res.render("wait_send", {
      orders : data,
      tyep:"wait_send",
      store:storeGps[req.session.storeName],
    });
  });
});



router.get("/wait_send/:last_index/:limit", function(req, res) {
  /*if (!checkPri(req. res)) {
    return;
  }
 */
  var last_index = req.params.last_index;
  var limit = req.params.limit;
  orderDB.getOrderByStatus(req.session.storeName, 1, last_index, limit, function(err, data) {
    res.render("wait_send", {
      orders : data,
      tyep:"wait_send",
      store:storeGps[req.session.storeName],
    });
  });
});

router.get("/wait_recycle/:last_index/:limit", function(req, res) {
  var last_index = req.params.last_index;
  var limit = req.params.limit;
  orderDB.getOrderByStatus(req.session.storeName,3, last_index, limit, function(err, data) {
    res.render("wait_send", {
      orders : data,
      type:'wait_recycle',
    });
  });
});

router.get("/order_sending/:last_index/:limit", function(req, res) {
  var last_index = req.params.last_index;
  var limit = req.params.limit;
  if (!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var storeName = req.session.storeName;
  console.log("order sending for " + userName + " "+ storeName)
  orderDB.getSendingOrder(userName, last_index, limit, function(err, data) {
    console.log("orderDB.getSendingOrder cb " + err + " data: " + JSON.stringify(data))
    if (!err) {
      res.render("user_sending", {
        orders : data,
        tyep : "send",
      });
    }
  });
});
router.get("/order_recycling/:last_index/:limit", function(req, res) {
  var last_index = req.params.last_index;
  var limit = req.params.limit;
  if (!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var storeName = req.session.storeName;
  orderDB.getRecyclingOrder(userName, last_index, limit, function(err, orders) {
    console.log(err + " data" + JSON.stringify(orders));
    res.render("user_sending", {
      orders : orders,
    });
  // res.send(orders);
  });
});

router.get("/apply_send/:order_id", function(req, res) {
  var orderID = req.params.order_id;
  if(!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var ret = {error:false};
  orderDB.setOrderPost(orderID, userName, 1, function(err) {
    if (err) {
      ret.error = true;
      ret.msg = JSON.stringify(err);
    }
    res.send(ret);
  });
});


router.get("/apply_send_cancel/:order_id", function(req, res) {
  var orderID = req.params.order_id;
  if(!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var ret = {error:false};
  orderDB.setOrderPost(orderID, userName, 3, function(err) {
    if (err) {
      ret.error = true;
      ret.msg = JSON.stringify(err);
    }
    res.send(ret);
  });
});

router.get("/apply_recycle/:order_id", function(req, res) {
  var orderID = req.params.order_id;
  if(!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var ret = {error:false};
  orderDB.setOrderRecycle(orderID, userName, 1, function(err) {
    if (err) {
      ret.error = true;
      ret.msg = JSON.stringify(err);
    }
    res.send(ret);
  });
});

router.get("/apply_no_recycle/:order_id", function(req, res) {
  var orderID = req.params.order_id;
  var ret = {error:false};
  if(!validateSession(req, res, false)) {
    ret.error = true;
    ret.msg = "请重新登陆进入系统";
    res.send(ret);
    return;
  }
  if (!priChecker.checkPri(req)) {
    ret.error = true;
    ret.msg = "你没有进行该操作的权限";
    res.send(ret);
    return;
  }
  var userName = req.session.userName;
  orderDB.setOrderNoRecycle(orderID, userName, function(err) {
    if (err) {
      ret.error = true;
      ret.msg = JSON.stringify(err);
    }
    res.send(ret);
  });
});



router.get("/apply_recycle_cancel/:order_id", function(req, res) {
  var orderID = req.params.order_id;
  if(!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var ret = {error:false};
  orderDB.setOrderRecycle(orderID, userName, 3, function(err) {
    if (err) {
      ret.error = true;
      ret.msg = JSON.stringify(err);
    }
    res.send(ret);
  });
});



router.get("/apply_send_complete/:order_id", function(req, res) {
  var orderID = req.params.order_id;
  if(!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var ret = {error:false};
  orderDB.setOrderPost(orderID, userName, 2, function(err) {
    if (err) {
      ret.error = true;
      ret.msg = JSON.stringify(err);
    }
    res.send(ret);
  });
});

router.get("/apply_recycle_complete/:order_id", function(req, res) {
  var orderID = req.params.order_id;
  if(!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var ret = {error:false};
  orderDB.setOrderRecycle(orderID, userName, 2, function(err) {
    if (err) {
      ret.error = true;
      ret.msg = JSON.stringify(err);
    }
    res.send(ret);
  });
});
// 查询用户的历史订单
router.get('/phoneorder/:phone/:last_order_index/', function(req, res, next) {
  // session在cookie里面
  // verify session
  console.log(req.url);
  orderDB.getUserHistOrder(req.params.phone, req.params.last_order_index,  function(err, data) {
    console.log("getUserHistOrder cb: " + err);
    if (!err) {
      res.render("order_history", {
        orders:data,
        order_num : data.length,
      })
    }
  });
});


router.post("/apply_order_comment", function(req, res) {
  var commentInfo = req.body;
  console.log(req.body);
  if(!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var orderID = commentInfo.order_id;
  var comment = commentInfo.comment;
  var ret = {error:false};
  orderDB.applyComment(orderID, userName, comment, function(err, new_comment) {
    if (err) {
      ret.error = true;
      ret.msg = JSON.stringify(err);
    } else {
      ret.new_comment = new_comment;
    }
    res.send(ret);
  });
});

router.get("/post_user_achievement", function(req, res) {
  if(!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var ret = {error:false, userName:userName};

  ret["daySum"] = {};

  var d = new Date();
  var year = d.getFullYear();
  var mon = d.getMonth() + 1;
  if( mon < 10 ) {
  mon = "0" + mon;
  }
  var day = d.getDate();
  if( day < 10 ) {
  day = "0" + day;
  }

   //today
   var bdate = year + "-" + mon + "-" + day;
   var sql = "select * from courier_day_summary where user_name = '" + userName + "' and day_str = '" + bdate + "' ";
   orderDB.postUserAchievement(sql, function(err, ret_data1) {
    if (err) {
      ret.error = true;
      ret.msg = JSON.stringify(err);
    } else {
      ret.daySum.sendAmount = 0;
      ret.daySum.recyclingAmount = 0;
      var len = ret_data1.length;
      for(i = 0; i < len; i++) {
        ret.daySum.sendAmount += ret_data1[i]["send_num"];
          ret.daySum.recyclingAmount += ret_data1[i]["recycle_num"];
      }
      res.send(ret);
    }
  });
});

router.get("/update_user_gps/:lat/:lng", function(req, res) {
    var userName = req.session.userName;
    var lat = req.params.lat;
    var lng = req.params.lng;
    orderDB.updateUserGps(userName, lat, lng, function(err) {
      console.log("update user: " + userName + " gps: (" + lat + ", " + lng + ") retuen " + err);
      res.send("ok");
    })
  })

router.get("/post_user_achievement_history/:month", function(req, res) {
  if(!validateSession(req, res, false)) {
    return;
  }
  var userName = req.session.userName;
  var ret = {error:false, userName:userName};
  var iLastMon = req.params.month;

  ret["monSum"] = {};

  var d = new Date();
  var year = d.getFullYear();
  if( iLastMon < 10 ) {
  iLastMon = "0" + iLastMon;
  }

  var bdate = year + "-" + iLastMon + "-01";
  var edate = year + "-" + iLastMon + "-31";
  var sql = "select * from courier_day_summary where user_name = '" + userName + "' and ";
  sql += "day_str >= '" + bdate + "' and day_str <= '" + edate + "' ";
  orderDB.postUserAchievement(sql, function(err, ret_data2) {
  if (err) {
    ret.error = true;
    ret.msg = JSON.stringify(err);
  } else {
    ret.monSum.sendAmount = 0;
    ret.monSum.recyclingAmount = 0;
    var len = ret_data2.length;
    for(i = 0; i < len; i++) {
      ret.monSum.sendAmount += ret_data2[i]["send_num"];
      ret.monSum.recyclingAmount += ret_data2[i]["recycle_num"];
    }
    res.send(ret);
  }
  });
});

// 只能查看今日的详情
// type = send/recycle
router.get("/day_detail/:type", function(req, res) {
  if(!validateSession(req, res, true)) {
    return;
  }
  var userName = req.session.userName;
  var type = req.params.type;
  var dateToday = new Date();
  // 默认取当天的
  orderDB.getPosterTodayOrderHistory(userName, type,  function(err, data) {
    console.log("orderDB.getPosterTodayOrderHistory cb: " + err);
    if (!err) {
      res.render("order_history", {
        orders:data,
        order_num : data.length,
      })
    }
  });
});

// 当年 month月份的 type详情数据
router.get("/month_detail/:type/:month", function(req, res) {
  if(!validateSession(req, res, true)) {
    return;
  }
  var userName = req.session.userName;
  var type = req.params.type;
  var month = req.params.month;
  var dateToday = new Date();
  // 月份
  // 2016-month
  var monthStr = dateToday.getFullYear();
  if (month < 10) {
    monthStr += "-0" + month;
  } else {
    monthStr += "-" + month;
  }
  orderDB.getPosterMonthOrderHistory(userName, type, monthStr,  function(err, data) {
    console.log("orderDB.getPosterMonthOrderHistory cb: " + err);
    if (!err) {
      res.render("order_history", {
        orders:data,
        order_num : data.length,
      })
    }
  });

});

module.exports = router;
