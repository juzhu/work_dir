var geocoder,map,marker, icon = null;
var storeIcon, normalIcon, selectIcon;
var markerInfo = [];
var regionInfo = [];
var posterInfo = [];
var nomalIcon;
var selectIcon;
var dragIcon;
var center;
var lastZIndex = 0;
function resetMapCenter() {
  map.setCenter(center);
  map.zoomTo(14);
}
function checkNewOrder() {
  var orderEmpty = ($("tr").length == 1);
  if (orderEmpty) {
    setTimeout(function() {
      window.location.reload();
    }, 10000);
    return;
  }
  var lastOrderID = $("#order_list").attr("lastorderid");
  $.get("/get_new_order_after/" + lastOrderID, function(data, success) {
    if (success == 'success' && data.error == false && data.orders.length > 0) {
      var orderInfo = data.orders[0];
      var appendHTML = "<tr class='data_tr' orderID='" + orderInfo.order_id +"' platform='" + orderInfo.order_platform +"' ondblclick='activeMarker(\"" + orderInfo.order_id + "\")' orderstatus='1'><td class='center' style='width:2%'><input class='check_op' orderid='" + orderInfo.order_id +"' type='checkbox'></td><td class='center' style='width:30px'>" + orderInfo.order_past_minute +"分</td><td class='center orderIndex' style='width:5%'>" + orderInfo.order_platform +"(" + orderInfo.order_index +")</td><td class='center addr' style='width:120px' lat='" + orderInfo.lat +"' lng='" + orderInfo.lng +"'>" + orderInfo.addr + "</td><td class='center order_status' style='color: red'>待配送</td><td class='center' id='" + orderInfo.order_id +"_waiting_dishes' style='color: green;width:150px'></td></tr>"
      $("tbody").prepend(appendHTML);
      if (orderInfo.lat == 0 || orderInfo.lng ==0) {
        setTimeout(function() {
          InitOneOrder(orderInfo.addr, orderInfo.order_id);
        }, 100);
      } else {
        console.log("new order has set lat lng");
        placeMarker(orderInfo.order_id, orderInfo.lat, orderInfo.lng, 0);
      }
      setTimeout(function() {
        checkOneOrderProgress(orderInfo.order_id);
      }, 20000);
      $("#order_list").attr("lastorderid", orderInfo.order_id);
    }
    setTimeout(function() {
      checkNewOrder();
    }, 10000)
  })
}
setTimeout(function() {
  checkNewOrder();
}, 2000);
var init = function(mapCenter) {
  center = mapCenter;
  map = new qq.maps.Map(document.getElementById('map_container'),{
    center: center,
    zoom: 15
  });
  //调用地址解析类
  geocoder = new qq.maps.Geocoder({
    complete : function(result){
      map.setCenter(result.detail.location);
      var marker = new qq.maps.Marker({
        icon:icon,
        map:map,
        position: result.detail.location
      });
      setTimeout(function() {
        marker.setMap(null);
      }, 5000);
    },
    error:function() {
      alert("没找到相关地址");
    }
  });

  var anchor = new qq.maps.Point(6, 6);
  var size = new qq.maps.Size(24, 24);
  var origin = new qq.maps.Point(0, 0);
  storeIcon = new qq.maps.MarkerImage('/images/center.gif', size, origin);;

  origin = new qq.maps.Point(0, 0);
  anchor = new qq.maps.Point(1, 0);
  size = new qq.maps.Size(35, 35);
  selectIcon = new qq.maps.MarkerImage('/images/order_red.png', size, origin);
  normalIcon = new qq.maps.MarkerImage('/images/order_org.png', size, origin);
  dragIcon = new qq.maps.MarkerImage('/images/order_black.png', size, origin);

  var marker = new qq.maps.Marker({
    icon: storeIcon,
    map:map,
    position: center,
    zIndex: 10000,
  });
}
function InitOneOrder(addr, orderID) {
  var geocoder = new qq.maps.Geocoder({
    complete : function(result){
      console.log("order_id:" + orderID + " addr" + addr + " success");
     //  alert("addr: " + addr + " split index: " + index);
      alert($("tr[orderID='" + orderID + "']").find(".addr").text());
      $("tr[orderID='" + orderID + "']").find(".addr").attr("lat", result.detail.location.lat).attr("lng", result.detail.location.lng);
      placeMarker(orderID, result.detail.location.lat, result.detail.location.lng, 0);
      updateOrderGPS(orderID, result.detail.location.lat, result.detail.location.lng);
      initSplitIndx(orderID);
    },
    error: function(err, msg) {
      console.log("error: " + orderID + " addr: " + addr + " " + err + " " + msg);
    }
  })

  if (addr.indexOf('鹤洲小镇') != -1 && addr.indexOf('精品女装') != -1) {
    addr = '鹤洲路大东';
  }
  if (addr.indexOf('骏悦商务') != -1) {
    addr = "新安五路骏悦商务宾馆";
  }
  if (addr.indexOf('河东第二工业区') != -1) {
    addr = addr.replace(/河东第二工业区/g, '翻身路');
  }
  if (addr.indexOf("鸿荣源") != -1 && addr.indexOf("尚都") != -1) {
    addr = "裕安一路尚都";
  }
  if (addr.indexOf('妇幼保健') != -1) {
    addr = addr.replace("妇幼保健", "玉律路妇幼保健");
  }
  if (addr.indexOf("麻布") != -1) {
    addr = addr.replace("麻布", "西乡坪洲麻布");
  }
  if (addr.indexOf("宝安") == -1) {
    addr = "宝安区" + addr;
  }
  if (addr.indexOf('深圳') == -1) {
    addr = "深圳市" + addr;
  }
  if (addr.indexOf('广东') == -1) {
    addr = "广东省" + addr;
  }
  geocoder.getLocation(addr);

}

