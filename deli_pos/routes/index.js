var express = require('express');
var mysql = require('mysql');
// var log4js = require("log4js");

var Config = require('./config_dev.js');
var PostmanUser = require('./post_user.js');
var mysql_pool = require('./mysql_pool.js').pool;
var OrderLogger = require('./order_log.js').OrderLogger;
var content_request = require('request');
var juzhuMQCommon = require("../../mq_init_test/js_comm/juzhu_mq_comm.js");
var router = express.Router();
var OrderStatus = {
  "WAIT2SEND" : 1,
  "SENDING" : 2,
  "WAIT2RECYCLE" : 3,
  "RECYCLING" : 4,
  "COMPLETE" : 5,
  "COMPLETENORECYCLE" : 6,
  "COMPLETEVERIFY" : 7,
  "SENDCOMPLETE":8
}

var user_map = {};
function getStoreName(req) {
  console.log(req.body);
  return req.body.store_name || "前进店";
}

function verifySession(req) {
  console.log(req.body);
  var userCookie = req.body;
  var verifyRet = false;
  // 必须新版的 包含version
  var version = userCookie.version;
  var checkRet = true;
  if (version) {
    var ticket = userCookie.user_ticket;
    var userName = userCookie.user_name;
    var checkRet = ticket_manager.checkTicket(userName, ticket);
    if (checkRet) {
      verifyRet = true;
    } else {
      console.log("ticket error, userName " + userName + " ticket: " + ticket);
    }
  } else {
    console.log("no version error" + JSON.stringify(userCookie));
  }
  return verifyRet;
}

function userTicket(user, expired_seconds)  {
  this.loginTime = (new Date()).getTime() / 1000;
  this.lastHeartBeat = (new Date()).getTime() / 1000;
  this.expiredTime = (new Date()).getTime() / 1000 + expired_seconds;
  this.ticketID = user + "_" + (new Date()).getTime() / 1000;
  this.userName = user;
  this.expired = false;
  this.checkExpired = function(now_time) {
    if (!this.expired && this.lastHeartBeat + 30 < now_time) {
      this.expired = true;
      console.log(this.ticketID + " expired as " + now_time);
    }
    return this.expired;
  }
}

function orderArrayFromDBResult(result) {
  var orderArray = new Array();
  for(index in result) {
    var row = result[index];
    var order = new Array();
    order.push(row.orderid);
    order.push(row.lat);
    order.push(row.lng);
    order.push(row.addr);
    order.push(row.phone);
    order.push(row.user_name);
    order.push(row.current_status);
    order.push(row.last_op_user);
    order.push(row.ordertime);
    order.push(row.platform + "-" + row.order_index);
    order.push(row.price + " RMB");
    order.push(row.comment);
    order.push(row.menu_list);
    orderArray.push(order);
  }
  // console.log(JSON.stringify(orderArray));
  return orderArray;
}

function orderBriefFromDBResult(result) {
  var orderBriefArray = new Array();
  for(index in result) {
    var row = result[index];
    var orderBrief = new Array();
    orderBrief.push(row.current_status);
    orderBrief.push(row.cnt);
    orderBriefArray.push(orderBrief);
  }
  return orderBriefArray;
}

function someDayBeforeByMysql(days) {
  // days = days + 5;
  return "left(from_unixtime(unix_timestamp(now())-" + days + "*24*60*60), 10)";
}

function getOrderBrief(storeName, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select current_status, count(*) as cnt from " + Config.order_position_tb + "  as  p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id where p.store_name='" + storeName + "' and i.order_valid=true and current_status in (1, 3) and p.order_time>" + someDayBeforeByMysql(10) + " group by current_status";
      // console.log(sql);

      client.query(sql, function(err, results) {
        if (err) {
          cb(err);
          console.log("mysql error " + err);
        } else if (results.affectedRows == 0) {
          cb(true);
        } else {
          cb(false, orderBriefFromDBResult(results));
        }
        mysql_pool.release(client);
      });
    } else {
      cb(false);
      mysql_pool.release(client);
    }
  });

}

