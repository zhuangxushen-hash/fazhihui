// app.js
App({
  globalData: {
    // ★ H5 地址（web-view 加载的页面）
    // 必须是已在微信公众平台「业务域名」中配置过的 HTTPS 域名
    h5BaseUrl: 'https://test.meichuangmenye.com/client',

    // ★ 后端 API（与 H5 同域）；该域名需加入小程序「request 合法域名」
    apiBaseUrl: 'https://test.meichuangmenye.com',

    // ★ 手机号快捷登录接口（方案A 原生授权页调用）
    // 后端需实现该接口：用 phoneCode 换手机号、loginCode 换 openid，签发 access_token
    wxPhoneLoginPath: '/api/auth/wx-phone-login',

    // 登录态：小程序本地存储里 token 的 key 名（与 app 端保持一致）
    tokenKey: 'token'
  }
});

/*
 * 微信授权登录 + 手机号获取说明（方案A 完整链路）
 * ------------------------------------------------------------------
 * 1. 启动页 pages/phone/phone：
 *    - 用户点「授权手机号并登录」→ 微信返回一次性 phoneCode；
 *    - 同时 wx.login() 拿 loginCode；
 *    - 一并 POST 到 wxPhoneLoginPath。
 * 2. 后端（NestJS，全局前缀 api）用「小程序 appid + secret」：
 *    a. auth.getAccessToken 换 access_token（建议缓存 2 小时）；
 *    b. auth.code2Session(loginCode) → openid（同开放平台可拿 unionid）；
 *    c. POST /wxa/business/getuserphonenumber { code: phoneCode }
 *       → phone_info.phoneNumber；
 *    d. 按手机号匹配/注册客户账号，签发与 client-login 同结构的 JWT；
 *    e. 返回 { access_token, user: { id, real_name, phone, role, ... } }。
 * 3. 小程序把 access_token 存本地后跳 pages/webview/webview，
 *    webview.js 将 token 以 ?token=xxx 传给 H5，H5 建立自己的会话。
 *
 * 注意：
 * - 手机号能力要求小程序为已认证主体，且后台已发布《用户隐私保护指引》。
 * - 小程序 openid 与公众号网页授权的 openid 不同；若 H5 同时服务
 *   公众号，请用 unionid 关联同一用户（需同属一个微信开放平台账号）。
 * - phoneCode / loginCode 均为 5 分钟内有效且一次性，后端不要缓存。
 * ------------------------------------------------------------------
 */
