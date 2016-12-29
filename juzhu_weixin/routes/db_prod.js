var dbMysql = require('./mysql_pool.js');
var dbPool = dbMysql.pool;
var mysqlEscape = dbMysql.mysql_escape;
var dbQuery = dbMysql.mysql_query;
var config = require('./config.js');

var jiFenDB = new Object({
  // 根据用户openid获取用户的基本信息 积分 积分余额会员等级 账户余额之类的信息
  // id 0 标识查询所有的
  "getJiFenProd" : function(id, cb) {

    console.log("getJiFenProd start");

    var sql = "select * from " + config.jifen_prod + " as jifen left join " + config.prod_info + " as p on jifen.prod_id=p.prod_id";
    if (id) {
      sql += " where p.prod_id=" + id;
    }
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
  "addJiFenOrder" : function(orderInfo, cb) {
    var sql = "insert into " + config.order_tb + " set uid=" + orderInfo.uid + ", prod_id=" + orderInfo.prod_id;
    sql += ", prod_name='" + orderInfo.prod_name + "', order_num=" + orderInfo.order_num;
    sql += ", price_type=" + orderInfo.price_type + ", jifen_cost=" + orderInfo.jifen_cost;
    sql += ", rmb_cost=" + orderInfo.rmb_cost + ", aval_balance=0, aval_point=" + orderInfo.aval_point;
    console.log(sql);
    dbQuery(sql, cb);
  },
  "getOrderRecord" : function(uid, cb) {
    var sql = "select *, if(jifen_cost>0, 1, 0) as jifen_order, if (rmb_cost>0, 1 ,0) as rmb_order , left(order_time, 19) as order_time from " + config.order_tb + " where uid=" + uid + " order by id desc";
    console.log(sql);
    dbQuery(sql, cb);
  },
  "getMenuList" : function(cb) {
    var sql = "select * from " + config.menu_list + " as m left join " + config.menu_type + " as t on m.menu_type=t.menu_type left join " + config.prod_info + " as p on m.prod_id=p.prod_id";
    console.log(sql);
    dbQuery(sql, cb);
  },
  "getProdInfo" : function(prodIDs, cb) {
    var sql = "select * from " + config.prod_info + " as p left join " + config.menu_list + " as m on p.prod_id=m.prod_id where p.prod_name in (";
    for (id in prodIDs) {
      sql += "'" + prodIDs[id] + "',"
    }
    sql += "'')";
    console.log(sql)
    dbQuery(sql, cb);
  },
  'addUserOrder' : function(userOrder, cb) {
    var sql = "insert into " +  config.user_order + " set order_id='" + userOrder.orderID + "',uid=" + userOrder.uid + ",amount=" + userOrder.orderAmount + ", time_start='" + userOrder.time_start + "',time_end='" + userOrder.time_expire + "', pay_id='" + userOrder.payID  + "', order_detail=" + mysqlEscape(JSON.stringify(userOrder));
    console.log("addUserOrder:" + sql);
    dbQuery(sql, cb);
  },
  "getUserOrders" : function(uid, cb) {
    var sql = "select order_detail, pay_status from " + config.user_order + " as o left join " + config.wx_pay_orders + " as p on o.pay_id=p.pay_id where uid=" + uid + " order by time_start desc  limit 10"
    dbQuery(sql, cb)
  },
  "addWechatPayOrder":function(parOrderInfo, cb) {
    var sql = "insert into " + config.wx_pay_orders + " set "+
      "pay_id='" + parOrderInfo.payID + "'," +
      "prepay_id='" + parOrderInfo.prepayID + "', " +
      "amount=" + parOrderInfo.orderAmount + ", " +
      "pay_status=1," +
      "prepay_time=now()";
      console.log("addWechatPayOrder:" + sql);
      dbQuery(sql, cb);
   },
   "payOrderSuccess" : function(payID, transationID, cb) {
     var sql = "update " + config.wx_pay_orders + " set " +
     "pay_status=2, wx_transaction_id='" + transationID + "', complete_time=now() where pay_id='" + payID + "'";
     console.log(sql);
     dbQuery(sql, cb);
   },

   "getOrderInfo" : function(orderId, cb) {
     var sql = "select * from " + config.user_order + " as o left join " + config.wx_pay_orders + " as p on o.pay_id=p.pay_id where order_id='" + orderId + "'";
     console.log("getUserOrders" + sql);
     dbQuery(sql, cb);
   },
   "addFanPiaoOrder" : function(fanPiaoOrder, cb) {
      var sql = "insert into " + config.fanpiao_order_tb + " set uid=" + fanPiaoOrder.uid +
        ", pay_id='" + fanPiaoOrder.payID + "', pay_amount=" + fanPiaoOrder.payAmount +
        ", buy_amount=" + fanPiaoOrder.buyAmount + ", create_time=now()";
      console.log("addFanPiaoOrder sql : " + sql);
      dbQuery(sql, cb);
   },
});
exports.jiFenDB = jiFenDB;
