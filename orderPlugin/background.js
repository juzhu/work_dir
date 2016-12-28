alert("im running");
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript(null,
                           {code:"document.body.bgColor='red'"});
});

function getLatLng(address, cb) {
    console.log("http://apis.map.qq.com/ws/geocoder/v1/?address=深圳市宝安区西乡街道" + address + "&key=O7BBZ-RZPCQ-YWN5D-GVKZ2-YIPIV-G5FHN");
    var addr = "http://apis.map.qq.com/ws/geocoder/v1/?address=" + address + "&key=O7BBZ-RZPCQ-YWN5D-GVKZ2-YIPIV-G5FHN";
    // addr = encodeURIComponent(addr); 
    console.log(addr);
    $.get(addr, function(data) {
        console.log(data);
        var addrDefault = {"lat":0, "lng":0};
        if (data.status == 0) {
          cb(data.result.location);
        } else {
           cb(addrDefault)
        }
    }, "json")
}

chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    // alert("recv request: " + JSON.stringify(request));
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    request['lat'] = 0;
    request['lng'] = 0;
    console.log(JSON.stringify(request));
    if (request.type && request.type=='heartbeat') {
      //add, 2016-12-08
      $.ajax({
        url: 'http://119.29.108.228:3000/reportHeartBeat',
        type: 'POST',// 必须是POST
        contentType:'application/json; charset=UTF-8',
        data: JSON.stringify(request),// 数据 必须是字符串
        dataType: 'json',// 期望返回类型 json, xml
        processData: false,// 防止 data 被预处理
        success: function (data, success) {
          console.log("report heartbeat return: " + data + " success " + success);
        }
      });
    } else {
      $.ajax({
        url: 'http://119.29.108.228:3000/addorder',
        type: 'POST',// 必须是POST
        contentType:'application/json; charset=UTF-8',
        data: JSON.stringify(request),// 数据 必须是字符串
        dataType: 'json',// 期望返回类型 json, xml
        processData: false,// 防止 data 被预处理
        success: function (data, success) {
          console.log("add order return: " + data + " success " + success);
        }
      });
    }
  });

