var request = require('request');
var uuid = require('node-uuid');
var dbQuery = require('../mysql_pool').mysql_query;

var blackListPhone = [];

function loadBlackListPhone(cb) {
  var sql = "select phone from user_market.phone_black_list";
  dbQuery(sql, cb);
}

function filterBlackPhone(mobile, cb) {
  console.log("before filter: " + mobile);
  var mobile_array = mobile.split(",");
  var mobile_ret = [];
  loadBlackListPhone(function(err, blackList) {
    if (!err) {
      var allBlackList = "";
      blackList.forEach(function(phoneRow) {
        allBlackList += "," + phoneRow.phone;
      })
      console.log(allBlackList);
      mobile_array.forEach(function(phone) {
        if (allBlackList.indexOf(phone) == -1) {
          mobile_ret.push(phone);
        }
      });

      var phone_str = mobile_ret.join(",");
      console.log("after filter: " + phone_str);
      cb(false, phone_str);
    } else {
      console.log("load black list error");
      cb(true);
    }
  });

}

function sendsmsWithFilterBlackList(mobile, content, cb) {
  filterBlackPhone(mobile, function(err, mobile_ret) {
    if (!err) {
      sendsms(mobile_ret, content, cb);
    } else {
      console.log("filter error");
      cb(true, 0);
    }
  });
}

// cb(errcode, id)
function sendNotice(mobile, content, cb) {
  username = '8LIUXB';   //用户账号
  password = 'Juzhu123'; //密码

  url = 'http://222.73.117.156/msg/HttpBatchSendSM';
  var data = {
    'account' : username,          //用户账号
    'pswd': password,        //密码
    'msg' : content,        //内容
    'mobile' : mobile,          //号码
    'needstatus' : 'true',            //apikey
    'extno':''
  };

  console.log("cl_sms " + JSON.stringify(data));

  var batchID = uuid.v4()

  var insertNum = 0;
  var phones = mobile.split(",");
  phones.forEach(function(phone) {
    var sql = "insert into user_market.notice_sms_record set phone='" + phone + "', content='" + content + "', batch_id='" + batchID + "', send_time=now(), sms_ret='INIT'";
    dbQuery(sql, function(err) {
      if (err) {
        console.log(sql + " err: " + err);
      }
      insertNum += 1;
      if (insertNum == phones.length) {
        // 全部落地数据库完毕 发送
        console.log("cl_sms " + JSON.stringify(data));
        var ret = request.post(url, function(err,response,body) {
          console.log("call: " + url + " return : " + body);
          console.log(JSON.stringify(response));
          if (!err) {
            var ret = body.split(/[, \n]/);
            console.log(ret)
            console.log(ret.length)
            if (ret.length >= 3) {
              var updateSql = "update user_market.notice_sms_record set sms_id='" + ret[2] + "' where batch_id='" + batchID + "'";
              dbQuery(updateSql, function(err) {
                cb(ret[1], ret[2]);
              })
            } else {
              cb(1);
            }
          } else {
            cb(1);
          }
        }).form(data);
      } else {
        console.log("insert num:" + insertNum + " total num: " + phones.length);
      }
    })
  });
}

// cb(errcode, id)
function sendsms(mobile, content, cb) {
  username = 'Liuxiaob_8';   //用户账号
  password = 'Tch956979'; //密码

  url = 'http://222.73.117.169/msg/HttpBatchSendSM';
  var data = {
    'account' : username,          //用户账号
    'pswd': password,        //密码
    'msg' : content,        //内容
    'mobile' : mobile,          //号码
    'needstatus' : 'true',            //apikey
    'extno':''
  };

  console.log("cl_sms " + JSON.stringify(data));

  var batchID = uuid.v4()

  var insertNum = 0;
  var phones = mobile.split(",");
  phones.forEach(function(phone) {
    var sql = "insert into user_market.sms_record set phone='" + phone + "', content='" + content + "', batch_id='" + batchID + "', send_time=now(), sms_ret='INIT'";
    dbQuery(sql, function(err) {
      if (err) {
        console.log(sql + " err: " + err);
      }
      insertNum += 1;
      if (insertNum == phones.length) {
        // 全部落地数据库完毕 发送
        console.log("cl_sms " + JSON.stringify(data));
        var ret = request.post(url, function(err,response,body) {
          console.log("call: " + url + " return : " + body);
          console.log(JSON.stringify(response));
          if (!err) {
            var ret = body.split(/[, \n]/);
            console.log(ret)
            console.log(ret.length)
            if (ret.length >= 3) {
              var updateSql = "update user_market.sms_record as s,juzhu.juzhu_user_info as u  set sms_id='" + ret[2] + "', s.last_order_time_before_sms=u.last_order_time where batch_id='" + batchID + "' and s.phone=u.phone";
              dbQuery(updateSql, function(err) {
                cb(ret[1], ret[2]);
              })
            } else {
              cb(1);
            }
          } else {
            cb(1);
          }
        }).form(data);
      } else {
        console.log("insert num:" + insertNum + " total num: " + phones.length);
      }
    })
  });
}

exports.sendsms = sendsms;
exports.sendNoticeSMS = sendNotice;
exports.sendsmsWithFilterBlackList = sendsmsWithFilterBlackList;
/*
filterBlackPhone("17727828865,18183377925", function(err, retPhone) {
  console.log("filter test ret: " + retPhone);
})
*/
/*
sendNotice('17727828865', '敬的贺小姐，您的订单我们已收到，大厨正在为您备餐，请耐心等待。上午11点前订餐是个好习惯哦，不仅更优，还能保证送达时间', function(send_ret) {
  console.log(send_ret);
});
*/
