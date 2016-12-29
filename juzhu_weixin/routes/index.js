var express = require('express');
var config = require('./config.js')
var fanPiaoConfig = require('./fanpiao_config.js')
var router = express.Router();
var wxUtli = require('./tool/wx_utli.js');
var dbUser = require('./db_user_info.js').userDB;
var dbProd = require('./db_prod.js').jiFenDB;
var wechatPay = require('./wechat_pay.js').wechatPay;
var h5Request = require('./wechat_pay.js').genH5Request;
var uuid = require('node-uuid');
var sms = require("./cl_send_sms.js");
var verifyCodeMap = {};
var userSession = {};  // session key索引信息 基本信息
var loginUrl ="https://open.weixin.qq.com/connect/oauth2/authorize?appid="+ config.appID+ "&redirect_uri=http%3A%2F%2Fappmishu.cn%2Fwx_redirect&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect"
var loginUrl ="https://open.weixin.qq.com/connect/oauth2/authorize?appid="+ config.appID+ "&redirect_uri=http%3A%2F%2Fappmishu.com%2Fwx_redirect&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect"

var menuListCache = {};
var debug = 0;
var debugAmount =  1;


console.log(loginUrl);
function genTimeStr(date) {
  var timeStart = date.getFullYear();
  timeStart += (date.getMonth() >= 9 ? (date.getMonth() + 1) : ("0" + (date.getMonth() + 1)));
  timeStart += date.getDate() >= 10 ? date.getDate() : ("0" + date.getDate());
  timeStart += date.getHours() >=10 ? (date.getHours()) : ("0" + (date.getHours() + 1));
  timeStart += date.getMinutes() >= 9 ? (date.getMinutes() + 1) : ("0" + (date.getMinutes() + 1));
  timeStart += date.getSeconds() >= 9 ? (date.getSeconds() + 1) : ("0" + (date.getSeconds() + 1));
  return timeStart;
}

function payOrderWithFanPiao(order, userInfo, cb) {
  var orderAmount = order.orderAmount;
  var uid = userInfo.uid;
  dbUser.payOrderAmountByFanPiao(uid, orderAmount, function(err, result) {
    console.log(err + " " + JSON.stringify(result));
    if (result.affectedRows == 1) {
      cb(err);
    } else {
      cb(true)
    }
  })
}

function generateSmsCodeInfo (phone) {
  // 检查用户上一次申请时间
  var lastCodeInfo = verifyCodeMap[phone];
  var validReq = false;
  var nowTime = (new Date()).getTime() / 1000; // 秒
  if (lastCodeInfo === undefined ) {
    validReq = true;
  } else if (lastCodeInfo.nextCodeTime >= nowTime) {
    validReq = true;
  } else {
    validReq = false;
  }
  // 下一次申请时间
  // 码有效时间
  // code
  var codeInfo = {};
  if (!validReq) {
    codeInfo.err = true;
    codeInfo.errMsg = "请求太频繁，稍等重试"
    return codeInfo;
  }
  codeInfo.err = false;
  var code = Math.floor(Math.random() * 1000000);
  if (code < 100000) {
    code += 100000;
  }
  var nowTime = (new Date()).getTime() / 1000; // 秒
  codeInfo.nextCodeTime = nowTime + 60 * 1;
  codeInfo.curCodeValidTime = nowTime + 60 * 5;
  codeInfo.code = code;
  codeInfo.codeMsg = "你的本次操作验证码是: " + code + " 两分钟内有效 ，请尽快使用【聚箸】"
  return codeInfo;
}

function verifySmsCode(phone, code) {
  // 检查用户上一次申请时间
  console.log(JSON.stringify(verifyCodeMap));
  var lastCodeInfo = verifyCodeMap[phone];
  console.log("verifySmsCode for phone: " + phone + " code: " + code + " lastinfo: " + JSON.stringify(lastCodeInfo));
  var validReq = false;
  var nowTime = (new Date()).getTime() / 1000; // 秒
  if (lastCodeInfo === undefined ) {
    return false;
  } else if ((lastCodeInfo.code ==code) && (lastCodeInfo.curCodeValidTime>= nowTime)) {
    verifyCodeMap[phone] = undefined;
    return  true;
  } else {
    return false;
  }
}

