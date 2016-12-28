var showDeetail = false;
var checkNumOnly = false;

var filterTag = {
"群" : 10,
"球" : 10,
"秋" : 10,
"加" : 20,
"加Q" : 100,
"加群" : 100,
"裙" : 100,
"QUN" : 20,
"QuN" : 20,
"QQ" : 20,
"Q" : 10,
"扣扣" : 10,
"蔻蔻" : 10,
"叩叩" : 10,
"口口" : 10,
"峮" : 20,
"郡" : 20,
"君羊" : 20,
"微" : 20,
"徽" : 10,
"薇" : 10,
"加微" : 20,
"微信" : 100,
"WEI" : 20,
"威信" : 20,
"唯心" :10,
"卫星": 10,
"魏杏" : 20,
"高仁" : 20,
"羣" : 20,
"企鹅" : 20,
"南极动物" : 20,
"推荐" : 10,
"验证" : 50,
"免费" : 50,
"电话" : 20,
"联系" : 20,
"活动" : 20,
"支付宝" : 10,
"返点":20,
"宜信":20,
};

var filterWechatTag = {
"徽" : 10,
"薇" : 10,
"微" : 20,
"加" : 20,
"加一下" : 20,
"加微" : 20,
"加我" : 20,
"微信" : 100,
"唯心" :10,
"卫星": 10,
"魏杏" : 20,
"高仁" : 20,
"沟通" : 5,
};

var filterExclude = {
  "加" : ["黄金加货币", "加入", "加急", "更加", "追加", "加一", "加佣", "加元", "加油", "加到", "美加","澳加","新加坡", "欧加", "增加", "加息","加大", "加仓", "参加","加追", "加上", "加强"],
  "微" : ["微跌", "微涨", "稍微", "略微", "微调", "微妙", "微博"],
  "球" : ["全球", "眼球", "雪球", "球赛", "地球", "绣球", "打球", "气球", "赌球"],
  "群" : ["群众", "群体", "一群"]
};

var commaPool = "~!@#$%^&*()_+-=,.;'<>:\~！@#￥%……&*（）——+-=，。；’《》：”";
var commaFilterMap = { };
var lengthCheckThreahHold = 0.8;
var positionCheckThreashHold = 3;

for (commaIndex = 0; commaIndex < commaPool.length; ++commaIndex) {
  commaFilterMap[commaPool[commaIndex]] = 1;
}

