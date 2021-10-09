/*
哔哩哔哩签到
暂未适配iOS

cron "0 5 * * *" script-path=https://raw.githubusercontent.com/he1pu/signin/main/_bili.js, tag=哔哩哔哩签到

环境变量：
coin_num     每日投币数量（默认5）
coin_type    投币类型：1=>关注的up；2=>随机（默认1）
silver2coin  银瓜子换硬币：true=>开启；false=>关闭（默认true）

*/

const $ = new Env('哔哩哔哩签到');
const notify = $.isNode() ? require('./sendNotify') : '';
let cookieArr = [],bili_jct='',
  bilibili_info = {};


let allMessage = '';
!(async () => {
  readConfig();
  if (!cookieArr.length && $.isNode()) {
     await scanGetCookie();
     await waitCookie();
     return
  }
  for (let i = 0, len = cookieArr.length; i < len; i++) {
    $.index = i + 1;
    console.log(`\n*********开始【哔哩哔哩账号${$.index}】********\n`);
    try {
      bilibili_info = cookieArr[i];
      let cookieStr = bilibili_info.bilibili_cookie;
      bili_jct = getCookie(cookieStr, 'bili_jct');
      let coin_num = bilibili_info.coin_num;
      let coin_type = bilibili_info.coin_type;
      let silver2coin = bilibili_info.silver2coin;
      await getUserInfo();
      if (!$.is_login) {
        $.msg($.name, `【提示】cookie已失效`, `B站账号${$.index} ${$.uname || ''}\n请重新登录获取`);
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.uname || ''}`, `B站账号${$.index} ${$.uname || ''}\n请重新登录获取cookie`, `\n\n本通知 By：https://github.com/he1pu/JDHelp`);
        }
        continue;
      }

      await run(coin_num, coin_type, silver2coin);

    } catch (e) {
      $.logErr(e);
    }
  }
  if ($.isNode()) await notify.sendNotify(`${$.name}`, allMessage, {}, '本通知 By：https://github.com/he1pu');
  else if (cookieArr.length) {
    $.msg($.name, ``, `${allMessage}本通知 By：https://github.com/he1pu` , {"open-url": "https://bilibili.com"});
  }else {
    $.msg($.name, `暂未适配iOS`, `本通知 By：https://github.com/he1pu` , {"open-url": "https://bilibili.com"});
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    if (cookieArr.length || !$.isNode()) $.done();
  })


async function getUserInfo() {
  let userData = await requestData('https://api.bilibili.com/x/web-interface/nav');
  if (userData) {
    $.uname = userData.data.uname;
    $.uid = userData.data.mid;
    $.is_login = userData.data.isLogin;
    $.coin = userData.data.money;
    $.vip_type = userData.data.vipType;
  }
  if ($.is_login) console.log('获取用户信息成功')
}

//模拟B站漫画客户端签到
async function mang_sign() {
  let res = await requestData('https://manga.bilibili.com/twirp/activity.v1.Activity/ClockIn?device=h5&platform=ios', {"type":0}, 'post');
  let msg = '漫画签到: ';
  if (res.code == 0) {
    msg += "成功";
  } else if (res.msg == 'clockin clockin is duplicate') {
    msg += "今天已经签到过了";
  } else {
    msg += `失败，信息为(${res["msg"]})`;
  }
  console.log(msg);
  return msg;
}

//B站直播签到
async function live_sign() {
  let ret = await requestData('https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign');
  let msg = '直播签到: '
  if (ret.code == 0) {
    msg += `成功，${ret["data"]["text"]}，特别信息：${ret["data"]["specialText"]}，本月已签到${ret["data"]["hadSignDays"]}天`;
  } else if (ret.code == 1011040) {
    msg += "今日已签过,无法重复签到";
  } else {
    msg += `失败，信息为：${ret["message"]}`;
  }
  console.log(msg);
  return msg;
}

//领取年度大会员权益 [receive_type int 权益类型，1为B币劵，2为优惠券]
async function vip_privilege_receive(receive_type = 1) {
  let param = {"type":receive_type, "csrf":bili_jct};
  let ret = await requestData('https://api.bilibili.com/x/vip/privilege/receive', param, 'post');
  return ret;
}