function validateSession(req, res) {
  if (debug) {
    var userInfo = {};
    userInfo["phone"] = "18965326598";
    userInfo["user_addr"] = "查积分多少立方进来看见了大家l"
    userInfo["uid"] = 1267;
    return userInfo;
  }
  /// 测试期间 直接返回用户的基本信息
  var sessionKey = req.session.sessionKey;
  console.log("session_key:" + sessionKey);
  if (!sessionKey || userSession[sessionKey] == undefined) {
    res.redirect(loginUrl);
    return false;
  } else {
    return userSession[sessionKey];
  }
}
/* GET home page. */
router.get('/wx_redirect', function(req, res, next) {
  var userInfo = {};
  var sessionKey = uuid.v4();

  req.session.sessionKey = sessionKey;
  if (req.query.code !== undefined) {
    console.log(req.query.code);
    wxUtli.getUserAccessToken(req.query.code, function(err, wxInfo) {
      if (!err) {
        userInfo.openID = wxInfo.openID;
        userInfo.nickName = wxInfo.nickName;
        userInfo.headImagUrl = wxInfo.headImagUrl;
        userSession[sessionKey] = userInfo;


        // 如果没绑定， 展示提示用户绑定手机号的页面
        dbUser.getUserInfoByOpenID(userInfo.openID, function(err, cbUserInfo) {
          // 如果是空 用户第一次用微信登录 记录这个openid
          if (cbUserInfo.length == 0) {
            dbUser.addWXUser(userInfo.openID, function(err,msg) {
              if (err) {
                console.log("error: " + msg);
              } else {
                res.redirect("/menu_list");
              }
            });
          } else if (!(cbUserInfo[0].phone)){
            // 登陆过 但是还是没有绑定手机号的
            res.render('index.html', { userInfo:userInfo, fanPiaoConfig:fanPiaoConfig.fanPiaoInfoArray});
          } else {
            // 展示用户积分信息
            var baseInfo = cbUserInfo[0];
            for (key in baseInfo) {
              userInfo[key] = baseInfo[key];
            }
            res.redirect("/menu_list");
          }
        })
      } else {
        res.redirect(loginUrl);
      }
    });
  } else {
    res.send("这个是一个美食交流的网站");
  }
});

/* GET home page. */
router.get('/wx_redirect_mine', function(req, res, next) {
  var userInfo = {};
  var sessionKey = uuid.v4();

  req.session.sessionKey = sessionKey;
  if (req.query.code !== undefined) {
    console.log(req.query.code);
    wxUtli.getUserAccessToken(req.query.code, function(err, wxInfo) {
      if (!err) {
        userInfo.openID = wxInfo.openID;
        userInfo.nickName = wxInfo.nickName;
        userInfo.headImagUrl = wxInfo.headImagUrl;
        userSession[sessionKey] = userInfo;


        // 如果没绑定， 展示提示用户绑定手机号的页面
        dbUser.getUserInfoByOpenID(userInfo.openID, function(err, cbUserInfo) {
          // 如果是空 用户第一次用微信登录 记录这个openid
          if (cbUserInfo.length == 0) {
            dbUser.addWXUser(userInfo.openID, function(err,msg) {
              if (err) {
                console.log("error: " + msg);
              } else {
                res.redirect("/mine");
              }
            });
          } else if (!(cbUserInfo[0].phone)){
            // 登陆过 但是还是没有绑定手机号的
            res.render('index.html', { userInfo:userInfo, fanPiaoConfig:fanPiaoConfig.fanPiaoInfoArray});
          } else {
            // 展示用户积分信息
            var baseInfo = cbUserInfo[0];
            for (key in baseInfo) {
              userInfo[key] = baseInfo[key];
            }
            res.redirect("/mine");
          }
        })
      } else {
        res.redirect(loginUrl);
      }
    });
  } else {
    res.send("这个是一个美食交流的网站");
  }
});



router.get('/mine', function(req, res, next) {
  var userInfo = validateSession(req, res);
  // var userInfo = {};
  // userInfo.openID = "o3GUCwb5mD7wGI9NYVZ2D2jscBOY";
  if (!userInfo) {
    return;
  }
  console.log(userInfo);
  dbProd.getJiFenProd(0, function(err, jifenProds) {
    dbUser.getFanPiaoInfo(userInfo.uid, function(err, fanPiaoInfo) {
      if (!err) {
        if (fanPiaoInfo.length > 0) {
          fanPiaoInfo = fanPiaoInfo[0];
        } else {
          fanPiaoInfo = {"cur_amount": 0, "uid":userInfo.uid};
        }
        res.render('index.html', {
          userInfo: userInfo,
          jifenProd:jifenProds,
          fanPiaoInfo: fanPiaoInfo,
          fanPiaoConfig:fanPiaoConfig.fanPiaoInfoArray,
        });
      } else {
      }
    });
  });
});