var numPool = {
  1:
    {
      "yao1": "腰邀幺妖吆夭要约葽約訞祅玅殀楆枖撽喓鴁", // 么 去掉
      "yao2": "姚窑瑶尧摇遥谣爻肴鳐轺繇徭陶侥珧荛峣蕘蘨窰窯磘謠謡瑤猺猶踰烑軺滧遙殽榣銚暚鎐摿搖揺铫愮恌徺嶤嶢尭顤颻飖餆餚媱堯垚嗂鰩匋鷂僥傜倄",
      "yao3": "咬舀杳窈崾窅蓔葽苭眑狕溔榚柼枖抭闄岆宎婹騕鴢鷕偠齩仸",
      "yao4" : "药耀鹞曜钥疟靿薬藥葯艞袎覞纅詏筄窔穾矅讑瘧趯獟燿熎烄鈅曣鑰愮驁鷂鼼", // 要
      "yi1" : "11️⃣①一伊依衣医铱漪猗壹咿揖黟衤噫椅祎繄袆蛜褘稦禕譩瑿渏洢郼毉醫檹銥弌嬄嫛夁吚鷖鹥黳",
      "yi2" : "宜仪移怡沂疑彝遗夷颐贻姨诒咦饴胰嶷圯痍一蛇义熙眙迤荑簃匜扅萓蛦螔衪袘耛義羠觺訑箷詒誃礙謻譺讉貤貽瓵珆跠狏狋熪熈迆迱迻遺沶釶椸椬鉇桋栘銕柂杝暆鏔拸戺恞彵彞彜彛弬巸嶬頉峓頤頥顊寲宧宐飴媐鮧鴺鸃冝儀侇乁",
      "yi3":"以已乙矣椅倚蚁迤苡旖钇尾蛾舣锜苢螘艤蟻裿笖礒輢轙迆逘醫歖釔檥鈘鉯錡旑敼攺扡扆阤陭靉庡嶬崺顗嬟鳦叆偯佁齮",
      "yi4" :"亿义意亦毅议益艺异译翼役溢逸忆邑疫驿谊裔轶抑奕弈懿弋峄翊衣佚翳屹绎羿呓刈镒翌诣肄仡熠缢挹臆癔怿蜴悒薏埸瘗一艾食佾劓酏殪镱嗌乂勚廙浥繄螠鹝藙藝蓺蘙萟虉蛡苅芅艗膉衵袘肊袣耴裛義羛褹襗襼繹繶縊絏訲詍詣竩穓誼秇譯議瞖睪讛豙豛豷貖瘱貤瘞痬賹異贀玴跇獈燱燡燚熼熤焲焬炈軼瀷澺輗潩湙辥浳浂洩泆殹殔醳醷歝欭欥檍樴槸釴榏鈠棭栺栧枻枍杙曎曀晹昳斁敡撎鎰搤掜鐿懌憶阣悥悘陭隿怈忔霬靾幆帠帟嶧寱孴嬟嬑嫕饐妷墿埶垼驛坄骮圛囈鮨唈鯣呹呭勩鶂鶃劮鷁鷊鷖鷧鷾兿鹢鹥儗億黓俋伿齸伇亄意宜一姨" //易
    },
    2: {
      "er2" : "鸸鲕荋胹聏袻耏輀轜洏栭陑陾隭峏髵唲鮞咡鴯兒児侕", // 而儿
      "er3" : "尔耳洱饵迩珥铒而薾衈趰爾邇毦栮鉺尓尒餌嬭駬",
      "er4": "2②二贰佴誀貮貳樲鉺弍髶咡刵2",
    },
    3: {
      "san1" :"3③三氵叁彡毵犙毿毶弎鬖叄厁",
      "san2" :"",
      "san3" :"伞馓糁散繖糤糣糝糂橵椮鏒鏾饊傪傘",
      "san4" :"散潵閐帴鬖俕",
      "shan1" :"山珊杉衫删姗栅煽苫跚舢埏膻钐扇潸芟蔪脠羶羴襂襳纔縿笘穇痁狦烻軕炶澘邖櫼檆釤柵銏摻搧挻幓顫姍嘇鯅鱣剼刪",
      "shan3" : "陕闪掺覢睒熌煔炶晱摻閃閄陝顃",
      "shan4" : "善扇汕擅膳讪鄯嬗赡缮鳝疝骟苫掸禅蟮剡钐蟺繕訕笧禪謆磰譱贍赸灗潬釤樿椫敾攙撣掞鐥嶦饍墡墠騸單鱓鱔鱣鳣儃僐傓䥇䦂䦅",
    },
    4: {
      "si1" : "斯思司丝私撕嘶锶咝厮蛳鸶澌缌厶偲飔蕬虒蜤螄螔蟖蟴罳緦絲糸簛禠禗謕磃燍泀榹楒鉰銯鋖鍶鐁愢恖廝颸媤騦噝鷉鷥凘傂俬鼶",
      "si2" : "",
      "si3" : "死",
      "si4" : "4④四寺似泗驷祀俟嗣肆饲伺巳耜姒汜食兕笥涘蕼肂罒覗竢禩貄牭瀃逘洍泤釲鈶鈻梩柶銉枱杫飤飴飼孠娰駟騃儩価佁佀亖",
      "shi1" : "诗施失狮湿尸虱蓍酾鲺浉鸤蒒葹蝨褷襹絁籭箷詩瑡獅濕溼溮湤邿釃釶鉇鍦敆師屍噓魳鯴鰤呞鳲鳾厔鶳䴛",// 师嘘
      "shi2" : "十石识食拾蚀鲥莳饣埘炻湜鼫蒔蝕竍祏識溡辻遈榯鉐鉽時旹嵵峕實寔宲実飠姼塒囸鮖鰣鼭佦丆",// 什时实
      "shi3" : "使史驶屎矢豕笶痑狶鉂宩駛兘乨",// 始
      "shi4" : "市式世士室试视氏示似适释饰逝仕誓轼嗜柿峙侍拭噬恃舐筮谥弑礻螫贳铈莳奭蒔舓褆襫視繹觢簭試秲諟諡謚睗眡眎眂貰跩狧煶烒軾澨澤遞適遰遾醳釋檡鈰鉃栻柹枾銴昰揓戺惿恀忯忕徥弒崼飭飾嬕餙餝媞馶啇咶鰘呩叓卋勢冟齛亊丗",// 是事势
    },
    5 : {
      "wu1" : "乌屋污邬巫呜诬钨恶兀圬於螐箼誈誣窏趶烏洿鄔汚汙歍釫杇杅鎢扝扜惡弙嗚鰞鴮剭",
      "wu2" : "无吴吾芜毋唔梧浯蜈亡鼯蝥郚铻鹀蕪莁茣蟱禑祦譕璑珸無洖橆鋘鋙幠峿娪墲鯃呉吳鵐鷡兦俉齬亾",
      "wu3" : "5⑤五武午伍舞捂侮庑忤仵妩牾怃迕鹉蕪膴碔瞴甒瑦珷玝躌熓潕逜橆旿摀憮陚廡嫵娬娒塢啎鵡儛倵俉",
      "wu4" : "物务误雾戊晤勿悟坞婺焐兀鹜芴恶鋈骛寤乌杌痦阢揾靰蘁粅窹誤矹熃烏溩渞逜沕旿敄扤惡悮悞隖忢雺霚霧霿嵨嵍岉屼娪奦塢騖噁嗚務鶩鼿齀伆",
    },
    6:{
      "liu1" : "溜熘蹓瀏澑",
      "liu2" : "刘留流硫瘤浏琉骝鎏榴馏镏旒遛镠飗鹠藰蓅蒥蟉裗磂癅疁畱畄璢瑬瑠瀏沠橊旈斿鎦鏐鐂懰嵧飀飅媹餾駠駵騮驑嚠鰡劉鶹麍",
      "liu3" : "柳绺锍藰羀罶綹珋熮橮桺桞栁鋶懰嬼",
      "liu4" : "6⑥六遛溜碌陆馏镏鹨蹓翏磟磂澑鎦鐂陸雡霤廇飂餾塯鬸鷚",
    },
    "7" :{
      "qi1" : "7⑦七妻戚漆栖欺沏凄嘁柒欹萋蹊桤缉螇緝緀紪諆碕踦迉淒郪榿棲桼朞敧攲鏚捿慽慼悽霋娸魌鵸鶈僛傶倛",// 期
      "qi2" : "棋旗骑琦祺琪祁岐崎淇脐歧祈圻畦麒耆蕲荠亓綦芪鳍骐颀萁蛴蜞俟锜埼鲯藄薺蘄萕蚑蚔蚚荎蜝艩臍蠐肵褀纃綨綥粸竒稘禥祇碕碁疧璂跂玂猉踑軙軝濝鄿櫀檱釮棊錡旂斊斉掑鐖懠愭忯庈嵜頎岓騎騏騹鬐鬾鬿魕鮨鯕鰭鶀剘麡倛齊亝",// 奇其齐
      "qi3" : "起启企绮岂屺乞杞稽綮芑棨袳裿綺觭諬豈盀玘邔梩晵闙嵜婍啟啔啓唘呇",
      "qi4" : "气器汽弃砌契泣迄憩碛讫葺妻槭汔碶芞舙蟿肐罊訖礘磩磧磜矵盵甈趞跂踖躤躩焏炁湇湆洓氣欫棄栔暣摖扢憇愒忔夡噐唭咠呮鼜",
    },
    "8" : {
      "ba1" : "8⑧八巴扒叭芭岜疤笆粑捌罢钯鲃蚆羓罷紦豝玐釛釟鈀柭朳峇夿哵仈丷",// 吧
      "ba2" : "拔跋八茇魃菝胈詙癹犮炦軷颰妭墢坺叐鼥",
      "ba3" : "靶钯鈀",// 把
      "ba4" : "坝罢霸爸灞耙鲅鲃鲌罷覇矲跁欛弝壩垻鮁鮊䎱䎬",
    },
    "9" : {
      "jiu1" : "纠揪鸠赳啾鬏阄萛糾糺穋稵牞樛朻摎揫揂鬮鳩勼丩", // 究
      "jiu2" : "",
      "jiu3" : "9⑨九酒久玖韭灸舏紤糺汣氿镹韮奺乣乆",
      "jiu4" : "旧舅咎臼鹫疚厩柩桕僦舊畂湬殧欍柾慦廐廏廄鯦匶匛匓鷲麔倃齨", // 就救
    },
    "0" : {
      "lin1" : "拎淋",
      "lin2" : "林临琳霖麟磷邻淋鳞啉辚瞵粼嶙遴璘臨翷繗綝粦箖碄疄獜蹸燐瀶潾轔鄰暽晽斴鏻惏隣崊壣驎魿鱗厸冧麐",
      "lin3" : "檩凛廪懔菻箖稟癝癛澟檁撛懍廩顲凜僯亃",
      "lin4" : "蔺吝赁膦淋躏藺痳賃疄甐蹸躙躪焛轥橉閵悋恡僯亃",
      "ling1" : "", // 凌
      "ling2" : "0〇陵零菱铃羚苓泠伶绫翎聆棱酃棂瓴蛉囹鲮柃〇祾鸰蕶蔆蓤蘦舲衑袊裬綾紷詅笭竛稜秢砱皊琌跉狑爧燯軨瀮澪輘淩醽欞櫺鈴朎錂昤掕閝阾霊霗霛霝彾靇靈崚岺孁婈姈駖夌坽魿鯪鴒刢鹷麢倰齡齢龗",
      "ling3" : "岭领令袊軨彾嶺領",
      "ling4" : "另令呤炩",
    },
}

