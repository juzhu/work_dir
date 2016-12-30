var bodyParser    = require('body-parser');
var orderDB = require("./db_orders.js").orderDB
var userDB = require("./db_user.js").orderDB
var marketDB = require("./db_market.js").orderDB
var SMS = require("./market_sms/send_sms.js");
var CLSMS = require("./market_sms/cl_send_sms.js");

module.exports = function (app) {
  app.use(bodyParser.json());       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    extended: true
  }));

  app.get('/user_market/:sms_id', function(req, res) {
    var sms_id = req.params.sms_id;

    marketDB.getTagUserInfo(sms_id, function(err, data) {
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      res.render('market_info', {
        phone_num : data.length,
        phone_info : data,
        title : "聚箸OA",
      });
    });
  });

  app.post('/user_market/new_sms', function(req, res) {
    console.log(req.body.tag_name);
    marketDB.newSMSInfo(req.body, function(err) {
      if (!err) {
        res.send("添加成功");
      } else {
        res.send("添加失败 " + err);
      }
    });
  });

  app.post('/user_market/filter_user', function(req, res) {
    console.log(req.body);
    var ret = {"error": true};
    marketDB.filterUser(req.body, function(err, sql,data) {
      if (!err) {
        ret["error"] = false;
        ret["sql"] = sql;
        ret["data"] = data;
        res.send(ret);
      } else {
        ret["sql"] = sql;
        ret["error_msg"] = JSON.stringify(err);
        res.send(ret);
      }
    });
  });
  app.get('/user_market/add_user/:tag_id/:phone', function(req, res) {
    var tag_id = req.params.tag_id;
    var phone = req.params.phone;
    var ret = {"error": true};
    marketDB.filterUser(req.body, function(err, sql,data) {
      if (!err) {
        ret["error"] = false;
        ret["sql"] = sql;
        ret["data"] = data;
        res.send(ret);
      } else {
        ret["sql"] = sql;
        ret["error_msg"] = JSON.stringify(err);
        res.send(ret);
      }
    });
  });



  app.get('/user_market_all', function(req, res) {
    var tag_id = req.params.tag_id;

    marketDB.getMarketTagList(function(err, data) {
      if (err) {
        console.log(err);
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      res.render('market_info_list', {
        sms_info : data,
        title : "聚箸OA",
      });
    });
  });
  app.get('/user_market/sms_del/:sms_id', function(req, res) {
    var sms_id = req.params.sms_id;

    var ret = {"error" : true};
    marketDB.deleteSMS(sms_id, function(err, data) {
      if (err) {
        res.send(ret);
      } else {
        ret["error"] = false;
        res.send(ret);
      }
    });
  });



  app.get('/user_market/sms_send_cl/:tag_id', function(req, res) {
    var tag_id = req.params.tag_id;

    marketDB.getTagInfo(tag_id, function(err, data){
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      tag_info = data;

      marketDB.getTagUserInfoNeedMarket(tag_info[0].tag_name, function(err, data) {
        if (err) {
          res.render('index', {title : "聚箸数据后台", services : [], data : {}});
          return;
        }

        var content = tag_info[0].content;
        tag_user_info =  data;
        phone = "";
        console.log(JSON.stringify(tag_user_info));
        tag_user_info.forEach(function(user) {
          phone += user.phone + ",";
        });
        if (phone > "") {
          phone = phone.substring(0, phone.length - 1);
        }
        ret_str = content + "<br> 发送给 : " + phone + "<br><a href='/user_market/1'>返回<a><br>总共: " + phone.length + " 人";
        CLSMS.sendsms(phone, content, function(code, msg_id) {
          if (code == 0) {
            marketDB.confirmCLSMSSend(tag_user_info, tag_info[0].tag_name, msg_id, function(err, msg) {
              console.log("update over");
            });
          } else {
            console.log("sms error:" + code);
          }
        });
        res.send(ret_str);
      });
    });
  });


  app.get('/user_market/sms_send/:tag_id', function(req, res) {
    var tag_id = req.params.tag_id;

    marketDB.getTagInfo(tag_id, function(err, data){
      if (err) {
        res.render('index', {title : "聚箸数据后台", services : [], data : {}});
        return;
      }
      tag_info = data;

      marketDB.getTagUserInfoNeedMarket(tag_info[0].tag_name, function(err, data) {
        if (err) {
          res.render('index', {title : "聚箸数据后台", services : [], data : {}});
          return;
        }

        var content = tag_info[0].content;
        tag_user_info =  data;
        phone = "";
        tag_user_info.forEach(function(user) {
          phone += user.phone + ",";
        });
        if (phone > "") {
          phone = phone.substring(0, phone.length - 1);
        }
        ret_str = content + "<br> 发送给 : " + phone + "<br><a href='/user_market/1'>返回<a><br>总共: " + phone.length + " 人";
        SMS.sendsms(phone, content, function(ok) {
          marketDB.confirmSMSSend(tag_user_info, tag_info[0].tag_name, function(err, msg) {
            console.log("update over");
          });
        });
        res.send(ret_str);
      });
    });
  });
};
