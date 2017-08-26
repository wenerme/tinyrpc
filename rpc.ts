let console = {log: (...args) => 0, err: (...args) => 0};

let handler: ProxyHandler<any> = {
    get({path, handle}, p, r){
        path = path.slice();
        path.push(p);
        return new Proxy(Object.assign(() => 0, {path, handle}), handler)
    },
    // set(target, p, v, r){
    //     throw new TypeError('Can not set proxy')
    // },
    apply({path, handle}, self, args){
        let state = {path: path.slice(), args};
        // console.log(state, handle)
        return handle(state, self)
    },
};
export function ProxyCall<T extends object>(handle): T {
    // chrome need a function as first argument to call apply
    return new Proxy(Object.assign(() => 0, {path: [], handle}), handler) as T;
}

export function CallProxy(target, {path, args}) {
    let fn = target;
    let recv = target;
    for (let i in path) {
        if (fn) {
            recv = fn;
        }
        fn = fn[path[i]];
        if (fn === undefined) {
            throw new TypeError('No such path: ' + path.slice(0, +i + 1).join('.'))
        }
    }
    return fn.apply(recv, args)
}

function ResolveContext(opt: string | ProxyContext, def): ProxyContext {
    let ctx: ProxyContext;
    if (typeof opt === 'string') {
        ctx = {type: opt};
    } else {
        ctx = opt;
    }
    ctx = Object.assign({}, DefaultOption, def, ctx) as ProxyContext;
    if (opt['option'] && def['option']) {
        // mix option
        ctx.option = Object.assign({}, def['option'], opt['option']);
    }
    return ctx
}

export function ProxyByRuntime(opt: string | ProxyContext) {
    return ProxyBy(ResolveContext(opt, Runtime))
}

export function BindByRuntime(iface, opt: string | ProxyContext) {
    return BindBy(iface, ResolveContext(opt, Runtime));
}

export function ProxyByDom(opt: string | ProxyContext): any {
    return ProxyBy(ResolveContext(opt, Dom))
}

export function BindByDom(iface, opt: string | ProxyContext) {
    return BindBy(iface, ResolveContext(opt, Dom))
}

export function BindBy(iface, ctx: ProxyContext) {
    let {type, onEvent, sendEvent} = ctx;
    if (!type || !onEvent) {
        throw new Error('Invalid context')
    }

    let need = type;
    onEvent(ctx, ({type, state, done, id, ext}) => {
        if (need === type && !done) {
            console.log(`${type} Handle request@${id} ${JSON.stringify(state)}`);
            let r = Promise.resolve(CallProxy(iface, state));
            if (id) {
                r.then(
                    result => sendEvent && sendEvent(ctx, {type, state, result, done: true, id, ext}),
                    error => sendEvent && sendEvent(ctx, {type, state, error, done: true, id, ext}),
                )
            } else {
                console.log(`${type} Drop result ${state}`)
            }
        }
    });
    return iface;
}


export function ProxyBy(ctx: ProxyContext) {
    let {type, onEvent, sendEvent} = ctx;

    if (!type || !onEvent) {
        throw new Error('Need type')
    }

    let seq = 0;
    let cbs = {};
    let need = type;
    onEvent(ctx, ({type, state, done, id, result, error}) => {
        if (need === type && done) {
            console.log(`${type} Handle result@${id} ${JSON.stringify(state)} ${result},${error}`)

            let c = cbs[id];
            if (!c) {
                console.log(`Callback for ${id} not found`)
            } else {
                c(result, error);
                delete cbs[id]
            }
        }
    });

    return ProxyCall(state => {
        return new Promise((resolve, reject) => {
            seq = (seq + 1) % 10;
            let id = Date.now() * 10 + seq;

            cbs[id] = (r, e) => {
                if (e) {
                    reject(e)
                } else {
                    resolve(r);
                }
            };
            setTimeout(() => reject(new Error(`${type} Request@${id} ${JSON.stringify(state)} timeout`)), 2000);

            console.log(`${type} Send Request@${id} ${JSON.stringify(state)}`);
            sendEvent && sendEvent(ctx, {type, state, id})
        })
    })
}

export interface ProxyState {
    id
    type
    state
    result?
    error?
    done?
    // ext used to handle extra info
    ext?
}

export type ProxyCallbackFunction = (state: ProxyState) => void

export interface ProxyContext {
    type: string
    onEvent?: (ctx: ProxyContext, cb: ProxyCallbackFunction) => void
    sendEvent?: (ctx: ProxyContext, state: ProxyState) => void
    option?: object
}


export const Scripts = {
    Page: 'Page',
    Content: 'Content',
    Background: 'Background',
    Popup: 'Popup',
};

export const Runtime = {
    onEvent(ctx: ProxyContext, cb: ProxyCallbackFunction){
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            message.ext = {sender}
            cb(message as ProxyState)
        });
    },
    sendEvent(ctx: ProxyContext, state: ProxyState){
        if (state.ext) {
            let {sender} = state.ext;
            if (sender && sender.tab) {
                chrome.tabs.sendMessage(sender.tab.id, state);
                return
            }
        }
        chrome.runtime.sendMessage(state)
    }
};
export const Dom = {
    onEvent(ctx: ProxyContext, cb: ProxyCallbackFunction){
        document.body.addEventListener('RPC', (event: CustomEvent) => {
            let detail = event.detail;
            if (typeof detail === 'string') {
                detail = JSON.parse(detail)
            }
            cb(detail)
        });
    },
    sendEvent(ctx: ProxyContext, state: ProxyState){
        document.body.dispatchEvent(new CustomEvent('RPC', {detail: JSON.stringify(state)}));
    },
    option: {
        element: document.body
    }
};
export const DefaultOption = {
    option: {},
};