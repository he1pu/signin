/*

2022.6.28

花花阅读 

微信内打开⬇️(若链接打不开，可复制到手机浏览器里打开)。号多就邀请自己小号
http://dhawaii.cn/user/huahua.html?mid=QK4U7ZW2N&1656394945905

一天30或50篇文章 

一篇文章=100花   1000花=0.1元

手动抓请求体里的un和token
青龙变量格式: export HHYD_token = 'un&token'多账号直接换行即可

Quantumult X 用户直接重写抓数据
（若无法获取，可使用BoxJs-->我的-->数据查看器（Key：HHYD_token）手动添加：un&token）

[rewrite_local]
http://u.wyexin.cn/api url script-request-body https://raw.githubusercontent.com/he1pu/signin/main/_hhyd.js

[mitm]
hostname = u.wyexin.cn

//定时15分钟一次，防止token失效！
0/15 * * * * https://raw.githubusercontent.com/he1pu/signin/main/_hhyd.js, tag=花花阅读, enabled=true

*/

const $ = new Env("花花阅读");
const notify = $.isNode() ? require("./sendNotify") : "";
const Notify = 1; //0为关闭通知，1为打开通知,默认为1
const debug = 0; //0为关闭调试，1为打开调试,默认为0
//////////////////////

let ckStr = ($.isNode() ? process.env.HHYD_token : $.getdata(`HHYD_token`)) || '';

let msg = "";
let ck = "";
let G = ''
/////////////////////////////////////////////////////////
console.log(`${G}\n`);
msg += `${G}\n`;
/////////////////////////////////////////////////////////



async function tips(ckArr) {
    console.log(
        `\n脚本执行 - 北京时间(UTC+8): ${new Date(
              new Date().getTime() +
              new Date().getTimezoneOffset() * 60 * 1000 +
              8 * 60 * 60 * 1000
          ).toLocaleString()} \n`
    );

    console.log(
        `\n******** 共找到 ${ckArr.length} 个账号 ********`
    );
    debugLog(`【debug】 这是你的账号数组:\n ${ckArr}`);
}

    !(async () => {
        if (typeof $request !== "undefined") {
            await GetRewrite()
        } else {
            let ckArr = await getCks(ckStr, "HHYD_token");

            await tips(ckArr);

            for (let index = 0; index < ckArr.length; index++) {
                let num = index + 1;
                console.log(`\n========= 开始【第 ${num} 个账号】=========\n`);

                if (ckArr[index].match(/&/g)) {
                    ck = ckArr[index].split("&");
                    await all();
                }

                debugLog(`【debug】 这是你第 ${num} 账号信息:\n ${ck}`);

            }


        }
    })()
    .catch((e) => $.logErr(e))
    .finally(() => $.done());
        
