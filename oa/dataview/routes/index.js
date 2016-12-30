var bodyParser    = require('body-parser');
var orderDB = require("./db_orders.js").orderDB
var marketDB = require("./db_market.js").marketDB
var userDB = require("./db_user.js").orderDB
var OrderLogger = require('./order_log.js').OrderLogger;
var juzhuMQPro = require('../../../juzhu_mq_pro/js_comm/juzhu_mq_comm.js');
var PostmanUser = require('./post_user.js');
var ticketManager = require("./session_manager.js").ticketManager;
var errorCode = require("../errcode.js");
var oaLog = require("./oa_log.js").logOP;
var regionInfo = require("./region_info.js").regionInfo;
var priManager = require("./pri_manager").priManager;
var storeGps = {
  "前进店" : [22.605990,113.863893],
  "坪洲店" : [22.566597,113.870534],
};

var postInfo = {
  "前进店":[
    {"user_name":"xiaowang"},
    {"user_name":"zhangqisheng"},
    {"user_name":"zhanghanhui"},
    {"user_name":"xiaojiangye"},
  ],
  "坪洲店" : [
    {"user_name":"xulong"},
    {"user_name":"chentianjin"},
    {"user_name":"leinengneng"},
    {"user_name":"huangjiaming"},
    {"user_name":"wangnian"},
    {"user_name":"xiaobing"},
  ]};

var cookInfo = {"坪洲店" : [
  {"name":"唐庶峰", "value":"唐庶峰"},
  {"name":"赵宗云", "value":"赵宗云"},
  {"name":"陈卫东", "value":"陈卫东"},
  {"name":"无序烹饪", "value":"无需烹饪"},
],
"前进店" : [
  {"name":"张平", "value":"张平"},
  {"name":"鲜师傅","value":"鲜师傅"},
  {"name":"无序烹饪", "value":"无需烹饪"},
]}

var assistentInfo = {"坪洲店": [
  {"name":"温展聪", "value":"温展聪"},
  {"name":"黄新春", "value":"黄新春"},
  {"name":"无需配菜", "value":"无需配菜"},
],
"前进店": [
  {"name":"李琳珂", "value":"李琳珂"},
  {"name":"张平", "value":"张平"},
  {"name":"无需配菜", "value":"无需配菜"},
]}

function getStoreName(req) {
  var storeName = req.session.storeName;
  // TODO session 没有尝试cookie
  if (storeName === undefined) {
    storeName = '前进店';
  }
  return storeName;
}

function validateSession(req, res) {
  var sessionOK = false;
  var ret = {error:true, msg:'登录后再操作'};
  if (req.session.userName && req.session.ticketID) {
    sessionOK = ticketManager.checkTicket(req.session.userName, req.session.ticketID)
  }
  if (!sessionOK) {
    console.log("session error");
    res.send(ret);
  }
  return sessionOK;
}