router.get('/menu_list', function(req, res, next) {
  // var userInfo = validateSession(req, res);
  //console.log(userInfo);
  // var userInfo = {};
  // userInfo.openID = "o3GUCwb5mD7wGI9NYVZ2D2jscBOY";
  // if (!userInfo) {
  //  return;
  // }
  // res.render('menu_list.html', {userInfo: userInfo});

  dbProd.getMenuList(function(err, results) {
    // 构造一个二级的map
    var menu_list = {};
    var render_menu_data = [];
    if (!err) {
      // 按照类型 分类
      for (menuIndex in results) {
        var menu = results[menuIndex];
        var menu_type = menu['type_desc'];
        var type_list = menu_list[menu_type];
        if (type_list === undefined) {
          type_list = [];
        }
        type_list.push(menu);
        menu_list[menu_type] = type_list;
      }
    } else {
      console.log("getMenuList err : " + err);
    }

    for (menu_type in menu_list) {
      var menu_type_data = {};
      menu_type_data["type"] = menu_type;
      menu_type_data["menu_list"] = menu_list[menu_type];
      render_menu_data.push(menu_type_data);
    }
    console.log(render_menu_data);
    menuListCache["data"] = menu_list;
    menuListCache["cacheTime"] = (new Date()).getTime()
    res.render('menu_list.html', {"menu_data":render_menu_data});
  });
});

router.get('/fanpiao_rebuy_submit/:order_id', function(req, res, next) {
  console.log("fanpiao_rebuy_order " + req.params.order_id);
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var payOrderRet = {"error":true, "msg":"订单数据非法"}
  var orderID = req.params.order_id;
  dbProd.getOrderInfo(orderID, function(err, ordersRet) {
    if (err) {
      console.log("getOrderInfo err:" + err);
      res.send(payOrderRet);
      return;
    }
    if (ordersRet.length != 1) {
      console.log("order err, should one order info");
      console.log(orderInfo);
      res.send(payOrderRet);
      return;
    }
    var orderInfo = ordersRet[0];
    var orderDetail = JSON.parse(orderInfo.order_detail);
    var orderDishes = orderDetail.dishInfo;
    var userOrder = {};
    // 转换下格式
    for (index in orderDishes) {
      userOrder[orderDishes[index].dishName] = orderDishes[index];
    }

    console.log("rebuy_submit with order:" + JSON.stringify(userOrder));
    genOrderDetail(userOrder, userInfo, function(err, orderRet) {
      if (err) {
        res.send(payOrderRet);
        return;
      }
      if (orderRet.orderAmount <= 0) {
        console.log("submit order error");
        res.send(payOrderRet);
      }
      // 订单落地数据库
      orderRet["pay_type"] = "dish_pay"
      orderRet["charge_type"] = "fanpiao"
      orderRet["prepayID"] = "pay_with_fanpiao";
      dbProd.addUserOrder(orderRet, function(err) {
        if (err) {
          console.log("newOrderToDB error " + err);
          res.send(payOrderRet);
          return;
        }
        dbProd.addWechatPayOrder(orderRet, function(err) {
          if (!err) {
            payOrderWithFanPiao(orderRet, userInfo, function(err) {
              if (!err) {
                // 成功 将支付订单标记成功
                dbProd.payOrderSuccess(orderRet["payID"], "pay_with_fanpiao", function(err) {
                  if (!err) {
                    // 成功 返回客户端支付成功
                    payOrderRet = {"error":false, "error_msg":"订单数据非法"}
                  } else {
                    // 失败 返回客户端信息
                    // 提示用户扣钱了 联系用户
                    payOrderRet = {"error":true, "error_msg":"请联系客服"}
                  }
                  res.send(payOrderRet);
                });
              } else {
                // 扣除饭票失败
                payOrderRet = {"error":true, "error_msg":"饭票余额不足，请购买饭票"}
                res.send(payOrderRet);
              }
            });
          } else {
            payOrderRet["error"] = true;
            payOrderRet["error_msg"] = "数据异常";
            res.send(payOrderRet);
          }
        });
      })
    });
  });
})


