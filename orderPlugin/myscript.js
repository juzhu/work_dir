var meituanStoreID = '';
var elemeStoreID = '';
var baiduStoreID = '';
var storeID = '';

var stopWork = false;
var meituanOrderCnt = 0;
var meituanOrderUrl = "http://e.waimai.meituan.com/#/v2/order/history";

function checkWorkTime() {
  // 早上八点半 到晚上十点半
  var hour = (new Date()).getHours();  // 0-23
  var minutes = (new Date()).getMinutes(); // 0-59
  var tm = (parseInt((new Date()).getTime() / 1000)) + (8 * 60 * 60); // 北京时间 加八
  console.log("tm " + tm);
  tm = tm % (24 * 60 * 60);

  if (tm > 8.5 * 60 * 60 && tm < 22.5 * 60 * 60) {
    console.log("current " + hour  + ":" + minutes + " stop work false tm:" + tm);
    stopWork = false;
  } else {
    console.log("current " + hour  + ":" + minutes + " stop work true tm: " + tm);
    stopWork = true;
  meituanOrderCnt = 0;
  }
}
checkWorkTime();
setInterval(checkWorkTime, 10000);

function toDateStr(dateObj) {
  var retStr = dateObj.getFullYear() + "-";
  var month = dateObj.getMonth() + 1;
  if (month <= 9) {
    retStr += "0";
  }
  retStr += month + "-";
  var day = dateObj.getDate();
  if (day <= 9) {
    retStr += "0";
  }
  retStr += day;
  return retStr;
  // return "2016-10-31";
}


function toDateTimeStr(dateObj) {
  var retStr = dateObj.getFullYear() + "-";
  var month = dateObj.getMonth() + 1;
  if (month <= 9) {
    retStr += "0";
  }
  retStr += month + "-";
  var day = dateObj.getDate();
  if (day <= 9) {
    retStr += "0";
  }
  retStr += day + " " ;

  var hour = dateObj.getHours();
  if (hour <= 9) {
    retStr += "0";
  }
  retStr += hour + ":";

  var minute = dateObj.getMinutes();
  if (minute <= 9) {
    retStr += "0";
  }
  retStr += minute + ":";

  var second = dateObj.getSeconds();
  if (second <= 9) {
    retStr += "0";
  }
  retStr += second;
  return retStr;
}

function getShopName(host) {
  if (host.indexOf("wmcrm") >= 0) {
    return "baidu";
  } else if (host.indexOf("taobao") >= 0){
    return "koubei";
  } else if (host.indexOf("melody") >= 0) {
    return "ele";
  } else if (host.indexOf("meituan") >= 0) {
    return "meituan";
  } else {
    return "unknown";
  }
}

function trim(str) {
  //str = str.replace(" ", "");
  str = str.replace(/\n/g, "");
  str = str.replace(/\t/g, "");
  return str;
}

function trimBlank(str) {
  if (str) {
  str = str.replace(/\s/g, "");
  str = str.replace(/\n/g, "");
  str = str.replace(/\t/g, "");
  } else {
    str = "";
  }
  return str;
}



var pageHost = window.location.host;
var shopName = getShopName(pageHost);

var index = 0;
var orderNum = 0;
var allOrder = [];
var allOrderObjs = new Array();
var intv;
var localStore = false;


if(window.localStorage){
  localStore = true;
}else{
  alerT("no localStore");
}

////////////////////////// 美团 ///////////////////////////////

var meituanInterval;
var lastNum = 0;
var pageOrderData = [];
var refreshOrderUrl = 'http://e.waimai.meituan.com/v2/order/history/r/query?getNewVo=1&wmOrderPayType=-2&wmOrderStatus=-2&sortField=1'
var pageNum = 1;
var getAllOrder = true;