module.exports = function (app) {
  app.use(bodyParser.json());       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    extended: true
  }));

  app.post('/test', function(req, res) {
    console.log(req.body);
    res.send("ok");
  });


  app.get('/', function(req, res) {
    priManager.checkPri(req);
    res.redirect("/all_order/all/today/today");
  });
  app.get('/add_prod', function(req, res) {
    res.render("add_prod");
  });


  app.get('/dish_info/:bdate/:edate', function(req, res) {
    var bdate = req.params.bdate;
    var edate = req.params.edate;
    if( bdate == "today" ) {
      var d = new Date();
      var mon = d.getMonth() + 1;
      if( mon < 10 ) {
        mon = "0" + mon;
      }
      var day = d.getDate();
      if( day < 10 ) {
        day = "0" + day;
      }
      bdate = d.getFullYear() + "-" + mon + '-' + day;
      edate = bdate;
    }
    console.log("dish_info from bdate " + bdate + " edate: " + edate);
    orderDB.dishInfo(getStoreName(req), bdate,edate, function(err, results) {
      var groupData = {};
      var totalDishNum = 0;
      results.forEach(function(dish_info) {
        var dish_group_info = groupData[dish_info.dish_name];
        if (dish_group_info === undefined) {
          dish_group_info = {}
          dish_group_info["dish_name"] = dish_info.dish_name;
          dish_group_info["num"] = dish_info.num;
          groupData[dish_info.dish_name] = dish_group_info;
        } else {
          dish_group_info.num += dish_info.num;
        }
        totalDishNum += dish_info.num;
      });
      var dishDroupInfoArray = [];
      for (dish in groupData) {
        dishDroupInfoArray.push(groupData[dish]);
      }
      dishDroupInfoArray.sort(function(a, b) {
        return b.num - a.num;
      })
      res.render("dish_info", {
        items_len:results.length,
        dish_count:totalDishNum,
        items:results,
        bdate:bdate,
        edate:edate,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        group_items:dishDroupInfoArray,
        group_items_len:groupData.length,
      })
    });
  });

  app.get('/set_wechat_name/:uid/:name', function(req, res) {
    var uid = req.params.uid;
    var name = req.params.name;
    var ret = {"error":false}
    userDB.setUserWeChatName(uid, name, function(err) {
      console.log("setUserWeChatName err " + err);
      ret.error = err;
      res.send(ret)
    });
  })

  app.get('/print_order/:order_id', function(req,res) {
    res.render('print_order');
  });

  app.get('/all_order_detail/:platform/:bdate/:edate', function(req, res) {
    oaLog(req);
    var platform = req.params.platform;
    var bdate = req.params.bdate;
    var edate = req.params.edate;
    var storeName = getStoreName(req);
    if( bdate == "today" ) {
      var d = new Date();
      var mon = d.getMonth() + 1;
      if( mon < 10 ) {
        mon = "0" + mon;
      }
      var day = d.getDate();
      if( day < 10 ) {
        day = "0" + day;
      }
      bdate = d.getFullYear() + "-" + mon + '-' + day;
      edate = bdate;
    }

    orderDB.getOrderByPlatform(storeName, platform, bdate, edate, function(err, data) {
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}, bdate:bdate,edate:edate});
        return;
      }
      var orders = [];
      var orders_invalid = [];
      for (index in data) {
        if (data[index].order_valid) {
          orders.push(data[index]);
        } else {
          orders_invalid.push(data[index]);
        }
      }
      res.render('all_order_detail', {
        platform: platform,
        title : "聚箸OA",
        items : orders,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items_len: orders.length,
        items_invalid:orders_invalid,
        items_invalid_len:orders_invalid.length,
        bdate: bdate,
        edate: edate
      });
    });
  });


  app.get("/order_geo", function(req, res) {
    res.redirect("order_geo/today/today");
  });
  app.get("/order_geo/:bdate/:edate", function(req, res) {
    var platform = 'all';
    var bdate = req.params.bdate;
    var edate = req.params.edate;
    var storeName = getStoreName(req);
    if( bdate == "today" ) {
      var d = new Date();
      var mon = d.getMonth() + 1;
      if( mon < 10 ) {
        mon = "0" + mon;
      }
      var day = d.getDate();
      if( day < 10 ) {
        day = "0" + day;
      }
      bdate = d.getFullYear() + "-" + mon + '-' + day;
      edate = bdate;
    }

    console.log("get order for platform: " + platform + ",from: " + bdate +  ", to: " + edate + " storeName: " + storeName);

    orderDB.getOrderByPlatform(storeName, platform, bdate, edate, function(err, data){
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}, bdate:bdate,edate:edate});
        return;
      }
      var orders = [];
      var orders_invalid = [];
      if (data.length > 0) {
        var maxOrderID = data[0].order_id;
      }
      for (index in data) {
        if (data[index].order_valid) {
          orders.push(data[index]);
        } else {
          orders_invalid.push(data[index]);
        }
      }
      res.render('geo_decode', {
        platform: platform,
        title : "聚箸OA",
        users : postInfo[getStoreName(req)],
        store_lat:storeGps[getStoreName(req)][0],
        store_lng:storeGps[getStoreName(req)][1],
        items : orders,
        user_info: req.session.userInfo,
        items_len: orders.length,
        items_invalid:orders_invalid,
        items_invalid_len:orders_invalid.length,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        bdate: bdate,
        edate: edate,
        maxOrderID : maxOrderID,
      });
    });
  });

  app.get('/search_order/:key_word', function(req, res) {
    oaLog(req);
    var keyWord = req.params.key_word;
    orderDB.searchOrder(getStoreName(req), keyWord, function(err, data){
      if (err) {
        res.send(err);
        return;
      }
      var orders = [];
      var orders_invalid = [];
      for (index in data) {
        if (data[index].order_valid) {
          orders.push(data[index]);
        } else {
          orders_invalid.push(data[index]);
        }
      }
      var platform = 'all';
      res.render('all_order_tb', {
        platform: platform,
        title : "聚箸OA",
        store_name : getStoreName(req),
        items : orders,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items_len: orders.length,
        items_invalid:orders_invalid,
        items_invalid_len:orders_invalid.length,
      });
    });
  });


  app.get('/all_order/:platform/:bdate/:edate', function(req, res) {
    oaLog(req);
    var platform = req.params.platform;
    var bdate = req.params.bdate;
    var edate = req.params.edate;
    var storeName = getStoreName(req);
    if( bdate == "today" ) {
      var d = new Date();
      var mon = d.getMonth() + 1;
      if( mon < 10 ) {
        mon = "0" + mon;
      }
      var day = d.getDate();
      if( day < 10 ) {
        day = "0" + day;
      }
      bdate = d.getFullYear() + "-" + mon + '-' + day;
      edate = bdate;
    }

    console.log("get order for platform: " + platform + ",from: " + bdate +  ", to: " + edate + " storeName: " + storeName);

    orderDB.getOrderByPlatform(storeName, platform, bdate, edate, function(err, data){
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}, bdate:bdate,edate:edate});
        return;
      }
      var orders = [];
      var orders_invalid = [];
      for (index in data) {
        if (data[index].order_valid) {
          orders.push(data[index]);
        } else {
          orders_invalid.push(data[index]);
        }
      }
      console.log("session " + JSON.stringify(req.session));
      res.render('all_order_tb', {
        platform: platform,
        title : "聚箸OA",
        store_name : getStoreName(req),
        items : orders,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items_len: orders.length,
        items_invalid:orders_invalid,
        items_invalid_len:orders_invalid.length,
        bdate: bdate,
        edate: edate
      });
    });
  });

  // 所有等待配送的  不分时间 平台
  app.get('/order_wait_send', function(req, res) {
    orderDB.getOrderByStatus(getStoreName(req), 1, function(err, data){
      if (err) {
        res.send("error + " + err);
        return;
      }
      res.render('wait_send', {
        title : "聚箸OA",
        order_status:1,
        items : data,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items_len: data.length,
        post_info:postInfo,
      });
    });
  });

  app.get('/order_sending', function(req, res) {
    orderDB.getOrderByStatus(getStoreName(req), 2, function(err, data){
      if (err) {
        res.send("error + " + err);
        return;
      }
      res.render('wait_sending', {
        title : "聚箸OA",
        order_status:2,
        items : data,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items_len: data.length,
        post_info:postInfo,
      });
    });
  });

  app.get('/order_wait_recycle', function(req, res) {
    orderDB.getOrderByStatus(getStoreName(req), 3, function(err, data){
      if (err) {
        res.send("error + " + err);
        return;
      }
      res.render('wait_recycle', {
        title : "聚箸OA",
        order_status:3,
        items : data,
        items_len: data.length,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        post_info:postInfo,
      });
    });
  });
  app.get('/order_recycling', function(req, res) {
    orderDB.getOrderByStatus(getStoreName(req), 4, function(err, data){
      if (err) {
        res.send("error + " + err);
        return;
      }
      res.render('wait_recycling', {
        title : "聚箸OA",
        order_status:4,
        items : data,
        items_len: data.length,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        post_info:postInfo,
      });
    });
  });

  app.get('/order_verify', function(req, res) {
    orderDB.getTableWearInfo(getStoreName(req), "", "", function(err, data){
      if (err) {
        res.send("error + " + err);
        return;
      }
      res.render('wait_verify', {
        title : "聚箸OA",
        order_status:5,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items : data,
        items_len: data.length,
      });
    });
  });
  app.get('/order_verify/:day_str', function(req, res) {
    var day_str = req.params.day_str;
    orderDB.getTableWearInfo(getStoreName(req), day_str, "",  function(err, data){
      if (err) {
        res.send("error + " + err);
        return;
      }
      console.log(data);
      res.render('wait_verify', {
        title : "聚箸OA",
        order_status:5,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items : data,
        items_len: data.length,
      });
    });
  });
  app.get('/order_verify/:day_str/:day_end', function(req, res) {
    var day_str = req.params.day_str;
    var day_end = req.params.day_end;

    orderDB.getTableWearInfo(getStoreName(req), day_str, day_end, function(err, data){
      if (err) {
        res.send("error + " + err);
        return;
      }
      console.log(data);
      res.render('wait_verify', {
        title : "聚箸OA",
        order_status:5,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items : data,
        items_len: data.length,
        bdate:day_str,
        edate:day_end,
      });
    });
  });
  app.get('/order_recharge_tb', function(req, res) {
    orderDB.getOrderRechargeInfo(getStoreName(req), "", function(err, data){
      if (err) {
        res.send("error + " + err);
        return;
      }
      console.log(data);
      res.render('order_recharge', {
        title : "聚箸OA",
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items : data,
        items_len: data.length,
      });
    });
  });
  app.get('/order_recharge_tb/:day_str', function(req, res) {
    var day_str = req.params.day_str;
    orderDB.getOrderRechargeInfo(getStoreName(req), day_str, function(err, data){
      if (err) {
        res.send("error + " + err);
        return;
      }
      console.log(data);
      res.render('order_recharge', {
        title : "聚箸OA",
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items : data,
        items_len: data.length,
      });
    });
  });



  app.get('/user_order/:phone', function(req, res) {
    var phone = req.params.phone;
    console.log("get order for user: " + phone);

    orderDB.getOrderByPhone(phone, 0, function(err, data){
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      console.log(JSON.stringify(data));
      res.render('user_order', {
        phone:phone,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        title : "聚箸OA",
        items : data
      });
    });
  });

  app.get('/income_summary/:bdate/:edate', function(req, res) {
    oaLog(req);
    var bdate = req.params.bdate;
    var edate = req.params.edate;

    if( bdate == "today" ) {
      var d = new Date();
      var mon = d.getMonth() + 1;
      if( mon < 10 ) {
        mon = "0" + mon;
      }
      var day = d.getDate();
      if( day < 10 ) {
        day = "0" + day;
      }
      bdate = d.getFullYear() + "-" + mon + '-' + day;
      edate = bdate;
    }
    console.log("get income_summary, from: " + bdate +  ", to: " + edate);

    orderDB.getIncomeByOrder2(getStoreName(req), bdate, edate, function(err, data){
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      res.render('income_summary', {
        title : "聚箸OA",
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items : data,
        bdate: bdate,
        edate: edate
      });
    });
  });
  app.get('/user/:filter_name/:filter', function(req, res) {
    // filter_name: addr/phone/name/all
    // filter: 根据filter_name进行地址  电话  名字的模糊匹配 all 所有
    var filter_name = req.params.filter_name;
    var filter      = req.params.filter;
    userDB.getUserByCondition(getStoreName(req), filter_name, filter, function(err, data) {
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      console.log(JSON.stringify(data));
      res.render('user_info', {
        title : "聚箸OA",
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items : data,
      });

    });
  });

  app.get('/userwithorder/:orderbycolumn/:order', function(req, res) {
    // filter_name: addr/phone/name/all
    // filter: 根据filter_name进行地址  电话  名字的模糊匹配 all 所有
    var orderByColumn = req.params.orderbycolumn;
    var order      = req.params.order;
    userDB.getUserWithOrderBY(getStoreName(req), orderByColumn, order, function(err, data) {
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      //  console.log(JSON.stringify(data));
      res.render('user_info', {
        title : "聚箸OA",
        items : data,
        items_len: data.length,
        orderby : orderByColumn,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        order: order
      });

    });
  });

  app.get('/show_post_user_list/:order_id/:status', function(req, res) {
    var order_id = req.params.order_id;
    var status   = req.params.status;

    userDB.getAllPostUser(function(err, data) {
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      //console.log(JSON.stringify(data));
      res.render('show_post_user_list', {
        title : "聚箸OA",
        items : data,
        items_len: data.length,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        order_id : order_id,
        status: status
      });
    });
  });
  app.get("/check_order_progress/:order_id", function(req, res) {
    var ret = {"error" : false};
    var orderID = req.params.order_id;
    orderDB.getOneOrderProgress(orderID, function(err, data) {
      // console.log(JSON.stringify(data));
      if (err || data.length == 0) {
        ret.error = true;
        ret.msg = err;
      } else if (data.length > 0){
        ret.data = data[0].waiting_dishes.toString();
        ret.menu_list = data[0].menu_list.toString();
      }
      res.send(ret);
    })
  });
  app.get("/order_progress", function(req, res) {
    orderDB.orderProgressInfo(getStoreName(req), function(err, dishes) {
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      // 累加当前每个菜总量

      dishes.forEach(function(dishInfo) {
        if (dishInfo.wait_minute < 30) {
          dishInfo.order_color = '#5FEE00';
        } else if (dishInfo.wait_minute < 60) {
          dishInfo.order_color = '#3884B7';
        } else {
          dishInfo.order_color = '#EE0000';
        }
      });
      //console.log(JSON.stringify(data));
      res.render('order_progress_view', {
        title : "聚箸OA",
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items : dishes,
        items_len: dishes.length,
      });
    });
  });

  app.post("/express_order/:order_id", function(req, res) {
    var orderID = req.params.order_id;
    var ret = {"error" : false};
    orderDB.expressOrder(orderID, function(err,dbInfo) {
      console.log("送出订单" + orderID + " info " + JSON.stringify(dbInfo));
      if (err) {
        ret["error"] = true;
        ret["msg"] = "数据库出错 " + JSON.stringify(err);
      } else if (dbInfo.affectedRows == 0) {
        ret["error"] = true;
        ret["msg"] = "出菜完毕之后才能配送"
      }
      res.send(ret);
    });
  });


  app.post("/check_new_dish", function(req, res)  {
    var postData = req.body;
    var ret = {"error" : false};
    orderDB.checkLastDish(postData.storeName, postData.dishID,  function(err, hasNew) {
      if (err) {
        ret.error = true;
        ret.msg = err;
      } else {
        ret.has_new = hasNew;
      }
      res.send(ret);
    });
  });
  app.post("/transfer_order", function(req, res)  {
    var postData = req.body;
    var ret = {"error" : false};
    orderDB.transferOrder(postData.order_id, postData.store_name,  function(err) {
      if (err) {
        ret.error = true;
        ret.msg = err;
      } else {
        ret.error = false;
      }
      console.log(err);
      res.send(ret);
    });
  });

  app.get("/cook_order_set", function(req, res) {
    // 烹任顺序调整页面
    // 只取当天的
    oaLog(req);
    var bdate = 'today';
    var platform = 'all';
    var storeName = getStoreName(req);
    if( bdate == "today" ) {
      var d = new Date();
      var mon = d.getMonth() + 1;
      if( mon < 10 ) {
        mon = "0" + mon;
      }
      var day = d.getDate();
      if( day < 10 ) {
        day = "0" + day;
      }
      bdate = d.getFullYear() + "-" + mon + '-' + day;
      edate = bdate;
    }

    orderDB.getOrderWaitAssign(storeName, function(err, data) {
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}, bdate:bdate,edate:edate});
        return;
      }
      var orders = [];
      var orders_invalid = [];
      for (index in data) {
        if (data[index].order_valid) {
          orders.push(data[index]);
        } else {
          orders_invalid.push(data[index]);
        }
      }
      console.log(req.session);
      // 按照烹饪顺序显示
      orders.sort(function(a, b) {
        return a.cook_order - b.cook_order;
      });
      res.render('cook_order', {
        platform: platform,
        title : "聚箸OA",
        items : orders,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        items_len: orders.length,
        bdate: bdate,
        edate: edate
      });
    });


  });

  app.get("/cook_assign_view", function(req, res) {
    orderDB.dishWaitAssign(getStoreName(req), function(err, dishes) {
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      // 累加当前每个菜总量

      var dishCnt = {};
      var maxDishID = 0;
      dishes.forEach(function(dishInfo) {
        if (dishInfo.dish_id > maxDishID) {
          maxDishID = dishInfo.dish_id;
        }
        if (dishInfo.wait_minute < 30) {
          dishInfo.order_color = '#5FEE00';
        } else if (dishInfo.wait_minute < 60) {
          dishInfo.order_color = '#3884B7';
        } else {
          dishInfo.order_color = '#EE0000';
        }
        if (dishCnt[dishInfo.dish_name] === undefined) {
          dishCnt[dishInfo.dish_name] = 1;
        } else{
          dishCnt[dishInfo.dish_name] += 1;
        }
      });
      dishes.forEach(function(dishInfo) {
        dishInfo.curTotalCnt = dishCnt[dishInfo.dish_name];
      });
      dishes.sort(function(a, b) {
        return a.cook_order - b.cook_order;
      })
      //console.log(JSON.stringify(data));
      maxDishID = 0;
      orderDB.getMaxDishID(getStoreName(req), function(err, maxID) {
        if (err) {
          maxDishID = 0;
        } else {
          maxDishID = maxID;
        }
        res.render('cook_view', {
          title : "聚箸OA",
          items : dishes,
          maxDishID:maxDishID,
          items_len: dishes.length,
          user_name: req.session.userName,
          user_info: req.session.userInfo,
          cook_info:cookInfo[getStoreName(req)],
          assistent_info:assistentInfo[getStoreName(req)],
        });
      })
    });
  });

  app.get("/cook_finish_view", function(req, res) {
    orderDB.dishWaitFinish(getStoreName(req),function(err, dishes) {
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      //console.log(JSON.stringify(data));
      res.render('cook_finish', {
        title : "聚箸OA",
        items : dishes,
        items_len: dishes.length,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        cook_info:cookInfo[getStoreName(req)],
        assistent_info:assistentInfo[getStoreName(req)],
      });
    });
  });

  app.get('/update_user_post_tb/:order_id/:status', function(req, res) {
    oaLog(req);
    var order_id = req.params.order_id;
    var status   = req.params.status;

    var ret = {"error": false};
    orderDB.updateUserPostTb(order_id, status, function(err, data) {
      if (err) {
        ret = {"error": true};
        res.send(ret);
        return;
      }
      res.send(ret);
    });
  });

  app.post("/assign_dish/:order_id", function(req, res) {
    var orderID = req.params.order_id;
    var dishName = req.body['dishName'];
    var assistent = req.body['assistent'];
    var cook = req.body['cook'];
    var ret = {"error" : false};
    if (dishName == '' || assistent == "" || cook == "") {
      console.log(JSON.stringify(req.body) + " post data not ok");
      ret["error"] = true;
      res.send(ret);
      return;
    }
    orderDB.assignDish(orderID, dishName, assistent, cook, function(err) {
      console.log("assignDish for order :" + orderID + " dish/name:" + dishName + " assistent: " + assistent + " cook : " + cook + " return err:" + err);
      if (err) {
        ret["error"] = true;
      }
      res.send(ret);
    });
  });
  app.post("/finish_dish/:order_id", function(req, res) {
    var orderID = req.params.order_id;
    var dishName = req.body['dishName'];
    var assistent = req.body['assistent'];
    var cook = req.body['cook'];
    var ret = {"error" : false};
    orderDB.finishDish(orderID, dishName, assistent, cook, function(err) {
      console.log("finishDish for order :" + orderID + " dish/name:" + dishName + " assistent: " + assistent + " cook : " + cook + " return err:" + err);
      if (err) {
        ret["error"] = true;
      }
      res.send(ret);
    });
  });


  app.post('/order_comment/:order_id', function(req, res) {
    var comment = req.body['comment'];
    var order_id = req.params.order_id;

    var ret = {};
    orderDB.setOrderCommentByUser(order_id, "OA", comment, function(succ, data) {
      if (succ) {
        ret["error"] = 0;
      } else {
        ret["error"] = 1;
        //console.log(JSON.stringify(data));
      }
      res.send(ret);
    });
  });

  app.get('/cancel_order/:order_id', function(req, res) {
    oaLog(req);
    var ret = {};
    if (!validateSession(req, res)) {
      // 登陆页面
    } else {
      var order_id = req.params.order_id;
      juzhuMQPro.PublishOrderInvalid(req.params, function(err) {
        console.log("juzhuMQPro.PublishOrderInvalid return " + err);
      });
      orderDB.cancelOrder(order_id, function(err) {
        if (err) {
          ret["error"] = 1;
        } else {
          ret["error"] = 0;
        }
        res.send(ret);
      });
    }
  });

  app.get("/set_order_post/:order_id/:user", function(req, res) {
    oaLog(req);
    var orderID = req.params.order_id;
    var user = req.params.user;

    var opRet = {
      "error" : false,
    }
    orderDB.setOrderPost(orderID, user, 1, function(err) {
      if (err) {
        opRet["error"] = true;
        opRet["msg"] = err;
      }
      res.send(opRet);
    })
  });
  app.get("/set_order_post_complete/:order_id/:user", function(req, res) {
    var orderID = req.params.order_id;
    var user = req.params.user;

    var opRet = {
      "error" : false,
    }
    orderDB.setOrderPost(orderID, user, 2, function(err) {
      if (err) {
        opRet["error"] = true;
        opRet["msg"] = err;
      }
      res.send(opRet);
    })

    OrderLogger.OrderSendCpmpleteLog(orderID, user, function(success) {
      console.log("OrderSendCpmpleteLog " + success);
    });
  });
  app.get("/set_order_recycle/:order_id/:user", function(req, res) {
    var orderID = req.params.order_id;
    var user = req.params.user;

    var opRet = {
      "error" : false,
    }
    orderDB.setOrderRecycle(orderID, user, 1, function(err) {
      if (err) {
        opRet["error"] = true;
        opRet["msg"] = err;
      }
      res.send(opRet);
    });

    OrderLogger.OrderRecycleApplyLog(orderID, user, function(success) {
      console.log("OrderRecycleApplyLog " + success);
    });
  });
  app.get("/set_order_recycle_complete/:order_id/:user", function(req, res) {
    var orderID = req.params.order_id;
    var user = req.params.user;

    var opRet = {
      "error" : false,
    }
    orderDB.setOrderRecycle(orderID, user, 2, function(err) {
      if (err) {
        opRet["error"] = true;
        opRet["msg"] = err;
      }
      res.send(opRet);
    });
    OrderLogger.OrderRecycleCompleteLog(orderID, user, function(success) {
      console.log("OrderRecycleCompleteLog " + success);
    });
  });
  // user 对 order_id的订单进行验收
  app.get("/set_order_recycle_verify/:order_id/:verify_ok", function(req, res) {
    var orderID = req.params.order_id;
    var verifyOK = req.params.verify_ok;
    var sessionOK = false;
    var user = "";
    var ret = {"error" : false};
    console.log(req.session);
    if (req.session.userName && req.session.ticketID) {
      sessionOK = ticketManager.checkTicket(req.session.userName, req.session.ticketID)
      user = req.session.userName;
    }
    if (!sessionOK) {
      // 登陆页面
      ret["error"] = errorCode.sessionError;
      ret["msg"] = '请登录之后再操作';
      res.send(ret);
    } else {
      orderDB.setOrderVerify(orderID, user, verifyOK, function(err) {
        if (err) {
          ret["error"] = true;
          ret["msg"] = err;
        }
        res.send(ret);
      });
    }
  });
  app.post("/set_order_recycle_miss", function(req, res) {
    var orderMissInfo = req.body;
    console.log("set_order_recycle_miss data" + JSON.stringify(orderMissInfo));

    var sessionOK = false;
    var user = "";
    var ret = {"error" : false};
    console.log(req.session);
    if (req.session.userName && req.session.ticketID) {
      sessionOK = ticketManager.checkTicket(req.session.userName, req.session.ticketID)
      user = req.session.userName;
    }
    if (!sessionOK) {
      // 登陆页面
      ret["error"] = errorCode.sessionError;
      ret["msg"] = '请登录之后再操作';
      res.send(ret);
    } else {
      orderDB.setOrderRecycleMiss(orderMissInfo, user, function(err) {
        if (err) {
          ret["error"] = true;
          ret["msg"] = err;
        }
        res.send(ret);
      });
    }
  });


  app.get("/market_sms_cb", function(req, res) {
    console.log("market_sms_cb :" + JSON.stringify(req.query));
    var msgID = req.query.msgid;
    var mobile = req.query.mobile;
    var status = req.query.status;
    marketDB.updateSMSRecord(msgID, mobile, status, function(err) {
      console.log(msgID + "-" + mobile + ":" + status);
      res.send("ok");
    });
  });

  app.get("/notice_sms_cb", function(req, res) {
    console.log("notice_sms_cb :" + JSON.stringify(req.query));
    var msgID = req.query.msgid;
    var mobile = req.query.mobile;
    var status = req.query.status;
    marketDB.updateNoticeSMSRecord(msgID, mobile, status, function(err) {
      console.log(msgID + "-" + mobile + ":" + status);
      res.send("ok");
    });
  });

  app.get("/logout", function(req, res) {
    if (req.session.userName) {
      console.log("logout for user: " + req.session.userName);
      delete req.session.userName;
      delete req.session.ticketID;
    }
    res.send("ok");
  });
  app.post('/login', function(req, res, next) {
    //check user name pass..
    var login_ret = {};
    var userName = req.body.user_name;
    var passwd = req.body.passwd;

    PostmanUser.login(userName, passwd, function(err, login_ok, userPri) {
      if (!err && login_ok) {
        var ticket = ticketManager.newTicket(userName);
        login_ret['ret'] = true;
        login_ret['ticket'] = ticket;
        var userInfo = {"userName" : userName, "userPri":userPri};
        req.session.userName = userName;
        req.session.userInfo = userInfo;
        req.session.ticketID = ticket.ticketID;
      } else {
        if (err) {
          login_ret['ret'] = errorCode.dbError;
          login_ret['msg'] = "system error";
        } else {
          login_ret['ret'] = errorCode.passwdError;
          login_ret['msg'] = "账号不匹配";
        }
      }
      console.log(req.session);
      res.send(JSON.stringify(login_ret));
    });
  });
  app.get('/switch_store/:store_name', function(req, res, next) {
    //check user name pass..
    var ret = {"change":false};
    var storeName = req.params.store_name;
    // TODO 检查合法性
    if (!req.session.storeName || req.session.storeName != storeName) {
      req.session.storeName = storeName;
      ret.change = true;
    }
    res.send(ret);
  });

  app.get("/order_recharge_complete/:order_id", function(req, res) {
    oaLog(req);
    if (!validateSession(req, res)) {
      return;
    }
    var orderID = req.params.order_id;
    var dataRet = {error:false};
    orderDB.updateOrderRechargeComplete(orderID, function(err) {
      if (err) {
        dataRet.error = true;
        dataRet.msg = JSON.stringify(err);
      }
      res.send(dataRet);
    });
  });


  app.get("/order_recharge/:order_id/:amount", function(req, res) {
    oaLog(req);
    if (!validateSession(req, res)) {
      return;
    }
    var orderID = req.params.order_id;
    var amount = req.params.amount;
    var dataRet = {error:false};
    orderDB.updateOrderRecharge(orderID, amount, function(err) {
      if (err) {
        dataRet.error = true;
        dataRet.msg = JSON.stringify(err);
      }
      res.send(dataRet);
    });
  });
  app.get("/refresh_order_split_index/:order_id", function(req, res) {
    var orderID = req.params.order_id;
    var ret = {error:true, split_index:-1};
    orderDB.getOrderSplitIndx(orderID, function(err, data) {
      if (!err && data.length > 0) {
        ret.split_index = data[0].split_index;
        res.send(ret);
      } else {
        res.send(ret);
      }
    });
  });
  app.get("/update_user_gps/:lat/:lng", function(req, res) {
    console.log("update user: " + req.session.userName + " gps: (" + req.params.lat + ", " + req.params.lng + ")" );
    res.send("ok");
  })
  app.get("/poster_lastest_info", function(req, res) {
    orderDB.getPosterLatestGPS(function(err, data) {
      res.send({"error" : (err) == true, 'data':data});
    })
  })

  app.post("/updateTableWear/:order_id/:type/:num", function(req, res) {
    var orderID = req.params.order_id;
    var type = req.params.type;
    var num = req.params.num;
  });

  app.get("/get_region", function(req, res) {
    console.log(regionInfo);
    res.send(regionInfo);
  });
  app.get("/update_order_spindex/:order_id/:index",  function(req, res) {
    var orderID = req.params.order_id;
    var splitIndex = req.params.index;
    console.log(req.params);
    orderDB.updateOrderSplitIndex(orderID, splitIndex, function(err) {
      res.send({"error":err});
    });
  });
  app.get("/no_post_count/:order_id", function(req, res) {
    var orderID = req.params.order_id;
    var ret = {"error" : false};
    orderDB.orderNoPostCount(orderID, 1, function(err) {
      if (err) {
        ret.error = 1;
        ret.msg = JSON.stringify(err);
      }
      res.send(ret);
    });
  })

  app.get("/update_order_gps/:order_id/:lat/:lng/",  function(req, res) {
    var orderID = req.params.order_id;
    var lat = req.params.lat;
    var lng = req.params.lng;
    orderDB.updateOrderGPS(orderID, lat, lng, function(err) {
      res.send({"error":err});
    });
  });
  app.get("/get_new_order_after/:order_id", function(req, res) {
    var orderID = req.params.order_id;
    var ret = {"error" : false};
    orderDB.getOrderAfterOrderID(getStoreName(req), orderID, function(err, data) {
      if (err) {
        ret.error = true;
      } else {
        ret.orders = data;
      }
      res.send(ret);
    })
  });
  app.post("/consume_point", function(req, res) {

    var postData = req.body;
    var uid = postData.uid;
    var point = postData.point;
    var comment = postData.comment;
    var ret = {"error" : false};
    if (!priManager.checkPri(req)) {
      ret.error = true;
      ret.msg = 'auth error';
      res.send(ret);
      return;
    }
    userDB.consumePoint(uid, point, comment, function(err) {
      if (err) {
        ret.error = true;
        ret.msg = JSON.stringify(err);
      }
      res.send(ret);
    });
  });

  app.get("/user_point_info/:page_num", function(req, res) {
    if (!priManager.checkPri(req)) {
      res.redirect("/");
      return;
    }
    var pageNum = parseInt(req.params.page_num);
    userDB.getUserPointList(getStoreName(req), pageNum, function(err, data) {
      res.render('list_user_point', {
        title : "聚箸OA",
        phone: "",
        point_info : data,
        user_name: req.session.userName,
        user_info: req.session.userInfo,
        point_history:[],
        last_page_num:pageNum - 1,
        next_page_num:pageNum + 1,
      });
    });
  });
  app.get("/get_user_point_info/:phone", function(req, res) {
    var phone = req.params.phone;
    if (!priManager.checkPri(req)) {
      res.redirect("/");
      return;
    }
    userDB.getUserPointInfo(phone, function(err, data) {
      userDB.getUserPointRecord(phone, function(err, hData) {
        if (data.length > 0) {
          res.render('user_point', {
            title : "聚箸OA",
            phone: phone,
            point_info : data[0],
            user_name: req.session.userName,
            user_info: req.session.userInfo,
            point_history:hData,
          });
        } else {
          res.render('user_point', {
            title : "聚箸OA",
            phone: phone,
            point_info : [],
            user_name: req.session.userName,
            user_info: req.session.userInfo,
            point_history:hData,
          });

        }
      })
    })
  });
  // 优先级调整  都是两个相邻订单之间的优先级交换
  app.post("/orderPriSet", function(req, res) {
    var setData = req.body;
    var ret = {"error": false};
    // body 格式是个数组 {id1:pri, id2:pri}
    console.log("new order pri " + JSON.stringify(setData));
    // 转成数组
    var setDataArray = [];
    for (id in setData) {
      setDataArray.push({"orderID": id, "newPri":setData[id]});
    }
    orderDB.setOrderPri(setDataArray, function(err) {
      if (err) {
        ret.error = true;
        ret.msg = JSON.stringify(err);
      }
      res.send(ret);
    });
  });
}
