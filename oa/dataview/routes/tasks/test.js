var mysql_pool = require('../mysql_pool.js').pool;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');
var marketDB = require('../db_market.js').marketDB;
var SMS = require('../send_sms.js');
var curDate = (new Date()).getDate();
console.log(curDate);

// 保证一天内最多3条给用户，多的发给我们自己一条告警
var sendCache = {};


// 收到用户订单之后 根据用户的情况 是否第一次点餐
// 给用户发送相应的短信通知

var last_order_index = 0;
function QueryWithNoRet(sql, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      client.query(sql, function(err, results) {
        if (err) {
          console.log(sql);
          cb(true, err);
        } else {
          cb(false);
        }
        mysql_pool.release(client);
      });
    } else {
      cb(true, "mysql error");
      mysql_pool.release(client);
    }
  });
}

function getLastProcessedOrderID(cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select ifnull(max(order_index), 0) as max_id from " + Config.order_sms_tb;
      client.query(sql, function(err, results) {
        if (err) {
          cb(true, err);
        } else {
          cb(false, results[0].max_id);
        }
        mysql_pool.release(client);
      });
    } else {
      cb(true, "mysql error");
      mysql_pool.release(client);
    }
  });
}

function getOneOrderAfterID(id, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select *, unix_timestamp(p.order_time) as tm from " + Config.order_info_tb + " as i left join " + Config.order_position_tb + " as p on i.order_id=p.order_id where id>" + id + "  order by id limit 1";

      client.query(sql, function(err, results) {
        if (err) {
          cb(true, err);
        } else {
          cb(false, results);
        }
        mysql_pool.release(client);
      });
    } else {
      cb(true, "mysql error");
      mysql_pool.release(client);
    }
  });
}

function addSendSmsRecord(order_index, phone, content, need_send, cb) {
  var sql = "insert into " + Config.order_sms_tb + " set order_index=" + order_index
  + ", phone='" + phone + "', sms_content='" + content + "', is_send=" + need_send;

  QueryWithNoRet(sql, function(err, msg) {
    if (err) {
      // 数据库没写进去 不能发
      console.log("addSendSmsRecord err: " + msg);
      cb(false);
    } else {
      cb(true);
    }
  });
}

function filterSMS(phone, content) {
  var sendNum = sendCache[phone];

  if (sendNum === undefined) {
    console.log("first send to " + phone + " content: " + content);
    sendCache[phone] = 1;
    return true;
  } else if (sendNum <= 3) {
    sendCache[phone] = sendNum + 1;
    return true;
  } else {
    console.log("send to " + phone + " " + sendNum + " too much, content: " + content);
    return false;
  }
}

function CheckNewOrder() {
  var nowDate = (new Date()).getDate();
  if (nowDate != curDate) {
    // 跨天之后 sendCache 清空
    curDate = nowDate;
    sendCache = {};
  }
  getOneOrderAfterID(last_order_index, function(err, orders) {
    if (err) {
      console.log("getOneOrderAfterID err: " + orders);
      return;
    }
    if (orders.length <= 0) {
      console.log("no order, wait....");
      setTimeout(CheckNewOrder, 10000);
      return;
    }
    var oneOrder = orders[0];
    var phone = oneOrder.phone;
    var tm = oneOrder.tm;
    var userName = oneOrder.user_name;
    last_order_index = oneOrder.id;
    var nowTm = new Date().getTime() / 1000;
    var need_send = true;
    if ((nowTm - tm) > 60 * 10) {
      need_send = false;
    }
    // 去掉空格
    userName = userName.replace(" ", "");
    var sms_content = "客户您好，您的外卖的订单我们已经收到，正在为您备餐，请耐心等候。任何疑问，请联系客服微信juzhu00001,祝您用餐愉快【聚箸】";

    if (userName.indexOf("先生") > 0 || userName.indexOf("女士") > 0) {
      userName = userName.replace(/[(,)]/g, "");
      sms_content = "尊敬的" + userName + "，";
    } else if (userName>" ") {

      sms_content = "尊敬的" + userName + "，"
    } else {
      sms_content = "尊敬的客户, "
    }
    sms_content += "您的订单我们已经收到，厨房正在为您备餐，请耐心等待。任何疑问请联系客服微信juzhu00001，祝您用餐愉快【聚箸】";

    addSendSmsRecord(last_order_index, phone, sms_content, need_send, function(addSuccess) {
      if (addSuccess) {
        need_send = (need_send && filterSMS(phone, sms_content));
        if (need_send) {
          console.log("need send sms for order:" + last_order_index);
          SMS.orderNotice(phone, sms_content, function(sendRet) {
            console.log("sms send return " + sendRet);
            setTimeout(CheckNewOrder(), 10000);
          });
        } else {
          console.log("order " + last_order_index + " already pass ten minute, no sms send");
          setTimeout(CheckNewOrder(), 10000);
        }
      } else {
        console.log("err occure, no sms send for order: " + last_order_index);
        setTimeout(CheckNewOrder(), 1000);
      }
    })
  });
}

/*
getLastProcessedOrderID(function(err, id) {
  if (!err) {
    last_order_index = id;
    CheckNewOrder();
  } else {
    console.log("getLastProcessedOrderID err " + id);
  }
});
*/
