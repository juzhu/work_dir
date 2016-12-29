var dbMysql = require('./mysql_pool.js');
var dbPool = dbMysql.pool;
var dbQuery = dbMysql.mysql_query;
var config = require('./config.js');

var userDB = new Object({
  // 根据用户openid获取用户的基本信息 积分 积分余额会员等级 账户余额之类的信息
  "getUserInfoByOpenID" : function(openID, cb) {
    console.log("getUserInfoByOpenID start");

    var sql = "select * from " + config.wx_bind_table + " as wx left join " + config.user_point_tb + " as p on p.uid=wx.uid left join " + config.user_info_tb + " as u on u.uid=wx.uid";
    sql += " where openID='" + openID + "'";
    console.log(sql);
    dbQuery(sql, function(err, results) {
      if (err) {
        cb(true, err);
        console.log("mysql error " + err);
      } else if (results.affectedRows == 0) {
        cb(false, []);
      } else {
        cb(false, results);
      }
    });
  },
  "getUserPointHistoryByPhone": function(phone, cb) {
	console.log("getUserPointHistoryByPhone start");

    var sql = "select * from " + config.user_point_history_tb + " as h left join " + config.order_info_tb + " as i on h.order_id=i.order_id where phone='" + phone + "' order by h.order_time desc";
    console.log(sql);
    dbQuery(sql, function(err, results) {
      if (err) {
        cb(true, err);
        console.log("mysql error " + err);
      } else if (results.affectedRows == 0) {
        cb(false, []);
      } else {
        cb(false, results);
      }
    });
  },
  "addWXUser":function(openID, cb) {
    var sql = "insert ignore into " + config.wx_bind_table + " set openID='" + openID + "'";
    dbQuery(sql, cb);
  },
  "updateUserPointInfo" : function(userInfo, cb) {
    sql = "update " + config.user_point_tb + " set point=" + userInfo.point + " where uid=" + userInfo.uid;
    console.log(sql)
    dbQuery(sql, cb);
  },
  "bindUser" : function(userInfo, phone, cb) {
    if (userInfo.uid != null || userInfo.uid == 0) {
      // 暂时只支持 一对一的绑定
      console.log("账户已经绑定了，暂时只支持电话和微信一一绑定");
      cb("账户已经绑定了，暂时只支持电话和微信一一绑定");
      return;
    }
    // 查询phone对应的uid
    var sql = "select * from " + config.user_info_tb + " where phone like '%" + phone + "%'";
    console.log(sql)
    dbQuery(sql, function(err, results) {
      if (!err && (results.length == 1)) {
        uid = results[0].uid;
        var phoneUser = results[0];
        sql = "update " + config.wx_bind_table + " set uid=" + uid + " where openID='" + userInfo.openID + "'";
        console.log(sql)
        dbQuery(sql, function(err) {
          if (err) {
            console.log("bind userinfo error");
            cb("err for bind user");
          } else {
            cb(false, phoneUser);
          }
        });
      } else if (err) {
        cb(err);
      } else {
        // 没点过  直接创建一个新的uid
        var sql = "insert into " + config.user_info_tb  + " set phone='" + phone + "', order_num=0, user_addr='请填写详细地址'";
        dbQuery(sql, function(err, results) {
          if (err) {
            cb(err);
          } else {
            var userID = results.insertId;
            var sql = "update " + config.wx_bind_table + " set uid=" + userID + " where openID='" + userInfo.openID + "'";
            dbQuery(sql, cb);
          }
        });
      }
    })
  },
  'setWXAddr' : function(userInfo, addr, cb) {
    var sql = "";
    if (userInfo.uid !== undefined) {
      sql = "update " + config.user_info_tb + " set user_addr='" + addr + "' where uid=" + userInfo.uid;
    } else {
      sql = "update " + config.wx_bind_table + " set user_addr='" + addr + "' where openID='" + openID + "'";
    }
    dbQuery(sql, function(err) {
      console.log("setWXAddr sql: " + sql + " return: " + err);
      cb(err);
    });
  },
  "sqrWXPhone" : function(openID, phone, cb) {
    var sql = "update " + config.wx_bind_table + " set phone='" + phone + "' where openID='" + openID + "'";
    dbQuery(sql, cb)
  },
  "getFanPiaoInfo" : function(uid, cb) {
    var sql = "select * from " + config.fanpiao_tb + " where uid=" + uid;
    dbQuery(sql, cb);
  },
  "fanPiaoPaySuccess" : function(payID, cb) {
    var sql = "insert ignore into " + config.fanpiao_tb + " select uid, buy_amount, now()  from " + config.fanpiao_order_tb + " where pay_id='" + payID + "' ";
    dbQuery(sql, function(err) {
      if (!err) {
        var sql = "update " + config.fanpiao_order_tb + " as a, " + config. fanpiao_tb +
          " as b set b.cur_amount=b.cur_amount + a.buy_amount, a.pay_time=now() where a.pay_id='" + payID + "' and a.pay_time=0 and a.uid=b.uid";
          console.log("fanPiaoPaySuccess:" + sql);
          dbQuery(sql, cb);
      } else {
        cb(err);
      }
    });
  },
  "payOrderAmountByFanPiao":function(uid, orderAmount, cb) {
    var sql = "update " + config.fanpiao_tb +  " set cur_amount=cur_amount-" + orderAmount + " where uid=" + uid + " and cur_amount>=" + orderAmount;
    dbQuery(sql, cb);
  }

});
exports.userDB = userDB;
