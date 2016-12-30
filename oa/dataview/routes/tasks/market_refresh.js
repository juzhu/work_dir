var mysql_pool = require('../mysql_pool.js').pool;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');
var marketDB = require('../db_market.js').marketDB;

// 遍历订单数据id
// 将各个平台的订单更新到user_info表相应的字段
//
function getRefreshDataForOneTagUser(user, cb) {
  // 查询一个用户 在一个时间点之后的点餐情况
  var sql = "select count(*) as cnt, max(order_time) as order_time from " + Config.order_position_tb + " as p left join " + Config.user_info_tb + " as i on i.phone=p.phone where i.uid=" + user.uid + " and order_time>'" + user.sms_time + "'";
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      console.log(sql);
      client.query(sql, function(err, results) {
        if (err) {
          cb(true, err);
          console.log("mysql error " + err);
        } else if (results.affectedRows == 0) {
          cb(false, []);
        } else {
          cb(false, results);
        }
        mysql_pool.release(client);
      });
    } else {
      cb(false);
      mysql_pool.release(client);
    }
  });
}

function updateTagUserInfo(user, data, cb) {
  console.log(data[0].cnt);
  if (data[0].cnt == 0 ) {
    cb(false);
    return;
  } else {
    // 查询一个用户 在一个时间点之后的点餐情况
    var update_data = data[0];
    var sql = "update " + Config.market_user_info + " set order_num_after_market=" + update_data.cnt + ", last_order_time_after_market='" + update_data.order_time + "' where uid=" + user.uid;
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        console.log(sql);
        client.query(sql, function(err, results) {
          if (err) {
            cb(true, err);
            console.log("mysql error " + err);
          } else {
            cb(false);
          }
          mysql_pool.release(client);
        });
      } else {
        cb(false);
        mysql_pool.release(client);
      }
    });
  }
}


function refreshTagUser(tag_name) {
  marketDB.getTagUserAlreadyMarket(tag_name, function(err, users) {
    if (!err) {
      users.forEach(function(user) {
        getRefreshDataForOneTagUser(user, function(err, data) {
          if (!err) {
            console.log(data);
            updateTagUserInfo(user, data, function(err, msg) {
              if (err) {
                console.log("updateTagUserInfo msg " + msg);
              } else {
                console.log("updateTagUserInfo success");
              }
            });

          } else {
            console.log(data);
          }
        });
      });
    } else {
      console.log("refreshTagUser error");
    }
  });
}

// refreshTagUser("沉寂用户激活短信触达2");
// refreshTagUser("沉寂用户激活短信触达");
// refreshTagUser("最近用户营销0409");
// refreshTagUser("3.10之后客户营销");
//refreshTagUser("母亲节营销");
// refreshTagUser("回收通知");
// refreshTagUser("0820晚餐客户激活")
refreshTagUser("排球营销")
