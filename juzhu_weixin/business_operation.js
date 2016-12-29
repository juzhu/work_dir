// 集合理财P2P  处理送体验金、送红包、送加息券等工作
var amqp = require("amqp")
var Config = require("../config/config.js");
var businessComm = require("../js_comm/business_comm.js");
var logger_manager = require("log4js");

logger_manager.configure({
  appenders: [
    { type: "file", filename: __dirname + "/logs/info.log", category: "info", maxLogSize: 500 * 1024 * 1024},
    { type: "file", filename: __dirname + "/logs/warn.log", category: "warn", maxLogSize: 500 * 1024 * 1024},
    { type: "file", filename: __dirname + "/logs/error.log", category: "error", maxLogSize: 500 * 1024 * 1024}
  ]
});
var info_logger = logger_manager.getLogger("info");
var warn_logger = logger_manager.getLogger("warn");
var error_logger = logger_manager.getLogger("error");

function resourceHandler() {
  this.handleMap = {};
  this.addHandler = function(resourceID, handleObj) {
    this.handleMap[resourceID] = handleObj;
  },
  this.handleMsg = function(msg, cb) {
    var resourceID = msg.resource;
    if (this.handleMap[resourceID] === undefined) {
      warn_logger.warn("no resource handle for resource " + resourceID);
      cb(false);
    } else {
      info_logger.info("process resource " + resourceID);
      this.handleMap[resourceID](msg,cb);
    }
  }
}

var msgHandler = new resourceHandler();

var resource_handle_1 = require("./resource_1_handle.js")(msgHandler);
var resource_handle_2 = require("./resource_2_handle.js")(msgHandler);
var resource_handle_3 = require("./resource_3_handle.js")(msgHandler);
info_logger.info(msgHandler);

function processBusinessOperation() {
  var c = amqp.createConnection({
    host:Config.mq_host,
    port:Config.mq_port,
    login:Config.mq_user,
    password:Config.mq_pass,
  });

  var timeout_ms = 100000; // 100 seconds
  var timeout = setInterval(function() {
    error_logger.error("reconnect");
    c.emit("error", "reconnect");
  }, timeout_ms);

  c.on("error", function(err) {
    error_logger.error("connection error occur: "  + err);
  });

  c.once("ready", function() {
    var exchange = c.exchange(Config.business_cop_exchange, {'type':'direct', 'durable':true,'autoDelete':false, });
    var queue = c.queue(Config.business_op_queue, {'durable':true, 'autoDelete':false}, function(q) {
      q.bind(Config.business_cop_exchange, Config.business_msg_key);
      q.once('queueBindOk', function () {
        q.subscribe({"ack":true});
        q.on("message", function (message, header, deliveryInfo, raw_msg) {
          info_logger.info("recv message:" + JSON.stringify(message));
          if (message.data !== undefined) {
            var message = JSON.parse(message.data.toString());
          }
          var resourceID = message.resource;
          msgHandler.handleMsg(message, function(err) {
            if (err) {
              businessComm.publishErrorMsg(message, function(err) {
                if (!err) {
                  warn_logger.warn("handleMsg failed, and have sent to Error Msg Queue!");
                  raw_msg.acknowledge(false);
                } else {
                  // 属于自己的resourceid 但是消费失败 发送错误队列也失败 消息不消费
                  error_logger.error("handleMsg failed!");
                  raw_msg.reject(false);
                }
              });
            } else {
              info_logger.info("handleMsg success!");
              raw_msg.acknowledge(false);
            }
          })
        });
      });
    });
  });
}


processBusinessOperation();