async function posthds(refer = "http://u.wyexin.cn/user/huahua.html?") {
    posthd = {
        "Host": "u.wyexin.cn",
        "Origin": "http://u.wyexin.cn",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.13(0x18000d38) NetType/WIFI Language/zh_CN",
        "Content-Type": "application/json; charset=utf-8",
        "Referer": refer + tss()
    }
}
async function all() {

    S = `当前用户`
    if (S == `当前用户`) {
        posthds()
        await task(`post`, `http://u.wyexin.cn/api/user/info`, posthd, `{"un":"${ck[0]}","token":"${ck[1]}","pageSize":20}`)
        if (DATA.code == 0) {
            yyd = DATA.result.read
            hopeNo = DATA.result.hopeNo
            moneyCurrent = DATA.result.moneyCurrent
            console.log(`\n账户余额 : ${moneyCurrent/10000} 元。当前已阅读 : ${yyd}/${DATA.result.max} 篇\n`);
        } else {
            console.log(`获取当前用户信息失败\n`);
        }
    }
        if (yyd >= 30) {
            S = `CJ`
            if (S == `CJ`) {
                posthds()
                await task(
                    `post`, `http://u.wyexin.cn/api/user/readRed`, posthd, `{"token" : "${ck[1]}","pageSize" : 20,"un" : "${ck[0]}"}`);
                if (DATA.code == 0) {
                    console.log(`抽奖 : ${DATA.msg}\n`);
                } else {
                    console.log(`抽奖: ${DATA.msg}\n`);
                }
            }
        }

    posthd = JSON.stringify(posthd).replace('huahua', 'h')

    if (hopeNo == (null)) {
        for (let i = 0; i < 10; i++) {
            posthds("http://u.wyexin.cn/user/h.html?")
            S = `获取阅读链接`
            if (S == `获取阅读链接`) {
                await task(
                    `post`, `http://u.wyexin.cn/api/user/startRead`, posthd, `{"code":"","un":"${ck[0]}","token":"${ck[1]}","pageSize":20,"url":"http://u.wyexin.cn/user/code.html"}`);
                if (DATA.code == 0 && DATA.result.articleId != (null) && DATA.result.articleId != 0) {

                    console.log(`获取articleId ： ${DATA.result.articleId}\n`);
                    await task('get', `http://u.wyexin.cn/user/article/${DATA.result.articleId}.html`, posthd)
                    DD = RT(6000, 8000)
                    await $.wait(DD)
                } else {
                    console.log(`暂无可阅读文章 停止阅读`);
                    break
                }
            }

            S = `提交阅读`
            if (S == `提交阅读`) {
                posthds("http://u.wyexin.cn/user/h.html?")
                await task(
                    `post`, `http://u.wyexin.cn/api/user/finishRead`, posthd, `{"code":"","un":"${ck[0]}","token":"${ck[1]}","pageSize":20}`);
                if (DATA.code == 0 && DATA.result != (null)) {

                    console.log(`提交阅读 : 成功。获得 ${DATA.result.val} 花\n`);

                } else {
                    console.log(`本轮阅读任务已完成，请稍后再来`);
                    break
                }

            }
        }
    } else {
        console.log(`当前阅读上限  请稍后再来`);
    }

    if (moneyCurrent >= 50000) {
        moneyCurrent = 50000
    } else if (moneyCurrent >= 10000) {
        moneyCurrent = 10000
    } else if (moneyCurrent >= 5000) {
        moneyCurrent = 5000
    } else if (moneyCurrent >= 3000) {
        moneyCurrent = 3000
    }
    hd = {
        "Host": "u.cocozx.cn",
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.13(0x18000d38) NetType/WIFI Language/zh_CN",
        "Referer": "https//servicewechat.com/wxec9f2c3d0bf86c6b/4/page-frame.html"
    }
    if (moneyCurrent > 3000) {
    for (let i = 0; i < 5; i++) {
            S = `TX`
            if (S == `TX`) {
                await task(
                    `post`, `https://u.cocozx.cn/api/user/wd`, hd, `{"un" : "${ck[0]}","mid" : "","val" : ${moneyCurrent},"token" : "${ck[1]}"}`);
                if (DATA.code == 0) {
                    console.log(`提现 : ${DATA.msg}\n`);
                } else {
                    console.log(`提现: ${DATA.msg}\n`);
                    break
                }
            }
        }
    }


}



//#region 固定代码
// ============================================变量检查============================================ \\

async function getCks(ck, str) {
    return new Promise((resolve, reject) => {
        let ckArr = []
        if (ck) {
            if (ck.indexOf("\n") != -1) {
                ck.split("\n").forEach((item) => {
                    ckArr.push(item);
                });
            } else {
                ckArr.push(ck);
            }
            resolve(ckArr)
        } else {
            console.log(`【${$.name}】：未填写变量 ${str}\n使用说明请脚本内查看`)
            SendMsg(`【${$.name}】：未填写变量 ${str}\n使用说明请脚本内查看\nhttps://raw.githubusercontent.com/he1pu/signin/main/_hhyd.js`)
        }

    })
}

