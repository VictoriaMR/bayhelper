const domain = 'https://erp.baycheer.com';
let constant = {};
//应用js文件
importScripts('./http.js');
importScripts('./cache.js');
importScripts('./socket.js');
//扩展内通信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    listenerEvent(request, sender).then(sendResponse);
    return true;
});
//监听页面通信 - 跨扩展消息
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    listenerEvent(request, sender).then(sendResponse);
    return true;
});
// 弹窗
const windowAlert = async(msg) => {
    alert(msg);
}
const checkSender = async(sender) => {
    let tab;
    if (sender && sender.tab) {
        tab = sender.tab;
    }
    if (!tab || tab.url.indexOf('chrome://') == 0) {
        const tmp = await chrome.tabs.query({});
        tab = false;
        let first;
        let second;
        for (let i=0; i<tmp.length; i++) {
            if (tmp[i].url.indexOf('chrome://') == 0) {
                continue;
            }
            if (!first) {
                first = tmp[i];
            }
            if (tmp[i].active) {
                second = tmp[i];
            }
        }
        tab = second ? second : first;
    }
    return tab;
}
const listenerEvent = async(request, sender) => {
    let rst;
    switch (request.action) {
        case 'getDomain':
            rst = {code:0, data:domain, msg:'success', version:constant.version};
            break;
        case 'getVersion':
            rst = {code:0, data:constant.version, msg:'success'};
            break;
        case 'getCookie': //获取cookie
            let cookies = '';
            let param = {};
            // 获取某个域名的cookie
            if (request.host) {
                param.url = request.host;
            }
            rst = await chrome.cookies.getAll(param);
            for(let k in rst){
                cookies+=rst[k].name+'='+rst[k].value+';';
            }
            let uuid = await getCache('uuid');
            rst = {uuid: uuid, cookies: cookies};
            break;
        case 'clearCookie':
            rst = await chrome.cookies.getAll({url: request.value});
            for(let k in rst){
                chrome.cookies.remove({url: 'http'+(rst[i].httpOnly?'':'s')+'://'+(rst.hostOnly?'':'www')+rst[i].domain, name: rst[i].name});
            }
            rst = {code: 0, data: true, msg: 'success'};
            break;
        case 'getCache':
            rst = await getCache(request.cache_key);
            rst = {code: 0, data: rst, msg: 'success'};
            break;
        case 'setCache':
            rst = await setCache(request.cache_key, request.value, request.expire);
            rst = {code: 0, data: rst, msg: 'success'};
            break;
        case 'hSetCache':
            let data = await getCache(request.cache_key);
            if (!data) {
                data = {};
            }
            data[request.key] = request.value;
            rst = await setCache(request.cache_key, data, request.expire);
            rst = {code: 0, data: rst, msg: 'success'};
            break;
        case 'delCache':
            rst = await delCache(request.cache_key);
            rst = {code: 0, data: rst, msg: 'success'};
            break;
        case 'request_api': //http请求 传cache_key时先取缓存
            if (request.cache_key) {
                rst = await getCache(request.cache_key);
            }
            if (!rst) {
                rst = await getApi(request.value, request.param, request.type, request.dataType, request.header);
                if (request.cache_key && rst.code == 0) {
                    await setCache(request.cache_key, rst.data, request.expire);
                }
            } else {
                rst = {code: 0, data: rst, msg: 'success'};
            }
            if (rst && rst.data && rst.data.version) {
                constant.version = rst.data.version;
            }
            break;
        case 'alert': //全局弹窗
            let tab = await checkSender(sender);
            if (tab) {
                chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    func: windowAlert,
                    args: [request.value],
                });
            }
            break;
        case 'init_socket': //socket连接
            //确认按钮点击
            rst = await socketInit(sender);
            rst = {code: 0, data: rst, msg: 'success'};
            break;
        case 'update_socket':
            rst  = await updateSocketConfig();
            rst = {code: 0, data: rst, msg: 'success'};
            break;
        case 'close_socket':
            rst  = await socketClose();
            rst = {code: 0, data: rst, msg: 'success'};
            break;
        case 'getAutoInfo': //获取机器人信息
            //确认按钮点击
            rst = await getSocketInfo();
            break;
        case 'dealAutoSuccess': //自动机器人处理数据成功请求
            rst = await dealSuccess(request.value);
            rst = {code: 0, data: rst, msg: 'success'};
            break;
        case 'dealAutoFailed': //自动化处理失败, 不能处理数据
            rst = await dealFailed(request.value);
            rst = {code: 0, data: rst, msg: 'success'};
            break;
        default:
            rst = {code: -1, data: {}, msg: '未知请求'};
            break;
    }
    return rst;
}