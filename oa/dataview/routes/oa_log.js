var DBQuery = require('./mysql_pool.js').mysql_query;
var mysqlEscape = require('./mysql_pool.js').mysql_escape;
function logOp(req) {
  // url session.userName;
  var userName = req.session.userName;
  if (userName === undefined) {
    userName = '';
  }
  var sql = "insert into juzhu_statistic.oa_log set op_url=" + mysqlEscape(req.originalUrl) + ", user_name=" + mysqlEscape(userName) + ", op_time=now()";
  DBQuery(sql, function(err) {
    console.log("LogOp with sql: " + sql + " error: " + err);
  })
}


exports.logOP = logOp;
