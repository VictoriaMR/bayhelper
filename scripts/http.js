importScripts('./qs.js');
const getApi = async (url, param, type, dataType, headers) => {
    if (url.substr(0, 4) != 'http') {
        url = domain + '/api/' + url;
    }
    type = type ? type : 'POST';
    dataType = dataType ? dataType : 'json';
    let init = {
        credentials: 'include',
        method: type,
        headers: {},
    };
    if (type == 'GET') {
        if (typeof param == 'object') {
            let strArr = new Array();
            for (let i in param) {
                strArr.push(i + '=' + param[i]);
            }
            param = strArr.join('&');
        }
        if (param) {
            url += '?' + param;
        }
    } else {
        init.headers = {
            'Content-Type':'application/x-www-form-urlencoded',
            'x-requested-with':'XMLHttpRequest'
        };
        init.body = typeof param == 'object' ? Qs.stringify(param) : param;
    }
    if (headers) {
        for (let i in headers) {
            init.headers[i] = headers[i];
        }
    }
    try {
        const response = await fetch(url, init);
        if (response.ok) {
            return await response[dataType]();
        }
        return {code: -1, data: false, msg: '请求失败, 请和管理人员联系.'+response.status+': '+response.statusText};
    } catch(e) {
        console.log(e)
        return {code: -1, data: false, msg: '请求失败, 请和管理人员联系.'+(e.message ? e.message : 'TypeError: Failed to fetch')};
    }
}