function getOrderListFromDB(storeName, order_status, username, start_index, cb) {
  // console.log("getOrderListFromDB 1");
  mysql_pool.acquire(function (err, client) {
    // 选择两天内的
    if (!err) {
      var sql = "select *, p.order_id as  orderid, p.order_platform as platform,p.order_time as ordertime, i.menu_list from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id where p.store_name='" + storeName + "' and i.order_valid=true and current_status=" + order_status + " and p.order_time>";
      if (order_status < 5) {
        sql += someDayBeforeByMysql(10);
      } else {
        sql += someDayBeforeByMysql(1);
      }
      if (username != "") {
        sql += " and last_op_user='" + username + "'";
      }
      sql += " order by p.order_time desc";
      sql += " limit " + start_index + ", 100";
      console.log(sql);

      client.query(sql, function(err, results) {
        if (err) {
          cb(false, err);
          console.log("mysql error " + err);
        } else if (results.affectedRows == 0) {
          cb(true);
        } else {
          cb(true, orderArrayFromDBResult(results));
        }
        mysql_pool.release(client);
      });
    } else {
      cb(false);
      mysql_pool.release(client);
    }
  });
}

function getOrderListFromDBByPhone(phone, start_index, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select *, p.order_id as orderid, p.order_platform as platform, p.order_time as ordertime from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id where p.phone like '%" + phone + "%'";
      sql += " order by p.order_time desc";
      sql += " limit " + start_index + ", 100";
      //console.log(sql);

      client.query(sql, function(err, results) {
        if (err) {
          cb(false, err);
          console.log("mysql error " + err);
        } else if (results.affectedRows == 0) {
          cb(true);
        } else {
          cb(true, orderArrayFromDBResult(results));
        }
        mysql_pool.release(client);
      });
    } else {
      cb(false);
      mysql_pool.release(client);
    }
  });
}

function setOrderStatusByUser(order_id, username, order_status, pre_status, cb) {
  console.log("from " + pre_status + " to " + order_status + " id: " + order_id);
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "update " + Config.order_position_tb + " set current_status=" + order_status + " ,last_op_user='" + username + "'";
      sql += " where order_id='" + order_id + "' and current_status=" + pre_status;
      console.log(sql);
      console.log("");

      client.query(sql, function(err, results) {
        if (err) {
          cb(false, err);
        } else if (results.affectedRows == 0) {
          cb(false);
        } else {
          cb(true);
        }
      });
    } else {
      console.log("err " + err);
      cb(false);
    }
    mysql_pool.release(client);
  });
}

function setOrderCommentByUser(order_id, username, comment, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var cur_comment = "";
      var tm = "";
      var new_comment = "";
      var sql = "select comment, now() as tm from "  + Config.order_position_tb + " where order_id='" + order_id + "' and comment!=''";
      client.query(sql, function(err, comments) {
        if (!err && comments.length > 0) {
          cur_comment = comments[0].comment;
        }
        if (cur_comment != "") {
          var new_start = comment.indexOf(cur_comment);
          if (new_start >= 0) {
            new_comment = comment.substr(new_start + cur_comment.length);
          } else {
            new_comment = comment;
          }
          cur_comment = cur_comment + "\r\n";
        } else {
          new_comment = comment;
        }
        var comment_ret = cur_comment + new_comment  + " " + (new Date()).toLocaleString() + " " + username;
        var sql = "update " + Config.order_position_tb + " set comment='" + comment_ret + "' ,last_op_user='" + username + "'";
        sql += " where order_id='" + order_id + "'";
        console.log(sql);

        client.query(sql, function(err, results) {
          if (err) {
            cb(false, err);
          } else if (results.affectedRows == 0) {
            cb(false);
          } else {
            cb(true);
          }
          mysql_pool.release(client);
        });
      });
    } else {
      cb(false);
      mysql_pool.release(client);
    }
  });
}

function addOrderCommentByUser(order_id, username, comment, cb) {
  var commentAdd = "\r\n" + comment + " " + (new Date()).toLocaleString() + " " + username;
  console.log("addOrderCommentByUser");
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "update " + Config.order_position_tb + " set comment=concat(comment, '" +  commentAdd + "') ,last_op_user='" + username + "'";
      sql += " where order_id='" + order_id + "'";

      console.log(sql);
      client.query(sql, function(err, results) {
        if (err) {
          cb(false, err);
        } else if (results.affectedRows == 0) {
          cb(false);
        } else {
          cb(true);
        }
        mysql_pool.release(client);
      });
    } else {
      cb(false);
      mysql_pool.release(client);
    }
  });
}

