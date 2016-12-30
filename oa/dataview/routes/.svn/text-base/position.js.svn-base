var bodyParser    = require('body-parser');
var orderDB = require("./db_orders.js").orderDB

module.exports = function (app) {
  app.use(bodyParser.json());       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    extended: true
  }));

  app.get('/order_position/:date_str', function(req, res) {
    var date_str = req.params.date_str;

    orderDB.getOrderByPlatform("all", "2016-03-20", "2016-03-20", function(err, data){
      if (err) {
        res.send([]);
        return;
      }
      console.log(JSON.stringify(data));
      res.send(data)
    });
  });
  app.get('/order_position_map', function(req, res) {
    res.render("map", {
      map_title : "订单分布",
    });
  });
}