var alphaMap = {};
alphaMap = {
  "a" : "a",
  "b" : "b",
  "c" : "c",
  "d" : "d",
  "e" : "e",
  "f" : "f",
  "g" : "g",
  "h" : "h",
  "i" : "i",
  "j" : "j",
  "k" : "k",
  "l" : "l",
  "m" : "m",
  "n" : "n",
  "o" : "o",
  "p" : "p",
  "q" : "q",
  "r" : "r",
  "s" : "s",
  "t" : "t",
  "u" : "u",
  "v" : "v",
  "w" : "w",
  "x" : "x",
  "y" : "y",
  "z" : "z",
  "A" : "a",
  "B" : "b",
  "C" : "c",
  "D" : "d",
  "E" : "e",
  "F" : "f",
  "G" : "g",
  "H" : "h",
  "I" : "i",
  "J" : "j",
  "K" : "k",
  "L" : "l",
  "M" : "m",
  "N" : "n",
  "O" : "o",
  "P" : "p",
  "Q" : "q",
  "R" : "r",
  "S" : "s",
  "T" : "t",
  "U" : "u",
  "V" : "v",
  "W" : "w",
  "X" : "x",
  "Y" : "y",
  "Z" : "z",
  "_" : "_",
  "-" : "-",
  "1" : "1",
  "2" : "2",
  "3" : "3",
  "4" : "4",
  "5" : "5",
  "6" : "6",
  "7" : "7",
  "8" : "8",
  "9" : "9",
  "0" : "0",
}


