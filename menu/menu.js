let uuid = '';
function uuidStr(len){
    let keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let str='';
    let keyLen = keyStr.length-1;
    for(let i=0;i<len;++i){
        str+=keyStr.charAt(Math.random()*keyLen);
    }
    return str;
}
// 获取[设置插件UUID]
chrome.runtime.sendMessage({action:'getCache', cache_key:'uuid'}, function(res){
    if(!res.data){
        uuid = uuidStr(32);
        chrome.runtime.sendMessage({action:'setCache', cache_key:'uuid', value:uuid, expire:-1});
    } else {
        uuid = res.data;
    }
    document.getElementById('ext_uuid').innerHTML = uuid;
    chrome.runtime.sendMessage({action:'request_api', value:'BayHelper/getBaycheerHelperData', param:{opn:'all', uuid: uuid}, cache_key:'baycheerhelper_all_cache_data'}, function(res) {
        if (res.code === 0) {
            if (res.data.bayhelper_func) {
                const func = res.data.bayhelper_func;
                let html = '';
                for (let i=0;i<func.length;i++) {
                    html += '<div class="setting-content">\
                                <label class="setting-title">'+func[i].title+'</label>\
                                <div class="switch-p" id="'+func[i].name+'_status" data-status="close">\
                                    <div class="switch-s"></div>\
                                </div>\
                            </div>';
                }
                document.getElementById('function-content').innerHTML = html;
                //按钮初始化
                chrome.runtime.sendMessage({action:'getCache', cache_key:'bayhelper_func_status'}, function(res){
                    if (res.data) {
                        for (let i in res.data) {
                            let obj = document.getElementById(i);
                            if (obj && res.data[i] == '1') {
                                obj.setAttribute('data-status', 'open');
                            }
                        }
                    }
                });
                let switchObj = document.querySelectorAll('#function-content .switch-p');
                for (let i=0; i<switchObj.length; i++) {
                    const id = switchObj[i].getAttribute('id');
                    switchObj[i].onclick = function(){
                        let status = this.getAttribute('data-status')=='close'?1:0;
                        if (id == 'auto_robot_status' && status === 0) {
                            chrome.runtime.sendMessage({action:'close_socket'});
                        }
                        chrome.runtime.sendMessage({action:'hSetCache', cache_key:'bayhelper_func_status', value:status, key:id, expire:-1}, function(res){
                            switchObj[i].setAttribute('data-status', status==1?'open':'close');
                            chrome.tabs.reload();
                        });
                    }
                }
            }
        } else {
            chrome.runtime.sendMessage({action:'alert', value:res.msg});
        }
    });
});
window.onload = function(){
    //重置cookie按钮
    document.getElementById('reset_cookie').onclick = function(e){
        let _this = this;
        _this.setAttribute('disabled', 'disabled');
        chrome.runtime.sendMessage({action:'request_api', value:'BayHelper/cookie', param:{cookieString:'clearCookie', domain:'taobao.com', uuid:uuid}}, function(res) {
            if(res.code === 0){
                chrome.runtime.sendMessage({action:'alert', value:'重置COOKIE成功'});
            }else{
                chrome.runtime.sendMessage({action:'alert', value:res.msg});
            }
            _this.removeAttribute('disabled');
        });
    };
    // 清除缓存
    document.getElementById('reset_cache').onclick = function(e){
        let _this = this;
        _this.setAttribute('disabled', 'disabled');
        chrome.runtime.sendMessage({action:'getCache', cache_key:null}, function(res) {
            if(res.code === 0){
                let tmpArr = new Array();
                for (let i in res.data) {
                    if (i != 'uuid') {
                        tmpArr.push(i);
                    }
                }
                if (tmpArr.length > 0) {
                    chrome.runtime.sendMessage({action:'delCache', cache_key:tmpArr});
                }
            }
            chrome.runtime.sendMessage({action:'alert', value:'清除缓存成功'});
            _this.removeAttribute('disabled');
        });
    };
};