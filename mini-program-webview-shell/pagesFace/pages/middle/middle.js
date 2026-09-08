// pagesFace/pages/middle/middle.js
// 刷脸（个人/企业实名）中间页：承接法大大 H5 的跳转，桥接到「法大大刷脸小程序」完成人脸识别，
// 完成后法大大小程序回跳本页（referrerInfo.extraData.returnURL），本页再 reloadPage 回 webview 拿结果。
// appId / path 取自 app.js globalData（从「刷脸小程序跳转中间页DEMO」的 middle.js 拷贝填入）。
const app = getApp()

Page({
  data: {
    url: '',
    appId: '',
    path: '',
    jumped: false,
  },

  onLoad(options) {
    const url = decodeURIComponent(options.url || '')
    const appId =
      options.appId || wx.getStorageSync('fadadaFaceAppId') || app.globalData.fadadaFaceAppId || ''
    const path =
      options.path || wx.getStorageSync('fadadaFacePath') || app.globalData.fadadaFacePath || ''
    this.setData({ url, appId, path })
    this.jumpToFadada()
  },

  // 从法大大小程序返回（App.onShow 已把 returnURL 写入 storage）时，回 webview 取结果
  onShow() {
    const returnURL = wx.getStorageSync('returnURL')
    if (returnURL) {
      wx.removeStorageSync('returnURL')
      wx.redirectTo({
        url: '/pagesFace/pages/webview/webview?url=' + encodeURIComponent(returnURL),
      })
    }
  },

  jumpToFadada() {
    const { appId, path, url } = this.data
    if (!appId) {
      wx.showModal({
        title: '配置缺失',
        content: '请在 app.js globalData.fadadaFaceAppId 配置法大大刷脸小程序 AppId（取自法大大官方 DEMO 的 middle.js）',
        showCancel: false,
      })
      return
    }
    if (!path) {
      wx.showModal({
        title: '配置缺失',
        content: '请在 app.js globalData.fadadaFacePath 配置法大大刷脸小程序入口 path（取自法大大官方 DEMO 的 middle.js）',
        showCancel: false,
      })
      return
    }
    this.setData({ jumped: true })
    wx.navigateToMiniProgram({
      appId,
      path: path + (path.indexOf('?') === -1 ? '?' : '&') + 'url=' + encodeURIComponent(url),
      extraData: { url },
      envVersion: 'release',
      fail: (err) => {
        wx.showToast({ title: '跳转法大大失败：' + (err && err.errMsg ? err.errMsg : '未知错误'), icon: 'none' })
      },
    })
  },
})
