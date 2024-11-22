//引入页面初始化静态文件
chrome.runtime.sendMessage(localStorage.getItem('baycheerhelper_extid'), {action: 'getDomain'}, function(res){
    if (res.code == 0) {
        let script = document.createElement('script');
        script.src = res.data+'/js/baycheerHelper/baycheerHelper_init.js'+(res.version?'?v='+res.version:'');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.id = 'baycheerHelper-init-js';
        document.querySelector('head').appendChild(script);
    }
});