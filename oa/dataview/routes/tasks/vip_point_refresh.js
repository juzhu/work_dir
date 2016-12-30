var mysql_pool = require('../mysql_pool.js').pool;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');

// 遍历订单数据id
// 累积用户的积分，一块钱一分
//
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
  console.log("getLastProcessedOrderID")
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select ifnull(max(last_order_id), 0) as max_id from " + Config.user_point_tb;
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
      var sql = "select i.price,u.uid,i.id  from " + Config.order_info_tb + " as i left join " + Config.order_position_tb + " as p on i.order_id=p.order_id "
      + " left join " + Config.user_info_tb + " as u on p.phone=u.phone where i.id>" + id + "  limit 1";

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

var empty = false;
var last_id = 0;
function orderProcessOver(err, msg) {
  if (err) {
    console.log(msg);
  } else {
    // 发送短信
  }
  if (!empty) {
    console.log(msg);
    console.log("last id " + last_id + " orderProcessOver, continue...");
    setTimeout(processOrder, 100);
  } else {
    console.log("no order  wait");
    setTimeout(processOrder, 10000);
  }
}

function processOrder() {
  getLastProcessedOrderID(function (err, max_id) {
    if (err) {
      console.log(max_id);
    } else {
      last_id = max_id;
      getOneOrderAfterID(max_id, function(err, orders) {
        if (err) {
          console.log(orders)
        } else {
          if (orders.length == 0) {
            empty = true;
            orderProcessOver(false)
            return;
          } else {
            empty = false;
          }
          var order = orders[0];
          var uid = order.uid;
          var amount = order.price;
          var sql = "insert into " + Config.user_point_tb + " set "
          + " uid=" + uid
          + ", point=" + amount
          + ", accumulate_point=" + amount
          + ", last_order_id=" + order.id
          + "  on duplicate key update point=point+" + amount
          + ", accumulate_point=accumulate_point+" + amount
          + ", last_order_id=" + order.id;
          QueryWithNoRet(sql, orderProcessOver);
        }
      });
    }
  });
}

processOrder();
