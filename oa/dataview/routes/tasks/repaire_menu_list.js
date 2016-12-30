// 计算用户的 配送费用
var mysql_pool = require('../mysql_pool.js').pool;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');
var marketDB = require('../db_market.js').marketDB;

var allPoster = ["xiaoluo","xulong", "xiaowang", "huangjiaming", "liuhong"]
var setDayStr = "2016-05-28";
setDayStr = "";

var dishMap = {
"重庆酸菜鱼":"酸菜鱼",
"重庆水煮鱼":"水煮鱼",
"清炒外婆菜":"外婆菜",
"【抢】麻婆豆腐":"麻婆豆腐",
"毛豆烧茄子":"毛豆茄子",
}

function getDishName(pname) {
  if (pname.indexOf("两菜") != -1 && pname.indexOf("套餐") >= 0) {
    return "家常两菜套餐";
  }
  if (pname.indexOf("龙虾") >= 0) {
    if (pname.indexOf("蒜香") >= 0) {
      if (pname.indexOf("一斤") >= 0) {
        return "蒜香小龙虾-一斤"
      } else if (pname.indexOf("两斤") >= 0) {
        return "蒜香小龙虾-两斤"
      } else if (pname.indexOf("三斤") >= 0) {
        return "蒜香小龙虾-三斤"
      }
    } else if (pname.indexOf("香辣") >= 0){
      if (pname.indexOf("一斤") >= 0) {
        return "香辣小龙虾-一斤"
      } else if (pname.indexOf("两斤") >= 0) {
        return "香辣小龙虾-两斤"
      } else if (pname.indexOf("三斤") >= 0) {
        return "香辣小龙虾-两斤"
      }
    }
  }
  if (dishMap[pname] === undefined) {
    dishMap[pname] = pname;
    return pname;
  }
  return dishMap[pname]
}
function QueryWithNoRet(sql, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      client.query(sql, function(err, results) {
        if (err) {
          console.log(sql);
          cb(err);
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

function getLastProcessedOrderID(cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select * from order_info where id>=880 and order_platform='eleme' and id<1153 limit 100";
      client.query(sql, function(err, results) {
        if (!err) {
          results.forEach(function(item) {
            var menu_list = item.menu_list;
            menu_list = menu_list.replace(/(x[1-9])([^,]+?)/g, "$1,$2");
            var sql = "update order_info set menu_list='" + menu_list + "' where id=" + item.id;
            console.log(sql);
            QueryWithNoRet(sql, function(err) {
              console.log("QueryWithNoRet sql: " + sql + " ret: " + err);
            })
          });
        }
        mysql_pool.release(client);
      });
    } else {
      cb(true, "mysql error");
      mysql_pool.release(client);
    }
  });
}
getLastProcessedOrderID();

