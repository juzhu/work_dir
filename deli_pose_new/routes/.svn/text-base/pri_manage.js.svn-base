// 检查session里面的userName是否有权限访问某个链接
// 1 最基础用户 只能登陆 查看订单 没有任何修改数据权限
// 2 普通配送员 登录 能配送 回收 增加备注
// 3 配送主管 能确定单是否是无需回收
var userPriMap = {
  "xiaobing" : 10,
  "xulong"   : 3,
  "xiaowang" : 2,
};

// 每个接口资源的权限要求
var resourcePriMap = {
  "/" : 1,
  "/login"  : 1,
  "/wait_send" : 1,
  "/wait_recycle" : 1,
  "/phoneorder" : 1,
  "/apply_recycle_complete":2,
  "/apply_order_comment":2,
  "/apply_send" : 2,
  "/apply_recycle" : 2,
};

// user pri map
// 记录每个用户的权限值
function initUserPriMap() {
  // 数据库加载用户权限数据
}

function initResourcePri() {
  // 数据库加载资源全线数据
}

//
function checkPri(req, res) {
  console.log("checkPri");
  console.log(req.session);
  userName = "no session";
  userName = req.session && req.session.userName;
  var resourceUrl = req.url;
  var userPri = userPriMap[userName];
  var uriPri = resourcePriMap[resourceUrl];
  var checkRet = false;
  if (userPri && uriPri && userPri >= uriPri) {
    checkRet = true;
  }
  // TODO 维护每个用户的权限 以及每个资源需要的权限
  console.log("userName get resource " + resourceUrl + " checkret : " + checkRet);
  if (!checkRet) {
    // redirect to unauth page
  }
  // return checkRet;
  return true;
}

initUserPriMap();
initResourcePri();

exports.checkPri = checkPri;