var numFilterMap = {};
var wechatFilterMap = alphaMap;

function initFilterMap() {
  for (num in numPool) {
    var numString = numPool[num];
    for (py in numString) {
      pyString = numString[py];
      var strLen = pyString.length;
      // console.log(pyString + " length: " + strLen);
      for (i = 0; i < strLen; ++i) {
        var numChar = pyString[i];
        numFilterMap[numChar] = num;
      }
    }
  }
}

initFilterMap();

var filterStat = 0;
// 0 没遇到数字 或者数字积分减到0
// 1 数字积分不为0 上一个字符为数字
// 2 上一个字符不为数字
// 3 上两个或者上两个以上字符不为0
var checkPoint = 0;
var startPoint = 5; // 首次遇到数字加积分
var addPoint2 = 5;  // 中断一个之后再次遇到数字
var addPoint3 = 2;  // 中断两个之后再次遇到数字
var addPoint4 = 1;  // 中断两个之后再次遇到数字

var subPoint1 = 1;
var subPoint2 = 2;

var checkRet = ""; // 检查的可能号码
var checkRetAll = ""; // 包含该段号码所有的原始字符
var checkRetAllStartIndex = 0;
var checkWechat = false;
// num 可以使数字 字母 下划线 减号
function caseState0(curChar, num) {

  // 初始或者积分已经减到0
  if (num === undefined) {
    // 状态不变
  } else {
    if (checkWechat && !((num>="a" && num<="z") || (num>="A" && num<="Z"))) {
      // 微信必须是字谜开始
    } else {
      filterStat = 1;
      checkPoint = startPoint;
      checkRet += num;
      checkRetAll += curChar;
    }
  }
}

