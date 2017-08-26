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