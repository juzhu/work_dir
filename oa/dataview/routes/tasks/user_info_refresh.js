var mysql_pool = require('../mysql_pool.js').pool;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');

// 遍历订单数据id
// 将各个平台的订单更新到user_info表相应的字段
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
      var sql = "select ifnull(max(last_order_id), 0) as max_id from " + Config.user_info_tb;
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
      var sql = "select *  from " + Config.order_info_tb + " as i left join " + Config.order_position_tb + " as p on i.order_id=p.order_id where id>" + id + "  limit 1";

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
    setTimeout(processOrder, 100);
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
            var platform_num_column = "";
            var platform_amount_column = "";
            console.log(order);
            var sex = order.user_name.indexOf("女士") >= 0 ? "female" : "male";
            var store_id = 0;
            if (order.store_name == '前进店') {
              store_id = store_id | 1;
            } else if (order.store_name == '坪洲店'){
              store_id = store_id | 2;
            } else {
              console.log("error store name");
            }
            if (platform == "baidu") {
              platform_num_column = "baidu_order_num";
              platform_amount_column = "baidu_amount";
            } else if (platform == "eleme") {
              platform_num_column = "eleme_order_num";
              platform_amount_column = "eleme_amount";
            } else if (platform == "koubei") {
              platform_num_column = "koubei_order_num";
              platform_amount_column = "koubei_amount";
            } else {
              platform_num_column = "meituan_order_num";
              platform_amount_column = "meituan_amount";
              // 美团不处理
              // orderProcessOver();
              // return;
            }
            var sql = "insert into " + Config.user_info_tb + " set "
            + platform_num_column + "=1, "
            + platform_amount_column + "=" + order.price
            + ", first_order_time='" + order.order_time + "'"
            + ", order_num=1"
            + ", last_order_time='" + order.order_time + "'"
            + ", user_name='" + order.user_name + "'"
            + ", user_addr='" + order.addr + "'"
            + ", sex='" + sex + "'"
            + ", comment=" + mysql_escape(order.comment)
            + ", phone='" + order.phone + "'"
            + ", accumulate_amount=" + order.price
            + ", store_id=" + store_id
            + ", last_order_id=" + order.id
            + "  on duplicate key update " + platform_num_column + "=" + platform_num_column + " + 1"
            + ", " + platform_amount_column + "=" + platform_amount_column + " +" + order.price
            + ", last_order_time='" + order.order_time + "'"
            + ", accumulate_amount=accumulate_amount+" + order.price
            + ", order_num=order_num+1, store_id=store_id|" + store_id
            + ", last_order_id=" + order.id;
            console.log(sql);
            QueryWithNoRet(sql, orderProcessOver);
          });
        }
      });
    }
  });
}

processOrder();