//获取漫画大会员福利
async function vip_manga_reward() {
  let ret = await requestData('https://manga.bilibili.com/twirp/user.v1.User/GetVipReward', {"reason_id": 1}, 'post');
  return ret;
}

//取经验信息
async function reward() {
  let ret = await requestData('https://account.bilibili.com/home/reward');
  return ret;
}

async function run(coin_num, coin_type, silver2coin) {
  let memberMsg = '';
  let manhua_msg = await mang_sign();
  await $.wait(2000);
  let live_msg = await live_sign();
  await $.wait(2000);

  let vip_manhua = await vip_manga_reward();
  console.log(`获取漫画大会员福利: ${vip_manhua.msg}`);
  await $.wait(2000);
  if ($.vip_type >= 2) {
    let vip_year = await vip_privilege_receive();
    console.log(`获取年费大会员福利: ${vip_year.message}`);
    await $.wait(2000);
  }
  

  await coinLog();
  let aid_list = await get_region();
  coin_num = coin_num - $.sendCoin;
  coin_num = coin_num < $.coin ? coin_num : $.coin;
  let coin_msg = '',
    report_msg = '',
    share_msg = '',
    silver2coin_msg = '未开启银瓜子兑换硬币功能';
  if (coin_num > 0) {
    if (coin_type == 1) {
      console.log('给关注的up投币');
      let followings_list = await get_followings($.uid);
      for (let i = 0, len = followings_list.data.list.length; i < len; i++) {
        mid = followings_list.data.list[i]['mid'];
        if (mid) {
          aid_list = await space_arc_search(mid);
        }
      }
    }else {
      console.log('随机获取up投币');
    }
    let success_count = 0;
    for (let j = aid_list.length - 1; j >= 0; j--) {
      if (coin_num <= 0) {
        break;
      }
      let aid = aid_list[j];
      let ret = await coin_add(aid.aid);
      if (ret.code == 0) {
        coin_num -= 1;
        console.log(`成功给${aid["title"]}投一个币`);
        success_count += 1;
      } else if (ret.code == 34005) {
        //-104 硬币不够了 -111 csrf 失败 34005 投币达到上限
        console.log(`投币${aid.title}失败，原因为${ret["message"]}`);
        continue;
      } else {
        console.log(`投币${aid.title}失败，原因为${ret["message"]}，跳过投币`);
        break;
      }
      coin_msg = `今日成功投币${success_count}/${bilibili_info.coin_num}个`;
      await $.wait(3000);
    }
  }else {
    coin_msg = `今日成功投币${$.sendCoin}个; 设置投币：${bilibili_info.coin_num}个`;
  }
  console.log(coin_msg);

  let reward_ret = await reward();

  let aid = aid_list[0].aid,
      cid = aid_list[0].cid,
      title = aid_list[0].title;
  if (reward_ret.data.watch_av == true) {
    report_msg = '任务已完成';
  }else {
    let report_ret = await report_task(aid, cid);
    report_msg = report_ret.code == 0 ? `观看《${title}》300秒` : `失败`;
    console.log(report_msg);
    await $.wait(2000);
  }

  if (reward_ret.data.share_av == true) {
    share_msg = '任务已完成';
  }else {
    let share_ret = await share_task(aid);
    share_msg = share_ret.code == 0 ? `分享《${title}》成功` : `失败`;
    console.log(share_msg);
  }
  
  if (silver2coin == 'true') {
    let silver2coin_ret = await silver2coin_fn();
    silver2coin_msg = silver2coin_ret.code == 0 ? '成功将银瓜子兑换为1个硬币' : `${silver2coin_ret["message"]}`;
  }
  console.log(silver2coin_msg);

  let live_stats = await live_status();
  reward_ret = await reward();
  let login = reward_ret.data.login,
    watch_av = reward_ret.data.watch_av,
    coins_av = reward_ret.data.coins_av,
    share_av = reward_ret.data.share_av,
    current_exp = reward_ret.data.level_info.current_exp;
  let today_exp = coins_av * 1;
  if (login) today_exp += 5;
  if (watch_av) today_exp += 5;
  if (share_av) today_exp += 5;
  let update_data = (reward_ret.data.level_info.next_exp - current_exp) / today_exp;
  update_data = Math.ceil(update_data);

  console.log(`👇👇👇👇👇👇汇总👇👇👇👇👇👇`)
  memberMsg = `*********【哔哩哔哩账号${$.index}】********\n帐号信息: ${$.uname}, 等级${reward_ret.data.level_info.current_level}\n${manhua_msg}\n${live_msg}\n登陆任务: 今日已登陆\n观看视频: ${report_msg}\n分享任务: ${share_msg}\n投币任务: ${coin_msg}\n银瓜子兑换硬币: ${silver2coin_msg}\n今日获得经验: ${today_exp}\n当前经验: ${current_exp}\n按当前速度升级还需: ${update_data}天\n${live_stats}\n\n`;
  console.log(memberMsg);
  allMessage += memberMsg;
}


