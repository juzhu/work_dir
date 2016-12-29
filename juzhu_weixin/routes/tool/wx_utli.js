var config = require("./config.js")
var request_wx = require("request")
function getAccessToken(cb) {
  var url = config.wxUrlPre + "token?grant_type=client_credential&appid=" + config.appID + "&secret=" + config.appSecret;
  request_wx(url, function(err, response, body) {
    body = JSON.parse(body);
    console.log(body.access_token);
    if (body.access_token !== undefined) {
      console.log("access_token " + JSON.stringify(body.access_token));
      cb(false, body.access_token);
    } else {
      console.log("access_token " + JSON.stringify(body.access_token));
      cb(true, body.errmsg);
    }
    console.log(body.access_token);
  });
}

function createMenu() {
  var menuData = {
    "button": [
      {
        "type": "view",
        "name": "我要点餐",
        "url": "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+ config.appID+ "&redirect_uri=http%3A%2F%2Fappmishu.com%2Fwx_redirect&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect"
      },
      {
        "name": "更多",
        "sub_button": [
          {
            "type": "view",
            "name": "个人中心",
            "url": "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+ config.appID+ "&redirect_uri=http%3A%2F%2Fappmishu.com%2Fwx_redirect_mine&raesponse_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect"
          },
        ]
      }
    ]
  };
  getAccessToken(function(err, token) {
    if (!err) {
      var url = config.wxUrlPre + "menu/create?access_token=" + token;
      console.log(menuData);
      request_wx({url:url, method:"post", body:JSON.stringify(menuData)}, function(err, response, body) {
        console.log("err:" + JSON.stringify(err));
        console.log("response: " + console.log(JSON.stringify(response)));
        console.log("body: " + console.log(JSON.stringify(body)));
      })
    }
  });
}

function getUserAccessToken(userCode, cb) {
  var userInfo = {};
  var url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=";
  url += config.appID + "&secret=" + config.appSecret + "&code=";
  url += userCode + "&grant_type=authorization_code";
  request_wx({url:url, method:"get"}, function(err, response, body) {
    body = JSON.parse(body);
    var access_token = body.access_token;
    var openID = body.openid;
    var userInfoUrl = "https://api.weixin.qq.com/sns/userinfo?access_token=" + access_token + "&openid=" + openID + "&lang=zh_CN";
    request_wx(userInfoUrl, function(err, response, body) {
      if (!err) {
        console.log(body);
        if (body.nickName === undefined) {
          body = JSON.parse(body);
        }
        userInfo["openID"] = openID;
        userInfo["nickName"] = body.nickname;
        userInfo["headImagUrl"] = body.headimgurl;
        cb(false, userInfo);
      }
    })
  })
}
createMenu();
// getAccessToken();
exports.getUserAccessToken = getUserAccessToken;
