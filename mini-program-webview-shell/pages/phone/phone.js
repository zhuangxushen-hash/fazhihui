// pages/phone/phone.js —— 原生手机号授权入口页（方案A）
// 用户点「授权手机号并登录」→ 拿 phoneCode + loginCode → 调后端换 token → 跳 web-view 进 H5
const app = getApp();

Page({
  data: {
    submitting: false
  },

  onLoad() {
    // 已登录过（本地已有 token）：直接进 H5，不再打扰用户
    if (wx.getStorageSync(this.tokenKey())) {
      this.goWebview();
      return;
    }

    // 隐私授权前置：若后台已配置《用户隐私保护指引》，此处触发合规弹窗
    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({ fail: () => { /* 用户拒绝则等待其主动点击按钮 */ } });
    }
  },

  tokenKey() {
    return (app.globalData && app.globalData.tokenKey) || 'token';
  },

  // 用户点击 getPhoneNumber 按钮后的回调
  onGetPhoneNumber(e) {
    const phoneCode = e.detail && e.detail.code; // 新版接口：一次性 code，给后端换手机号
    if (!phoneCode) {
      // 用户拒绝授权 / 授权失败
      wx.showToast({ title: '未获取到手机号授权', icon: 'none' });
      return;
    }

    // 同时拿 wx.login 的 code，后端一次请求内同时换出 openid + 手机号
    wx.login({
      success: (loginRes) => this.requestLogin(phoneCode, loginRes.code),
      fail: () => this.requestLogin(phoneCode, '')
    });
  },

  // 调后端：POST /api/auth/wx-phone-login { phoneCode, loginCode }
  requestLogin(phoneCode, loginCode) {
    const g = app.globalData || {};
    const baseUrl = g.apiBaseUrl || 'https://test.meichuangmenye.com';
    const path = g.wxPhoneLoginPath || '/api/auth/wx-phone-login';

    this.setData({ submitting: true });
    wx.request({
      url: baseUrl + path,
      method: 'POST',
      data: { phoneCode, loginCode },
      success: (res) => {
        const data = res.data || {};
        if (res.statusCode === 200 || res.statusCode === 201) {
          // 与后端 client-login 返回约定一致：{ access_token, user: { id, phone, ... } }
          const token = data.access_token || (data.data && data.data.access_token);
          if (token) {
            wx.setStorageSync(this.tokenKey(), token);
            // 完整 user 存一份：进 H5 时随 token 一起通过 URL 传给 H5 建立登录态
            const user = data.user || (data.data && data.data.user);
            if (user) {
              wx.setStorageSync('user', JSON.stringify(user));
              if (user.phone) {
                wx.setStorageSync('phone', user.phone);
              }
            }
            this.goWebview();
            return;
          }
        }
        wx.showModal({
          title: '登录失败',
          content: data.message || '服务暂不可用，请稍后重试',
          showCancel: false
        });
      },
      fail: () => {
        wx.showModal({
          title: '网络错误',
          content: '无法连接服务器，请检查网络后重试',
          showCancel: false
        });
      },
      complete: () => {
        this.setData({ submitting: false });
      }
    });
  },

  // 暂不授权：直接进 H5（如需强制授权，把这里改成提示"需授权后使用"即可）
  onSkip() {
    this.goWebview();
  },

  goWebview() {
    wx.redirectTo({ url: '/pages/webview/webview' });
  }
});