function caseState1(curChar, num) {
  // 上一个或多个为数字
  if (num === undefined) {
    filterStat = 2;
    checkPoint -= subPoint2;
  } else {
    checkPoint = startPoint
    checkRet += num
  }
  checkRetAll += curChar;
}

function caseState2(curChar, num) {
  // 上一个为非数字
  if (num === undefined) {
    filterStat = 3;
    checkPoint -= subPoint2;
  } else {
    filterStat = 1;
    checkPoint += addPoint2;
    checkRet += num
  }
  checkRetAll += curChar;
}

function caseState3(curChar, num) {
  // 上两个以上为非数字
  if (num === undefined) {
    filterStat = 3;
    checkPoint -= subPoint2;
    if (checkPoint <= 0) {
      checkRetAll = "";
      checkRet = "";
      filterStat = 0;
    } else {
      checkRetAll += curChar;
    }
  } else {
    filterStat = 2;
    checkPoint += addPoint3;
    checkRet += num
    checkRetAll += curChar;
  }
}

var stateProMap = {
  "0" : caseState0,
  "1" : caseState1,
  "3" : caseState3,
  "2" : caseState2,
}

function checkStateMachineWechatStr(checkStr) {
  // console.log(checkStr);
  // console.log(checkStr);
  var checkStrLen = checkStr.length;
  checkRet = "";
  checkRetAll = "";
  filterStat = 0;
  for (charIndex = 0; charIndex < checkStrLen; ++charIndex) {
    var curChar = checkStr[charIndex];
    if (commaFilterMap[curChar] == 1) {
      // console.log("filter comma " + curChar);
      continue;
    }
    var num = wechatFilterMap[curChar];
    stateProMap[filterStat](curChar, num);
    if (checkRet.length == 1) {
      checkRetAllStartIndex = charIndex;
    }
    if (checkRet.length >=5) {
      break;
     }
  }
  if (checkRet.length >=5 ) {
    // console.log(checkStr + " checkRet:" + checkRet + " strMask: " + checkRetAll);
    return [checkRet, checkRetAll];
  }
  return ["", ""];
}


