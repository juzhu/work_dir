var mysql_pool = require('../mysql_pool.js').pool;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');

var filter_cond = {
  "order_num" : 2,
  "last_order_time":
};
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

function getLastUserByTagName(tag_name, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select ifnull(max(last_order_index), 0) as max_id from " + Config.market_user_info  + " where tag_name='" + tag_name + "'";
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


function getOneUserAfterID(id, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select *  from " + Config.user_info_tb + " where id>" + id + "  limit 1";

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
    setTimeout(processOrder, 20);
  } else if (waitNum == 0) {
    console.log("no order processed wiat...");
    curNum = 0;
    waitNum = 0;
    setTimeout(processOrder, 10000);
  } else {
  }
}

function filterTagUser(tagInfo, filter, cb) {
  getLastProcessedOrderID(function (err, max_id) {
    if (err) {
      console.log(max_id);
    } else {
      getOneOrderAfterID(max_id, function(err, orders) {
        if (err) {
          console.log(orders)
        } else {
          waitNum = orders.length;
          if (waitNum == 0) {
            orderProcessOver();
            return;
          } else if (waitNum > 1) {
            console.log("one each time please");
            return;
          }
          waitNum = 0;
          orders.forEach(function(order) {
            var menu_list = order.menu_list;
            var dishes = menu_list.split(",");
            console.log(dishes + " from order: " + order.id);
            waitNum = waitNum + dishes.length;
            dishes.forEach(function(dish) {
              // console.log(order);
              // console.log(dish);a
              if (dish > " ") {
                var sql = "insert into " + Config.user_menu_info + " set "
                + "phone='" + order.phone + "'"
                + ", order_id='" + order.order_id + "'"
                + ", dish_name='" + dish.split("x")[0] + "'"
                + ", order_time='" + order.order_time + "'"
                + ", last_order_index=" + order.id;
                QueryWithNoRet(sql, orderProcessOver);
              }
            });
          });
        }
      });
    }
  });
}

processOrder();