/*
B站上报视频观看进度
aid int 视频av号
cid int 视频cid号
progres int 观看秒数
*/
async function report_task(aid, cid, progres = 300) {
  let param = `aid=${aid}&cid=${cid}&progress=${progres}&csrf=${bili_jct}`;
  let ret = await requestData('http://api.bilibili.com/x/v2/history/report', param, 'post');
  return ret;
}

//分享指定av号视频 [aid int 视频av号]
async function share_task(aid) {
  let param = `aid=${aid}&csrf=${bili_jct}`;
  let ret = await requestData('https://api.bilibili.com/x/web-interface/share/add', param, 'post')
  return ret;
}

/*
获取用户关注的up主
uid int 账户uid，默认为本账户，非登录账户只能获取20个*5页
pn int 页码，默认第一页
ps int 每页数量，默认50
order str 排序方式，默认desc
order_type 排序类型，默认attention
*/
async function get_followings(uid, pn = 1, ps = 20, order = 'desc', order_type = 'attention') {
  let param = {"vmid":uid, "pn":pn, "ps":ps, "order":order, "order_type":order_type};
  let ret = await requestData('https://api.bilibili.com/x/relation/followings', param);
  return ret;
}

/*
获取指定up主空间视频投稿信息
uid int 账户uid，默认为本账户
pn int 页码，默认第一页
ps int 每页数量，默认50
tid int 分区 默认为0(所有分区)
order str 排序方式，默认pubdate
keyword str 关键字，默认为空
*/
async function space_arc_search(uid, pn = 1, ps = 20, tid = 0, order = 'pubdate', keyword = '') {
  let param = {"mid":uid, "pn":pn, "ps":ps, "order":order, "keyword":keyword};
  let ret = await requestData('https://api.bilibili.com/x/space/arc/search', param);
  let data_list = [];
  for (let i = 0, len = ret.data.list.vlist.length; i < len; i++) {
    let one = ret.data.list.vlist[i];
    data_list.push({
      "aid": one.aid,
      "cid": 0,
      "title": one.title,
      "owner": one.author
    });
  }
  return data_list;
}

/*
用B币给up主充电
uid int up主uid
num int 充电电池数量
*/
async function elec_pay(uid, num = 50) {
  let param = {"elec_num":num, "up_mid":uid, "otype":"up", "oid":uid, "csrf":bili_jct};
  let ret = await requestData('https://api.bilibili.com/x/ugcpay/trade/elec/pay/quick', param, 'post');
  return ret;
}

/*
给指定 av 号视频投币
aid int 视频av号
num int 投币数量
select_like int 是否点赞
*/
async function coin_add(aid, num = 1, select_like = 1) {
  let param = `aid=${aid}&multiply=${num}&select_like=${select_like}&cross_domain="true"&csrf=${bili_jct}`;
  let ret = await requestData('https://api.bilibili.com/x/web-interface/coin/add', param, 'post');
  return ret;
}