async function GetRewrite() { //user/info

    if ($request.url.indexOf("user") > -1 && $request.url.indexOf("info") > -1) {
        cks = $request.body
        token = cks.split(`"token":"`)[1].split(`"`)[0]
        un = cks.split(`"un":"`)[1].split(`"`)[0]
        const ck = un+'&'+token

        if (ckStr) {
            if (ckStr.indexOf(ck) == -1) {
                ckStr = ckStr + '\n' + ck
                $.setdata(ckStr, 'HHYD_token');
                ckList = ckStr.split('\n')
                $.msg($.name + ` 获取第${ckList.length}个ck成功: ${ck}`)
            }
        } else {
            $.setdata(ck, 'HHYD_token');
            $.msg($.name + ` 获取第1个ck成功: ${ck}`)
        }
    }
}

// ============================================发送消息============================================ \\

async function SendMsg(message) {
    if (!message) return;

    if (Notify > 0) {
        if ($.isNode()) {
            var notify = require("./sendNotify");
            await notify.sendNotify($.name, message);
        } else {
            $.msg(message);
        }
    } else {
        console.log(message);
    }

}

/**
 * 随机数生成
 */

function randomString(e) {
    e = e || 32;
    var t = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890",
        a = t.length,
        n = "";

    for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
    return n;
}

/**
 * 随机整数生成
 */

function RT(X, Y) {
    do rt = Math.round(Math.random() * Y);
    while (rt < X)
    return rt;
}

//时间
nowTimes = new Date(
    new Date().getTime() +
    new Date().getTimezoneOffset() * 60 * 1000 +
    8 * 60 * 60 * 1000
);


//当前日期年月日+时间
//console.log('\n'+getCurrentDate());
function getCurrentDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate +
        " " + date.getHours() + seperator2 + date.getMinutes() +
        seperator2 + date.getSeconds();
    return currentdate;


}

//当前10位时间戳
function ts() {
    TS = Math.round((new Date().getTime() +
        new Date().getTimezoneOffset() * 60 * 1000 +
        8 * 60 * 60 * 1000) / 1000).toString();

    return TS;
};

function tss() {
    TS = Math.round(new Date().getTime() +
        new Date().getTimezoneOffset() * 60 * 1000 +
        8 * 60 * 60 * 1000).toString();
    return TS;
};

