var Config = require('./config_dev.js');
var mysql_query = require("./mysql_pool.js").mysql_query;

var OrderLogger = new Object({
  "OrderSendApplyLog":function(order_id,post_user_name, cb) {
    var sql = "insert into " + Config.mysql_db + "." + Config.order_post_tb + " set order_id='" + order_id + "', post_user_name='" + post_user_name + "', accept_time=now(), post_status=1 on duplicate key update post_status=1, post_user_name='" + post_user_name + "'";
    console.log(" OrderSendApplyLog sql: " + sql);
    mysql_query(sql, function(err, results) {
      if (!err) {
        console.log(results);
        cb(true);
      } else {
        console.log(JSON.stringify(err));
        cb(false);
      }
    });
  },

  "OrderSendCancelLog" : function(order_id, post_user_name, cb) {
    var sql = "update " + Config.mysql_db + "." + Config.order_post_tb + " set post_status=3 where order_id='" + order_id + "' and post_user_name='" + post_user_name + "'";
    mysql_query(sql, function(err, results) {
      if (!err) {
        console.log(results);
        cb(true);
      } else {
        console.log(JSON.stringify(err));
        cb(false);
      }
    });
  },

  "OrderSendCpmpleteLog" : function(order_id, post_user_name, cb) {
    var sql = "update " + Config.mysql_db + "." + Config.order_post_tb + " set post_status=2, complete_time=now() where order_id='" + order_id + "' and post_user_name='" + post_user_name + "'";
    console.log("OrderSendCpmpleteLog sql : " + sql);
    mysql_query(sql, function(err, results) {
      if (!err) {
        console.log(results);
        cb(true);
      } else {
        console.log(JSON.stringify(err));
        cb(false);
      }
    });
  },

  "OrderRecycleApplyLog" : function(order_id, post_user_name, cb) {

    var sql = "update " + Config.mysql_db + "." + Config.order_post_tb + " set recycle_status=1, recycle_accept_time=now(), recycle_user_name='" + post_user_name + "' where order_id='" + order_id + "'";
    console.log("OrderRecycleApplyLog sql : " + sql);
    mysql_query(sql, function(err, results) {
      if (!err) {
        console.log(results);
        cb(true);
      } else {
        console.log(JSON.stringify(err));
        cb(false);
      }
    });
  },

  "OrderRecycleCancelLog" : function(order_id, post_user_name, cb) {
    var sql = "update " + Config.mysql_db + "." + Config.order_post_tb + " set recycle_status=3 where order_id='" + order_id + "'";
    console.log("OrderRecycleCancelLog sql : " + sql);
    mysql_query(sql, function(err, results) {
      if (!err) {
        console.log(results);
        cb(true);
      } else {
        console.log(JSON.stringify(err));
        cb(false);
      }
    });

  },
  "OrderRecycleCompleteLog": function(order_id, post_user_name, cb) {
    var sql = "update " + Config.mysql_db + "." + Config.order_post_tb + " set recycle_status=2, recycle_complete_time=now(), recycle_user_name='" + post_user_name + "' where order_id='" + order_id + "' and recycle_user_name='" + post_user_name + "'";
    console.log("OrderRecycleCompleteLog sql : " + sql);
    mysql_query(sql, function(err, results) {
      if (!err) {
        console.log(results);
        cb(true);
      } else {
        console.log(JSON.stringify(err));
        cb(false);
      }
    });
  },
  "orderCompleteNoRecycle": function(order_id, cb) {
    var sql = "update " + Config.mysql_db + "." + Config.order_post_tb + " set recycle_status=2, recycle_complete_time=now(), recycle_user_name='norecycle' where order_id='" + order_id + "'";
    console.log("orderCompleteNoRecycle sql : " + sql);
    mysql_query(sql, function(err, results) {
      if (!err) {
        console.log(results);
        cb(true);
      } else {
        console.log(JSON.stringify(err));
        cb(false);
      }
    });
  }
});

exports.OrderLogger = OrderLogger;
