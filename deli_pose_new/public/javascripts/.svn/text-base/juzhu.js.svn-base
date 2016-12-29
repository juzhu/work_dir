var pageTop = 0;
var mainPageSubPage = "";
var myTaskPageSubPage = "";

function getHashValue() {
  var hash = window.location.hash;
  if (hash.charAt(0) == "#") {
    hash = hash.substr(1);
  }
  var hashArray = hash.split("#");
  return hashArray;
}

function orderSquear() {
  // order_squear.html
  var hashArray = getHashValue();
  if (hashArray.length == 0 || hashArray.length == 1 || hashArray[0] != 'main') {
    if (mainPageSubPage != "") {
      window.location.hash = '#main#' + mainPageSubPage;
    } else {
      window.location.hash = "#main#wait_send";
    }
  }
  var allPreview = $(".weui-form-preview");
  if (allPreview.length > 0) {
    pageTop = $(allPreview[0]).scrollTop();
  } else {
    pageTop = 0;
  }
  var html = $("#tpl_order_squear").html();
  $("#main_page").html("");
  $("#main_page").append(html);
}

function myTask() {
  // order_squear.html
  var hashArray = getHashValue();
  if (hashArray.length == 0 || hashArray.length == 1 || hashArray[0] != 'send') {
    if (myTaskPageSubPage != "") {
      window.location.hash = "#send#" + myTaskPageSubPage;
    } else {
      window.location.hash = "#send#order_sending";
    }
  }
  var html = $("#tpl_my_task").html();
  $("#main_page").html("");
  $("#main_page").append(html);
}

function myPreview() {
  window.location.hash='#mine';
  var html = $("#tpl_my_preview").html();
  $("#main_page").html("");
  $("#main_page").append(html);
}

function orderWaitList(type, last_index, limit) {
  $.get("/" + type + "/" +last_index + "/" + limit, function(data, success) {
    if (success == 'success') {
      $('#order_squear_content').html("");
      $('#order_squear_content').append(data);
      $($(".weui-form-preview")[0]).scrollTop(pageTop);
      mainPageSubPage = type;
      window.location.hash='#main#'+type;
    }
  })
}

function myTaskList(type, last_index, limit) {
  $.get("/" + type + "/" +last_index + "/" + limit, function(data, success) {
    if (success == 'success') {
      $('#my_task_content').html("");
      $('#my_task_content').append(data);
      myTaskPageSubPage = type;
      window.location.hash='#send#'+type;
    }
  })
}

function applySend(btnObj, orderID) {
  opComfirm(btnObj, orderID, "确定配送？", applySendComfirm);
}

function applySendComfirm(btnObj, orderID) {
  $.get("/apply_send/" + orderID, function(data, success) {
    if (success == 'success' && data.error == false) {
      $(btnObj).removeClass('weui-form-preview__btn_primary').addClass('weui-form-preview__btn_default').attr("disabled", "disabled");
      removeOrderItem(orderID);
    } else {
      alert("失败 " + data.msg);
    }
  })
}

function applyRecycle(btnObj, orderID) {
  opComfirm(btnObj, orderID, "确定回收？", applyRecycleComfirm);
}

function applyRecycleComfirm(btnObj, orderID) {
  $.get("/apply_recycle/" + orderID, function(data, success) {
    if (success == 'success' && data.error == false) {
      $(btnObj).removeClass('weui-form-preview__btn_primary').addClass('weui-form-preview__btn_default').attr("disabled", "disabled");
      removeOrderItem(orderID);
    } else {
      alert("失败 " + data.msg);
    }
  })
}

function applyNoRecycle(btnObj, addr, orderID) {
  opComfirm(btnObj, orderID, "确定地址【" + addr + "】无需回收？状态不可恢复", applyNoRecycleComfirm);
}

function applyNoRecycleComfirm(btnObj, orderID) {
  $.get("/apply_no_recycle/" + orderID, function(data, success) {
    if (success == 'success' && data.error == false) {
      $(btnObj).removeClass('weui-form-preview__btn_primary').addClass('weui-form-preview__btn_default').attr("disabled", "disabled");
      removeOrderItem(orderID);
    } else {
      alert("失败 " + data.msg);
    }
  })
}




