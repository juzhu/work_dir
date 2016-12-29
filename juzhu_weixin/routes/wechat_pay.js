var dbMysql = require('./mysql_pool.js');
var dbPool = dbMysql.pool;
var dbQuery = dbMysql.mysql_query;
var config = require('./config.js');
var request = require('request');
var xml2js=require('xml2js') ;
var parser = new xml2js.Parser();

var weChatUrl = "https://api.mch.weixin.qq.com/pay/unifiedorder"
var sighStrKey ='4C46CC1FE8FAB277D5F80BD7B22B225B';
var appid='wxde03f0c82c8bc4f0'
var attach = "taoyuanju"
var body = "dishfee"
var detail = "dishfee"
var device_info='WEB'
var fee_type="CNY"
var goods_tag = "bbb"
var mch_id='1309488901'

var nonce_str = ""
var dish_notify_url = "http://appmishu.cn/pay_notify"
var fanpiao_notify_url = "http://appmishu.cn/fanpiao_pay_notify"
var openid = ""
var out_trade_no= ""
var product_id="" // 订单号
var sign = ""
var spbill_create_ip=""
var total_fee=999
var time_expire = ""
var time_start = ""
var trade_type="JSAPI"

function genH5Request(prepay_id) {
  nonce_str = Math.floor(Math.random() * 10000000) + (new Date()).getTime()  ;
  var h5Request = {
    "appId":appid.toString(),     //公众号名称，由商户传入
    "timeStamp":(Math.floor((new Date()).getTime()/1000)).toString(),         //时间戳，自1970年以来的秒数
    "nonceStr":nonce_str.toString(),//随机串
    "package" : "prepay_id="+ prepay_id,
    "signType": "MD5",         //微信签名方式：
  }
  var strToSign="appId=" + appid + "&nonceStr=" + h5Request.nonceStr + "&package=" + h5Request.package + "&signType=" + h5Request.signType + "&timeStamp=" + h5Request.timeStamp;
  var sign = h5PaySign(strToSign).toUpperCase();
  h5Request["paySign"] = sign
  console.log("strtoSign: " + strToSign);
  console.log(JSON.stringify(h5Request));
  return h5Request;
}

function raw(args) {
  var keys = Object.keys(args);
  keys = keys.sort()
  var newArgs = {};
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  var string = '';
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  string = string.substr(1);
  return string;
};

function h5PaySign(string) {
  var key = sighStrKey;
  string = string + '&key='+key;  //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
  var crypto = require('crypto');
  return crypto.createHash('md5').update(string,'utf8').digest('hex');
}
function paysign(appid,attach,body,mch_id,nonce_str,notify_url,openid, out_trade_no,spbill_create_ip,total_fee,trade_type) {
  var ret = {
    appid: appid,
    attach: attach,
    body: body,
    mch_id: mch_id,
    nonce_str: nonce_str,
    notify_url:notify_url,
    openid:openid,
    out_trade_no:out_trade_no,
    spbill_create_ip:spbill_create_ip,
    total_fee:total_fee,
    trade_type:trade_type
  };
  var string = raw(ret);
  var key = sighStrKey;
  string = string + '&key='+key;  //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
  console.log("string to sign: " + string);
  var crypto = require('crypto');
  return crypto.createHash('md5').update(string,'utf8').digest('hex');
};

var preXml = "<xml><appid>" + appid + "</appid><attach>" + attach + "</attach><body>" + body + "</body><mch_id>" + mch_id + "</mch_id>";
function xmlEscape(value) {
  value = value.replace(/&/g,"&amp;");
  value = value.replace(/</g,"&lt;");
  value = value.replace(/>/g,"&gt;");
  value = value.replace(/"/g,"&quot;");
  value = value.replace(/'/g,"&apos;");
  return value;
}

function addSignItem(name, value) {
  return "&" + name + "=" + value;
}

function addPostData(name, value) {
  return "<" + name + ">" + value + "</" + name + ">";
}

var userIp = "119.29.108.228";
var tradeType = "JSAPI";

var wechatPay = new Object({
  "genPreWechatOrder" : function(userOrder, userInfo, cb) {
    var pay_notify_url = dish_notify_url;
    if (userOrder.pay_type == "fanpiao_pay") {
      pay_notify_url = fanpiao_notify_url;
    }
    var postData = preXml;
    nonce_str = Math.floor(Math.random() * 10000000) + (new Date()).getTime()  ;
    postData  += addPostData("nonce_str" , nonce_str);
    postData += addPostData("notify_url", pay_notify_url);
    postData += addPostData("openid", userInfo.openID);
    postData += addPostData("out_trade_no", userOrder.payID);
    postData += addPostData("spbill_create_ip", userIp);
    postData += addPostData("total_fee", userOrder.orderAmount * 100);
    postData += addPostData("trade_type", tradeType);
    var sign  = paysign(appid, attach, body, mch_id, nonce_str, pay_notify_url, userInfo.openID, userOrder.payID, userIp, userOrder.orderAmount * 100, tradeType);
    sign = sign.toUpperCase();

    postData += addPostData("sign", sign);
    postData += "</xml>"
    // 请求微信
    request({
      url:weChatUrl,
      method:"POST",
      body : postData
    }, function(err, resp, body) {
      if (!err && resp.statusCode == 200) {
        console.log(body);
      }
      parser.parseString(body, function (err, result) {
        if (!err) {
          console.log("err:" + err + JSON.stringify(result.xml));
          if (result.xml.result_code.indexOf("SUCCESS") != -1) {
            var h5Request = genH5Request(result.xml.prepay_id)
            cb(err, h5Request);
          } else {
            console.log("prepay error");
            cb(true);
          }
        } else {
          cb(true, "err occure");
        }
      });
    })
    console.log("post_data: " + postData + " sign: " + sign);
  },
  "parsePayNotify": function(notifyData, cb) {
    parser.parseString(notifyData, cb);
  }
});

exports.wechatPay = wechatPay;
exports.genH5Request = genH5Request;