function checkStateMachineNumStr(checkStr) {
  // console.log(checkStr);
  // console.log(checkStr);
  var checkStrLen = checkStr.length;
  checkRet = "";
  checkRetAll = "";
  filterStat = 0;
  for (charIndex = 0; charIndex < checkStrLen; ++charIndex) {
    var curChar = checkStr[charIndex];
    if (commaFilterMap[curChar] == 1) {
      // console.log("filter comma " + curChar);
      continue;
    }
    var num = numFilterMap[curChar];
    stateProMap[filterStat](curChar, num);
    if (checkRet.length == 1) {
      checkRetAllStartIndex = charIndex;
    }
    if (checkRet.length >= 6) {
      break;
     }
  }
  if (checkRet.length >= 6) {
    // console.log(checkStr + " checkRet:" + checkRet + " strMask: " + checkRetAll);
    return [checkRet, checkRetAll];
  }
  return ["", ""];
}

checkStateMachineNumStr("加群: 17782746477");
checkStateMachineNumStr("加群: ①②③④⑤⑥⑦⑧⑧");
checkStateMachineNumStr("加群: (以三五,-七-=把~酒$是%尔");
checkStateMachineNumStr("~`要~~~琪~~~琪~~`二~~期~~巴~@#尔344");
checkStateMachineNumStr("我要七饭了，八要打搅我，一会见");
checkStateMachineNumStr("我刚加了2000，上次亏了1700");
checkStateMachineNumStr("你好：下周将账户资金增加到3000\\\\U0001F4B2。后期增加到10000\\\\U0001F4B2。");
var strategyArray = {
  // "lengthCheck" : lengthCheck,
  "tagCheckStrategy" : tagCheckStrategy,
};

function  tagCheckWechatStrategy(checkStr, checkRet, checkRetAll) {
  var checkTag = [];
  var tagPoint = 0;
  var checkStrUpper = checkStr.toUpperCase();
  for (tagName in filterWechatTag) {
    var tagThreshold = filterWechatTag[tagName];
    var tagStrIndex = checkStrUpper.indexOf(tagName);
    while (tagStrIndex != -1) {
      if (tagStrIndex != -1) {
        // 过一遍排除单词的
        // 比如找到了加  但是"加" 是加息 那就不算
        var excludeArray = filterExclude[tagName];
        var needContinue = true;
        if (excludeArray === undefined) {
        } else {
          for (etagIndex in excludeArray) {
            var etagName = excludeArray[etagIndex];
            var searchOffset = 0;
            var offPar = etagName.indexOf(tagName);
            if (offPar >= 0) {
              searchOffset = tagStrIndex - offPar;
            } else {
              break;
            }
            var etagNameIndex = checkStrUpper.indexOf(etagName, searchOffset);
            if (etagNameIndex != -1 && (etagNameIndex + offPar == tagStrIndex)) {
              // 不算敏感
              needContinue = false;
              // console.log("tag:" + tagName + " index: " + tagStrIndex + " exclude tagname:" + etagName + " index: " + etagNameIndex);
            }
          }
        }
        if (!needContinue) {
        } else {
          if (Math.abs(tagStrIndex - checkRetAllStartIndex) < tagThreshold) {
            // console.log("tagname: " + tagName + " tagStrIndex " + tagStrIndex + " checkRetAllStartIndex " + checkRetAllStartIndex)
            checkTag.push(tagName);
            break;
          } else {
            // console.log(checkStr + " tag: " + filterTag[tagIndex] + " index " + tagStrIndex);
          }
        }
      }
      tagStrIndex = checkStrUpper.indexOf(tagName, tagStrIndex + 1);
    }
  }
  return [checkTag.length > 0, checkTag];
}