router.get('/rebuy_submit/:order_id', function(req, res, next) {
  console.log("rebuy_order " + req.params.order_id);
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var payOrderRet = {"error":true, "msg":"订单数据非法"}
  var orderID = req.params.order_id;
  dbProd.getOrderInfo(orderID, function(err, ordersRet) {
    if (err) {
      console.log("getOrderInfo err:" + err);
      res.send(payOrderRet);
      return;
    }
    if (ordersRet.length != 1) {
      console.log("order err, should one order info");
      console.log(orderInfo);
      res.send(payOrderRet);
      return;
    }
    var orderInfo = ordersRet[0];
    var orderDetail = JSON.parse(orderInfo.order_detail);
    var orderDishes = orderDetail.dishInfo;
    var userOrder = {};
    // 转换下格式
    for (index in orderDishes) {
      userOrder[orderDishes[index].dishName] = orderDishes[index];
    }

    console.log("rebuy_submit with order:" + JSON.stringify(userOrder));
    genOrderDetail(userOrder, userInfo, function(err, orderRet) {
      if (err) {
        res.send(payOrderRet);
        return;
      }
      if (orderRet.orderAmount <= 0) {
        console.log("submit order error");
        res.send(payOrderRet);
      }
      // 订单落地数据库
      orderRet["pay_type"] = "dish_pay"
      orderRet["charge_type"] = "weixin"
      dbProd.addUserOrder(orderRet, function(err) {
        if (err) {
          console.log("newOrderToDB error " + err);
          res.send(payOrderRet);
          return;
        }
        // 生成微信预支付订单
        wechatPay.genPreWechatOrder(orderRet, userInfo, function(err, msg) {
          if (!err) {
            msg["error"] = false;
            orderRet["prepayID"] = msg.package.split("=")[1];
            dbProd.addWechatPayOrder(orderRet, function(err) {
              if (!err) {
              } else {
                msg["error"] = true;
                msg["error_msg"] = "数据异常";
              }
              res.send(msg);
            });
          } else {
            msg["error"] = true;
            msg["error_msg"] = "error from wx prepay";
            res.send(msg);
          }
        });
      })
    });
  });
})

router.get('/rebuy_order', function(req, res, next) {
  var userInfo = {};
  if (debug) {
    userInfo["phone"] = "18965326598";
    userInfo["user_addr"] = "查积分多少立方进来看见了大家l"
    console.log(userInfo);
  } else {
    userInfo = validateSession(req, res);
    if (!userInfo) {
      return;
    }
  }
  var dataRet = {"error":true};
  var orderID = req.query.order_id;
  console.log("rebuy id: " + orderID);
  dbProd.getOrderInfo(orderID, function(err, ordersRet) {
    if (err) {
      console.log("getOrderInfo err:" + err);
      res.send(dataRet);
      return;
    }
    if (ordersRet.length != 1) {
      console.log("order err, should one order info");
      console.log(orderInfo);
      res.send(dataRet);
      return;
    }
    var orderInfo = ordersRet[0];
    var orderDetail = JSON.parse(orderInfo.order_detail);
    orderDetail["detailStr"] = JSON.stringify(orderDetail);
    // 1 订单处于未支付且订单属于这个uid
    // 成功的订单才有这个功能
    if (orderInfo.uid != userInfo.uid) {
      dataRet["error_msg"] = "订单信息不合法, 请重新下单"
      console.log(dataRet);
      res.send(dataRet);
      return;
    }
    dbUser.getFanPiaoInfo(userInfo.uid, function(err, fanPiaoInfo) {
      if (!err) {
        if (fanPiaoInfo.length > 0) {
          fanPiaoInfo = fanPiaoInfo[0];
        } else {
          fanPiaoInfo = {"cur_amount": 0, "uid":userInfo.uid};
        }
        res.render('shopcart_v2.html', {
          "userInfo":userInfo,
          "orderDetail":orderDetail,
          fanPiaoInfo: fanPiaoInfo,
          fanPiaoConfig:fanPiaoConfig.fanPiaoInfoArray,
        });
      } else {
      }

    });
  });
});
router.get('/shop_cart', function(req, res, next) {

  var userInfo = {};
  if (debug) {
    userInfo["phone"] = "18965326598";
    userInfo["user_addr"] = "查积分多少立方进来看见了大家l"
    console.log(userInfo);
  } else {
    userInfo = validateSession(req, res);
    if (!userInfo) {
      return;
    }
  }
  console.log(req.session);
  var shopCartList = req.session.shopCart;
  if (shopCartList == undefined) {
    shopCartList = {};
  }
  dbUser.getFanPiaoInfo(userInfo.uid, function(err, fanPiaoInfo) {
    if (!err) {
      if (fanPiaoInfo.length > 0) {
        fanPiaoInfo = fanPiaoInfo[0];
      } else {
        fanPiaoInfo = {"cur_amount": 0, "uid":userInfo.uid};
      }
      res.render('shopcart.html', {
        "userInfo":userInfo,
        fanPiaoInfo: fanPiaoInfo,
        fanPiaoConfig:fanPiaoConfig.fanPiaoInfoArray,
      });
    } else {
    }
  });

});

