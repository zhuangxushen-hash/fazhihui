// pagesFace/pages/index/index.js
// 法大大刷脸/互动视频签中间页分包入口（占位页，法大大 DEMO 要求存在）。
// 真正承载跳转逻辑的是 webview / middle / avsMiddlePage。
Page({
  onLoad() {
    // 直接进入入口页时，回退到 H5 首页，避免白屏
    const app = getApp()
    const base = (app.globalData && app.globalData.h5BaseUrl) || 'https://test.meichuangmenye.com/client'
    wx.reLaunch({ url: '/pages/webview/webview?src=' + encodeURIComponent(base) })
  },
})
