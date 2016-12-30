var mysql_pool = require('./mysql_pool.js').pool;
var DBQuery = require('./mysql_pool.js').mysql_query;
var Config = require('./config_dev.js');
var async = require('async');

function orderArrayFromDBResult(result) {
  var orderArray = new Array();
  for(index in result) {
    var row = result[index];
    var order = new Array();
    order.push(row.orderid);
    order.push(row.lat);
    order.push(row.lng);
    order.push(row.addr);
    order.push(row.phone);
    order.push(row.user_name);
    order.push(row.current_status);
    order.push(row.last_op_user);
    order.push(row.ordertime);
    order.push(row.platform + "-" + row.order_index);
    order.push(row.price + " RMB");
    order.push(row.comment);
    orderArray.push(order);
  }
  console.log(JSON.stringify(orderArray));
  return orderArray;
}


var orderDB = new Object({
  "getTagInfo" : function(tag_id, cb) {
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select * from " + Config.market_tag_info + " where id=" + tag_id;
        console.log(sql);

        client.query(sql, function(err, results) {
          console.log(results.length);
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
  // cb(err, tagListInfo)
  "getMarketTagList" : function(cb) {
    var sql = "select n.sms_id,day_str, n.content, phone_num,sql_str,total_send,`success`,`blacklist`,`other_failed`, order_num from user_market.daily_new_user_sms as n left join user_market.sms_ret_by_id as m on n.sms_id=m.sms_id left join user_market.sms_result_to_order as r on n.sms_id=r.sms_id";
    console.log(sql);
    DBQuery(sql, cb);
  },
  // 拉取已经发了短信的用户
  "getTagUserAlreadyMarket" : function(tag_name, cb) {
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select t.uid, if(sms_time>0, sms_time, '未发送') as sms_time, ";
        sql += " left(last_order_time_before_market, 10) as last_order_time_before_market, phone, user_name,"
        sql += " order_num_after_market, "
        sql += " left(last_order_time_after_market, 10) as last_order_time_after_market from " + Config.market_user_info + " as t left join juzhu.juzhu_user_info as i on  t.uid=i.uid where tag_name='" + tag_name + "' and sms_send=true";
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

  "getTagUserInfo" : function(smsID, cb) {
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select i.store_id, order_num, accumulate_amount,i.user_name, i.user_addr as user_addr, m.phone, sms_cnt, left(last_order_time_before_sms, 19) as last_order_time_before_sms,sum(if(p.order_time is not null, 1, 0)) as num, max(order_time) as last_order_time_after_sms from user_market.sms_record as m left join juzhu.order_position  as p on m.phone=p.phone and  p.order_time>m.update_time left join juzhu.juzhu_user_info as i on m.phone=i.phone left join user_market.user_last_sms_time as l on m.phone=l.phone where sms_id='" + smsID + "' group by phone order by num desc,last_order_time_after_sms desc";
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
  // 拉取该标签下 还没有发营销短信的用户
  "getTagUserInfoNeedMarket" : function(tag_name, cb) {
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select t.uid, t.id, if(sms_time>0, sms_time, '未发送') as sms_time, ";
        sql += " left(last_order_time_before_market, 10) as last_order_time_before_market, phone, "
        sql += " order_num_after_market, "
        sql += " left(last_order_time_after_market, 10) as last_order_time_after_market from " + Config.market_user_info + " as t left join juzhu.juzhu_user_info as i on  t.uid=i.uid where tag_name='" + tag_name + "' and sms_send=false";
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
  "deleteSMS" : function(sms_id, cb) {
    var sql = "delete from " + Config.market_user_info + " where id=" + sms_id;
    DBQuery(sql, cb);
  },
  "setSmsPrefix" : function(content, cb) {
    var sql = "insert into juzhu.order_sms_config(sms_type, content) values(1, '" + content + "')";
    DBQuery(sql, cb);

  },
  "getSmsPrix" : function(cb) {
    var sql = "select * from juzhu.order_sms_config where sms_type=1 order by id desc limit 1";
    DBQuery(sql, cb);
  },
  "setSmsSufix" : function(content, cb) {
    var sql = "insert into juzhu.order_sms_config(sms_type, content) values(2, '" + content + "')";
    DBQuery(sql, cb);
  },

  "newSMSInfo" : function(smsInfo, cb) {
    var sql = "insert into " + Config.market_tag_info + " set tag_name='" + smsInfo.tag_name +
      "', create_time=now(), content='" + smsInfo.content + "', tag_desc='" + smsInfo.condition + "',tag_cond='" + smsInfo.condition + "'";
      DBQuery(sql, cb);
  },
  "getSmsSufix" : function(cb) {
    var sql = "select * from juzhu.order_sms_config where sms_type=2 order by id desc limit 5";
    DBQuery(sql, cb);
  },

  // cb(err, sql, ret)
  "filterUser" : function(filterCond, cb) {
    var sql = "select * from juzhu." + Config.user_info_tb + " where ";
    var condEmpty = true;
    if (filterCond.date_first > "") {
      sql += " first_order_time" + filterCond.date_first + "";
      condEmpty = false;
    }

    if (filterCond.date_last > "") {
      if (!condEmpty) {
        sql += " and ";
      }
      sql += " last_order_time" + filterCond.date_last;
      condEmpty = false;
    }
    if (filterCond.order_num > "") {
      if (!condEmpty) {
        sql += " and ";
      }
      sql += " order_num" + filterCond.order_num;
      condEmpty = false;
    }
    console.log(sql);
    DBQuery(sql, function(err, ret) {
      cb(err, sql, ret);
    })
  },
  "addPhoneToTag" : function(tagID, phone,  cb) {
  },
  "confirmSMSSend":function(sms_users, tag_name, cb) {
    sms_users.forEach(function(user) {
      mysql_pool.acquire(function (err, client) {
        if (!err) {
          var sql = "update " + Config.market_user_info + " set sms_send=true, sms_time=now()  where tag_name='" + tag_name + "' and uid=" + user.uid;
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
    });
  },
  "confirmCLSMSSend":function(sms_users, tag_name, msg_id,cb) {
    sms_users.forEach(function(user) {
      mysql_pool.acquire(function (err, client) {
        if (!err) {
          var sql = "update " + Config.market_user_info + " set sms_send=true, sms_time=now(),sms_msg_id='"+msg_id+"'  where tag_name='" + tag_name + "' and uid=" + user.uid;
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
    });
  },
  "updateSMSRecord":function(msgID, mobile, status, cb) {
    var sql = "update user_market.sms_record set sms_ret='" + status + "' where sms_id='" + msgID + "' and phone='" + mobile + "' limit 1";
    DBQuery(sql, cb);
  },
  "updateNoticeSMSRecord":function(msgID, mobile, status, cb) {
    var sql = "update user_market.notice_sms_record set sms_ret='" + status + "' where sms_id='" + msgID + "' and phone='" + mobile + "' limit 1";
    DBQuery(sql, cb);
  },

});
exports.orderDB = orderDB;
exports.marketDB = orderDB;