router.post("/calculate_order", function(req, res, next) {
  if (!debug) {
    var userInfo = validateSession(req, res);
    if (!userInfo) {
      return;
    }
  }
  var dataRet = {"orderAmount":0};
  if (req.body.userOrder <= "") {
    res.send(dataRet);
    return;
  }
  var userOrder = JSON.parse(req.body.userOrder);
  // 根据用户上传的订单 得到满减 运维费用条目
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
      res.send(dataRet);
    } else {
      console.log(err);
    }
  })

});

router.get('/point_test', function(req, res, next) {
  var userInfo = validateSession(req, res);
  dbProd.getJiFenProd(0, function(err, jifenProds) {
    console.log(jifenProds);
    res.render('index.html', {userInfo: userInfo,jifenProd:jifenProds });
  });
});

router.get('/point_record', function(req, res, next) {
  // var userInfo = validateSession(req, res);
  var userInfo = {};
  userInfo.openID = "o3GUCwb5mD7wGI9NYVZ2D2jscBOY";
  if (!userInfo) {
    return;
  }
  // 如果没绑定， 展示提示用户绑定手机号的页面
  dbUser.getUserInfoByOpenID(userInfo.openID, function(err, cbUserInfo) {
    // 如果是空 用户第一次用微信登录 记录这个openid
    if (cbUserInfo.length == 0) {
      dbUser.addWXUser(userInfo.openID, function(err, msg) {
        if (err) {
          console.log("error: " + msg);
        } else {
          res.render('index.html', {userInfo: userInfo, fanPiaoConfig:fanPiaoConfig.fanPiaoInfoArray});
        }
      });
    } else if (!(cbUserInfo[0].uid)){
      // 登陆过 但是还是没有绑定手机号的
      res.render('index.html', { userInfo:userInfo, fanPiaoConfig:fanPiaoConfig.fanPiaoInfoArray});
    } else {
      // 展示用户积分信息
      var baseInfo = cbUserInfo[0];
      for (key in baseInfo) {
        userInfo[key] = baseInfo[key];
      }
      userInfo.allPhone = [{"phone" : baseInfo.phone}];
      userInfo.pointRecCnt = 0;
      dbUser.getUserPointHistoryByPhone(baseInfo.phone, function(err, cbUserPointHistory) {
        if (!err) {
          userInfo.pointHistory = cbUserPointHistory;
          userInfo.pointRecCnt = cbUserPointHistory.length;
        }
        console.log("#################, userInfo");
        console.log(userInfo);
        res.render('point_record.html', {userInfo: userInfo });
      })
    }
  })
});

router.get('/pointFAQ', function(req, res, next) {
  console.log("pointFAQ");
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  res.render("point_faq.html", {});
});

router.get('/addPhone/:backPage', function(req, res, next) {
  console.log("add_phone " + req.params.backPage);
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  console.log(userInfo);
  res.render("add_phone.html", {backPage:req.params.backPage});
});

router.get('/pointFAQ', function(req, res, next) {
  console.log("pointFAQ");
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  res.render("point_faq.html", {});
});




router.get('/getVerifyCode', function(req, res, next) {
  userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var ret = {};
  var phone = req.query.phone;
  var codeInfo = generateSmsCodeInfo(phone);
  console.log("getVerifyCode for phone: " + phone + " code: " + JSON.stringify(codeInfo));
  if (codeInfo.err) {
    ret.err = codeInfo.err;
    ret.errMsg = codeInfo.errMsg;
    res.send(JSON.stringify(ret));
  } else {
    sms.sendNoticeSMS(phone, codeInfo.codeMsg, function(err) {
      console.log(err);
      verifyCodeMap[phone] = codeInfo;
      ret.err = false;
      res.send(JSON.stringify(ret));
    })
  }
})

router.get("/verifyPhone", function(req, res) {
  var phone = req.query.phone;
  var code = req.query.code;
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return ;
  }
  var bindRet = {};
  if (verifySmsCode(phone, code)) {
    // 验证码通过  将手机号绑定到userInfo.openID
    dbUser.bindUser(userInfo, phone, function(err, phoneUserInfo) {
      console.log("bindUser " + err);
      if (err) {
        bindRet["err"] = true;
        bindRet["errMsg"] = JSON.stringify(err);
      } else {
        dbUser.getUserInfoByOpenID(userInfo.openID, function(err, cbUserInfo) {
          console.log("getUserInfoByOpenID" + err)
          if (err) {
            bindRet["err"] = true;
            bindRet["errMsg"] = JSON.stringify(err);
          } else if (cbUserInfo.length > 0) {
            bindRet["err"] = false;
            var updateInfo = cbUserInfo[0];
            for (key in updateInfo) {
              userInfo[key] = updateInfo[key];
            }
          }
          console.log("userInfo:" + JSON.stringify(userInfo));
          res.send(bindRet);
        });
      }
    });
  } else {
    bindRet.err = true;
    bindRet.errMsg = "验证码错误或者已经失效"
    res.send(bindRet);
  }
})

