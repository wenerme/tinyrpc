# Tinyrpc

A type safe rpc for es6 Proxy.


## Example: Chrome Extension
 
__iface.ts__
```typescript
export interface IBase {
    ping(): Promise<string>

    getType(): Promise<string>
}
export interface IBackground extends IBase {
    getStatus(): Promise<object>
    updateStatus(status: object): Promise<object>
    updateContextMenu(opt: { selection?: string, selected: boolean });
    showNotify(opt: string | { title?, message } | NotificationOptions);
    requestCall({phoneNumber});
}

export interface IContent extends IBase {

}

export interface IPage extends IBase {
    piwik: IPiwik
}
// https://developer.piwik.org/guides/tracking-javascript
export interface IPiwik {
    trackEvent(category, action, name?, value?)
    trackPageView(customTitle?)
    trackSiteSearch(keyword, category?, resultsCount?)
    trackGoal(idGoal, customRevenue?)
    trackLink(url, linkType)
}
```

__popup.ts__
```typescript
import {ProxyByRuntime, Scripts} from "tinyrpc";
let background = window[Scripts.Background] = ProxyByRuntime({type: Scripts.Background}) as IBackground;
// Call background method
background.getStatus().then(v=>console.log(v))
```

__content_script.ts__
```typescript
// Providing rpc
class Content implements IContent {
    ping() {
        console.log('Content recv ping');
        return Promise.resolve('PONG');
    }

    getType() {
        return Promise.resolve('Scripts.Content')
    }
}
let content = window[Scripts.Content] = BindByRuntime(new Content(), {type: Scripts.Content});

// Consuming rpc
let page = window[Scripts.Page] = ProxyByDom({type: Scripts.Page}) as IPage;
let background = window[Scripts.Background] = ProxyByRuntime({type: Scripts.Background}) as IBackground;
// Allow called from page
BindByDom(background, {type: Scripts.Background});
BindByDom(content, {type: Scripts.Content});
```

Original idea from [wenerme/tinyrpc](https://github.com/wenerme/tinyrpc)

* [Document](https://apis.wener.me/docs/@wener/tinyrpc/index.html)


<!-- LINK:BEGIN -->

# Links

* Site
  * [wener.me](https://wener.me)
    * Blog
    * Github [wenerme/wener](https://github.com/wenerme/wener)
  * [apis.wener.me](https://apis.wener.me/)
    * APIs playground with docs & stories
    * Github [wenerme/apis](https://github.com/wenerme/apis)
* Library
  * [@wener/utils](https://www.npmjs.com/package/@wener/utils) - ![VERSION](https://img.shields.io/npm/v/@wener/utils) - ![LICENSE](https://img.shields.io/npm/l/@wener/utils)
    * utils for daily use
    * [Document](https://apis.wener.me/docs/@wener/utils/)
  * [@wener/ui](https://www.npmjs.com/package/@wener/ui) - ![VERSION](https://img.shields.io/npm/v/@wener/ui) - ![LICENSE](https://img.shields.io/npm/l/@wener/ui)
    * [Storybook](https://apis.wener.me/storybook/@wener/ui)
    * [Document](https://apis.wener.me/docs/@wener/ui/)
  * [@wener/tinyrpc](https://www.npmjs.com/package/@wener/tinyrpc) - ![VERSION](https://img.shields.io/npm/v/@wener/tinyrpc) - ![LICENSE](https://img.shields.io/npm/l/@wener/tinyrpc)
    * [Document](https://apis.wener.me/docs/@wener/tinyrpc/)
  * [rjsf-antd-theme](https://www.npmjs.com/package/rjsf-antd-theme) - ![VERSION](https://img.shields.io/npm/v/rjsf-antd-theme) - ![LICENSE](https://img.shields.io/npm/l/rjsf-antd-theme)
    * Ant Design Theme for React Json Schema Form
    * [Storybook](https://apis.wener.me/storybook/rjsf-antd-theme)
    * [Document](https://apis.wener.me/docs/rjsf-antd-theme/)

<!-- LINK:END -->