function ProcessMeiTuanOrder() {
  if (stopWork) {
    console.log("stop work true, no data refresh");
    pageNum = 1;
    index = 0;
    getAllOrder = true;
  meituanOrderCnt = 0;
    setTimeout(ProcessMeiTuanOrder, 60000);
    return;
  }
  // allOrder = $(".order-list", window.frames["hashframe"].document).find("li");
  // lastNum = $("#ordersCount", window.frames["hashframe"].document).text();
  // orderNum = allOrder.length;
  var curUrl = window.location.href;
  if( curUrl != meituanOrderUrl ) {
  console.log("need jump to url: " + meituanOrderUrl);
  window.location.href = meituanOrderUrl;
  window.location.reload();
    return;
  }

  var curNum = parseInt($("#ordersCount", window.frames["hashframe"].document).text());
  var log = "lastNum:" + meituanOrderCnt + ", curNum:" + curNum + ", pageNum: " + pageNum;
  if( getAllOrder ) {
  log += ", getAllOrder: true";
  } else {
  log += ", getAllOrder: false";
  }
  console.log(log);
  if( pageNum == 1 ) {
  if( curNum == meituanOrderCnt ) {
      setTimeout(ProcessMeiTuanOrder, 20000);
    return;
  } else {
      meituanOrderCnt = curNum;
  }
  }

  var nowDate = toDateStr(new Date());
  // nowDate = '2016-11-04'
  var OrderUrl = refreshOrderUrl + "&startDate=" + nowDate + "&endDate=" + nowDate + "&pageNum=" + pageNum;
  $.get(OrderUrl, function(data, success) {
    if (success != 'success') {
    pageNum = 1;
      index = 0;
      getAllOrder = false;
      setTimeout("ProcessMeiTuanOrder()", 60000);
      return;
    }
    for (id in data.wmOrderList) {
      pageOrderData.push(data.wmOrderList[id]);
    }
    if (data.wmOrderList.length == 10 && getAllOrder) {
      // 一页超过10个 在拉下一页
      pageNum += 1;
      setTimeout("ProcessMeiTuanOrder()", 10000);
    } else {
      intv = setInterval("ProcessOneMeiTuanOrder()", 200);
      pageNum = 1;
      index = 0;
      orderNum = pageOrderData.length;
      getAllOrder = false;
      setTimeout("ProcessMeiTuanOrder()", 60000);
    }
    console.log(pageOrderData);
  });
  /*
     console.log("orderNum " + orderNum);
     intv = setInterval("ProcessOneMeiTuanOrder()", 500);
     ProcessOneMeiTuanOrder();
   */
}
function ProcessOneMeiTuanOrder() {
  if (orderNum <= index) {
    clearInterval(intv);
    pageOrderData = [];
    return;
  }

  // var order = parseMeiTuanOrderFromDom(allOrder[index]);
  var order = parseMeiTuanOrderFromData(pageOrderData[index]);
  if (order === undefined) {
    console.log("order already processed");
  } else {
    order['storeID'] = storeID;
    if (order.phone.indexOf("***") > -1) {
      $.get("http://e.waimai.meituan.com/v2/order/receive/processed/r/recipientPhone?wmPoiId=" + order['wmPoiId'] + "&wmOrderId=" + order['wmOrderId'], function(data, success) {
        if (success == 'success' && data.data !== undefined) {
        order['phone'] = (data.data.recipientPhone ? data.data.recipientPhone : data.data)
        order['bind_phone'] = (data.data.recipientBindedPhone ? data.data.recipientBindedPhone : data.data)
        chrome.extension.sendRequest(order, function(response) {
          console.log(response);
          });
        } else {
        alert("订单拉取失效，请及时更新代码");
        chrome.extension.sendRequest(order, function(response) {
          console.log(response);
          });
        }
        console.log(order);
        })
    } else {
      console.log(order);
      chrome.extension.sendRequest(order, function(response) {
        console.log(response);
        });
    }
    allOrderObjs.push(order);
  }
  index++;
}