function opComfirm(btnObj, orderID, comfirmText, confirmFn) {
  var opComfirm = $("#op_complete_dialog");
  $(opComfirm).find("#complete_content").text(comfirmText);
  $(opComfirm).find("#op_comfirm").click(function() {
    confirmFn(btnObj, orderID);
    $(opComfirm).fadeOut(200);
    $(opComfirm).find("#op_comfirm").unbind();
    $(opComfirm).find("#op_cancel").unbind();
  })
  $(opComfirm).find("#op_cancel").click(function() {
    $(opComfirm).fadeOut(200);
    $(opComfirm).find("#op_comfirm").unbind();
    $(opComfirm).find("#op_cancel").unbind();
  })
  opComfirm.fadeIn(200);

}


function sendComplete(btnObj, orderID) {
  opComfirm(btnObj, orderID, "确定送达？", sendCompleteConfirm);
}

function sendCompleteConfirm(btnObj, orderID, cb) {
  $.get("/apply_send_complete/" + orderID, function(data, success) {
    if (success == 'success' && data.error == false) {
      $(btnObj).removeClass('weui-form-preview__btn_primary').addClass('weui-form-preview__btn_default').attr("disabled", "disabled");
    } else {
      alert("失败 " + data.msg);
    }
  })
}

function recycleComplete(btnObj, orderID) {
  opComfirm(btnObj, orderID, "确定回收完毕？", recycleCompleteComfirm);
}

function recycleCompleteComfirm(btnObj, orderID) {
  $.get("/apply_recycle_complete/" + orderID, function(data, success) {
    if (success == 'success' && data.error == false) {
      $(btnObj).removeClass('weui-form-preview__btn_primary').addClass('weui-form-preview__btn_default').attr("disabled", "disabled");
    } else {
      alert("失败 " + data.msg);
    }
  })
}

function EditComment(orderID, orderLat, orderLng) {
  var commentDialog = $("#comment_input_dialog");
  $(commentDialog).find('textarea').val("");
  $(commentDialog).find("#op_comfirm").click(function() {
    commentOver();
    var commentContent = $(commentDialog).find('textarea').val();
    if (commentContent > "") {
      commentCommit(orderID, commentContent);
    }
    $(commentDialog).fadeOut(200);
    $(commentDialog).find("#op_comfirm").unbind();
    $(commentDialog).find("#op_cancel").unbind();
  })
  $(commentDialog).find("#op_cancel").click(function() {
    commentOver();
    $(commentDialog).fadeOut(200);
    $(commentDialog).find("#op_comfirm").unbind();
    $(commentDialog).find("#op_cancel").unbind();
  })
  getLocate(function(result) {
    var myLocate = new qq.maps.LatLng(result.coords.latitude, result.coords.longitude) ;
    qq.maps.convertor.translate(myLocate, 1, function(res) {
      myLocate = res[0];
      var orderLocate = new qq.maps.LatLng(orderLat, orderLng);
      var dt = qq.maps.geometry.spherical.computeDistanceBetween(myLocate, orderLocate);
      commentGPSSuc(myLocate, orderLat, orderLng, dt);
    });
  }, function(err) {
      alert("comment gps back err");
      $("#get_gps_title").attr("lat", 0);
      $("#get_gps_title").attr("lng", 0);
      $("#get_gps_title").html("或者位置失败");
  })
  commentDialog.fadeIn(200);
}
function commentGPSSuc(locate, orderLat, orderLng, dt) {
  $("#get_gps_title").attr("lat", locate.lat);
  $("#get_gps_title").attr("lng", locate.lng);

  $("#get_gps_title").attr("order_lat", orderLat);
  $("#get_gps_title").attr("order_lng", orderLng);

  $("#get_gps_title").html("与订单距离: " + parseInt(dt) + " 米");
  $("#get_gps_title").parent().parent().append("<span class='weui-cell__ft'></span>");
}

function commentOver() {
  $("#get_gps_title").parent().parent().find("span").remove();
  $("#get_gps_title").attr("lat", 0);
  $("#get_gps_title").attr("lng", 0);

  $("#get_gps_title").attr("order_lat", 0);
  $("#get_gps_title").attr("order_lng", 0);
  $("#get_gps_title").html("位置更新中");
}

