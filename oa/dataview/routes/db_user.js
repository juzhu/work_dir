var mysql_pool = require('./mysql_pool.js').pool;
var dbQuery = require('./mysql_pool.js').mysql_query;
var mysqlEscape = require("./mysql_pool").mysql_escape;
var Config = require('./config_dev.js');

var orderDB = new Object({
  "getUserByCondition" : function(storeName, filter_name, filter, cb) {
    console.log("getUserByCondition start " + storeName);
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select *, left(last_order_time, 10) as last_order_day, left(first_order_time, 10) as first_order_day, TRUNCATE(accumulate_amount/order_num, 1) as avg_amount from " + Config.user_info_tb + " " + Config.order_info_tb;
        if (filter_name != "" && filter_name != "all") {
          sql += " where " + filter_name + " like '%" + filter + "%'";
        }
        if (storeName == "前进店") {
          sql += " and (store_id&1) ";
        } else if (storeName == "坪洲店") {
          sql += " and (store_id&2) "
        } else {
          // 所有的
        }
        sql += " order by last_order_time desc ";
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
  },
  "getUserWithOrderBY" : function(storeName, orderByColumn, order, cb) {
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select *, left(last_order_time, 10) as last_order_day, left(first_order_time, 10) as first_order_day "
        + ", (meituan_order_num+baidu_order_num+eleme_order_num+koubei_order_num) as total_order_num, TRUNCATE(accumulate_amount/order_num, 1) as avg_amount from "
        + Config.user_info_tb;
        if (storeName == "前进店") {
          sql += " where  (store_id&1) ";
        } else if (storeName == "坪洲店") {
          sql += " where (store_id&2) "
        } else {
          // 所有的
        }
 
        if (orderByColumn != "") {
          sql += " order by " + orderByColumn + " " + order;
        }
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
  },

  "setUserWeChatName" : function(uid, name, cb) {
    var sql = "update juzhu_user_info set wechat_name='" + name + "' where uid=" + uid;
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        console.log(sql);
        client.query(sql, function(err, results) {
          if (err) {
            cb(true, err);
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
  },
  "getAllPostUser" : function(cb) {
    console.log("getPostUser start");
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select * from juzhu_post_user ";
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
  },
  "getUserPointInfo" : function(phone, cb) {
    var sql = "select * from juzhu.user_point as p left join juzhu.juzhu_user_info as i on p.uid=i.uid where phone='" + phone + "'";
    dbQuery(sql, cb);
  },
  "getUserPointList" : function(storName, pageNum, cb) {
    var storeID = 1;
    var offset = pageNum * 100;
    if (storName == "all") {
      storeID = 3;
    } else if (storName == '坪洲店') {
      storeID = 2;
    }
    var sql = "select * from juzhu.user_point as p left join juzhu.juzhu_user_info as i on p.uid=i.uid where (i.store_id&" + storeID  + ") order by point desc limit " + offset + ", 100";
    dbQuery(sql, cb);
  },

  "getUserPointRecord" : function(phone, cb) {
    var sql = "select *, r.comment as h_comment, left(tm, 19) as h_tm from juzhu.point_record as r left join juzhu.juzhu_user_info as i on r.uid=i.uid where phone='" + phone + "'";
    dbQuery(sql, cb);
  },
  "consumePoint" : function(uid, point, comment, cb) {
    var sql = "insert into juzhu.point_record set uid=" + uid + ", type=2, point=" + point + ", comment=" + mysqlEscape(comment) + ", last_order_index=0";
    // last_order_index= 0 b不影响订单的积分处理
    dbQuery(sql, function(err) {
      if (!err) {
        var updateSql = "update juzhu.user_point set point=point-" + point + " where uid=" + uid;
        dbQuery(updateSql, cb);
      } else {
        cb(err);
      }
    })
  },

});

exports.orderDB = orderDB;