router.get("/jifen_prod_detail/:id", function(req, res) {
  userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var prodID = req.query.id;
  dbProd.getJiFenProd(prodID, function(err, jifenProds) {
    console.log(jifenProds);
    if (!err) {
      oneProdInfo = jifenProds[0];
      res.render('jifen_prod.html', {userInfo: userInfo,prodInfo:oneProdInfo });
    } else {
    }
  })
})

router.get('/prodConfirm/:prodID/:num', function(req, res, next) {
  var prodID = req.params.prodID;
  var num = req.params.num;
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  // 获取产品信息
  dbProd.getJiFenProd(prodID, function(err, jifenProds) {
    if (!err) {
      oneProdInfo = jifenProds[0];
      var needPoint = oneProdInfo.jifen_price * num;
      if (needPoint > userInfo.point) {
        // error
      } else {
        console.log("prodConfirm: " + oneProdInfo.jifen_price + "* " + num + "= " + needPoint);
        var pointBefore = userInfo.point;
        userInfo.point -= needPoint;
        dbUser.updateUserPointInfo(userInfo, function(err) {
          if (!err) {
            var orderInfo = {
              "uid" : userInfo.uid,
              "prod_id" : prodID,
              "prod_name" : oneProdInfo.prod_name,
              "order_num" : num,
              "price_type" : 1,
              "jifen_cost" : needPoint,
              "rmb_cost" : 0,
              "aval_balance" : 0,
              "aval_point" : userInfo.point,
            }
            dbProd.addJiFenOrder(orderInfo, function(err) {
              if (!err) {
                res.send("order ok");
              } else {
                res.send("order error");
              }
            });
          } else {
          }
        })
      }
    } else {
    }
  })
});

router.get('/orderRecord', function(req, res, next) {
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  // 获取产品信息
  dbProd.getOrderRecord(userInfo.uid, function(err, allOrders) {

    if (!err) {
      console.log(allOrders);
      res.render("order_record.html", {orderRecord:allOrders})
    } else {
      console.log("orderRecord error " + allOrders);
      // res.redirect("/point");
    }
  })
});

// 根据用户提交的订单数据 计算最终的订单价格以及订单详情
function genOrderDetail(userOrder, userInfo, cb) {
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
    var dataRet = {};
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
      // 生成一个订单id
      var orderID = Math.floor(Math.random()*10000000) + (new Date()).getTime() + "_orderID";
      var payID = Math.floor(Math.random()*10000000) + (new Date()).getTime() + "_payID";

      dataRet["orderID"] = orderID;
      dataRet["payID"] = payID;
      dataRet["uid"] = userInfo.uid;
      var dateNow = new Date();
      dataRet["time_start"] =genTimeStr(dateNow);
      dateNow.setTime(dateNow.getTime() + 10 * 60 * 1000);
      dataRet["time_expire"] =genTimeStr(dateNow);

      dataRet["discountInfo"] = discountInfo;
      if (debugAmount) {
        dishAmount = 0.1;
      }
      dataRet["orderAmount"] = dishAmount;
      console.log(JSON.stringify(dataRet));
    } else {
      console.log(err);
    }
    cb(false, dataRet);
  })
}

router.post('/submit_order', function(req, res, next) {
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var payOrderRet = {"err":true, "msg":"订单数据非法"}
  if (req.body.userOrder <= "") {
    res.send(payOrderRet);
    return;
  }
  console.log(req.body.userOrder)
  var userOrder = JSON.parse(req.body.userOrder);
  genOrderDetail(userOrder, userInfo, function(err, orderRet) {
    if (err) {
      res.send(payOrderRet);
      return;
    }
    if (orderRet.orderAmount <= 0) {
      console.log("submit order error");
      res.send(payOrderRet);
    }
    // 订单落地数据库
    orderRet["pay_type"] = "dish_pay"
    orderRet["charge_type"] = "weixin"
    dbProd.addUserOrder(orderRet, function(err) {
      if (err) {
        console.log("newOrderToDB error " + err);
        res.send(payOrderRet);
        return;
      }
      // 生成微信预支付订单
      wechatPay.genPreWechatOrder(orderRet, userInfo, function(err, msg) {
        if (!err) {
          msg["error"] = false;
          orderRet["prepayID"] = msg.package.split("=")[1];
          dbProd.addWechatPayOrder(orderRet, function(err) {
            if (!err) {
            } else {
              msg["error"] = true;
              msg["error_msg"] = "数据异常";
            }
            res.send(msg);
          });
        } else {
          msg["error"] = true;
          msg["error_msg"] = "error from wx prepay";
          res.send(msg);
        }
      });
    })
    payOrderRet["err"] = false;
    payOrderRet["msg"] = "success";
    payOrderRet["orderInfo"] = orderRet;
  });
});



