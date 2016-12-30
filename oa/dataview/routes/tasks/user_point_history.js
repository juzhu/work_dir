var mysql_pool = require('../mysql_pool.js').pool;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');

// 遍历订单数据id
// 将各个平台的订单更新到user_point_history表相应的字段
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
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select ifnull(max(last_order_index), 0) as max_id from " + Config.user_point_record_tb;
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


function getOrderAfterID(id, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select *  from " + Config.order_info_tb + " as i left join " + Config.order_position_tb + " as p on i.order_id=p.order_id left join juzhu.juzhu_user_info as u on u.phone=p.phone where id>" + id + " and p.user_name is not null order by id limit 1";

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


var waitNum = 0;
var curNum = 0;


function orderProcessOver(err, msg) {
  if (err) {
    console.log(msg);
  }
  curNum = curNum + 1;
  if (curNum >= waitNum && waitNum >= 1) {
    console.log("process " + waitNum + " over");
    curNum = 0;
    waitNum = 0;
    setTimeout(processOrder, 50);
  } else if (waitNum == 0) {
    console.log("no order processed wiat...");
    curNum = 0;
    waitNum = 0;
    setTimeout(processOrder, 10000);
  } else {
  }
}


function processOrder() {
  getLastProcessedOrderID(function (err, max_id) {
    console.log(max_id);
    if (err) {
      console.log(max_id);
    } else {
      getOrderAfterID(max_id, function(err, orders) {
        if (err) {
          console.log(orders)
        } else {
          waitNum = orders.length;
          if (waitNum == 0) {
            orderProcessOver();
            return;
          }
          orders.forEach(function(order) {
            var platform = order.order_platform;
            var sex = order.user_name.indexOf("女士") >= 0 ? "female" : "male";

            var sql = "insert into " + Config.user_point_record_tb + " set "
            + "  type=1"
            + ", uid=" + order.uid
            + ", order_id='" + order.order_id + "'"
            + ", last_order_index=" + order.id
            + ", point=" + parseInt(order.price);
            console.log(sql);

            QueryWithNoRet(sql, orderProcessOver);
          });
        }
      });
    }
  });
}


processOrder();