//B站直播获取金银瓜子状态
async function live_status() {
  let ret = await requestData('https://api.live.bilibili.com/pay/v1/Exchange/getStatus');
  let data = ret.data;
  let msg = `银瓜子数量: ${data.silver}\n金瓜子数量: ${data.gold}\n硬币数量: ${data.coin}`;
  return msg;
}

//查询银瓜子兑换状态.
async function queryStatus() {
  let ret = await requestData('https://api.live.bilibili.com/xlive/revenue/v1/wallet/myWallet?need_bp=1&need_metal=1&platform=pc');
  return ret;
}
    
//银瓜子兑换硬币
async function silver2coin_fn() {
  let statu = await queryStatus();
  let msg = '';
  if (statu.code == 0) {
    if (statu.data.silver >= 700) {
      let param = `csrf_token=${bili_jct}&csrf=${bili_jct}`;
      let ret = await requestData('https://api.live.bilibili.com/xlive/revenue/v1/wallet/silver2coin', param, 'post');
      return ret;
    }else {
      msg = `当前银瓜子余额为: ${statu.data.silver},不足700,不进行兑换`;
      return {"message":msg};
    }
  }else {
    msg = '获取银瓜子状态失败';
    return {"message":msg};
  }
  
}

/*
获取 B站分区视频信息
rid int 分区号
num int 获取视频数量
*/
async function get_region(rid = 1, num = 6) {
  let ret = await requestData(`https://api.bilibili.com/x/web-interface/dynamic/region?ps=${num}&rid=${rid}`);
  let data_list = [];
  for (let i = 0, len = ret.data.archives.length; i < len; i++) {
    let one = ret.data.archives[i];
    data_list.push({
      "aid": one.aid,
      "cid": one.cid,
      "title": one.title,
      "owner": one.owner.name
    });
  }
  return data_list;
}

//硬币记录
async function coinLog() {
  let ret = await requestData('https://api.bilibili.com/x/member/web/coin/log?jsonp=jsonp');
  $.addCoin = 0; $.sendCoin =0;
  for (let i =0, len = ret.data.list.length; i<len; i++) {
    let one = ret.data.list[i];
    if (isToday(one.time)) {
      if (one.delta < 0) 
        $.sendCoin -= one.delta;
      else
        $.addCoin +- one.delta;
    }
  }
}

//判断时间是否过期
function isToday(time) {
  var strtime = time.replace("/-/g", "/");//时间转换
  //时间
  var date1=new Date(strtime).getDay();
  //现在时间
  var date2=new Date().getDay();
  //判断时间是否过期
  return date1 == date2;
}

//扫码获取Cookie
async function scanGetCookie() {
  if (!$.isNode()) return;
  let qrcode = require('qrcode-terminal');
  let qrRet = await requestData('https://passport.bilibili.com/qrcode/getLoginUrl');
  if (qrRet.code == 0) {
    let qrUrl = qrRet.data.url;
    $.oauthKey = qrRet.data.oauthKey;
    qrcode.generate(qrUrl, {small: true});
    console.log(`请打开 哔哩哔哩APP 扫码登录(二维码有效期为3分钟)\n`);
    console.log(`\n注：若上图二维码扫描不到，请使用工具(例如在线二维码工具：https://cli.im)手动生成下面链接的二维码：\n${qrUrl}\n`);
  }
}

function waitCookie() {
  let msg = ''
  $.timer = setInterval(async () => {
    let ret = await requestData('http://passport.bilibili.com/qrcode/getLoginInfo', `oauthKey=${$.oauthKey}`, 'post');
    if (ret.status == true) {
      findCookie(ret.data.url);
      clearInterval($.timer);
      $.done();
    }else {
      if (ret.data == -1) {
        console.log('密钥错误');
        clearInterval($.timer);
        $.done();
      } else if (ret.data == -2) {
        console.log('密钥超时');
        clearInterval($.timer);
        $.done();
      } else if (ret.data == -4) {
        if (msg != '等待扫码。。。') {
          console.log('等待扫码。。。');
        }
        msg = '等待扫码。。。';
        
      } else if (ret.data == -5) {
        if (msg != '已扫码未确认。。。') {
          console.log('已扫码未确认。。。');
        }
        msg = '已扫码未确认。。。';
        
      }else {
        clearInterval($.timer);
        $.done();
      }
    }
    
  }, 1000)
}