router.post('/pay_order_with_fanpiao', function(req, res, next) {
  console.log("submit_order");
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var payOrderRet = {"err":true, "msg":"订单数据非法"}
  if (req.body.userOrder <= "") {
    res.send(payOrderRet);
    return;
  }
  console.log(req.body.userOrder)
  var userOrder = JSON.parse(req.body.userOrder);
  genOrderDetail(userOrder, userInfo, function(err, orderRet) {
    if (err) {
      res.send(payOrderRet);
      return;
    }
    if (orderRet.orderAmount <= 0) {
      console.log("submit order error");
      res.send(payOrderRet);
    }
    // 订单落地数据库
    orderRet["pay_type"] = "dish_pay";
    orderRet["charge_type"] = "fanpiao"
    orderRet["prepayID"] = "pay_with_fanpiao";
    dbProd.addUserOrder(orderRet, function(err) {
      if (err) {
        console.log("newOrderToDB error " + err);
        res.send(payOrderRet);
        return;
      }
      dbProd.addWechatPayOrder(orderRet, function(err) {
        if (!err) {
          // 扣饭票
          payOrderWithFanPiao(orderRet, userInfo, function(err) {
            if (!err) {
              // 成功 将支付订单标记成功
              dbProd.payOrderSuccess(orderRet["payID"], "pay_with_fanpiao", function(err) {
                if (!err) {
                  // 成功 返回客户端支付成功
                  payOrderRet = {"error":false, "error_msg":"订单数据非法"}
                } else {
                  // 失败 返回客户端信息
                  // 提示用户扣钱了 联系用户
                  payOrderRet = {"error":true, "error_msg":"请联系客服"}
                }
                res.send(payOrderRet);
              });
            } else {
              // 扣除饭票失败
              payOrderRet = {"error":true, "error_msg":"饭票余额不足，请购买饭票"}
              res.send(payOrderRet);
            }
          });
        } else {
          payOrderRet["error"] = true;
          payOrderRet["error_msg"] = "数据异常";
          res.send(payOrderRet);
        }
      });

    })
  });
});


router.get("/pay_notify", function(req, res, next) {
  console.log("pay_notify: " + JSON.stringify(req));
});

router.get("/orders", function(req, res, next) {

  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  dbProd.getUserOrders(userInfo.uid, function(err, data) {
    var orders = [];
    var noOrders = true;
    if (err) {
      console.log("getUserOrders: "  + err);
    } else {
      for (index in data) {
        var orderDetail = JSON.parse(data[index].order_detail);
        orderDetail["pay_status"] = data[index].pay_status;
        var orderTime = orderDetail.time_start;
        orderDetail["order_time"] = orderTime.substr(0,4) + "-" + orderTime.substr(4, 2) + "-" + orderTime.substr(6, 2) + " " + orderTime.substr(8,2) + ":" + orderTime.substr(10,2);
        orders.push(orderDetail);
        noOrders = false;
      }
    }
    console.log(JSON.stringify(orders));
    res.render("user_order_records", {allOders: orders, noOrders:noOrders});
  })
});

router.post("/pay_notify", function(req, res, next) {
  console.log("pay_notify: ");
  var retXmlData = "";
  req.on("data", function(data) {
    retXmlData += data;
  });
  req.on("end", function() {
    wechatPay.parsePayNotify(retXmlData, function(err, retObj) {

      console.log("parseRet err:" + err + " ret: " + JSON.stringify(retObj));
      if (retObj.xml.result_code.indexOf("SUCCESS") != -1) {
        dbProd.payOrderSuccess(retObj.xml.out_trade_no, retObj.xml.transaction_id, function(err) {
          if (err) {
            console.log("payOrderSuccess: " + err)
          } else {
            var xml = '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';
            res.send(xml);
          }
        })
        var payID = retObj.xml.out_trade_no;
      } else {
      }

    })
  })
});

