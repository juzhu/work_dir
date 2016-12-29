var Config = require('./config.js');
var poolModule = require("generic-pool");
var mysql_pool = poolModule.Pool({
  name     : 'mysql_pool',
  // 将建 一个 连接的 handler
  create   : function(callback) {
    var  mysql = require('mysql');
    var c = mysql.createConnection({
      user:Config.mysql_user,
      password:Config.mysql_pass,
      database : Config.mysql_db,
      host : Config.mysql_host,
      port : Config.mysql_port,
    })
    console.log("client start");
    callback(null, c);
  },
  // 释放一个连接的 handler
  destroy  : function(client) { console.log("client end"); client.end(); /*console.log("mysql client end")*/},
  // 连接池中最大连接数量
  max      : 10,
  // 连接池中最少连接数量
  min      : 0,
  // 如果一个线程3秒钟内没有被使用过的话。那么就释放
  idleTimeoutMillis : 3000,
  // 如果 设置为 true 的话，就是使用 console.log 打印入职，当然你可以传递一个 function 最为作为日志记录handler
  log : false
});

exports.mysql_query = function(sql, cb) {
  mysql_pool.acquire(function (err, client) {
    if (!err) {
      client.query(sql, function(err, results) {
        if (!err) {
          cb(false, results);
        } else {
          cb(err);
        }
        mysql_pool.release(client);
      });
    } else {
      cb(err);
      mysql_pool.release(client);
    }
  });
}

exports.mysql_escape = function(sql) {
  var  mysql = require('mysql');
  return mysql.escape(sql);
};


exports.pool = mysql_pool;