function parseMeiTuanOrderFromData(orderData) {
  var order = {};
  var order = {"from" : "mac"};
  // 订单编号
  var orderIndex = orderData['num'];
  // 订单id
  var orderId = orderData['wm_order_id_view_str'];
  order['orderId'] = orderId;
  order['orderIndex'] = orderIndex;

  var cache_key = "meituan-" + order['orderId'];
  var send_num = window.localStorage.getItem(cache_key);
  if (send_num == null) {
    window.localStorage.setItem(cache_key, 1);
  } else if (send_num < 111) {
    send_num += 1;
    window.localStorage.setItem(cache_key, send_num);
  } else {
    // 重试多次 保证成功
    return;
  }
  var priceStr = orderData['total_after'];
  order['realPrice'] = priceStr;
  priceStr = orderData['total_before'];
  order["orgPrice"] = priceStr;

  var orderAddr = orderData['recipient_address'];
  order['addr'] = trimBlank(orderAddr);


  // 订单时间
  order['orderTime'] = orderData['order_time_fmt'];
  //alert(date_str);
  // 订单备注
  orderComment = orderData['remark'];
  order["comment"] = trimBlank(orderComment);
  // 用户名
  var orderUser = orderData['recipient_name']
  order['userName'] = trimBlank(orderUser);

  // 电话

  orderPhone = orderData['recipient_phone'];
  order['phone'] = orderPhone;
  // 电话可能还需要异步获取
  // 需要另外两个数据去获取
  var wmPoiId = orderData['wm_poi_id'];
  var wmOrderId = orderData['id']
    order['wmPoiId'] = wmPoiId;
  order['wmOrderId'] = wmOrderId;

  // 订单详情
  var orderDetail = orderData['cartDetailVos'][0]['details'];
  var orderDetailArray = new Array()
    var orderDetailStr = "";
  for(j = 0; j < orderDetail.length; ++j) {
    var oneDish = {}
    var dishInfo = orderDetail[j];
    dishName = dishInfo['food_name'];
    oneDish['name'] = trimBlank(dishName);
    oneDish['num'] = dishInfo['count'];

    orderDetailArray.push(oneDish);
    orderDetailStr += oneDish['name'] + "x" + oneDish['num'];
    if (j != orderDetail.length - 1 ) {
      orderDetailStr = orderDetailStr + ","
    }
  };
  if (orderDetailStr[orderDetailStr.length - 1] == ",") {
    orderDetailStr = orderDetailStr.substr(0, orderDetailStr.length - 1);
  }
  order['orderDetailStr'] = orderDetailStr;
  order['orderDetail'] = orderDetailArray

    order['source'] = "meituan";
  // alert(JSON.stringify(order));
  return order;

}
////////////////////////// 美团结束 ///////////////////////////

////////////////////////// 百度 ////////////////////////////////
var baiduInterval;
function baiduOrderOK () {
  var baiduShopID = window.localStorage.AutoOrderV2_Store_shop_id;
  if (baiduShopID > "") {
    storeID = JSON.parse(baiduShopID).value;
  }
  var listNum = $(".list-item").length;
  if (listNum > 0 ) {
    clearInterval(baiduInterval);
    setTimeout(function(){
      window.location.href="http://wmcrm.baidu.com/crm?qt=orderlist";
      }, 30000);
    ProcessBaiduOrder();
  } else {
    console.log("wait page load");
    setTimeout(function(){
      window.location.href="http://wmcrm.baidu.com/crm?qt=orderlist";
      }, 30000);
  }
}

function ProcessBaiduOrder() {
  allOrder = $(".list-item");
  orderNum = allOrder.length;
  ProcessOneBaiDuOrder();
  intv = setInterval("ProcessOneBaiDuOrder()", 500);
}

function ProcessOneBaiDuOrder() {
  if (orderNum <= index) {
    clearInterval(intv);
    return;
  }

  var order = parseBaiDuOrderFromDom(allOrder[index]);
  if (order === undefined) {
    console.log("order already processed");
  } else {
    order['storeID'] = storeID;
    chrome.extension.sendRequest(order, function(response) {
      console.log(response.farewell);
      });
    allOrderObjs.push(order);
  }
  index++;
}

