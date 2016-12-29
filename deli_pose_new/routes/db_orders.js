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
  "getTodayOrder" : function(storeName, status, last_index, limit, cb) {
    var sql = "select *,p.order_id as order_id, ceil((unix_timestamp(now()) - unix_timestamp(p.order_time))/60)  as order_past_minute from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  left join " + Config.order_post_tb + " as t on p.order_id=t.order_id where  i.order_valid=1  and p.order_time>'2016-06-10'";
    sql += " and p.order_time>left(now(), 10) ";
    if (storeName!='all') {
      sql += " and store_name='" + storeName + "' "
    }

    if (last_index > 0) {
      sql += " and i.id>" + last_index;
    }
    if (limit == 0) {
      limit = 200;
    }
    sql += " limit " + limit;
    console.log(sql);
    DBQuery(sql, cb);
  },

  "getOrderByStatus" : function(storeName, status, last_index, limit, cb) {
    var sql = "select *,p.order_id as order_id, ceil((unix_timestamp(now()) - unix_timestamp(p.order_time))/60)  as order_past_minute from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  left join " + Config.order_post_tb + " as t on p.order_id=t.order_id where p.current_status=" + status + " and i.order_valid=1  and p.order_time>'2016-06-10'";
    if (storeName!='all') {
      sql += " and store_name='" + storeName + "' "
    }
    if (last_index > 0) {
      sql += " and i.id>" + last_index;
    }
    if (limit == 0) {
      limit = 100;
    }
    sql += " limit " + limit;
    console.log(sql);
    DBQuery(sql, cb);
  },
  "getSendingOrder" : function(postUser, last_index, limit, cb) {
    var sql = "select *,p.order_id as order_id, ceil((unix_timestamp(now()) - unix_timestamp(p.order_time))/60)  as order_past_minute from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  left join " + Config.order_post_tb + " as t on p.order_id=t.order_id where t.post_status=1 and i.order_valid=1  and p.order_time>'2016-06-10' and t.post_user_name='" + postUser + "'  and i.id>" + last_index;
    DBQuery(sql, cb);
  },
  "getRecyclingOrder" : function(postUser, last_index, limit, cb) {
    var sql = "select *,p.order_id as order_id, ceil((unix_timestamp(now()) - unix_timestamp(p.order_time))/60)  as order_past_minute from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  left join " + Config.order_post_tb + " as t on p.order_id=t.order_id where t.recycle_status=1 and i.order_valid=1  and p.order_time>'2016-06-10' and t.recycle_user_name='" + postUser + "'  and i.id>" + last_index;
    DBQuery(sql, cb);
  },

  "getOrderByPhone" : function(phone, start_index, cb) {
    console.log("getOrderByPhone start");
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select *, p.order_id as  orderid, p.order_platform as platform,p.order_time as ordertime from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  "
        sql += " where p.phone like '%" + phone + "%'";
        sql += " order by p.order_time desc";
        sql += " limit " + start_index + ", 100";

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

  "updateUserPostTb" : function(order_id, status, cb) {
    console.log("updateUserPostTb start");
    async.series([
      function(callback) {
        mysql_pool.acquire(function (err, client) {
          if (!err) {
            var sql = "update order_position set current_status = " + status + " where order_id = '" + order_id + "'";
            console.log(sql);

            client.query(sql, function(err, results) {
              if (err) {
                console.log("mysql error " + err);
              } else {
                console.log("mysql succ ");
              }
              mysql_pool.release(client);
            });
          } else {
            mysql_pool.release(client);
          }
        });
        callback(null, "one");
      },
      function(callback) {
        mysql_pool.acquire(function (err, client) {
          if (!err) {
            var where = "";
            var sql = "insert into order_post_tb(order_id, post_status) values ('" + order_id + "', 0) ON DUPLICATE KEY UPDATE ";
            if (status == 6) { // 无需配送 需要把配送人清空
              sql += " recycle_user_name='norecycle' "
            } else {
              sql += " order_id='" + order_id + "'";
            }

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
        callback(null, "two");
      }],
      function(err, results) {
        if( err ) {
          console.log("In async.series last err flow");
        } else {
          console.log("In async.series level1 success");
          console.log("******************************");
        }
      }
    );
  },
  "applyComment" : function(orderID, userName, comment, cb) {
      var cur_comment = "";
      var tm = "";
      var new_comment = "";
      var sql = "select comment, now() as tm from "  + Config.order_position_tb + " where order_id='" + orderID + "' and comment!=''";
      DBQuery(sql, function(err, comments) {
        if (!err && comments.length > 0) {
          cur_comment = comments[0].comment;

        }
        if (cur_comment != "") {
          var new_start = comment.indexOf(cur_comment);
          if (new_start >= 0) {
            new_comment = comment.substr(new_start + cur_comment.length);
          } else {
            new_comment = comment;
          }
          cur_comment = cur_comment + "\r\n";
        } else {
          new_comment = comment;
        }
        var comment_ret = cur_comment + new_comment  + " " + (new Date()).toLocaleString() + " " + userName;
        var sql = "update " + Config.order_position_tb + " set comment='" + comment_ret + "' ,last_op_user='" + userName + "'";
        sql += " where order_id='" + orderID + "'";
        console.log(sql);
        DBQuery(sql, function(err) {
          cb(err, comment_ret);
        });
      });
  },
  "setOrderCommentByUser" : function(order_id, username, comment, cb) {
    console.log("setOrderCommentByUser 1");
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "update " + Config.order_position_tb + " set comment='" + comment + "' ,last_op_user='" + username + "'";
        sql += " where order_id='" + order_id + "'";

        client.query(sql, function(err, results) {
          if (err) {
            cb(false, err);
          } else if (results.affectedRows == 0) {
            cb(false);
          } else {
            cb(true);
          }
        });
      } else {
        cb(false);
      }
      mysql_pool.release(client);
    });

  },
  "cancelOrder" : function(orderId, cb) {
    console.log("cancelOrder " + orderId);
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "update " + Config.order_info_tb + " set order_valid=false where order_id='" + orderId + "'";
        client.query(sql, function(err) {
          cb(err);
        });
      } else {
        cb(true);
      }
      mysql_pool.release(client);
    });
  },
  "setOrderPost":function(orderId, user, post_status, cb) {
    var complete_time = "complete_time";
    var accept_time = "now()";
    var cur_status = 1;
    if (post_status == 2) {
      accept_time = "accept_time";
      complete_time = "now()";
      cur_status = 2
    }
    if (post_status == 3) {
      cur_status = 2
      complete_time = "0";
      accept_time = 0;
    }
    var sql = "insert into order_post_tb(order_id, post_user_name, post_status, accept_time, complete_time) " +
      " values ('" + orderId + "', '" + user + "', " + post_status + ", " + accept_time + "," + complete_time + ") ON DUPLICATE KEY UPDATE post_user_name='" + user + "', accept_time=" + accept_time + ", complete_time=" +complete_time + ", post_status=" + post_status;
      DBQuery(sql, function(err) {
        if (!err) {
          var order_status = 1 +  post_status;
          if (post_status == 3) {
            order_status = 1;
          }
          var sql = "update order_position set current_status=" + order_status + ",last_op_user='" + user + "' where order_id='" + orderId + "' and current_status=" + cur_status;
          console.log("setOrderPost " + sql);
          DBQuery(sql, cb);
        } else {
          console.log(err);
          cb(err);
        }
      });
  },
  "setOrderNoRecycle" : function(orderId, user, cb) {
    var sql = "update " + Config.mysql_db + "." + Config.order_post_tb + " set recycle_status=2, recycle_complete_time=now(), recycle_user_name='norecycle' where order_id='" + orderId + "'";
    DBQuery(sql, function(err) {
      console.log(err);
      // 成功在做
      // 当前状态必须是等待回收
      var sql = "update order_position set current_status=6, last_op_user='" + user+ "'" + " where order_id='" + orderId + "' and current_status=3";
      DBQuery(sql, cb);
    });

  },
  "setOrderRecycle":function(orderId, user, recycle_status, cb) {
    var complete_time = "recycle_complete_time";
    var accept_time = "now()";
    var cur_status = 3;
    if (recycle_status == 2) {
      cur_status = 4;
      accept_time = "recycle_accept_time";
      complete_time = "now()";
    }
    if (recycle_status == 3) {
      cur_status = 4;
      accept_time = 0;
      complete_time = 0;
    }

    var sql = "update order_post_tb set recycle_user_name='" + user + "', recycle_accept_time=" + accept_time + ", recycle_complete_time=" + complete_time + ", recycle_status=" + recycle_status + " where order_id='" + orderId + "'";
    DBQuery(sql, function(err) {
      console.log(err);
      // 成功在做
      var order_status = 3 + recycle_status;
      if (recycle_status == 3) {
        order_status = 3;// 恢复到等待回收
      }
      var sql = "update order_position set current_status=" + order_status + ", last_op_user='" + user+ "'" + " where order_id='" + orderId + "'";
      console.log("setOrderRecycle " + sql);
      DBQuery(sql, cb);
    });
  },
  "setOrderVerify":function(orderId, user, verifyStatus, cb) {
    verifyStatus = parseInt(verifyStatus);
    var sql = "update order_post_tb set verify_user_name='" + user + "', verify_time=now(), verify_status=" + verifyStatus + " where order_id='" + orderId + "'";
    DBQuery(sql, function(err) {
      var sql = "update order_position set current_status=" +(6+verifyStatus) + ", last_op_user='" + user+ "'" + " where order_id='" + orderId + "'";
      DBQuery(sql, cb);
    });
  },

  "dishInfo":function(bdate, edate, cb) {
    var sql = "select * from dish_daily_info where date_str>='" + bdate + "' and date_str <='" + edate + "' order by date_str desc, num desc";
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        client.query(sql, function(err, results) {
          cb(err, results);
        });
      } else {
        cb(true);
      }
      mysql_pool.release(client);
    });
  },
  "getMaxDishID" : function(storeName, cb) {
    var sql = "select max(dish_id) as maxDishID from dish_cooking_tb as d left join order_position as p on d.order_id=p.order_id where p.store_name='" + storeName + "'";
    DBQuery(sql, function(err, ret) {
      if (err) {
        cb(err)
      } else {
        cb(false, ret[0]["maxDishID"]);
      }
    })
  },
  "transferOrder" : function(orderID, storeName, cb) {
    var sql = "update order_position set store_name='" + storeName + "' where order_id='" + orderID + "' limit 1";
    DBQuery(sql, cb);
  },
  "checkLastDish" : function(storeName, dishID, cb) {
    var sql = "select count(*) as newDishNum from dish_cooking_tb as d left join order_position as p on d.order_id=p.order_id  where d.dish_id>" + dishID + " and p.store_name='" + storeName + "'";
    DBQuery(sql, function(err, ret) {
      if (!err) {
        cb(false, ret[0].newDishNum);
      } else {
        cb(err);
      }
    });
  },
  "dishWaitAssign" : function(storeName, cb) {
    // var sql = "select dish_name, sum(cnt) as cnt, group_concat(concat(order_platform, '--', order_index) SEPARATOR '\\r\\n') as own_order, round((unix_timestamp(now()) - unix_timestamp(min(order_time))) / 60) as wait_minute from dish_cooking_tb where status=0 group by dish_name order by order_time"
    var sql = "select d.one_time_dish, d.dish_id, p.order_id, addr, if (dish_name=dish_name_orig, comment, concat(dish_name_orig, comment)) as comment, dish_name,cnt, concat(d.order_platform, '--', d.order_index) as own_order, round((unix_timestamp(now()) - unix_timestamp(d.order_time)) / 60) as wait_minute, assistent, cook from juzhu.dish_cooking_tb as d left join juzhu.order_position as p on d.order_id=p.order_id where p.store_name='" + storeName + "' and d.status=0 and d.order_time>left(now(), 10) order by wait_minute desc "
    DBQuery(sql, cb);
  },
  "dishWaitFinish" : function(storeName, cb) {
    var sql = "select d.status, p.order_id, addr, if (dish_name=dish_name_orig, comment, concat(dish_name_orig, comment)) as comment, dish_name,cnt, concat(d.order_platform, '--', d.order_index) as own_order, round((unix_timestamp(now()) - unix_timestamp(d.order_time)) / 60) as wait_minute, assistent, cook from juzhu.dish_cooking_tb as d left join juzhu.order_position as p on d.order_id=p.order_id where p.store_name='" + storeName + "' and d.status=1 and d.order_time>left(now(), 10) order by wait_minute desc "
    // var sql = "select d.status, p.order_id, dish_name,cnt, concat(p.order_platform, '--', p.order_index) as own_order, round((unix_timestamp(now()) - unix_timestamp(order_time)) / 60) as wait_minute, assistent, cook from juzhu.dish_cooking_tb  as d left join juzhu.order_position as p on d.order_id=p.order_id where p.store_name='" + storeName + "' and  (d.status=1) and p.order_time>left(now(), 10) order by wait_minute desc "
    DBQuery(sql, cb);

  },
  "assignDish" : function(orderID, dishName, assistent, cook, cb) {
    var sql = "update dish_cooking_tb set status=1, assistent='" + assistent + "', cook='" + cook + "', assign_time=now() where order_id='" + orderID + "' and dish_name='" + dishName + "'";
    DBQuery(sql, cb);
  },
  "finishDish" : function(orderID, dishName, asstent, cook, cb) {
    // 配菜人这个接口先不修改
    var sql = "update dish_cooking_tb set status=2, finish_time=now() where order_id='" + orderID + "' and dish_name='" + dishName + "'";
    DBQuery(sql, cb);
  },
  "orderProgressInfo" : function(storeName, cb) {
    var sql = "select addr,menu_list, p.order_id, concat(c.order_platform, '-', c.order_index) as own_order, ifnull(group_concat(if((c.status=0 or c.status=1),concat(dish_name, 'X', cnt), null) SEPARATOR '\\r\\n'), '') as waiting_dishes, group_concat(if(c.status=2,concat(dish_name, 'X', cnt), null) SEPARATOR ' ') as finish_dishes, max(round((unix_timestamp(now()) - unix_timestamp(c.order_time)) / 60)) as wait_minute from dish_cooking_tb as c left join order_position as p on c.order_id=p.order_id left join order_info as i on p.order_id=i.order_id where p.store_name='" + storeName + "' and c.order_time >left(now(), 10)  and c.status<3 group by own_order order by wait_minute desc";
    DBQuery(sql, cb);
  },
  "expressOrder":function(orderID, cb) {
    var sql = "update dish_cooking_tb set status=3 where order_id='" + orderID + "' and status=2";
    DBQuery(sql, cb);
  },
  "getTableWearInfo":function(storeName, dayStr, cb) {
    var sql = "select concat(p.order_platform, '--',p.order_index) as odi, p.order_id, p.order_time, left(p.addr, 10) as addr, i.menu_list, p.comment, sum(d.caiwan) as caiwan, sum(d.fanwan) as fanwan, sum(d.shaozi) as shaozi, d.onetime_tablewear from juzhu.order_position as p left join juzhu.order_info as i  on p.order_id=i.order_id left join juzhu.order_tablewear_info as d on p.order_id=d.order_id where  order_valid=1 and p.store_name='" + storeName + "'";
    if (dayStr == "") {
      sql += " and p.order_time>left(now(), 10) "
    } else {
      sql += " and p.order_time like '" + dayStr + "%' ";
    }
    sql += " group by d.order_id order by p.order_time";
    DBQuery(sql, cb);
  },
  "updateTableWear" : function(orderID, type, num, cb) {
    var sql = "update juzhu.order_tablewear_info set " + type + "=" + num + " where order_id='" + orderID
  },
  "updateOrderRecharge" : function(orderID, amount, cb) {
    var sql = "update juzhu.order_info set order_recharge=" + amount + " where order_id='" + orderID + "' and order_recharge_status=0";
    DBQuery(sql, function(err, data) {
      console.log(data);
      cb(err);
    })
  },
  "updateOrderRechargeComplete" : function(orderID, cb) {
    var sql = "update juzhu.order_info set order_recharge_status=1 where order_id='" + orderID + "'";
    DBQuery(sql, cb);
  },
  "getUserHistOrder" : function(phone, startIndex, cb) {
    var sql = "select * from order_position where phone='" + phone +"' order by order_time desc limit " + startIndex + ", 20";
    console.log(sql);
    DBQuery(sql ,cb);
  },
  "updateUserGps" : function(userName, lat, lng, cb) {
    var sql = 'insert into juzhu.user_gps_info set user_name="' + userName + '", lat=' + lat + ", lng=" + lng + ", tm=now()";
    DBQuery(sql, cb);
  },
  "postUserAchievement" : function(sql, cb) {
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        //console.log(sql);
        client.query(sql, function(err, results) {
          cb(err, results);
        });
      } else {
        cb(true);
      }
      mysql_pool.release(client);
    });
  },
  "getPosterTodayOrderHistory": function(userName, type, cb) {
    var sql = "select p.* from juzhu.order_post_tb as o left join juzhu.order_position as p on o.order_id=p.order_id where ";
    if (type == "post") {
      sql += " post_user_name='" + userName + "' and complete_time>left(now(), 10) and post_status=2";
    } else {
      sql += " recycle_user_name='" + userName + "' and recycle_complete_time > left(now(), 10) and recycle_status=2";
    }
    console.log(sql);
    DBQuery(sql ,cb);
  },
  "getPosterMonthOrderHistory":function(userName, type, monthStr, cb) {
    var sql = "select p.* from juzhu.order_post_tb as o left join juzhu.order_position as p on o.order_id=p.order_id where ";
    if (type == "post") {
      sql += " post_user_name='" + userName + "' and complete_time like '" + monthStr + "%'";
    } else {
      sql += " recycle_user_name='" + userName + "' and recycle_complete_time like '" + monthStr + "%'";
    }
    DBQuery(sql ,cb);
  },

});
exports.orderDB = orderDB;