function codeAddress() {
  var address = document.getElementById("address").value;
  //通过getLocation();方法获取位置信息值
  geocoder.getLocation(address);
}

function initAllOrderMarker() {
  var delaySecond = 1;
  var allAddr = $("tbody").find("td.addr");
  $(allAddr).each(function() {
    var addr = $(this).text();
    var orderID = $(this).parent().attr("orderID")
    var lat = $(this).attr("lat");
    var lng = $(this).attr("lng");
    if (lat == 0 || lng == 0) {
      setTimeout(function() {
        InitOneOrder(addr, orderID);
      }, delaySecond * 1000);
      delaySecond += 1;
    } else{
      placeMarker(orderID, lat, lng, 0)
      initSplitIndx(orderID);
    }
  });
}

function initAllOrderSpIndx() {
  var delaySecond = 1;
  var allAddr = $("tbody").find("td.addr");
  $(allAddr).each(function() {
    var addr = $(this).text();
    var orderID = $(this).parent().attr("orderId")
    var splitIndex = $(this).parent().attr("split_index");
    if (splitIndex == -1) {
      setTimeout(function() {
        initSplitIndx(orderID);
      }, delaySecond * 1000);
      delaySecond += 1;
    } else{
      markerInfo[orderID].splitIndex = splitIndex;
    }
  });
}



function initSplitIndx(orderID) {
  var orderTR = $("tr[orderID='" + orderID + "']");
  var splitIndex = $(orderTR).attr("split_index");
  var addrTD = $(orderTR).find("td.addr");
  var lat = $(addrTD).attr("lat");
  var lng = $(addrTD).attr("lng");
  if (lat == 0 || lng == 0) {
    setTimeout(function() {
      initSplitIndx(orderID);
    }, 3000);
  }
  if (splitIndex === undefined || splitIndex == -1 || splitIndex == 999) {
    splitIndex = checkOrderRegion(lat, lng);
    if (splitIndex != -1) {
      $(orderTR).attr("split_index", splitIndex);
    } else {
      splitIndex = 999;
      $(orderTR).attr("split_index", 999);
    }
    $.get("/update_order_spindex/" + orderID + "/" + splitIndex, function(data, success) {
      console.log("update index form order " + orderID + " return " + splitIndex);
    })
  }
  markerInfo[orderID].splitIndex = splitIndex;
}

