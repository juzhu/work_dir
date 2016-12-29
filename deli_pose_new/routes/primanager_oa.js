var priConfig = {
  "/" : 0,
  "get_user_point_info" : 5,
  "user_point_info" : 5,
  "consume_point" : 6,
  "income_summary" : 4,
  "order_verify" : 4,
  "order_recharge_tb" : 5,
  "userwithorder" : 5,
  "apply_no_recycle" : 4,
};

var priManager = {
  "checkPri" : function(req) {
    var uri = req.url.split("/");
    var userInfo = req.session.userInfo;
    console.log(userInfo);
    var userPri = userInfo ? userInfo.userPri : 0;
    var checkUri = uri[1];
    var checkRet = true;

    if (checkUri > "") {
      if (priConfig[checkUri] && priConfig[checkUri] > userPri) {
        checkRet =  false;
      }
    }
    console.log("check pri for " + checkUri  + " checkPri: " + priConfig[checkUri] + " userInfo " + userPri + " return " + checkRet);
    return checkRet;
  },
}

exports.priManager = priManager;