function  tagCheckStrategy(checkStr, checkRet, checkRetAll) {
  var checkTag = [];
  var tagPoint = 0;
  var checkStrUpper = checkStr.toUpperCase();
  for (tagName in filterTag) {
    var tagThreshold = filterTag[tagName];
    var tagStrIndex = checkStrUpper.indexOf(tagName);
    while (tagStrIndex != -1) {
      if (tagStrIndex != -1) {
        // 过一遍排除单词的
        // 比如找到了加  但是"加" 是加息 那就不算

        var excludeArray = filterExclude[tagName];
        var needContinue = true;
        if (excludeArray === undefined) {
        } else {
          for (etagIndex in excludeArray) {
            var etagName = excludeArray[etagIndex];
            var searchOffset = 0;
            var offPar = etagName.indexOf(tagName);
            if (offPar >= 0) {
              searchOffset = tagStrIndex - offPar;
            } else {
              break;
            }
            // var etagNameIndex = checkStrUpper.indexOf(etagName);
            var etagNameIndex = checkStrUpper.indexOf(etagName, searchOffset);
            if (etagNameIndex != -1 && (etagNameIndex + offPar == tagStrIndex)) {
              // 不算敏感
              needContinue = false;
              // console.log("tag:" + tagName + " index: " + tagStrIndex + " exclude tagname:" + etagName + " index: " + etagNameIndex);
            }
          }
        }
        if (!needContinue) {
        } else {
          if (Math.abs(tagStrIndex - checkRetAllStartIndex) < tagThreshold) {
            checkTag.push(tagName);
            // console.log("tagname: " + tagName + " tagStrIndex " + tagStrIndex + " checkRetAllStartIndex " + checkRetAllStartIndex)
            break;
          } else {
            // console.log(checkStr + " tag: " + filterTag[tagIndex] + " index " + tagStrIndex);
          }
        }
      }
      tagStrIndex = checkStrUpper.indexOf(tagName, tagStrIndex + 1);
    }
  }
  return [checkTag.length > 0, checkTag];
}

// checkRet checkRetAll很接近
// 或者占比整个内容长度 一句话基本都是别为数字串
function lengthCheck(checkStr, checkRet, checkRetAll) {
  if (checkRet.length / checkStr.length > lengthCheckThreahHold) {
    return [true];
  } else if (checkStr.indexOf(checkRetAll) == 0 && checkRet == checkRetAll) {
    // console.log( "lengthCheck: " + checkRet + " " + checkRetAll + " checkStr " + checkStr);
    return [true];
  }
  return [false];
}

function positionCheck(checkStr, checkRet, checkRetAll) {
  return [false]
  var checkRetAllIndex = checkStr.indexOf(checkRetAll);
  if (checkRetAllIndex != -1 && checkRetAllIndex <= positionCheckThreashHold) {
    return [true];
  }
  return [false];
}

function preProcessStr(checkStr) {
  var checkStr = checkStr.replace(/\\\\U.{8}/g, "");
  var checkStr = checkStr.replace(/[\s,-]/g, "");
  return checkStr;
}

