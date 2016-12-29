var mysql_pool = require('./mysql_pool.js').pool;
var config = require('./config_dev.js');
// cb(err, login_ret)

postmanLogin  = function(user_name, passwd, cb) {
  var sql = "select user_pri, uid, user_name, work_store,passwd, if(md5('" + passwd + "')=passwd, 1, 0) as loginok  from " + config.mysql_db + "." + config.post_man_tb + " where user_name='" + user_name + "';";
  console.log("postmanLogin  2 " + sql );
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      client.query(sql, function(err, results) {
        if (!err) {
          console.log(results.length + " " + results[0]);
          if (results.length == 1 && results[0].loginok == 1) {
            cb(false, true, results[0]);
          } else {
            console.log(JSON.stringify(results));
            cb(false, false);
          }
        } else {
          console.log(JSON.stringify(err));
          console.log("postmanLogin query " + JSON.stringify(results));
          cb(err);
        }
      });
    } else {
      console.log(JSON.stringify(err));
      cb(err);
    }
    mysql_pool.release(client);
  });
}

postmanBrief = function(user_name, cb) {
  var sql = "select 'today' as day_type, day_str, send_num, send_amount, recycle_num from " + config.mysql_db + "." + config.post_summary_tb + " where user_name='" + user_name + "' and day_str=left(from_unixtime(unix_timestamp(now())), 10)" + 
  " union select 'last_day', day_str, send_num, send_amount, recycle_num from " + config.mysql_db + "." + config.post_summary_tb + " where user_name='" + user_name + "' and day_str=left(from_unixtime(unix_timestamp(now()) - 24 * 60 * 60), 10)" + 
    " union select 'month', left(now(), 7) as month_str, sum(send_num), sum(send_amount), sum(recycle_num) from " + config.mysql_db + "." + config.post_summary_tb + " where user_name='"+ user_name +"' and day_str>left(now(), 7)";
    console.log(sql);
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      client.query(sql, function(err, results) {
        if (!err && results.length > 0) {
          cb(false, results);
        } else {
          cb(true);
        }
        mysql_pool.release(client);
      });
    } else {
      console.log(JSON.stringify(err));
      cb(err);
    }
  });
}

postmanBrief("xulong", function(err, ret) {
  console.log(ret);
});

exports.login = postmanLogin;
exports.postmanBrief = postmanBrief;