function parseBaiDuOrderFromDom(orderDom) {
  var order = {};
  // 订单编号
  var orderIndex = $(orderDom).find(".right-header").find("div:eq(0)").find("p:eq(0)").text().split("#")[1];
  // 订单id
  var orderId = $(orderDom).find(".right-header").find("div:eq(0)").text().split("：")[1];
  order['orderId'] = trim(orderId);
  order['orderIndex'] = trim(orderIndex);

  var cache_key = "baidu-" + order['orderId'];
  var send_num = window.localStorage.getItem(cache_key);
  if (send_num == null) {
    window.localStorage.setItem(cache_key, 1);
  } else if (send_num < 3) {
    send_num += 1;
    window.localStorage.setItem(cache_key, send_num);
  } else {
    // 重试多次 保证成功
    return;
  }
  var priceStr = $(orderDom).find(".right-header").find("div:eq(2)").text();
  order['realPrice'] = priceStr.split('￥')[1];
  priceStr = $(orderDom).find(".menu-td.menutotal").text();
  order["orgPrice"] = priceStr;


  var orderAddr = $(orderDom).find(".userAddr.info-div-div.common-list-item");
  $(orderAddr).find("div.mapcot").remove();
  orderAddr = $(orderAddr).text();
  orderAddr = orderAddr.split("：")[1];
  order['addr'] = trimBlank(orderAddr);


  // 订单时间
  var orderTime= $(orderDom).find(".right-header").find("div:eq(1)").find("span:eq(1)").text() + " " +
    $(orderDom).find(".right-header").find("div:eq(1)").find("i:eq(0)").text()
    // orderTime = trim(orderTime);
    order['orderTime'] = orderTime;
  //alert(date_str);
  // 订单备注
  orderComment = $(orderDom).find(".subleft-userinfo").find(".info-div-div:last").text().split("：");
  if (orderComment.length > 1) {
    orderComment = orderComment[1];
    orderComment = trim(orderComment);
  } else {
    orderComment = "";
  }
  if(orderComment > " ") {
    order["comment"] = orderComment;
    //alert(orderComment);
  } else {
    order["comment"] = "";
  }
  // 用户名
  var orderUser = $(orderDom).find(".userinfo-cot.info-div").find('div:eq(1)').text().split("：")[1];
  order['userName'] = trimBlank(orderUser);

  // 电话
  orderUser = $(orderDom).find(".userinfo-cot.info-div").find('div:eq(2)').text().split("：")[1];
  order['phone'] = trim(orderUser);

  // 订单详情
  var orderDetail = $(orderDom).find(".dish-info").find(".item.flex-item");
  var orderDetailArray = new Array()
    var orderDetailStr = "";
  for(j = 0; j < orderDetail.length - 1; ++j) {
    var oneDish = {}
    dishTR = orderDetail[j];
    dishNameDiv = $(dishTR).find(".dish-name");
    $(dishNameDiv).find("span").remove();
    dishName = $(dishNameDiv).text();

    oneDish['name'] = trimBlank(dishName);
    oneDish['num'] = trim($(dishTR).find(".item-num").text());
    orderDetailArray.push(oneDish);
    orderDetailStr += oneDish['name'] + "x" + oneDish['num'];
    if (j != orderDetail.length - 2 ) {
      orderDetailStr = orderDetailStr + ","
    }
  };
  order['orderDetailStr'] = orderDetailStr;
  order['orderDetail'] = orderDetailArray

    order['source'] = "baidu";
  // alert(JSON.stringify(order));
  return order;
}
////////////////////////// 百度end /////////////////////////////

////////////////////////饿了么////////////////////////////

