// 计算用户的 配送费用
var mysql_pool = require('../mysql_pool.js').pool;
var mysql_escape = require('../mysql_pool.js').mysql_escape;
var Config = require('../config_dev.js');
var marketDB = require('../db_market.js').marketDB;

function trim(str)
{
       return str.replace(/(^\s*)|(\s*$)/g, "");
}
function  checkOneTimeDish(dishName) {
  return dishName.indexOf('餐具') >= 0;
}

var filterKeyWord = ["餐具", "米饭", "冬瓜茶", "雪碧", "可乐", "天地一号", "红牛", "青岛","百威", "加多宝", "百威", "花生", "王老吉"];
function filterDish(dishName) {
  var needFilter = false;
  filterKeyWord.forEach(function(keyWord) {
    if (dishName.indexOf(keyWord) >=0) {
      needFilter = true;
    }
  });
  return needFilter;
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
  if (pname.indexOf("荷香米饭单") > -1) {
    return "荷香米饭单人";
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
  // console.log(pname + " before regexp");

  // 去除各种口味标签
  pname = pname.replace(/（.*/g, "");
  // console.log(pname + " after regexp");

  pname = pname.replace(/\(.*\)/g, "");
  pname = pname.replace(/劲省.*/g, "");
  // console.log(pname + " after regexp2");

  if (dishMap[pname] === undefined) {
    dishMap[pname] = pname;
    return pname;
  }
  return dishMap[pname]
}

console.log(getDishName("重庆酸菜鱼"));

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
      var sql = "select ifnull(max(last_order_index), 0) as max_id from dish_cooking_tb ";
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
      var sql = "select *  from " + Config.order_info_tb + " as i left join order_position as p on i.order_id=p.order_id where id>" + id + " and p.order_id is not null order by id limit 1";
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
      cb(true, "mysql error");
      mysql_pool.release(client);
    }
  });
}

var lastProcessedId = 0;
function processOrder() {
  getLastProcessedOrderID(function (err, max_id) {
    if (err) {
      console.log(max_id);
    } else {
      if (max_id <= lastProcessedId) {
        max_id = lastProcessedId + 1;
      }
      getOneOrderAfterID(max_id, function(err, orders) {
        if (err) {
          console.log(orders)
        } else if (orders.length == 0){
          setTimeout(processOrder, 10000);
          console.log("no orders");
        } else {
          setTimeout(processOrder, 1000);
          lastProcessedId = max_id;
          var order = orders[0];
          var menu_list = order.menu_list;
          console.log(menu_list);
          if (menu_list.charAt(0) == ',') {
            menu_list = menu_list.substr(1);
          }
          if (menu_list.charAt(menu_list.length - 1) == ',') {
            menu_list = menu_list.substr(0, menu_list.length - 1);
          }
          var isOneTimeDish = checkOneTimeDish(menu_list);
          console.log("one time dish: " + isOneTimeDish);

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
              var dishNameOrig = dish.split("x")[0]; // 原始名字里面有口味需求的
              var dishName = getDishName(dish.split("x")[0]);
              if (filterDish(dishName)) {
                console.log(dishName + " no need assigh and cook");
                return;
              }
              var dishCnt = dish.split("x")[1];
              var sql = "insert into dish_cooking_tb set order_id='" + order.order_id + "',order_platform='"  + order.order_platform + "', order_index=" + order.order_index + ", dish_name='"  + dishName + "',dish_name_orig='" + dishNameOrig + "',cnt=" + dishCnt+ ", status=0, order_time='" + order.order_time+"', last_order_index=" + order.id + ", one_time_dish=" + isOneTimeDish;
              console.log(sql);
              QueryWithNoRet(sql, function(err) {
                if (err) {
                  console.log(err);
                  exit();
                } else {
                  console.log("add dish " + dishName + " to cooking table ok");
                }
              });
            }
          });
        }
      });
    }
  });
}

processOrder();

