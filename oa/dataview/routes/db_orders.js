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
  "getOrderByStatus" : function(storeName, status, cb) {
    var sql = "select *,p.order_id as order_id, ceil((unix_timestamp(now()) - unix_timestamp(p.order_time))/60)  as order_past_minute from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  left join " + Config.order_post_tb + " as t on p.order_id=t.order_id where p.store_name='" + storeName + "' and p.current_status=" + status + " and i.order_valid=1  and p.order_time>'2016-06-10' limit 100";
    DBQuery(sql, cb);
  },
"searchOrder" : function(storeName, keyWord, cb) {
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select *, p.order_id as order_id, p.comment as comment, if(order_num=1 ,1, 0) as newcommer, p.order_id as  orderid, p.order_platform as platform,p.order_time as ordertime , if(store_name=source_store, '', source_store) as is_transfer,ceil((unix_timestamp(now()) - unix_timestamp(p.order_time))/60)  as order_past_minute from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  left join " + Config.order_post_tb + " as t on p.order_id=t.order_id";
        sql += " left join " + Config.user_info_tb + " as u on u.phone=p.phone "

        if (storeName != "all" ) {
          sql += " where p.store_name='" + storeName + "' and ";
        } else {
          sql += " where ";
        }
        sql += " p.addr like '%" + keyWord + "%' or ";
        sql += " p.phone like '%" + keyWord + "%' ";
        sql += " order by p.order_time desc";
        //sql += " limit 0, 100";
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

  "getOrderWaitAssign" : function(storeName, cb) {
    var sql = "select *,p.order_platform as platform from juzhu.order_wait_assign as w left join juzhu.order_info as i on w.order_id=i.order_id left join order_position as p on p.order_id=i.order_id where p.store_name='" + storeName  + "'";
    DBQuery(sql , cb);
  },
  "getOrderByPlatform" : function(storeName, platform, bdate, edate, cb) {
    console.log("getOrderByPlatform start");
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select *,t.no_post_count, p.order_id as order_id, p.comment as comment, if(order_num=1 ,1, 0) as newcommer, p.order_id as  orderid, p.order_platform as platform,p.order_time as ordertime , if(store_name=source_store, '', source_store) as is_transfer,ceil((unix_timestamp(now()) - unix_timestamp(p.order_time))/60)  as order_past_minute from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  left join " + Config.order_post_tb + " as t on p.order_id=t.order_id";
        sql += " left join " + Config.user_info_tb + " as u on u.phone=p.phone "
        if (platform != "all" ) {
          sql += " where p.order_platform='" + platform + "' and ";
        } else {
          sql += " where ";
        }
        sql += " store_name='" + storeName + "' and "
        if( bdate < edate ) {
          sql += " p.order_time >= '" + bdate + "' and p.order_time <= '" + edate + " 59:59:59' ";
        } else { //bdate == edate, bdate > edate
          sql += " p.order_time like '" + bdate + "%' ";
        }
        sql += " order by p.order_time desc";
        //sql += " limit 0, 100";
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
  "getIncomeByOrder2": function(storeName, bdate, edate, cb) {
    console.log("getIncomeByOrder2 start");
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select source_store, p.order_platform as platform, sum(price) as price, count(*) as cnt from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  ";
        if( bdate < edate ) {
          sql += " where p.order_time >= '" + bdate + "' and p.order_time <= '" + edate + " 59:59:59' ";
        } else { //bdate == edate, bdate > edate
          sql += " where p.order_time like '" + bdate + "%' ";
        }
        sql += " and order_valid=true and source_store='" + storeName + "' group by source_store, platform order by source_store";
        console.log(sql);
        var ret_data = new Array();

        client.query(sql, function(err, results) {
          if (err) {
            cb(true, err);
            console.log("mysql error " + err);
          } else {
            //console.log(results);
            var all_cnt = results.length;
            var all_price = 0;

            for(index in results) {
              var row = results[index];
              row['bdate'] = bdate;
              row['edate'] = edate;
              all_price += row['price'];
              ret_data.push(row);
            }
            console.log("income_sumary: ret_data");
            console.log(ret_data);
            cb(false, ret_data);
          }
          mysql_pool.release(client);
        });
      } else {
        cb(false);
        mysql_pool.release(client);
      }
    });
  },



  "getIncomeByOrder": function(bdate, edate, cb) {
    console.log("getIncomeByOrder start");
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select *, p.order_id as  orderid, p.order_platform as platform,p.order_time as ordertime from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  ";
        if( bdate < edate ) {
          sql += " where p.order_time >= '" + bdate + "' and p.order_time <= '" + edate + " 59:59:59' ";
        } else { //bdate == edate, bdate > edate
          sql += " where p.order_time like '" + bdate + "%' ";
        }
        sql += " and order_valid=true order by p.order_time desc";
        console.log(sql);

        client.query(sql, function(err, results) {
          if (err) {
            cb(true, err);
            console.log("mysql error " + err);
          } else if (results.length == 0) {
            var pf_income_map = {};
            pf_income_map["all"] = {
              "price": 0,
              "platform": "all",
              "cnt": 0,
              "bdate": bdate,
              "edate": edate
            };
            var ret_data = new Array();
            for (var key in pf_income_map) {
              var tmp_arr = new Array();
              tmp_arr["platform"] = pf_income_map[key]["platform"];
              tmp_arr["cnt"] = pf_income_map[key]["cnt"];
              tmp_arr["price"] = pf_income_map[key]["price"];
              ret_data.push(tmp_arr);
            }
            cb(false, ret_data);

          } else {
            //console.log(results);
            var pf_income_map = {};
            var all_cnt = results.length;
            var all_price = 0;

            var orderArray = new Array();
            for(index in results) {
              var row = results[index];
              var pt = row['platform'];
              var price = row['price'];
              all_price += price;

              if( pt in pf_income_map ) {
                var tmp_price = pf_income_map[pt]["price"] + price;
                var tmp_cnt = pf_income_map[pt]["cnt"] + 1;

                pf_income_map[pt]["price"] = tmp_price;
                pf_income_map[pt]["cnt"] = tmp_cnt;
              } else {
                pf_income_map[pt] = {
                  "price": price,
                  "platform": pt,
                  "cnt": 1,
                  "bdate": bdate,
                  "edate": edate
                }
              }
            }
            pf_income_map["all"] = {
              "price": all_price,
              "platform": "all",
              "cnt": all_cnt,
              "bdate": bdate,
              "edate": edate
            };

            var cur_index = 0;
            var ret_data = new Array();
            for (var key in pf_income_map) {
              var tmp_arr = new Array();
              tmp_arr["platform"] = pf_income_map[key]["platform"];
              tmp_arr["cnt"] = pf_income_map[key]["cnt"];
              tmp_arr["price"] = pf_income_map[key]["price"];
              tmp_arr["bdate"] = pf_income_map[key]["bdate"];
              tmp_arr["edate"] = pf_income_map[key]["edate"];
              ret_data.push(tmp_arr);
            }
            console.log("income_sumary: ret_data");
            console.log(ret_data);
            cb(false, ret_data);
          }
          mysql_pool.release(client);
        });
      } else {
        cb(false);
        mysql_pool.release(client);
      }
    });
  },

  "getOrderByPhone" : function(phone, start_index, cb) {
    console.log("getOrderByPhone start");
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "select *, p.order_id as  orderid, p.order_platform as platform,p.order_time as ordertime from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  "
        sql += " where p.phone like '%" + phone + "%'";
        sql += " order by p.order_time desc";
        sql += " limit " + start_index + ", 100";
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
  "setOrderCommentByUser" : function(order_id, username, comment, cb) {
    console.log("setOrderCommentByUser 1");
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        var sql = "update " + Config.order_position_tb + " set comment='" + comment + "' ,last_op_user='" + username + "'";
        sql += " where order_id='" + order_id + "'";
        console.log(sql);

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
        console.log(sql);
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
    if (post_status == 2) {
      accept_time = "accept_time";
      complete_time = "now()";
    }
    var sql = "insert into order_post_tb(order_id, post_user_name, post_status, accept_time, complete_time) " +
      " values ('" + orderId + "', '" + user + "', " + post_status + ", " + accept_time + "," + complete_time + ") ON DUPLICATE KEY UPDATE post_user_name='" + user + "', accept_time=" + accept_time + ", complete_time=" +complete_time + ", post_status=" + post_status;
      DBQuery(sql, function(err) {
        var sql = "update order_position set current_status=" + (1+post_status) + ",last_op_user='" + user + "' where order_id='" + orderId + "'";
        console.log("setOrderPost " + sql);
        DBQuery(sql, cb);
      });
  },
  "setOrderRecycle":function(orderId, user, recycle_status, cb) {
    var complete_time = "recycle_complete_time";
    var accept_time = "now()";
    if (recycle_status == 2) {
      accept_time = "recycle_accept_time";
      complete_time = "now()";
    }
    var sql = "update order_post_tb set recycle_user_name='" + user + "', recycle_accept_time=" + accept_time + ", recyle_complete_time=" + complete_time + ", recycle_status=" + recycle_status + " where order_id='" + orderId + "'";
    DBQuery(sql, function(err) {
      var sql = "update order_position set current_status=" +(3+recycle_status) + ", last_op_user='" + user+ "'" + " where order_id='" + orderId + "'";
      console.log("setOrderRecycle " + sql);
      DBQuery(sql, cb);
    });
  },
  "setOrderVerify":function(orderId, user, verifyStatus, cb) {
    verifyStatus = parseInt(verifyStatus);
    var sql = "update order_post_tb set verify_user_name='" + user + "', verify_time=now(), verify_status=" + verifyStatus + " where order_id='" + orderId + "'";
    DBQuery(sql, function(err) {
      if (err) {
        console.log(sql + " error : " + err);
      }
      var sql = "update order_position set current_status=" +(6+verifyStatus) + ", last_op_user='" + user+ "'" + " where order_id='" + orderId + "'";
      console.log("setOrderVerify" + sql);
      DBQuery(sql, cb);
    });
  },
  "setOrderRecycleMiss" : function(orderMissInfo, user, cb) {
    var verifyStatus = 1;
    if (orderMissInfo.caiwan > 0 || orderMissInfo.fanwan>0 || orderMissInfo.shaozi>0) {
      verifyStatus = 2;
    }
    var sql = "update order_post_tb set verify_user_name='" + user + "', verify_time=now(), verify_status=" + verifyStatus;
    if (verifyStatus == 2) {
      sql += ", fanwan_miss=" + orderMissInfo.fanwan + ", caiwan_miss=" + orderMissInfo.caiwan + ", shaozi_miss=" + orderMissInfo.shaozi;
    }
    sql += " where order_id='" + orderMissInfo.order_id + "'";
    DBQuery(sql, function(err) {
      if (err) {
        console.log(sql + " error : " + err);
      }
      // 7 验收通过  8 餐具缺失
      var sql = "update order_position set current_status=" +(6+verifyStatus) + ", last_op_user='" + user+ "'" + " where order_id='" + orderMissInfo.order_id + "'";
      console.log("setOrderRecycleMiss" + sql);
      DBQuery(sql, cb);
    })
  },

  "dishInfo":function(storeName, bdate, edate, cb) {
    var sql = "select date_str, dish_name, sum(num) as num from dish_daily_info where date_str>='" + bdate + "' and date_str <='" + edate + "' ";
    if (storeName != 'all') {
      sql += " and store_name='" + storeName + "'";
    }
    sql += " and (dish_name not like '%米饭%'";
    sql += " and dish_name not like '%餐具%'";
    sql += " and dish_name not like '%百事可乐%'";
    sql += " and dish_name not like '%雪碧%'";
    sql += " and dish_name not like '%天地一号%'";
    sql += " and dish_name not like '%花生米%'";
    sql += " and dish_name not like '%冬瓜茶%'";
    sql += " and dish_name not like '%青岛啤酒%'";
    sql += " and dish_name not like '%加多宝%'";
    sql += " and dish_name not like '%王老吉%'";
    sql += ") group by date_str,dish_name order by date_str desc, num desc";
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        console.log(sql);
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
    sql = "select max(dish_id) as maxDishID from dish_cooking_tb as d left join order_position as p on d.order_id=p.order_id where p.store_name='" + storeName + "'";
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
    sql = "select count(*) as newDishNum from dish_cooking_tb as d left join order_position as p on d.order_id=p.order_id  where d.dish_id>" + dishID + " and p.store_name='" + storeName + "'";
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
    var sql = "select i.cook_order, p.order_id, p.split_index, d.one_time_dish, d.dish_id, p.order_id, addr, if (dish_name=dish_name_orig, comment, concat(dish_name_orig, comment)) as comment, dish_name,cnt, concat(d.order_platform, '--', d.order_index) as own_order, round((unix_timestamp(now()) - unix_timestamp(d.order_time)) / 60) as wait_minute, assistent, cook from juzhu.dish_cooking_tb as d left join juzhu.order_position as p on d.order_id=p.order_id left join juzhu.order_info as i on p.order_id=i.order_id where p.store_name='" + storeName + "' and d.status=0 and d.order_time>left(now(), 10) order by wait_minute desc "
    DBQuery(sql, cb);
  },
  "dishWaitFinish" : function(storeName, cb) {
    var sql = "select d.status, p.order_id, addr, if (dish_name=dish_name_orig, comment, concat(dish_name_orig, comment)) as comment, dish_name,cnt, concat(d.order_platform, '--', d.order_index) as own_order, round((unix_timestamp(now()) - unix_timestamp(d.order_time)) / 60) as wait_minute, assistent, cook from juzhu.dish_cooking_tb as d left join juzhu.order_position as p on d.order_id=p.order_id where p.store_name='" + storeName + "' and d.status=1 and d.order_time>left(now(), 10) order by wait_minute desc "
    // var sql = "select d.status, p.order_id, dish_name,cnt, concat(p.order_platform, '--', p.order_index) as own_order, round((unix_timestamp(now()) - unix_timestamp(order_time)) / 60) as wait_minute, assistent, cook from juzhu.dish_cooking_tb  as d left join juzhu.order_position as p on d.order_id=p.order_id where p.store_name='" + storeName + "' and  (d.status=1) and p.order_time>left(now(), 10) order by wait_minute desc "
    DBQuery(sql, cb);

  },
  "assignDish" : function(orderID, dishName, assistent, cook, cb) {
    sql = "update dish_cooking_tb set status=1, assistent='" + assistent + "', cook='" + cook + "', assign_time=now() where order_id='" + orderID + "' and dish_name='" + dishName + "'";
    DBQuery(sql, cb);
  },
  "finishDish" : function(orderID, dishName, asstent, cook, cb) {
    // 配菜人这个接口先不修改
    sql = "update dish_cooking_tb set status=2, finish_time=now() where order_id='" + orderID + "' and dish_name='" + dishName + "'";
    DBQuery(sql, cb);
  },
  "getOneOrderProgress" : function(orderID, cb) {
    var sql = "select addr,menu_list, p.order_id, concat(c.order_platform, '-', c.order_index) as own_order, ifnull(group_concat(if((c.status=0 or c.status=1),concat(dish_name, 'X', cnt), null)), '') as waiting_dishes, group_concat(if(c.status=2,concat(dish_name, 'X', cnt), null)) as finish_dishes, max(round((unix_timestamp(now()) - unix_timestamp(c.order_time)) / 60)) as wait_minute from dish_cooking_tb as c left join order_position as p on c.order_id=p.order_id left join order_info as i on p.order_id=i.order_id where p.order_id='" + orderID +"' group by own_order order by wait_minute desc";
    DBQuery(sql, cb);
  },

  "orderProgressInfo" : function(storeName, cb) {
    var sql = "select addr,menu_list, p.order_id, concat(c.order_platform, '-', c.order_index) as own_order, ifnull(group_concat(if((c.status=0 or c.status=1),concat(dish_name, 'X', cnt), null) SEPARATOR '\\r\\n'), '') as waiting_dishes, ifnull(group_concat(if(c.status=2,concat(dish_name, 'X', cnt), null) SEPARATOR ' '), '') as finish_dishes, max(round((unix_timestamp(now()) - unix_timestamp(c.order_time)) / 60)) as wait_minute from dish_cooking_tb as c left join order_position as p on c.order_id=p.order_id left join order_info as i on p.order_id=i.order_id where p.store_name='" + storeName + "' and c.order_time >left(now(), 10)  and c.status<3 group by own_order order by wait_minute desc";
    DBQuery(sql, cb);
  },
  "expressOrder":function(orderID, cb) {
    var sql = "update dish_cooking_tb set status=3 where order_id='" + orderID + "' and status=2";
    DBQuery(sql, cb);
  },
  "getOrderRechargeInfo":function(storeName, dayStr, cb) {
    var sql = "select *, p.order_id as order_id, p.comment as comment, if(order_num=1 ,1, 0) as newcommer, p.order_id as  orderid, p.order_platform as platform,p.order_time as ordertime , if(store_name=source_store, '', source_store) as is_transfer,ceil((unix_timestamp(now()) - unix_timestamp(p.order_time))/60)  as order_past_minute from " + Config.order_position_tb + " as p left join " + Config.order_info_tb + " as i on p.order_id=i.order_id  left join " + Config.order_post_tb + " as t on p.order_id=t.order_id left join " + Config.user_info_tb + " as u on u.phone=p.phone where i.order_recharge>0 "
    if (dayStr == "") {
      // 不加时间 所有都显示
      // sql += " and p.order_time>left(now(), 10) "
    } else {
      sql += " and p.order_time like '" + dayStr + "%' ";
    }
    DBQuery(sql, cb);
  },
  "getTableWearInfo":function(storeName, dayStr, dayEndStr, cb) {
    var sql = "select if (source_store=store_name, false, true) as is_transfer, p.current_status, post_user_name, recycle_user_name, concat(p.order_platform, '--',p.order_index) as odi, p.order_id, p.order_time, left(p.addr, 10) as addr, i.menu_list, p.comment, sum(d.caiwan) as caiwan, sum(d.fanwan) as fanwan, sum(d.shaozi) as shaozi, d.onetime_tablewear from juzhu.order_position as p left join juzhu.order_info as i  on p.order_id=i.order_id left join juzhu.order_tablewear_info as d on p.order_id=d.order_id left join order_post_tb as po on p.order_id=po.order_id where  order_valid=1 and p.store_name='" + storeName + "'";
    if (dayStr == "") {
      sql += " and p.order_time>left(now(), 10) "
    } else if(dayEndStr == ""){
      sql += " and p.order_time like '" + dayStr + "%' ";
    } else {
      sql += " and p.order_time > '" + dayStr + "' and p.order_time<'" + dayEndStr + "' ";
    }
    sql += " group by d.order_id order by p.order_time";
    DBQuery(sql, cb);
  },
  "updateTableWear" : function(orderID, type, num, cb) {
    sql = "update juzhu.order_tablewear_info set " + type + "=" + num + " where order_id='" + orderID
  },
  "updateOrderRecharge" : function(orderID, amount, cb) {
    sql = "update juzhu.order_info set order_recharge=" + amount + " where order_id='" + orderID + "' and order_recharge_status=0";
    console.log(sql);
    DBQuery(sql, function(err, data) {
      console.log(data);
      cb(err);
    })
  },
  "updateOrderRechargeComplete" : function(orderID, cb) {
    sql = "update juzhu.order_info set order_recharge_status=1 where order_id='" + orderID + "'";
    console.log(sql);
    DBQuery(sql, cb);
  },
  "updateOrderSplitIndex" : function(orderID, index, cb) {
    var sql = "update juzhu.order_position set split_index='" + index + "' where order_id='" + orderID + "'";
    console.log(sql);
    DBQuery(sql ,cb);
  },

  "updateOrderGPS" : function(orderID, lat, lng, cb) {
    sql = "update juzhu.order_position set lat=" + lat + ", lng=" + lng + " where order_id='" + orderID + "'";
    DBQuery(sql, function(err) {
      if (!err) {
        var sql = "insert into user_addr_gps select phone, addr, lat, lng from order_position where order_id='" + orderID +"' on duplicate key update user_addr_gps.lat=order_position.lat , user_addr_gps.lng=order_position.lng;";
        DBQuery(sql, cb);
      }
    });
  },
  "getOrderAfterOrderID" : function(storeName, orderID, cb) {
    var sql = "select p.order_platform, p.order_index, p.lat, p.lng,p.order_id, ceil((unix_timestamp(now()) - unix_timestamp(p.order_time))/60)  as order_past_minute, addr, current_status, post_user_name, recycle_user_name from juzhu.order_position as p left join juzhu.order_post_tb as po on p.order_id=po.order_id where p.order_time>(select order_time from juzhu.order_position where order_id='" + orderID + "') and store_name='" + storeName + "'";
    DBQuery(sql ,cb);
  },
  "getPosterLatestGPS" : function(cb) {
    var sql = "select * from juzhu.user_gps_info where id in (select max(id) from juzhu.user_gps_info group by user_name)";
    DBQuery(sql, cb);
  },
  "getOrderSplitIndx" : function(orderID, cb) {
    var sql = "select split_index from order_position where order_id='" + orderID + "'";
    DBQuery(sql, cb);
  },
  "orderNoPostCount" : function(orderID, noPostCount, cb) {
    var sql = "update juzhu.order_post_tb set no_post_count=" + noPostCount + " where order_id='" + orderID + "'";
    console.log(sql);
    DBQuery(sql, cb);
  },
  "setOrderPri" : function(orderPriArray, cb) {
    if (orderPriArray.length != 2) {
      cb("orderPriArray length error");
    } else {
      sql = "update juzhu.order_info set cook_order=" + orderPriArray[0].newPri + " where order_id='" + orderPriArray[0].orderID + "'";
      DBQuery(sql, function(err) {
        if (err) {
          cb(err);
        } else {
          sql = "update juzhu.order_info set cook_order=" + orderPriArray[1].newPri + " where order_id='" + orderPriArray[1].orderID + "'";
          DBQuery(sql, cb);
        }
      });
    }
  },
});

exports.orderDB = orderDB;
