var bodyParser    = require('body-parser');
var prodOADB = require("./db_prod_oa.js").DB

module.exports = function (app) {
  app.use(bodyParser.json());       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    extended: true
  }));

  app.post('/set_menu_info', function(req, res) {
    var ret = {"error": false};
    console.log(req.body);
    var setData = req.body;
    if (setData.menu_id > "") {
      prodOADB.updateMenuInfo(setData, function(err) {
        if (err) {
          ret["error"] = err;
        }
        res.send(ret);
      });
    } else {
      prodOADB.addMenuInfo(setData, function(err) {
        if (err) {
          ret["error"] = err;
        }
        res.send(ret);
      });
    }
  });
  app.get("/prod_list", function(req, res) {
    prodOADB.getProdInfo(function(err, prodInfo) {
      if (!err) {
        prodOADB.getMenuTypeList(function(err, typeInfo) {
          prodInfo.forEach(function(prod) {
            prod['typeList'] = typeInfo;
          })
          console.log(typeInfo);
          res.render("prod_list", {items: prodInfo, typeInfo:typeInfo});
        })
      }
    })
  });
  app.get("/type_list", function(req, res) {
    prodOADB.getMenuTypeList(function(err, results) {
      if (!err) {
        res.render("type_list", {items: results});
      }
    })
  });

};