var elemeTodayOrder = 0;
function elemeTodayData() {
  if (stopWork) {
    console.log("stop work true, no data refresh");
    setTimeout(elemeTodayData, 10000);
    return;
  }
  var postData = {
  };
  var ksid = window.localStorage.ksid;
  var shopId = JSON.parse(window.localStorage.npa_user_traits).rid;
  postData.id=uuid();
  postData.metas = {appName: "melody", appVersion: "4.4.0", ksid: ksid};
  postData.method = "getTodayBusinessData";
  postData.ncp = "2.0.0";
  postData.params = {"shopId":shopId};
  postData.service = "PCMainViewService";
  $.ajax({
url: 'http://app-api.shop.ele.me/arena/invoke/?method=PCMainViewService.getTodayBusinessData',
type: 'POST',// 必须是POST
contentType:'application/json; charset=UTF-8',
data: JSON.stringify(postData),// 数据 必须是字符串
dataType: 'json',// 期望返回类型 json, xml
processData: false,// 防止 data 被预处理
success: function (data, success) {
  if (success == "success" && data && data.result && data.result.Order) {
    if (elemeTodayOrder != data.result.Order) {
      ProcessEleOrderV2();
      elemeTodayOrder = data.result.Order;
    } else {
      var time_second = parseInt(Math.random() * 20000);
      console.log("wait second " + time_second)
      setTimeout("elemeTodayData()", time_second);
    }
  } else {
      var time_second = parseInt(Math.random() * 10000);
      console.log("wait second " + time_second)
      setTimeout("elemeTodayData()", time_second);
  }
},
error: function() {
  var time_second = parseInt(Math.random() * 20000);
    console.log("wait second " + time_second)
    setTimeout("elemeTodayData()", time_second);
}
});
console.log("elemeTodayData check");
}
function ProcessEleOrderV2() {

  var orderUrl = 'http://app-api.shop.ele.me/nevermore/invoke/?method=OrderService.queryLatestOrderForPC';
  var postData = {
  };
  var ksid = window.localStorage.ksid;
  var shopId = storeID;

  postData.id=uuid();
  postData.metas = {appName: "melody", appVersion: "4.4.0", ksid: ksid};
  postData.method = "queryLatestOrderForPC";
  postData.ncp = "2.0.0";
  postData.params = {"shopId":shopId, "orderFilter":"ORDER_QUERY_ALL"};
  postData.params.condition = {"page":1, "limit":"40", offset:0};
  postData.service = "OrderService";


  $.ajax(
    {
url: orderUrl,
type: 'POST',// 必须是POST
contentType:'application/json; charset=UTF-8',
data: JSON.stringify(postData),// 数据 必须是字符串
dataType: 'json',// 期望返回类型 json, xml
processData: false,// 防止 data 被预处理
success: function (data) {
console.log("ProessEleOrderV2");
console.log(data);
console.log("latest order: " + data.result.orders.length)
index = 0;
allOrder = data.result.orders;
orderNum = allOrder.length;
intv = setInterval("ProcOneELeMeOrderV2()", 500);
},
error: function() {
  var time_second = parseInt(Math.random() * 20000);
      console.log("wait second " + time_second)
      setTimeout("elemeTodayData()", time_second);
}
});
}

function ProcOneELeMeOrderV2() {
  if (orderNum <= index) {
    clearInterval(intv);
    index = 0;
    setTimeout("elemeTodayData()", 10000);
    return;
  }
  var order = parseELeMeOrderFromData(allOrder[index]);
  // orderDetailStr 为空不传送后台
  if (order === undefined || order.orderDetailStr =="") {
    console.log("order already processed");
  } else {
    order['storeID'] = storeID;
    chrome.extension.sendRequest(order, function(response) {
      console.log(response.farewell);
      });
    allOrderObjs.push(order);
  }
  index++;
}