function placePolygonMarker(index, center) {
  var marker = new qq.maps.Marker({
    map:map,
    position: center,
    zIndex : 0,
    icon : dragIcon,
    title:"split-" + index,
  });
  var label = new qq.maps.Label({
    position: center,
    map: map,
    content:"split-" + index,
    zIndex:0,
  });

  marker.label = label;
  // 单击事件
}
function placeMarker(orderID, lat, lng, tm) {
  var pt = new qq.maps.LatLng(lat, lng);
  console.log("placeMarker for " + $("tr[orderID='" + orderID + "']").find(".orderIndex").text())
  var marker = new qq.maps.Marker({
    title:$("tr[orderID='" + orderID + "']").find(".orderIndex").text().replace(" ", "") + $("tr[orderID='" + orderID + "']").find(".addr").text(),
    map:map,
    position: pt,
    zIndex : 0,
    icon : normalIcon,
  });
  var label = new qq.maps.Label({
    position: pt,
    map: map,
    content:$("tr[orderID='" + orderID + "']").find(".orderIndex").text(),
    zIndex:0,
  });
  marker.label = label;
  marker.orderID = orderID;
  // 单击事件
  qq.maps.event.addListener(marker, 'click', function(event) {
    var marker = this;
    var dt = setTimeout(function() {
      var index = ++lastZIndex;
      marker.setZIndex(index);
      marker.label.setZIndex(index);
      markerClickFilter(marker);
      alert(marker.splitIndex);
    }, 200);
    this.dt = dt;
  });

  // 双击事件
  qq.maps.event.addListener(marker, 'dblclick', function(event) {
    clearTimeout(this.dt);
    this.setDraggable(!this.getDraggable());
    var draggable = this.getDraggable();
    if (draggable == true) {
      this.setIcon(dragIcon);
      this.oGPS = this.getPosition();
    } else {
      this.setIcon(normalIcon);
      var newGps = this.getPosition();
      if (this.oGPS.lat != newGps.lat || this.oGPS.lng != newGps.lng) {
        alert("位置变化 更新信息");
        updateOrderGPS(this.orderID, newGps.lat, newGps.lng);
        initSplitIndx(this.orderID);
      }
    }
  });
  markerInfo[orderID] = marker;
}
function orderReadyToPost(orderID) {
  var marker = markerInfo[orderID];
  //map.setCenter(marker.getPosition());
  if (marker) {
    marker.setAnimation(qq.maps.MarkerAnimation.BOUNCE);
    // marker.setIcon(selectIcon);
    marker.setZIndex(++lastZIndex);
  }
}
function activeMarker(orderID) {
  var marker = markerInfo[orderID];
  map.setCenter(marker.getPosition());
  if (marker) {
    marker.setAnimation(qq.maps.MarkerAnimation.BOUNCE);
    marker.setZIndex(++lastZIndex);
    marker.setIcon(selectIcon);
    // marker.setTitle($("td[orderID=']" + orderID + "']").text());
    setTimeout(function() {
      marker.setIcon(null);
      marker.setAnimation(null);
    }, 3000);
  }
}
function updateOrderGPS(orderID, lat, lng) {
  var query = "/update_order_gps/" + orderID + "/" + lat + "/" + lng;
  $.get(query, function(data, success) {
    console.log(query + " return " + success + " msg: " + JSON.stringify(data));
  })
}
function markerClickFilter(marker) {
  var orderID = marker.orderID;
  var clickTR = $("tr[orderID='" + orderID + "']");
  var trCheck = $(clickTR).find(".check_op");
  var checked = $(trCheck).attr("checked");
  marker.setDraggable(false);
  if (checked) {
    checked = false;
    marker.setIcon(normalIcon);
  } else {
    checked = true;
    marker.setIcon(selectIcon);
  }
  setCheckBox(trCheck, checked);
  // $(clickTR).find("input[type='checkbox']").toggle();
}
var currentFilterStatus = 1;
function filterPlatform(platform) {
  // 在当前显示的订单中过滤
  // 先拿到当前行的显示状态 与要进行的专题与操作
  $("tr.data_tr").each(function() {
    var orderID = $(this).attr("orderID");
    var statusShow = false;
    var platformShow = false;
    var status = currentFilterStatus;
    if (status == -1) {
      statusShow = true;
    } else {
      var trStatus = $(this).attr('orderStatus');
      if (trStatus == status) {
        statusShow = true;
      }
    }
    if (statusShow == false) {
      platformShow = false;
    } else {
      if (platform == 'all') {
        platformShow = true;
      } else {
        var trPlatform = $(this).attr('platform');
        if (trPlatform == platform) {
          platformShow = true;
        } else {
          platformShow = false;
        }
      }
    }
    if (platformShow) {
      $(this).show();
    } else {
      $(this).hide();
    }
    showMarker(orderID, platformShow);
  })
}
function filterStatus(status) {
  uncheckAll();
  currentFilterStatus = status;
  if (status == 1) {
    $(".order_filter_div_1").show();
    $("#btn_post_batch").show();
    $("#btn_recycle_batch").hide();
  } else if (status == 3) {
    $(".order_filter_div_1").show();
    $("#btn_post_batch").hide();
    $("#btn_recycle_batch").show();
  } else {
    $(".order_filter_div_1").hide();
  }
  $("tr.data_tr").each(function() {
    var markerShow = true;
    var orderID = $(this).attr("orderID");
    if (status == -1) {
      $(this).show();
    } else {
      var trStatus = $(this).attr('orderStatus');
      if (trStatus == status) {
        $(this).show();
      } else {
        $(this).hide();
        markerShow = false;
      }
    }
    showMarker(orderID, markerShow);
  })
}
function showMarker(orderID, show) {
  var marker = markerInfo[orderID];
  if (marker) {
    marker.setVisible(show);
    marker.label.setVisible(show);
  }
}
function setOrderRecycleBatch() {
  // 找到配送人
  var postUser = $(".select_post").val();
  var allChecked = $("span.checked").find("input[type=checkbox]");
  $(allChecked).each(function() {
    var orderID = $(this).attr("orderID");
    var status = $("tr[orderID='" + orderID +"']").attr("orderStatus");
    console.log("order id:" + orderID +" recycle by " + postUser + " order_stauts: " + status);
    setOrderRecycle(orderID, postUser);
  });
  uncheckAll();
}
function setOrderRecycle(orderID, postUser) {
  $.get("/set_order_recycle/" + orderID + "/" + postUser, function(data, success) {
    if (success == "success" && data.error == false) {
      $("tr[orderId='" + orderID + "']").attr("orderStatus", 4);
      $("tr[orderId='" + orderID + "']").find(".order_status").text("回收中(" + postUser + ")");
      $("tr[orderId='" + orderID + "']").hide();
    } else {
      alert("操作失败 " + data.msg);
    }
  });
}
function setOrderPostBatch() {
  // 找到配送人
  var postUser = $(".select_post").val();
  var allChecked = $("span.checked").find("input[type=checkbox]");
  $(allChecked).each(function() {
    var orderID = $(this).attr("orderID");
    var status = $("tr[orderID='" + orderID +"']").attr("orderStatus");
    console.log("order id:" + orderID +" post by " + postUser + " order_stauts: " + status);
    setOrderPost(orderID, postUser);
  });
  uncheckAll();
}
function setOrderPost(orderID, postUser) {
  $.get("/set_order_post/" + orderID + "/" + postUser, function(data, success) {
    if (success == "success" && data.error == false) {
      $("tr[orderId='" + orderID + "']").attr("orderStatus", 2);
      $("tr[orderId='" + orderID + "']").find(".order_status").text("配送中(" + postUser + ")");
      $("tr[orderId='" + orderID + "']").hide()
    } else {
      alert("操作失败 " + data.msg);
    }
  });
}
function toggleLabel(obj) {
  var showLabel = $(obj).attr("show_label");
  for (orderID in markerInfo) {
    marker = markerInfo[orderID];
    if (showLabel == 'true') {
      marker.label.setVisible(false);
      $(obj).attr("show_label", false);
    } else {
      if (markerInfo[orderID].getVisible() == true) {
        marker.label.setVisible(true);
      }
      $(obj).attr("show_label", true);
    }
  }
  // 图标隐藏再次显示是 出bug
  // zoom一下就可以了
  map.zoomTo(map.getZoom() + 1);
  map.zoomTo(map.getZoom() - 1);
}
function uncheckAll() {
  var trCheck = $(".check_op");
  $(trCheck).each(function() {
    setCheckBox(this, false);
  })
}
function setCheckBox(checkObj, checked) {
  if (checked) {
    $(checkObj).parent().attr("class",'checked');
  } else {
    $(checkObj).parent().attr("class",'');
  }
  var scrollTo = $(checkObj).offset().top - window.screen.height / 2;
  window.scrollTo(0, scrollTo);
  var orderID = $(checkObj).attr("orderID");
  var orgColor = $("tr[orderID='"+ orderID + "']").css('background-color');
  $("tr[orderID='"+ orderID + "']").find("td").css('background-color','red');
  setTimeout(function() {
    $("tr[orderID='"+ orderID + "']").find("td").css('background-color', orgColor);
  }, 1000);
  $(checkObj).attr("checked",checked);
}

