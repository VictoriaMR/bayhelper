if (location.hostname.indexOf('login') < 0 && location.hostname.indexOf('baycheer') < 0) {
    //设置监听事件
    window.baycheerAjaxRespone = {};
    let baycheerAjaxResponeCount = 0;
    //设置全局数据储存
    function setBaycheerAjaxRespone(data) {
        window.baycheerAjaxRespone[baycheerAjaxResponeCount] = data;
        baycheerAjaxResponeCount++;
    }
    // ajax监听事件
    ;(function () {
        if ( typeof window.CustomEvent === 'function') return false;
        function CustomEvent ( event, params ) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent( 'CustomEvent' );
            evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
            return evt;
        }
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
    })();
    ;(function () {
        function ajaxEventTrigger(event) {
            var ajaxEvent = new CustomEvent(event, { detail: this });
            window.dispatchEvent(ajaxEvent);
        }
        var oldXHR = window.XMLHttpRequest;
        function newXHR() {
            var realXHR = new oldXHR();
            realXHR.addEventListener('loadend', function () { ajaxEventTrigger.call(this, 'ajaxLoadEnd'); }, false);
            return realXHR;
        }
        window.XMLHttpRequest = newXHR;
        window.addEventListener('ajaxLoadEnd', function (e) {
            if (e && e.detail && e.detail.response) {
                setBaycheerAjaxRespone(e.detail.response);
            }
        });
    })();
    // jsonp监听事件
    ;(function () {
        var originalCreateElement = document.createElement;
        function changeReqLink(script) {
            let src = script.src;
            Object.defineProperty(script, 'src', {
                get: function () {
                    return src;
                },
                set: function (oSrc) {
                    src = oSrc;
                    script.setAttribute('src', oSrc);
                }
            });
            const originalSetAttribute = script.setAttribute;
            script.setAttribute = function () {
                const args = Array.prototype.slice.call(arguments);
                if (args[0] == 'src' && args[1].indexOf('callback=') >= 0) {
                    var tmpMatch = args[1].match(/(?<=(callback=))([^&]*)(?=&|$)/);
                    if (tmpMatch && tmpMatch[0] && tmpMatch[0].indexOf('jsonpbaycheer') < 0) {
                        listenerObjChange(tmpMatch[0]);
                    }
                }
                originalSetAttribute.call(script, ...args);
            }
        }
        // 创建标签监听
        document.createElement = function (tagName) {
            const dom = originalCreateElement.call(document, tagName);
            if (tagName.toLowerCase() == 'script') {
                changeReqLink(dom);
            }
            return dom;
        }
        // 监听方式
        function listenerObjChange(name) {
            if (typeof window[name] != 'undefined') {
                return false;
            }
            let val = window[name];
            Object.defineProperty(window, name, {
                get : function(){
                    return val;
                },
                set : function(newVal){
                    if (typeof newVal == 'function') {
                        const oldVal = newVal;
                        newVal = function(data) {
                            setBaycheerAjaxRespone(data);
                            oldVal(data);
                        }
                    }
                    val = newVal;
                },
                enumerable : true,
                configurable : true
            });
        }
    })();
}