function parseELeMeOrderFromData(orderDom) {
  var order = {};
  var priceStr = orderDom.income;
  // 订单金额
  order['realPrice'] = priceStr;

  // 地址
  var orderAddr = orderDom.consigneeAddress;
  order['addr'] = orderAddr;

  // 订单编号
  var orderIndex = orderDom.daySn;
  order['orderIndex'] = orderIndex;
  // 订单id
  var orderId = orderDom.id;
  order['orderId'] = orderId;

  // 订单时间
  var orderTime= orderDom.activeTime;
  orderTime = orderTime.replace("T", " ");
  order['orderTime'] = orderTime;

  // 订单备注
  orderComment = orderDom.remark;
  if(orderComment > " ") {
    order["comment"] = orderComment;
    //alert(orderComment);
  } else {
    order["comment"] = "";
  }

  // 用户名
  var orderUser = orderDom.consigneeName;
  //  order['userName'] = orderUser;
  var sexStr = orderUser.split(" ")[1];
  if (sexStr == "女士") {
    order["sex"] = "famale"
  } else {
    order["sex"] = "male";
  }
  order['userName'] = orderUser;
  // 电话
  orderUser = orderDom.consigneePhones[0];
  // alert(orderUser.toString(16));
  order['phone'] = orderUser;



  // 订单详情
  var orderDetail = orderDom.groups[0].items;
  var orderDetailArray = new Array()
    var orderDetailStr = "";
  for(j = 0; j < orderDetail.length; ++j) {
    var oneDish = {}
    dishTR = orderDetail[j];
    oneDish['name'] = dishTR.name;
    oneDish['num'] = dishTR.quantity;
    orderDetailArray.push(oneDish);
    orderDetailStr += oneDish['name'] + "x" + oneDish['num'];
    if (j != orderDetail.length - 1) {
      orderDetailStr = orderDetailStr + ","
    }
  };
  if (orderDetailStr > "") {
    var cache_key = "eleme-" + order['orderId'];
    var send_num = window.localStorage.getItem(cache_key);
    if (send_num == null) {
      window.localStorage.setItem(cache_key, 1);
    } else if (send_num < 111) {
      send_num += 1;
      window.localStorage.setItem(cache_key, send_num);
    } else {
      // 重试多次 保证成功
      return;
    }
  }
  order['orderDetailStr'] = orderDetailStr;
  order['orderDetail'] = orderDetailArray
    order['source'] = "eleme";
  // alert(JSON.stringify(order));
  return order;
}

var elemeIntval;
////////////////////////饿了么////////////////////////////


if (shopName == "koubei") {
  ProcessKouBeiOrder();
  setTimeout("window.location.reload()", 30000);
} else if (shopName == "ele") {
  var storeInfo = JSON.parse(window.localStorage.npa_user_traits);
  elemeStoreID = storeInfo.rid || storeInfo.oid;
  storeID = elemeStoreID;
  ProcessEleOrderV2();
  //setTimeout(function() {
  setInterval(function() {
    window.location.reload();
  }, 300000);
} else if (shopName == "baidu") {
  baiduInterval = setInterval("baiduOrderOK()", 30000);
} else if (shopName == "meituan") {
  meituanInterval = setTimeout("callMeituanAll()", 30000);
}

function uuid() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
}

function callMeituanAll() {
  // 美团需要选择订单为所有的
  meituanStoreID = window.localStorage.autoAcceptWmPoiList;
  storeID = meituanStoreID;
  if (!storeID || storeID == "") {
    alert("获取门店信息失败")
      return;
  }
  // $("input[name=pay-type]", window.frames["hashframe"].document)[0].click();
  meituanInterval = setTimeout("ProcessMeiTuanOrder()", 10000);
  //setTimeout(function() {
  setInterval(function() {
    // 避免页面出错 长时间不刷新
    window.location.reload();
  }, 600000);
}

function reportHeartBeat() {
  var time = new Date();
  var m = time.getMonth() + 1;
  var tt = time.getFullYear() + "-" + m + "-" + time.getDate();
  tt += " " + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();

  var heartInfo = {};
  heartInfo['platform'] = shopName;
  heartInfo['storeID'] = String(storeID);
  heartInfo['reportTime'] = tt;
  heartInfo['interval'] = heartInterval;
  heartInfo['type'] = "heartbeat";

  chrome.extension.sendRequest(heartInfo, function(response) {
    console.log(response.farewell);
  });
}

var heartInterval = 1000 * 60 * 1;
setInterval("reportHeartBeat()", heartInterval);