function addOrderInfo(order, cb) {
  console.log("addOrderInfo for order: " + JSON.stringify(order));
  var userName = order.userName.replace("'", "");
  var userName = userName.replace('"', '');
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "insert ignore into " + Config.order_position_tb;
      sql +=  " set order_id='" + order['orderId'] + "', ";
      sql +=  " addr='" + order['addr'] + "', ";
      sql +=  " phone='" + order['phone'] + "', ";
      sql +=  " user_name='" + userName + "', ";
      sql +=  " order_time='" + order['orderTime'] + "', ";
      sql +=  " order_platform='" + order['source'] + "', ";
      sql +=  " order_index=" + order['orderIndex'] + ", ";
      sql +=  " lat='" + order['lat'] + "', ";
      sql +=  " lng='" + order['lng'] + "', ";
      sql +=  " comment='" + order['comment'] + "',";
      sql +=  " current_status=1, source_store='" + order['storeName'] + "',store_name='" + order['storeName'] + "', shop_id='" + order['storeID'] + "'";
      console.log("addorderInfo: " + sql);

      client.query(sql, function(err, results) {
        if (err) {
          cb(false, err);
        } else if (results.affectedRows == 0) {
          cb(false);
        } else {
          cb(true);
        }
        sql = "insert ignore into order_info set order_id='" + order['orderId'] + "', ";
        sql += " price='" + order['realPrice'] + "',";
        sql += " order_platform='" + order['source'] + "',";
        sql += " order_time='" + order['orderTime'] + "', ";
        sql += " menu_list='" + order['orderDetailStr'] + "'";
        console.log(sql);
        client.query(sql, function(err, results) {
          console.log(sql + " return : " + err);
          mysql_pool.release(client);
        });
      });
    } else {
      cb(false);
      mysql_pool.release(client);
    }
  });
}

function userTicketManager() {
  // ticketid map
  this.allTickets = {};
  this.ticketNum = 0;
  this.allTickets_array = [];
  this.expired_seconds = 10;
  this.refreshTicket = function(ticket) {
    ticket.lastHeartBeat = (new Date()).getTime() / 1000;
    ticket.expiredTime = (new Date()).getTime() / 1000 + this.expired_seconds;
  };

  this.checkTicket = function (user, ticketID) {
    if (this.allTickets[user] === undefined
      || this.allTickets[user].expired === true) {
        return false;
      } else {
        var ticket = this.allTickets[user];
        if (ticket.ticketID === ticketID) {
          this.refreshTicket(ticket);
          return true;
        } else {
          return false;
        }
      }
  }
  this.newTicket = function(user) {
    // 看是否已经有session
    if (this.allTickets[user] !== undefined && this.allTickets[user].expired === false) {
      var ticket = this.allTickets[user];
      this.refreshTicket(ticket);
      return this.allTickets[user];
    }
    var ticket = new userTicket(user, this.expired_seconds);
    this.allTickets[user] = ticket;
    this.ticketNum++;
    return ticket;
  };
  var this_obj = this;
  this.refreshProc = function() {
    var ticket_num = 0;
    for (user in this_obj.allTickets) {
      var ticket = this_obj.allTickets[user];
      var now_time = (new Date()).getTime() / 1000;
      if (ticket.checkExpired(now_time)) {
        delete this_obj.allTickets[user];
        this_obj.ticketNum--;
      }
      ++ticket_num;
    }
    // console.log("allTickets refresh size: " + ticket_num + " after refresh " + this_obj.ticketNum);
  };
  this.refreshTimer = setInterval(this.refreshProc, 1000 * 1);
};
var ticket_manager = new userTicketManager();

function getOrderPosition(date, order_cnt) {
  var order_map = {};
  var conn = mysql.createConnection({
    host:'localhost',
    user:'root',
    database:'juzhu',
    password:'juzhudb001',
    port:3306
  });

  conn.connect();
  var where = "select * from order_position where order_time like '" + date + "%' order by order_index desc limit " + order_cnt;
  conn.query(where, function(err, rows, fields) {
    if(err) {
      console.log("get info from db fail");
    } else {
      console.log("get info from db success");
    }
    for(var i = 0; i < rows.length; i++){
      var firstResult = rows[i];
      var user_addr = firstResult['addr'];
      var user_phone = firstResult['phone'];
      var user_name = firstResult['user_name'];
      var lat = firstResult['lat'];
      var lng = firstResult['lng'];
      var order_index = firstResult['order_index'];

      order_map[user_addr] = {
        "name": user_addr,
        "lat": lat,
        "lng": lng,
        "last_time":(new Date()).getTime() / 1000,
      };
    }
    conn.end();
  });

  return order_map;
}

