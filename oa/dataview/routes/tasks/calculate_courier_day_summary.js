// 计算用户的 配送费用
var mysql_pool = require('../mysql_pool.js').pool;
var dbQuery = require('../mysql_pool.js').mysql_query;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');
var marketDB = require('../db_market.js').marketDB;

var allPoster = ["xulong", "xiaowang", "huangjiaming", "liuhong", "zhangqisheng", "xiaojiangye", "zhanghanhui", "leinengneng", "chentianjin", "wangnian"]
// var setDayStr = "2016-08-15";
var setDayStr = "2016-11-15";
var setDayStr = "";

function loadPostUser() {
  var sql = "select user_name from juzhu.juzhu_post_user where user_enable=1";
  dbQuery(sql, function(err, users) {
    if (!err) {
      allPoster = [];
      for (i in users) {
        allPoster.push(users[i].user_name);
      }
      console.log("postuser:" + allPoster);
    } else {
      console.log("loadPostUser error: " + err);
      setTimeout(loadPostUser, 1000 * 60 * 10);
    }
  })
}
loadPostUser();

function calculatePost() {
  console.log("start calculate in on loop")
  var today = new Date();
  dayStr = today.getFullYear() + "-";
  if (setDayStr > "") {
    dayStr = setDayStr;
  } else {

    var month_num = today.getMonth();
    if (month_num < 9) {
      dayStr += "0"
    }
    month_num += 1
    dayStr += month_num + "-";
    day_num = today.getDate();
    if (day_num <= 9) {
      dayStr += "0";
    }
    dayStr += day_num;
  }
  console.log(dayStr);

  allPoster.forEach(function(user) {
    var sql = "insert ignore into courier_day_summary(user_name, day_str) values('" + user +
      "', '" + dayStr + "')"
      mysql_pool.acquire(function (err, client) {
        if (!err) {
          client.query(sql, function(err, ret) {
            if (err) {
              console.log("sql: " + sql + " ret: " + err);
            }
            mysql_pool.release(client);
          });
        }
      });
  })

  allPoster.forEach(function(user) {
    var sql = "update courier_day_summary as su left join (select '" + dayStr + "' as day_str , post_user_name, count(*) as send_num, sum(price) as send_amount from order_post_tb as p left join order_info as i on i.order_id=p.order_id  where complete_time>'" + dayStr+ "' and complete_time<'" + dayStr + " 23:59:59' and no_post_count=0 group by post_user_name) as r on su.user_name=r.post_user_name and su.day_str=r.day_str set su.send_num=r.send_num,su.send_amount=r.send_amount where user_name='" + user + "' and su.day_str='" + dayStr + "'";
    console.log(sql);
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        client.query(sql, function(err, ret) {
          if (err) {
            console.log("sql: " + sql + " ret: " + err);
          } else {
            // console.log(sql + " ret: " + sql);
          }
          mysql_pool.release(client);
        });
      }
    });
  })

  // 初始化每天的记录
  allPoster.forEach(function(user) {
    var sql = "update courier_day_summary as su left join (select '" + dayStr + "' as day_str, recycle_user_name, count(*) as recycle_num from order_post_tb as p left join order_info as i on i.order_id=p.order_id  where recycle_complete_time>'" + dayStr+ "' and recycle_complete_time<'" + dayStr + " 23:59:59' group by recycle_user_name) as r on su.user_name=r.recycle_user_name and su.day_str=r.day_str set su.recycle_num=r.recycle_num where user_name='" + user + "' and su.day_str='" + dayStr + "'";
    mysql_pool.acquire(function (err, client) {
      if (!err) {
        client.query(sql, function(err, ret) {
          if (err) {
            console.log("sql: " + sql + " ret: " + err);
          }
          mysql_pool.release(client);
        });
      }
    });
  })
}

setInterval(calculatePost, 10000);