function checkOrderProgress() {
  $("tr.data_tr").each(function() {
    var orderID = $(this).attr("orderID");
    var trStatus = $(this).attr('orderStatus');
    // 代配送的才检查
    if (trStatus == 1) {
      setTimeout(function() {
        checkOneOrderProgress(orderID);
      }, Math.random() * 5000);
    }
  })
}

function checkOneOrderProgress(orderID) {
  $.get("/check_order_progress/" + orderID, function(data, success) {
    if (success == "success") {
      if (data.data > "") {
        $("#" + orderID +"_waiting_dishes").text(data.data);
        setTimeout(function() {
          checkOneOrderProgress(orderID);
        }, Math.random() * 10000);
      } else {
        $("#" + orderID +"_waiting_dishes").text(data.menu_list);
        $("tr[orderID='" + orderID + "']").find("td").eq(1).css("background-color", "red");
        orderReadyToPost(orderID);
      }
    }
  })
}

function checkOrderRegion(lat, lng) {
  var marketPT = new qq.maps.LatLng(lat, lng);
  var dist = 0;
  var resultIndex = -1;
  var optionIndex = {};
  for (var i in regionInfo) {
    var region = regionInfo[i];
    if (region.getBounds().contains(marketPT)) {
      var dt = qq.maps.geometry.spherical.computeDistanceBetween(marketPT, region.getBounds().getCenter());
      if (dist == 0 || dist > dt) {
        dist = dt;
        resultIndex = region.splitIndex;
      }
      optionIndex[region.splitIndex] = dt;
    }
  }
  return resultIndex;
}