router.post("/fanpiao_pay_notify", function(req, res, next) {
  console.log("fanpiao_pay_notify: ");
  var retXmlData = "";
  req.on("data", function(data) {
    retXmlData += data;
  });
  req.on("end", function() {
    wechatPay.parsePayNotify(retXmlData, function(err, retObj) {

      console.log("parseRet err:" + err + " ret: " + JSON.stringify(retObj));
      if (retObj.xml.result_code.indexOf("SUCCESS") != -1) {
        dbProd.payOrderSuccess(retObj.xml.out_trade_no, retObj.xml.transaction_id, function(err) {
          if (err) {
            console.log("payOrderSuccess: " + err)
            // 更新失败 等到继续回调
          } else {
            dbUser.fanPiaoPaySuccess(retObj.xml.out_trade_no, function(err) {
              if (!err) {
                console.log("payID: " + retObj.xml.out_trade_no + " 上账成功");
                var xml = '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';
                // 更新成功 把余额加到饭票表
                res.send(xml);
              } else {
                console.log("饭票上账失败 payID: " + retObj.xml.out_trade_no);
              }
            });
          }
        })
        var payID = retObj.xml.out_trade_no;
      } else {
      }

    })
  })
});


router.post("/wx_user/set_addr", function(req, res, next) {
  var dataRet = {"error":true};
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var addr = req.body.addr;
  dbUser.setWXAddr(userInfo, addr, function(err) {
    if (err) {
      console.log("setWXAddr error: " + err);
    } else {
      dataRet["error"] = false;
      userInfo.user_addr = addr;
    }
    res.send(dataRet);
  })
});

router.get("/repay_id/:order_id", function(req, res, next) {
  // 用户点击重新支付订单
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var dataRet = {"error":true};
  var orderID = req.params.order_id;
  console.log("repay id: " + orderID);
  dbProd.getOrderInfo(orderID, function(err, ordersRet) {
    if (err) {
      console.log("getOrderInfo err:" + err);
      res.send(dataRet);
      return;
    }
    if (ordersRet.length != 1) {
      console.log("order err, should one order info");
      console.log(orderInfo);
      res.send(dataRet);
      return;
    }
    var orderInfo = ordersRet[0];
    // 1 订单处于未支付且订单属于这个uid
    if (orderInfo.uid != userInfo.uid || orderInfo.pay_status != 1) {
      dataRet["error_msg"] = "订单信息不合法, 请重新下单"
      console.log(dataRet);
      res.send(dataRet);
      return;
    }
    console.log("repay for order_id:" + orderInfo.order_id + " prepay_id: "+ orderInfo.prepay_id);
    var h5Msg = h5Request(orderInfo.prepay_id);
    dataRet["error"] = false;
    dataRet["h5Request"] = h5Msg;
    console.log("repay return:" + JSON.stringify(dataRet));
    res.send(dataRet);
  });
})

router.get("/buy_fanpiao/:pay_amount/:buy_amount", function(req, res) {
  var userInfo = validateSession(req, res);
  if (!userInfo) {
    return;
  }
  var payAmount = req.params.pay_amount;
  var buyAmount = req.params.buy_amount;
  var ret = {"error": true}
  if (fanPiaoConfig.fanPiaoInfo[payAmount] !== buyAmount) {
    console.log("payAmount: " + payAmount + " not for buyAmount: " + buyAmount  + " config is: " + fanPiaoConfig.fanPiaoInfo[payAmount]);
    res.send(ret);
  } else {
    var fanPiaoOrder = {};
    fanPiaoOrder["uid"] = userInfo.uid;
    fanPiaoOrder["payID"] = Math.floor(Math.random()*10000000) + (new Date()).getTime() + "_payID";
    fanPiaoOrder["payAmount"] = payAmount;
    fanPiaoOrder["buyAmount"] = buyAmount;
    fanPiaoOrder["orderAmount"] = payAmount;
    fanPiaoOrder["orderAmount"] = 0.1;
    fanPiaoOrder["pay_type"] = "fanpiao_pay";
    orderRet["charge_type"] = "weixin"
    dbProd.addFanPiaoOrder(fanPiaoOrder, function(err) {
      if (!err) {
        wechatPay.genPreWechatOrder(fanPiaoOrder, userInfo, function(err, msg) {
          if (!err) {
            msg["error"] = false;
            fanPiaoOrder["prepayID"] = msg.package.split("=")[1];
            dbProd.addWechatPayOrder(fanPiaoOrder, function(err) {
              if (!err) {
              } else {
                msg["error"] = true;
                msg["error_msg"] = "数据异常";
              }
              res.send(msg);
            });
          } else {
            msg["error"] = true;
            msg["error_msg"] = "error from wx prepay";
            res.send(msg);
          }
        })
      } else {
      }
    });
  }
});

module.exports = router;