router.get('/heartbeat/:username/:ticket', function(req, res, next) {
  var heartbeat_ret = {};
  var check_ret = ticket_manager.checkTicket(req.params.username, req.params.ticket);
  if (check_ret == true) {
    // console.log("user: " + req.params.username + " ticket: " + req.params.ticket + " heartbeat ok");
  } else {
    console.log("user: " + req.params.username + " ticket: " + req.params.ticket + " heartbeat error");
  }
  heartbeat_ret["ret"] = check_ret;
  // console.log(JSON.stringify(req.query));

  if (req.query.lat || req.query.lng) {
    // console.log(JSON.stringify(req.query));
    // console.log(req.params.username);
    user_map[req.params.username] = {
      "name":  req.params.username,
      "lat":req.query.lat,
      "lng":req.query.lng,
      "last_time":(new Date()).getTime() / 1000,
    };
    // console.log(JSON.stringify(user_map));
  }
  // 写路劲记录
  res.send(JSON.stringify(heartbeat_ret));
});


router.get('/report/:name/:lat/:lng/:timestamp', function(req, res, next) {
  // console.log(req.params.name);
  // console.log(req.params.lat);
  // console.log(req.params.lng);
  user_map[req.params.name] ={
    "name":req.params.name,
    "lat":req.params.lat,
    "lng":req.params.lng,
    "last_time":req.params.timestamp
  };
  res.send("ok");
});

router.get('/user_position', function(req, res) {
  // console.log(JSON.stringify(user_map));
  res.send(JSON.stringify(user_map));
});



/*
///////////////////////////////////////////////////////////////add, 2016-12-09
var log4js_config = require("./log4js.json");
log4js.configure(log4js_config);
var log_file = log4js.getLogger('log_file');

var transporter = require('./mail_config').mail_transporter;

//send mail service
function sendMail2Admin(receiver, title, content) {
	var mailOptions = {
		from: '2202055547@qq.com', // 发件地址
		to: receiver, // 收件列表
		subject: title, // 标题
		//text和html两者只支持一种
		//html: content, // html 内容
		text: content // 标题
	};

	transporter.sendMail(mailOptions, function(error, info){
		if( error ){
			log_file.warn(error);
		} else {
			log_file.debug('Message sent: ' + info.response);
		}
	});
}


var storeId2Name = {
	"699922": "美团-前进店",
	"1626582": "美团-坪洲店",
	"30719215": "饿了么-前进店",
	"1533412": "饿了么-坪洲店",
};
//storeID => (platform, storeName, storeID, lastestReport, interval)
//var alertInterval = 3;
var alertInterval = 2;
var pluginMap = {};

//插件上报心跳
router.post("/reportHeartBeat/", function(req, res, next) {
  log_file.debug("In service: reportHeartBeat");
  var heartInfo = req.body;
  var ret = {"ret":0};
  //log_file.debug(heartInfo);
  
  var reportTime = Date.parse(new Date(heartInfo['reportTime']));
  var reportTime = reportTime / 1000;
  
  if (heartInfo.storeID) { // 饿了么 美团店id
	var storeID = heartInfo.storeID;
	if( storeID in storeId2Name ) {
		if( storeID in pluginMap ) {
			pluginMap[storeID]["lastestReport"] = reportTime;
		} else {
			pluginMap[storeID] = {
				"storeID": storeID,
				"storeName": storeId2Name[storeID],
				"platform": heartInfo['platform'],
				"lastestReport": reportTime,
				"interval":heartInfo["interval"]
			};
		}
	} else {
		ret.ret = 1;
		res.send(ret);
		return;
	}
  } else {
    ret.ret = 1;
    res.send(ret);
    return;
  }
  
});

//检查插件是否work
router.get("/checkHeartBeat/", function(req, res, next) {
	log_file.debug("In service: checkHeartBeat");

	var receiver = "381813354@qq.com";
	var title = "juzhu plugin abnormal";
	
	var delMap = {};
	var curTime = Date.parse(new Date()) / 1000;
	for(var storeID in pluginMap) {
		var hInt = (curTime - pluginMap[storeID]["lastestReport"] ) * 1000;
    log_file.debug("hInt: " + hInt);
		if( hInt > alertInterval * pluginMap[storeID]["interval"]) {
			var warnStr = "platform: " +　pluginMap[storeID]["platform"] + "; ";
			warnStr += "storeName: " + pluginMap[storeID]["storeName"] + "; ";
			warnStr += "storeID: " + storeID + ", work abnormal, please check!!!";
			log_file.warn(warnStr); 
			
			//send mail to admin
			sendMail2Admin(receiver, title, warnStr);
			
			delMap[storeID] = 1;
		} else {
			continue;
		}
	}
	
   //delMap.length => undefined 
	for(var storeID in delMap) {
		delete pluginMap[storeID];
	}
	
	var ret = {"ret":0};
	res.send(ret);
	return;

});

*/
				   
module.exports = router;