function toggleRegion() {
  for (i in regionInfo) {
    var region = regionInfo[i];
    region.setVisible(!(region.getVisible()));
  }
}
function updatePosterInfo() {
  $.get("/poster_lastest_info", function(data, success) {
    if (success == "success" && !data.error) {
      var gpsData = data.data;
      for (var i in gpsData) {
        var postData = gpsData[i];
        var userName = postData.user_name;
        var postMarker = posterInfo[userName];
        if (postMarker === undefined) {
          postMarker = new qq.maps.Marker({
            icon:storeIcon,
            map:map,
            title:postData.user_name,
          });
        }
        var position = new qq.maps.LatLng(postData.lat, postData.lng);
        postMarker.setPosition(position);
        posterInfo[userName] = postMarker;
      }
    }
  });
}

function initRegion(center) {
  $.get("/get_region", function(data, success) {
    if (success == 'success') {
      for (i in data) {
        var polygonPath = [];
        var regionData = data[i];
        for (j in regionData) {
          var pt = new qq.maps.LatLng(regionData[j].lat, regionData[j].lng);
          polygonPath.push(pt);
        }
        var ployGon = new qq.maps.Polygon({
          map:map,
          path:polygonPath,
          strokeColor: '#000000',
        });
        placePolygonMarker(i, ployGon.getBounds().getCenter());
        ployGon.splitIndex = i;
        regionInfo.push(ployGon)
      }
    }
    initAllOrderMarker();
    // initAllOrderSpIndx();
  })
}
var lastWidth = "50%";
function hideMap() {
  $("#container_op_right").toggle();
  $("#container").toggle();
  var curWidth = $("#order_list").css("max-width");
  $("#order_list").css("max-width", lastWidth);
  lastWidth = curWidth;
}

function orderPriUp(orderID) {
  alert("orderPriUp " + orderID);
  // 找到前一个兄弟行节点
  var priData = {};
  var curTR = $("tr[orderID='"+ orderID + "']");
  var curPri = $(curTR).attr("cook_order");
  var preSib = $(curTR).prev();
  if (preSib) {
   var preOrderID = $(preSib).attr("orderID");
   var preOrderPri = $(preSib).attr("cook_order");
    priData[orderID] = preOrderPri;
    priData[preOrderID] = curPri;
    $.post("/orderPriSet",  priData, function(data, success) {
      if (success == 'success') {
        curTR.insertBefore(preSib);
        $(curTR).attr("cook_order", preOrderPri);
        $(preSib).attr("cook_order", curPri);
      } else {
        alert(data.msg);
      }
    })
  } else {
    alert("已经是第一个");
  }
}

function orderPriDown(orderID) {
  alert("orderPriDown  " + orderID);
}

setTimeout(updatePosterInfo, 10000);
