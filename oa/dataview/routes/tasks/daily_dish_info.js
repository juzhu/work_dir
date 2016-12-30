// 计算用户的 配送费用
var mysql_pool = require('../mysql_pool.js').pool;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');
var marketDB = require('../db_market.js').marketDB;

var allPoster = ["xiaoluo","xulong", "xiaowang", "huangjiaming", "liuhong"]
var setDayStr = "2016-05-28";
setDayStr = "";

function trim(str)
{
       return str.replace(/(^\s*)|(\s*$)/g, "");
}

var dishMap = {
"重庆酸菜鱼":"酸菜鱼",
"重庆水煮鱼":"水煮鱼",
"清炒外婆菜":"外婆菜",
"【抢】麻婆豆腐":"麻婆豆腐",
"毛豆烧茄子":"毛豆茄子",
"豆鼓鱼":"清蒸豆鼓鱼",
"聚箸秘制香酥鸭":"聚箸秘制鸭",
"茶树菇炖老母鸡":"茶树菇炖鸡",
"聚箸秘制红烧肉":"红烧肉",
"聚箸香煎鲤鱼":"聚箸煎鱼",
"山城毛血旺" : "毛血旺",
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
  // 米饭
  if (pname.indexOf("米饭单") > -1) {
    return "米饭单人";
  }
  if (pname.indexOf("太安鱼") > -1) {
    return "聚箸川味太安鱼";
  }
  if (pname.indexOf("藤椒鸡") > -1) {
    return "藤椒鸡";
  }
  // 烧鸡公
  if (pname.indexOf("烧鸡公") > -1) {
    if (pname.indexOf("3斤鸡肉") > -1) {
      return "烧鸡公大份";
    } else {
      return "烧鸡公小份";
    }
  }
  // 鸭头
  if (pname.indexOf("香酥鸭头") > -1) {
    if (pname.indexOf("大") > -1) {
      return "香酥鸭头大份";
    } else {
      return "香酥鸭头小份";
    }
  }
  // 酸菜鱼
  if (pname.indexOf("酸菜鱼") >-1) {
    return "酸菜鱼";
  }
  console.log(pname + " before regexp");
  pname = pname.replace("【抢】", "");

  // 去除各种口味标签
  pname = pname.replace(/（.*/g, "");
  console.log(pname + " after regexp");

  pname = pname.replace(/\(.*\)/g, "");
  pname = pname.replace(/劲省.*/g, "");
  console.log(pname + " after regexp2");

  if (dishMap[pname] === undefined) {
    dishMap[pname] = pname;
    return pname;
  }
  return dishMap[pname]
}
function menuListToMenuArray(menuListStr) {
  var arrayRet = [];
  if (menuListStr.charAt(0) == ',') {
    menuListStr = menuListStr.substr(1);
  }
  if (menuListStr.charAt(menuListStr.length - 1) == ',') {
    menuListStr = menuListStr.substr(0, menuListStr.length - 1);
  }
  var splitLengthTest = menuListStr.split("x").length;
  var dishes = menuListStr.split(",");
  console.log("splitLengthTest: " + splitLengthTest + " dishes len:" + dishes.length + " dish: " + menuListStr);
  if (dishes.length != splitLengthTest -1) {
    dishes = menuListStr.split(' ');
  }
  dishes.forEach(function(dish) {
    dish = trim(dish);
    if (dish > " ") {
      var dishInfo = {};
      dishInfo['dishName'] = getDishName(dish.split("x")[0]);
      dishInfo['dishCnt'] = getDishName(dish.split("x")[1]);
      arrayRet.push(dishInfo);
    }
  });
  return arrayRet;
}

function getTodayStr() {
  console.log("start calculate in on loop")
  var today = new Date();
  var dayStr = today.getFullYear() + "-";
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
    if (day_num < 9) {
      dayStr += "0";
    }
    dayStr += day_num;
  }
  return dayStr;
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
      var sql = "select ifnull(max(last_order_index), 0) as max_id from dish_daily_info ";
      client.query(sql, function(err, results) {
        if (err) {
          cb(true, err);
        } else {
          cb(false, results[0].max_id);
        }
        mysql_pool.release(client);
      });
    } else {
      cb(true, "mysql error");
      mysql_pool.release(client);
    }
  });
}

function getOneOrderAfterID(id, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      var sql = "select *, left(p.order_time, 10) as date_str  from " + Config.order_info_tb + " as i left join juzhu.order_position as p on i.order_id=p.order_id where id>" + id + " order by id limit 1";

      client.query(sql, function(err, results) {
        if (err) {
          cb(true, err);
        } else {
          cb(false, results);
        }
        mysql_pool.release(client);
      });
    } else {
      cb(true, "mysql error");
      mysql_pool.release(client);
    }
  });
}

function addDishOrderInfo(dishName, dishCnt, orderID, cb) {
  var sql = "insert ignore into juzhu_statistic.dish_info set order_id='" + orderID + "', dish_name='" + dishName + "', dish_cnt=" + dishCnt;
  console.log(sql);
  QueryWithNoRet(sql, cb);
}

function processOrder() {
  getLastProcessedOrderID(function (err, max_id) {
    if (err) {
      console.log(max_id);
    } else {
      getOneOrderAfterID(max_id, function(err, orders) {
        if (err) {
          console.log(orders)
        } else if (orders.length == 0){
          console.log("no orders");
        } else {
          var order = orders[0];
          waitNum = 0;
          var menu_list = order.menu_list;
          console.log(menu_list);
          if (menu_list.charAt(0) == ',') {
            menu_list = menu_list.substr(1);
          }
          if (menu_list.charAt(menu_list.length - 1) == ',') {
            menu_list = menu_list.substr(0, menu_list.length - 1);
          }
          var splitLengthTest = menu_list.split("x").length;
          var dishes = menu_list.split(",");
          console.log("splitLengthTest: " + splitLengthTest + " dishes len:" + dishes.length + " dish: " + menu_list);
          if (dishes.length != splitLengthTest -1) {
            dishes = menu_list.split(' ');
          }

          console.log(menu_list + " from order: " + order.id);
          dishes.forEach(function(dish) {
            dish = trim(dish);
            if (dish > " ") {
              var dishName = getDishName(dish.split("x")[0]);
              var dishCnt = dish.split("x")[1];
              var sql = "insert into dish_daily_info set "
              + " date_str='" + order.date_str + "'"
              + ", dish_name='" + getDishName(dish.split("x")[0]) + "'"
              + ", store_name='" + order.store_name + "', num=" + dish.split("x")[1]  + ", last_order_index=" + order.id + " on duplicate key update num=num+" + dish.split("x")[1] + ", last_order_index=" + order.id;
              QueryWithNoRet(sql, function(err) {
                if (err) {
                  console.log(err);
                  exit();
                } else {
                  // 记录订单号
                  console.log(sql);
                  addDishOrderInfo(dishName, dishCnt,order.order_id, function(err) {
                    if (err) {
                      console.log("add juzhu_statistic.dish_info err " + err);
                    }
                  })
                }
              });
            }
          });
        }
        setTimeout(processOrder, 3000);
      });
    }
  });
}
console.log(menuListToMenuArray("酸菜鱼x1,水煮肉片x2"));
processOrder();

