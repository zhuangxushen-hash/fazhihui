// pages/webview/webview.js
const app = getApp();

Page({
  data: {
    url: ''
  },

  onLoad(options) {
    let base = (app.globalData && app.globalData.h5BaseUrl) || 'https://test.meichuangmenye.com/client';

    // 支持从外部带 src 进来（需 encodeURIComponent）
    if (options.src) {
      base = decodeURIComponent(options.src);
    }

    // 打通微信授权登录：先 wx.login 拿 code，再打开 H5
    this.loginAndOpen(base);
  },

  // 微信授权登录：wx.login 拿 code 传给 H5 后端做 code2Session 登录
  loginAndOpen(base) {
    wx.login({
      success: (res) => {
        const code = res.code; // 5 分钟有效，一次性
        const params = [];
        if (code) {
          params.push('code=' + encodeURIComponent(code));
        }

        // 若小程序本地已有 token，一并带上（已登录用户可跳过授权）
        const tokenKey = (app.globalData && app.globalData.tokenKey) || 'token';
        const token = wx.getStorageSync(tokenKey);
        if (token) {
          params.push('token=' + encodeURIComponent(token));
          // user 一并传给 H5：H5 渲染前据此直接建立 client_token/client_user 登录态
          //（H5 端实现见 frontend/src/utils/tokenBootstrap.ts）
          const userStr = wx.getStorageSync('user');
          if (userStr) {
            params.push('user=' + encodeURIComponent(userStr));
          }
        }

        // 向 H5 透传小程序环境标记，便于前端 openFadadaUrl 可靠识别并桥接到 pagesFace
        params.push('mp_env=weapp');
        const sep = base.indexOf('?') === -1 ? '?' : '&';
        this.setData({ url: base + sep + params.join('&') });
      },
      fail: () => {
        // 授权失败也先打开 H5，由 H5 端降级处理（如跳转登录页）
        this.setData({ url: base + (base.indexOf('?') === -1 ? '?' : '&') + 'mp_env=weapp' });
      }
    });
  },

  onError(e) {
    wx.showModal({
      title: '加载失败',
      content: '页面打开出错，请检查业务域名配置或网络。' + (e && e.detail ? e.detail : ''),
      showCancel: false
    });
  }
});