var contentIndex = 0;
function processStr(checkStrOrg) {
  var checkStr = preProcessStr(checkStrOrg);

  checkWechat = false;
  var checkResult = checkStateMachineNumStr(checkStr);
  if (checkNumOnly && checkResult[0] > "") {
    console.log(checkStrOrg );
    if (showDeetail) {
      console.log(JSON.stringify(checkResult));
    }
    return;
  }
  // 先找到可能的数字串
  // 再来过一系列的策略
  // checkContent(allInfo[contentIndex]);
  var isSpam = false;
  if (checkResult[0] > "") {
    var straRet = tagCheckStrategy(checkStr, checkResult[0], checkResult[1]);
    if (straRet[0]) {
      // console.log(contentIndex + ": " + checkStrOrg + " check by tagCheckStrategy " + " ret:" + checkResult[0] + " mask:" + checkResult[1] + " stra ret: " + straRet);
      if (showDeetail) {
        console.log(checkStrOrg + " check by tagCheckStrategy " + " ret:" + checkResult[0] + " mask:" + checkResult[1] + " stra ret: " + straRet);
      } else {
        console.log(checkStrOrg);
      }
      isSpam = true;
      // console.log(checkStr + " ret:" + checkResult[0] + " mask:" + checkResult[1]);
    } else {
      var straRet = lengthCheck(checkStrOrg, checkResult[0], checkResult[1]);
      if (straRet[0]) {
        // console.log(contentIndex + ": " + checkStrOrg + " check by tagCheckStrategy " + " ret:" + checkResult[0] + " mask:" + checkResult[1] + " stra ret: " + straRet);
        if (showDeetail) {
          console.log(checkStrOrg + " check by lengthCheck " + " ret:" + checkResult[0] + " mask:" + checkResult[1] + " stra ret: " + straRet);
        } else {
          console.log(checkStrOrg);
        }
        isSpam = true;
        // console.log(checkStr + " ret:" + checkResult[0] + " mask:" + checkResult[1]);
      }
      var straRet = positionCheck(checkStr, checkResult[0], checkResult[1]);
      if (straRet[0]) {
        // console.log(contentIndex + ": " + checkStrOrg + " check by tagCheckStrategy " + " ret:" + checkResult[0] + " mask:" + checkResult[1] + " stra ret: " + straRet);
        if (showDeetail) {
          console.log(checkStrOrg + " check by positionCheck " + " ret:" + checkResult[0] + " mask:" + checkResult[1] + " stra ret: " + straRet);
        } else {
          console.log(checkStrOrg);
        }
        isSpam = true;
        // console.log(checkStr + " ret:" + checkResult[0] + " mask:" + checkResult[1]);
      }
    }
  }
  if (isSpam == false) {
    checkWechat = true;
    var checkResult = checkStateMachineWechatStr(checkStr);
    // 过微信
    // checkContent(allInfo[contentIndex]);
    var isSpam = false;
    if (checkResult[0] > "") {
      // var straRet = strategyArray[stra](checkStr, checkResult[0], checkResult[1]);
      var straRet = tagCheckWechatStrategy(checkStr, checkResult[0], checkResult[1]);
      if (straRet[0]) {
        // console.log(contentIndex+ ": " + checkStrOrg + " check by tagCheckWechatStrategy " + " ret:" + checkResult[0] + " mask:" + checkResult[1] + " stra ret: " + straRet);
        // console.log(checkStrOrg + " check by tagCheckWechatStrategy " + " ret:" + checkResult[0] + " mask:" + checkResult[1] + " stra ret: " + straRet);
        console.log(checkStrOrg);
        isSpam = true;
        // console.log(checkStr + " ret:" + checkResult[0] + " mask:" + checkResult[1]);
      }
    }
  }
}

/*
processStr("每天都有收入，至少90以上。手几就行，有意者咨询wei信8️⃣2️⃣0️⃣4️⃣3️⃣0️⃣1️⃣7️⃣4️⃣\n\n\n邀简直人员威信8️⃣2️⃣0️⃣4️⃣3️⃣0️⃣1️⃣7️⃣4️⃣");

processStr("我们都关注的。相信极鼎说的时间也是参数。我的薇信:m一路儿七二七一久。你连一个？");
*/
var fs = require("fs");
fs.readFile("./ugc_content.txt", 'utf8', function(err, data) {
  if (!err) {
    var allInfo = data.split("\n");
    console.log(allInfo.length);
    for(contentIndex = 0; contentIndex < allInfo.length; ++contentIndex) {
      var checkStrOrg = allInfo[contentIndex];
      processStr(checkStrOrg);
    }
  } else {
   console.log(err);
  }
})