function task(method, taskurl, taskheader, taskbody) {
    return new Promise(async resolve => {
        let url = {
            url: taskurl,
            headers: taskheader,
            body: taskbody,
            timeout: 5000,
        }
        if (debug) {
            console.log(
                `\n 【debug】=============== 这是 ${S} 请求 url ===============`
            );
            console.log(url);
        }

        $[method](url, (err, resp, data) => {
                try {
                    if (debug) {
                        console.log(
                            `\n\n 【debug】===============这是 ${S} 返回data==============`
                        );
                        console.log(data);
                        console.log(`======`);
                        console.log(JSON.parse(data));
                    }
                    if (err) {
                        console.log(`${JSON.stringify(err)}`)
                    } else {
                        if (data) {
                            if (data.indexOf(`<body>`) >= 0) {
                                DATA = data
                            } else {
                                DATA = JSON.parse(data);
                            }
                        } else {
                            console.log(`服务器返回数据为空`)
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp)
                } finally {
                    resolve();
                }
            },

        )
    })
}
function debugLog(...args) {
    if (debug) {
        console.log(...args);
    }
}


// prettier-ignore
function Env(t, e) {
    class s {
        constructor(t) {
            this.env = t
        }
        send(t, e = "GET") {
            t = "string" == typeof t ? {
                url: t
            } : t;
            let s = this.get;
            return "POST" === e && (s = this.post), new Promise((e, i) => {
                s.call(this, t, (t, s, r) => {
                    t ? i(t) : e(s)
                })
            })
        }
        get(t) {
            return this.send.call(this.env, t)
        }
        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }
    return new class {
        constructor(t, e) {
            this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log(``, `\ud83d\udd14${this.name}, \u5f00\u59cb!`)
        }
        isNode() {
            return "undefined" != typeof module && !!module.exports
        }
        isQuanX() {
            return "undefined" != typeof $task
        }
        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }
        isLoon() {
            return "undefined" != typeof $loon
        }
        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }
        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }
        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try {
                s = JSON.parse(this.getdata(t))
            } catch {}
            return s
        }
        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }
        getScript(t) {
            return new Promise(e => {
                this.get({
                    url: t
                }, (t, s, i) => e(i))
            })
        }
        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, ``).trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"), a = {
                    url: `http://${h}/v1/scripting/evaluate`,
                    body: {
                        script_text: t,
                        mock_type: "cron",
                        timeout: r
                    },
                    headers: {
                        "X-Key": o,
                        Accept: "*/*"
                    }
                };
                this.post(a, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }
        loaddata() {
            if (!this.isNode()) return {}; {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e);
                if (!s && !i) return {}; {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }
        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e),
                    r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }
        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i)
                if (r = Object(r)[t], void 0 === r) return s;
            return r
        }
        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }
        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ``;
                if (r) try {
                    const t = JSON.parse(r);
                    e = t ? this.lodash_get(t, i, ``) : e
                } catch (t) {
                    e = ``
                }
            }
            return e
        }
        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i)
                }
            } else s = this.setval(t, e);
            return s
        }
        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }
        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }
        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }
        get(t, e = (() => {})) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                "X-Surge-Skip-Scripting": !1
            })), $httpClient.get(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                hints: !1
            })), $task.fetch(t).then(t => {
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                }, o)
            }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                try {
                    if (t.headers["set-cookie"]) {
                        const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                        this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
                    }
                } catch (t) {
                    this.logErr(t)
                }
            }).then(t => {
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                }, o)
            }, t => {
                const {
                    message: s,
                    response: i
                } = t;
                e(s, i, i && i.body)
            }))
        }
        post(t, e = (() => {})) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                "X-Surge-Skip-Scripting": !1
            })), $httpClient.post(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            });
            else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                hints: !1
            })), $task.fetch(t).then(t => {
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                }, o)
            }, t => e(t));
            else if (this.isNode()) {
                this.initGotEnv(t);
                const {
                    url: s,
                    ...i
                } = t;
                this.got.post(s, i).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => {
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                })
            }
        }
        time(t) {
            let e = {
                "M+": (new Date).getMonth() + 1,
                "d+": (new Date).getDate(),
                "H+": (new Date).getHours(),
                "m+": (new Date).getMinutes(),
                "s+": (new Date).getSeconds(),
                "q+": Math.floor(((new Date).getMonth() + 3) / 3),
                S: (new Date).getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + ``).substr(4 - RegExp.$1.length)));
            for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr((`` + e[s]).length)));
            return t
        }
        msg(e = t, s = ``, i = ``, r) {
            const o = t => {
                if (!t) return t;
                if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? {
                    "open-url": t
                } : this.isSurge() ? {
                    url: t
                } : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"],
                            s = t.mediaUrl || t["media-url"];
                        return {
                            openUrl: e,
                            mediaUrl: s
                        }
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl,
                            s = t["media-url"] || t.mediaUrl;
                        return {
                            "open-url": e,
                            "media-url": s
                        }
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {
                            url: e
                        }
                    }
                }
            };
            this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r)));
            let h = [``, "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];
            h.push(e), s && h.push(s), i && h.push(i), console.log(h.join("\n")), this.logs = this.logs.concat(h)
        }
        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
        }
        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log(``, `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log(``, `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t)
        }
        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }
        done(t = {}) {
            const e = (new Date).getTime(),
                s = (e - this.startTime) / 1e3;
            this.log(``, `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }(t, e)
}
