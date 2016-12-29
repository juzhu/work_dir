var express = require('express');

var wechat = require('wechat');
var config = {
  token: 'juzhu',
  appid: 'wxde03f0c82c8bc4f0',
  encodingAESKey: 'BXMsd6lYEpq253brcdKLIZfTzS5Yj2DbegfOXudJfHD'
};

module.exports = (wechat(config, function (req, res, next) {
  // 微信输入信息都在req.weixin上
  var message = req.weixin;
  console.log("recv msg" + JSON.stringify(message));
  if (message.FromUserName === 'diaosi') {
    // 回复屌丝(普通回复)
    res.reply('hehe');
  } else if (message.FromUserName === 'text') {
    //你也可以这样回复text类型的信息
    res.reply({
      content: 'text object',
      type: 'text'
    });
  } else if (message.FromUserName === 'hehe') {
    // 回复一段音乐
    res.reply({
      type: "music",
      content: {
        title: "来段音乐吧",
        description: "一无所有",
        musicUrl: "http://mp3.com/xx.mp3",
        hqMusicUrl: "http://mp3.com/xx.mp3",
        thumbMediaId: "thisThumbMediaId"
      }
    });
  } else {
    res.reply('欢迎光临聚箸，请在美团，饿了么，百度外卖搜索聚箸下单');
}
}));