function findCookie(url) {
  let cookie = '', aParams = url.split('?')[1].split("&");
  for (i = 0; i < aParams.length-1; i++) {
    cookie += aParams[i];
    cookie += '; '
  }
  console.log(`哔哩哔哩 Cookie获取成功，cookie如下：\n\n${cookie}\n\n其它设置请前往GitHub查看\nhttps://github.com/he1pu`);
  return cookie;

}

function readConfig() {
  if ($.isNode()) {
    let cks = [];
    if (process.env.BILIBILI_COOKIE) {
      if (process.env.BILIBILI_COOKIE.indexOf('&') > -1) {
        cks = process.env.BILIBILI_COOKIE.split('&');
      } else if (process.env.BILIBILI_COOKIE.indexOf('\n') > -1) {
        cks = process.env.BILIBILI_COOKIE.split('\n');
      } else {
        cks = [process.env.BILIBILI_COOKIE];
      }
    }
    if (!cks.length) {
      console.log(`\n请先设置Cookie`);
    }else {
      for (let i = 0, len = cks.length; i < len; i++) {
        let coin_num = process.env.coin_num ? process.env.coin_num : 5;
        let coin_type = process.env.coin_type ? process.env.coin_type : 1;
        let silver2coin = process.env.silver2coin ? process.env.silver2coin : true;

        let conf = {"bilibili_cookie":cks[i], "coin_num":coin_num, "coin_type":coin_type, "silver2coin":silver2coin};
        cookieArr.push(conf);
      }
    }
    console.log(`\n=========共${cks.length}个哔哩哔哩账号Cookie=========\n`);
    console.log(`=========脚本执行- 北京时间(UTC+8)：${new Date(new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000).toLocaleString()}=========\n`)
  } else {
    cookiesArr = [$.getdata('CookieBL'), $.getdata('CookieBL1'), ...jsonParse($.getdata('CookieBL') || "[]")
      .map(item => item.cookie)
    ].filter(item => !!item);
  }
}

function requestData(url, param, mathod = 'get') {
  return new Promise(resolve => {
    if (mathod == 'get') {
      $.get(params(url, param, mathod), (err, resp, data) => {
        try {
          if (err && !data) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${url} API请求失败，请检查网路重试`);
          } else {
            if (data) {
              data = JSON.parse(data);
            } else {
              console.log(`服务器返回空数据`)
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      })
    } else {
      $.post(params(url, param, mathod), (err, resp, data) => {
        try {
          if (err && !data) {
            console.log(`ERROR==>${JSON.stringify(err)}`);
            console.log(`${url} API请求失败，请检查网路重试`);
          } else {
            if (data) {
              data = JSON.parse(data);
            } else {
              console.log(`服务器返回空数据`)
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      })
    }

  })
}

function params(host, param, mathod = 'get') {
  let header = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.64",
        "Referer": "https://www.bilibili.com/",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "Connection": "keep-alive",
        "Cookie": (cookieArr.length ? cookieArr[$.index - 1]['bilibili_cookie'] : '')
      };
  if (mathod == 'get') {
    if (param) {
      host += '?';
      for (let key in param) {
        host += `${key}=${param[key]}&`;
      }
      host = host.substr(0, host.length-1);
    }
  
    return {
      url: host,
      headers: header,
      "timeout": 10000
    }
  }
  return {
    url: host,
    body: ((typeof param)== 'string' ? param : JSON.stringify(param)),
    headers: header,
    "timeout": 10000
  }
}


function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(ck, cname) {
  var name = cname + "=";
  var ca = ck.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie(ck) {
  var user = getCookie(ck, "username");
  if (user != "") {
    alert("Welcome again " + user);
  } else {
    user = prompt("Please enter your name:", "");
    if (user != "" && user != null) {
      setCookie("username", user, 365);
    }
  }
}

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}

function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
