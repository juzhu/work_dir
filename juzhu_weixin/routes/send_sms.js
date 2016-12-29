var request = require('request');
var debug = 0;
function sendOrderNotice (mobile, content, cb) {
  if (debug) {
    cb(false);
    return;
  }
  username = 'szwc';   //用户账号
  password = 'asdf123'; //密码
  apikey = '2561300aaa06b0780dac074221052469'; //密码

  url = 'http://m.5c.com.cn/api/send/?';
  // url = 'http://localhost:9200/test';
  var data = {
    'username' : username,          //用户账号
    'password': password,        //密码
    'mobile' : mobile,          //号码
    'content' : content,        //内容
    'apikey' : apikey,            //apikey
  };
  var ret = request.post(url, function(err,response,body) {
    cb(body);
  }).form(data);
}

function sendsms(mobile, content, cb) {

  username = '17727828865';   //用户账号
  password = 'asdf123'; //密码
  apikey = '7a4f54c857048122df3e7cd242b1930e'; //密码

  url = 'http://m.5c.com.cn/api/send/?';
  // url = 'http://localhost:9200/test';
  var data = {
    'username' : username,          //用户账号
    'password': password,        //密码
    'mobile' : mobile,          //号码
    'content' : content,        //内容
    'apikey' : apikey,            //apikey
  };
  var ret = request.post(url, function(err,response,body) {
    cb(body);
  }).form(data);
}

exports.sendsms = sendsms;
exports.orderNotice = sendOrderNotice;
exports.codeNotice = sendOrderNotice;
//sendsms('17727828865,17727961386', '尊敬的客户，本周新推出酸辣鸡杂，重庆烧鸡公等新菜品，各大外卖平台均已上架，欢迎品尝回复N退订【聚箸】', function(send_ret) {
  //console.log(send_ret);
// });
