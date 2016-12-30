// 新用户 第二天中午前发送点餐提醒 连续提醒两天
// 也就是第一次点餐时间是在两天之前的用户
//
var mysqlEscape = require('../mysql_pool').mysql_escape;
var dbQuery = require('../mysql_pool').mysql_query;
var sendSMS = require('./cl_send_sms').sendsms;
var sendsmsWithFilterBlackList = require('./cl_send_sms').sendsmsWithFilterBlackList

var content = "再多的烦恼，是没有一顿大餐解决不了的，如果有，那就两顿。周末了，告别菜场，告别厨房，静静的等待聚箸为你备餐吧。退订回T";  // 发送的内容
// var content = "又到周末了，来份大餐犒劳下这么辛苦的自己吧；叫上闺蜜和基友们，点上田鸡，小龙虾，聊聊宝宝的八卦，一起迎接周末吧。退订回T";  // 发送

var content = "中秋玩的也该回家了，聚箸为您接风洗尘，好好准备上班。清淡美味酸汤龙利鱼，酸汤肥牛，清蒸豆豉鱼等等，更多美味等你来!退订回T";  // 发送的内容

var content = "这个周末显得特别漫长，终于熬到周末，赶紧和小伙伴一起点一餐庆祝下吧，新上酸汤龙利鱼，带皮黄牛肉，还有更多美味等你哦 退订回T";  // 发送的内容
var content = "聚箸新上酸辣下饭双人套餐,美团外卖19.9元，一份简易快餐的价格，就能和好基友,好闺蜜，美美饱餐一顿，提前下单再减两元！退订回T";  // 发送的内容

var content = "连续七天，终于把周末等来了。晚餐想好了吗？聚箸为您准备了新菜飘香鱼，外酥而里嫩，油香而不腻，赶紧来尝一下吧。退订回T"
var content = "周末，天凉了!你忍心用一份简单的快餐去应付自己的胃吗？或者奔波于菜市厨房做饭洗碗吗？约上三五个好友，一起聚箸吧!退订回T"
var content = "不想饿着肚子等外卖？提前点餐是诀窍。美团外卖十一点前下单再减两元，送达时间更有保障，叫上同事，朋友一起聚箸吧!退订回T"
// 11-03
//
var content = "周三半价嗨完，19.9双人套餐继续，还有田鸡，招财凤爪等等热门菜品八折起。提前下单既能保证准时送达，不用饿肚子，还更有优惠哦。退订回T" // 前进店
var content = "周三半价还不够，今天继续五折，各种口味田鸡，招财凤爪等等热门好评菜品继续五折起。拉上朋友，用快餐的价格享受酒店的美味。退订回T" // 坪洲店

//11-08
var content = "支持可回收餐具，为健康加一份保证，为环境少一份负担。点餐时间到了，简单的，丰富的，还有随便的，提前订餐更有优惠哦!退订回T";  // 发送的内容

var content = "晚餐准备好了吗？水煮鱼，毛血旺，水煮牛肉,香辣牛蛙香辣过瘾，泡椒田鸡,酸汤肥牛，酸菜鱼鲜香爽口。现在下单回家就能享受美味啦。退订回T";  // 坪洲/前进
var content = "晚餐准备好了吗？水煮鱼，毛血旺，水煮牛肉,香辣牛蛙香辣过瘾，泡椒田鸡,酸汤肥牛，酸菜鱼鲜香爽口。现在下单回家就能享受美味啦。退订回T";  // 坪洲/前进

// 11-09
var content = "周三美团半价日，疯抢就一天，聚箸精选亲们最喜欢的菜品限量五折优惠，11点之前订餐再减两元，还不用饿着肚子等外卖，赶紧下单吧。退订回T";

//11-14
var content = "支持可回收餐具，为健康加一份保证，为环境少一份负担。点餐时间到了，简单的，丰富的，还有随便的，提前订餐更有优惠哦!退订回T";  // 发送的内容

var last_days = 20; // 两天前的用户
// var sql = "select * from juzhu.juzhu_user_info where first_order_time>from_unixtime(unix_timestamp(now()) - " + (last_days * 24 * 60*60) + ") and last_order_time<from_unixtime(unix_timestamp(left(now(), 10))) or phone='17727828865'";
// var sql = "select * from user_market.dinner_user_19";

// var sql = "select * from user_market.last_61_to_90_days_user union select * from user_market.91_lost_user";
// var sql = "select * from juzhu.juzhu_user_info where  phone='17727828865' or phone='15818723609' or phone='15952006994'";
// var sql = "select * from user_market.home_user where last_order_time>from_unixtime(unix_timestamp(now()) - " + (60 * 24 * 60*60)+ ") and last_order_time<from_unixtime(unix_timestamp(left(now(), 10))) or phone='17727828865'";
// var sql = "select * from juzhu.juzhu_user_info where  phone='17727828865'"
var sql = "select * from user_market.dinner_user_17 where last_order_time>'2016-06-01' union select * from juzhu.juzhu_user_info where  phone='17727828865'";
var sql = "select * from user_market.longxia_user as u left join user_market.user_last_sms_time as l on u.phone=l.phone where (last_order_time>from_unixtime(unix_timestamp(now()) - " + (90 * 24 * 60*60) + ") and last_order_time<from_unixtime(unix_timestamp(left(now(), 10))) and l.last_sms_time<'2016-09-03') or u.phone='17727828865'";

