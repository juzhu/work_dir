var express = require('express');
var dbProd = require('./db_prod.js').jiFenDB;
var config = require('./config.js')
var router = express.Router();
var wxUtli = require('./tool/wx_utli.js');
var dbUser = require('./db_user_info.js').userDB;
var uuid = require('node-uuid');
var sms = require("./send_sms.js");
var prod_info = {};
var userSession = {};  // session key索引信息 基本信息
var loginUrl ="https://open.weixin.qq.com/connect/oauth2/authorize?appid="+ config.appID+ "&redirect_uri=http%3A%2F%2Fappmishu.com%2Fwx_redirect&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect"

// 根据用户提交的订单数据 计算最终的订单价格以及订单详情
function genOrderDetail(userOrder) {
  var validDish = [];
  var allDishNames = [];
  for (dish in userOrder) {
    if (userOrder[dish].num > 0) {
      allDishNames.push(dish);
    }
  }
  if (allDishNames.length == 0) {
    res.send(dataRet);
    return;
  }
  dbProd.getProdInfo(allDishNames, function(err, data) {
    if (!err) {
      var dishAmount = 0;
      console.log(data);
      for (dishIndex in data) {
        var dishInfo = data[dishIndex];
        var dishRet = {};
        dishRet["dishName"] = dishInfo.prod_name;
        dishRet['price'] = dishInfo.price;
        dishRet['discount'] = dishInfo.discount;
        dishRet['num'] = userOrder[dishInfo.prod_name].num;
        dishRet['totalAmount'] = dishRet['price'] * dishRet['num'];
        dishAmount += dishRet['totalAmount'];
        validDish.push(dishRet);
      }
      dataRet['dishInfo'] = validDish;

      // 加满减
      var discountInfo = [];
      var oneDoscount = {"name":"没有满减优惠", "amount":0};
      if (dishAmount >= 300) {
        oneDoscount['name'] = "满300减50";
        oneDoscount['amount'] = 50;
      } else if (dishAmount >= 200) {
        oneDoscount['name'] = "满200减25";
        oneDoscount['amount'] = 25;
      } else if (dishAmount >= 100)  {
        oneDoscount['name'] = "满100减10";
        oneDoscount['amount'] = 10;
      } else if (dishAmount >= 50) {
        oneDoscount['name'] = "满50减3";
        oneDoscount['amount'] =3;
      }
      dishAmount -= oneDoscount['amount'];
      discountInfo.push(oneDoscount);

      // 增加运费 5块
      dataRet['diliveryInfo'] = 5;
      dishAmount += 5;

      // 满40免运费
      if (dishAmount > 40) {
        var postDiscount = {};
        postDiscount['name'] = "满40免运费";
        postDiscount['amount'] = 5;
        discountInfo.push(postDiscount);
        dishAmount -= 5;
      }
      dataRet["discountInfo"] = discountInfo;
      dataRet["orderAmount"] = dishAmount;
      console.log(JSON.stringify(dataRet));
    } else {
      console.log(err);
    }
    return dataRet;
  })


}

router.get('/gen_order', function(req, res, next) {
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var payOrderRet = {"err":true, "msg":"订单数据非法"}
  if (req.body.userOrder <= "") {
    res.send(payOrderRet);
    return;
  }
  var userOrder = JSON.parse(req.body.userOrder);
  var genOrderInfo = genOrderDetail(userOrder);
  if (genOrderDetail.dishAmount > 0) {
    payOrderRet["err"] = false;
    payOrderRet["msg"] = "success";
  }
  payOrderRet["orderInfo"] = genOrderInfo;
  res.send(payOrderRet);
});

module.exports = router;
