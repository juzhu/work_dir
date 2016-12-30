$(".select_store").change(function() {
  var storeNameOrig = window.localStorage.storeName;
  var storeName = $(this).val();
  $.get("/switch_store/" + storeName, function(data) {
    if (data && !data.error) {
      window.localStorage.storeName = storeName;
      window.location.reload();
    } else {
      alert("切换失败");
      $(".select_store").val(storeNameOrig);
    }
  })
})
$(document).ready(function(){
  // 看本地是否有分店信息缓存
  var storeName = window.localStorage.storeName;
  if (storeName === undefined) {
    storeName = '前进店';
    window.localStorage.storeName = storeName;
  }
  $(".select_store").val(storeName);
  $.get("/switch_store/" + storeName, function(data) {
    if (data && data.change) {
      window.localStorage.storeName = storeName;
      window.location.reload();
    } else {
      // 没变 不刷新
    }
  })
});

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
}