var sql = "select * from user_market.home_user as u left join user_market.user_last_sms_time as l on u.phone=l.phone where (last_order_time>from_unixtime(unix_timestamp(now())-(90 * 24 * 60*60))  and last_order_time<from_unixtime(unix_timestamp(left(now(), 10))) and l.last_sms_time<'2016-10-14') or u.phone='17727828865'";

var sql = "select * from juzhu.juzhu_user_info as u left join user_market.user_last_sms_time as l on u.phone=l.phone where (last_order_time>from_unixtime(unix_timestamp(now()) - " + (90 * 24 * 60*60) + ") and last_order_time<from_unixtime(unix_timestamp(left(now(), 10))) and l.last_sms_time<'2016-10-15') or u.phone='17727828865'";


// 没发过短信的用户

var sql = "select * from juzhu.juzhu_user_info as u left join user_market.user_last_sms_time as l on u.phone=l.phone where (first_order_time>from_unixtime(unix_timestamp(now()) - (15 * 24 * 60*60)) and last_order_time<from_unixtime(unix_timestamp(left(now(), 10)))) and (l.last_sms_time is null or l.last_sms_time<'2016-10-31') and  (l.sms_cnt<3  or l.sms_cnt is null) or u.phone='17727828865'";

var sql = "select *, u.phone as send_phone from juzhu.juzhu_user_info as u left join user_market.user_last_sms_time as l on u.phone=l.phone where u.last_order_time>'2016-09-01' and (l.last_sms_time is null or l.last_sms_time<'2016-11-03') and (l.sms_cnt is null or l.sms_cnt<8 ) and (u.store_id&1) or u.phone='17727828865'";

var sql = "select *, u.phone as send_phone from juzhu.juzhu_user_info as u left join user_market.user_last_sms_time as l on u.phone=l.phone where (u.first_order_time>'2016-10-01' and last_order_time<from_unixtime(unix_timestamp(left(now(), 10)))) and (l.last_sms_time is null or l.last_sms_time<'2016-11-07') and (l.sms_cnt is null or l.sms_cnt<8 ) and (u.store_id&2) or u.phone='17727828865'";

var sql = "select *, u.phone as send_phone from juzhu.juzhu_user_info as u left join user_market.user_last_sms_time as l on u.phone=l.phone where (u.first_order_time>'2016-09-01' and last_order_time<from_unixtime(unix_timestamp(left(now(), 10)))) and (l.last_sms_time is null or l.last_sms_time<'2016-11-07')  and (u.store_id&1) or u.phone='17727828865'";


// 11-09
console.log(sql)
var sql = "select *, u.phone as send_phone from juzhu.juzhu_user_info as u left join user_market.user_last_sms_time as l on u.phone=l.phone where (u.last_order_time>'2016-09-01' and last_order_time<from_unixtime(unix_timestamp(left(now(), 10)))) and (l.last_sms_time is null or l.last_sms_time<'2016-11-09')  and (u.store_id&1) or u.phone='17727828865'";
// return;
// 11-14
var sql = "select *, u.phone as send_phone from juzhu.juzhu_user_info as u left join user_market.user_last_sms_time as l on u.phone=l.phone where (u.first_order_time>'2016-11-01' and last_order_time<from_unixtime(unix_timestamp(left(now(), 10)))) and (l.last_sms_time is null or l.last_sms_time<'2016-11-07') and (l.sms_cnt is null or l.sms_cnt<3 ) or u.phone='17727828865'";

var phone = "";
dbQuery(sql, function(err, users) {
  if (!err) {
    users.forEach(function(user) {
      phone += user.send_phone + ","
    });
    if (phone > "") {
      phone = phone.substr(0, phone.length - 1);
    }
    console.log("phone list: " + phone);
    if (phone > "") {
      sendsmsWithFilterBlackList(phone, content, function(err, id) {
        console.log("sms send ret: " + err + " id: " + id);
        var insert_sql = "insert into user_market.daily_new_user_sms set day_str=left(now(), 10), phones='" + phone + "', content='" + content + "', sms_code='" + err + "', sms_id='" + id + "', phone_num=" + users.length + ", sql_str=" + mysqlEscape(sql) + "";
        dbQuery(insert_sql, function(err) {
          console.log(insert_sql + " ret: " + err);
        });
      })
    }
  } else {
    console.log("err occur: " + err);
  }
});
