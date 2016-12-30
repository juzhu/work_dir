var mysql_pool = require('./mysql_pool.js').pool;
var DBQuery = require('./mysql_pool.js').mysql_query;
var Config = require('./config_dev.js');
var async = require('async');


var prodOADB = new Object({
  "getProdInfo" : function(cb) {
    var sql = "select m.menu_id,p.prod_id, p.prod_name, m.price, m.menu_type, m.discount,de.type_desc  from prod_info as p left join menu_list as m on p.prod_id=m.prod_id  left join menu_type_desc as de on m.menu_type=de.menu_type order by menu_type"
    DBQuery(sql, cb);
  },
  "getMenuTypeList": function(cb) {
    var sql = "select de.menu_type, de.type_desc, count(*) as prod_count from menu_type_desc as de left join menu_list as m on de.menu_type=m.menu_type group by de.type_desc order by de.type_desc";
    DBQuery(sql, cb);
  },
  "addMenuInfo" : function(menuData, cb) {
    var sql = "insert into menu_list set prod_id=" + menuData.prod_id +
      ", price=" + menuData.price + ", menu_type=" + menuData.menu_type +
      ", discount='" + menuData.discount + "'";
      DBQuery(sql, cb);
  },
  "updateMenuInfo" : function(cb) {
    var sql = "update menu_list set price=" + menuData.price + ", menu_type=" + menuData.menu_type
    + ", discount='" + menuData.discount + "' where menu_id=" + menuData.menu_id;

    DBQuery(sql, cb);
  },
});

exports.DB = prodOADB;