function checkOrderPos() {
  var gpsInfo = $("#get_gps_title");
  var orderLat = $(gpsInfo).attr("order_lat");
  var orderLng = $(gpsInfo).attr("order_lng");
  var userLat = $(gpsInfo).attr("lat");
  var userLng = $(gpsInfo).attr("lng");

  var checkOrderUrl = "http://apis.map.qq.com/tools/poimarker?type=0&marker=coord:"+orderLat+"," + orderLng + ";title:订单位置;addr:订单位置|coord:" + userLat + "," + userLng + ";title:自己位置;addr:自己位置" + "&key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77&referer=myapp";
  window.location.href=checkOrderUrl;
}

function commentCommit(orderID, comment) {
  $.post("/apply_order_comment", {"order_id":orderID, "comment":comment}, function(data, success) {
    if (success == 'success' && data.error == false) {
      var cur_text = $("#" + orderID + "_comment").text();
      cur_text += "\r\n" + comment;
      $("#" + orderID + "_comment").text(data.new_comment);
    } else {
      alert("失败 " + data.msg);
    }
  })
}
function locateSuccess(result) {
}

function locateError(error) {
  alert("my locate error" + JSON.stringify(error));
}


function getLocate(cbSuccess, cbError) {
  navigator.geolocation.getCurrentPosition(cbSuccess, cbError, {
    enableHighAcuracy: true,
    timeout: 50000,
    maximumAge: 30000,
  });
}

function openLocation(obj) {
  var uriPri = $(obj).attr("uriPri");
  var uriTo = $(obj).attr("toOrder");
  getLocate(function(result) {
    var myLocate = new qq.maps.LatLng(result.coords.latitude, result.coords.longitude) ;
    qq.maps.convertor.translate(myLocate, 1, function(res) {
      myLocate = res[0];
      uriPri += "&from=我的位置&fromcoord=" + myLocate.lat + "," + myLocate.lng;
      var mapUri = uriPri + uriTo + "&policy=2&referer=myapp";
      // alert(mapUri);
      // mapUri = "http://apis.map.qq.com/uri/v1/routeplan?type=bus&from=我的家&fromcoord=39.980683,116.302&to=中关村&tocoord=39.9836,116.3164&policy=1&referer=myapp";
      window.location.href=mapUri;
    })

  }, function(err) {
    alert("error " + err);
  })
}

function removeOrderItem(orderID) {
  $("#" + orderID).remove();
}


function cancelSend(orderID) {
  $.get("/apply_send_cancel/" + orderID, function(data, success) {
    if (success == 'success' && data.error == false) {
      removeOrderItem(orderID);
    } else {
      alert("失败 " + data.msg);
    }
  })
}

function cancelRecycle(orderID) {
  $.get("/apply_recycle_cancel/" + orderID, function(data, success) {
    if (success == 'success' && data.error == false) {
      removeOrderItem(orderID);
    } else {
      alert("失败 " + data.msg);
    }
  })
}

function todayDetail(type) {
  window.location.href='/day_detail/' + type;
}

function checkUrHashJump() {
  var hash = window.location.hash;
  var tabs = $(".weui-tabbar__item");
  if (hash.charAt(0) == "#") {
    hash = hash.substr(1);
  }
  var hashArray = hash.split("#");
  var startPage = "main";
  var secondPage = "";
  if (hashArray.length > 0) {
    startPage = hashArray[0];
  }
  if (hashArray.length > 1) {
    secondPage = hashArray[1];
  }
  switch(startPage) {
    case "main":
      $(tabs[0]).click();
      /*
      if (secondPage == "") {
        secondPage = "wait_send";
      }
      $(".weui-navbar__item").each(function(obj) {
        if ($(this).attr("tab_type") == secondPage) {
          $(this).click();
        }
      });
     */
      break;
    case "send":
      $(tabs[1]).click();
      if (secondPage == "") {
        secondPage = "order_sending";
      }
      $(".weui-navbar__item").each(function(obj) {
        if ($(this).attr("tab_type") == secondPage) {
          $(this).click();
        }
      });
      break;
    case "mine":
      $(tabs[2]).click();
      break;
    default:
      window.location.hash='#main';
      $(tabs[0]).click();
      break;
  }
}
