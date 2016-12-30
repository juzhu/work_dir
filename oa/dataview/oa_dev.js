var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var app     = express();
app.sms_data = []
app.sms_data_all = {}

app.use(cookieParser("bingo_juzhu_key"));
app.use(session({
    secret: 'sessiontest',//与cookieParser中的一致
    resave: true,
    saveUninitialized:true
}));



var path    = require('path');

var routes1 = require('./routes/index.js')(app);
var routes2 = require('./routes/position.js')(app);
var routes3 = require('./routes/market.js')(app);
var routes4 = require('./routes/prod_oa.js')(app);
/*
var routes3 = require('./routes/client_request.js')(app);
var routes4 = require('./routes/interface-provider.js')(app);
var routes5 = require('./routes/get_html.js')(app);
var routes6 = require('./routes/config.js')(app);
var routes7 = require('./routes/mobile.js')(app);
*/


// 设置静态目录
app.use(express.static(__dirname + '/public'));

// 设定port变量，意为访问端口
app.set('port', process.env.PORT || 4000);

// 设定views变量，意为视图存放的目录
app.set('views', path.join(__dirname, 'views'));

var hbs = require('hbs');
// 加载hbs模块
hbs.registerHelper('if_eq', function(a, b, opts) {
  if(a == b) // Or === depending on your needs
    return opts.fn(this);
  else
    return opts.inverse(this);
});

hbs.registerHelper('if_ne', function(a, b, opts) {
  if(a != b) // Or === depending on your needs
    return opts.fn(this);
  else
    return opts.inverse(this);
});
// 加载hbs模块
hbs.registerHelper('if_gt', function(a, b, opts) {
  if(a > b) // Or === depending on your needs
    return opts.fn(this);
  else
    return opts.inverse(this);
});


// 加载hbs模块
hbs.registerHelper('if_undefined', function(a, opts) {
  if(a === undefined) // Or === depending on your needs
    return opts.fn(this);
  else
    return opts.inverse(this);
});




// 指定模板文件的后缀名为html
app.set('view engine', 'html');

// 运行hbs模块
app.engine('html', hbs.__express);

// 设定监听端口
app.listen(9200);
