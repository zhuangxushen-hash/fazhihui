// pagesFace/pages/webview/webview.js
// 法大大授权/签署 H5 页面的承载页。
// 法大大 H5 在「需要刷脸 / 互动视频签」的环节，会通过 wx.miniProgram.navigateTo 跳转到
// 对应的中间页（pages/middle/middle 或 pages/avsMiddlePage/avsMiddlePage），
// 由中间页桥接法大大刷脸小程序；刷脸/录制完成后法大大回跳中间页，中间页再 reloadPage 回本页拿结果。
// 同时支持 fadada H5 通过 wx.miniProgram.postMessage 回传需要重载的 URL（reloadPage）。
Page({
  data: {
    url: '',
  },

  onLoad(options) {
    const url = decodeURIComponent(options.url || '')
    if (!url) {
      wx.showModal({ title: '参数缺失', content: '未收到法大大页面地址', showCancel: false })
      return
    }
    this.setData({ url })
    // 透传法大大刷脸/互动视频签小程序的 appId/path 到 globalData 与 storage，
    // 供 middle / avsMiddlePage 中间页优先使用（避免硬编码）。appId 为法大小程序原始 Id，
    // 刷脸与互动视频签共用；path 为互动视频签入口（face 场景回退 fadadaFacePath 配置）。
    const app = getApp()
    if (options.appId) {
      app.globalData.fadadaFaceAppId = options.appId
      wx.setStorageSync('fadadaFaceAppId', options.appId)
    }
    if (options.path) {
      app.globalData.fadadaAvsPath = options.path
      wx.setStorageSync('fadadaAvsPath', options.path)
    }
  },

  // fadada H5 调用 wx.miniProgram.postMessage({ data: { url } }) 时触发
  onMessage(e) {
    const list = e && e.detail && e.detail.data
    if (Array.isArray(list) && list.length) {
      const last = list[list.length - 1]
      const next = last && (last.url || last.data)
      if (next && next !== this.data.url) {
        this.setData({ url: next })
      }
    }
  },

  // 供 fadada H5 直接调用的重载方法（DEMO 要求存在）
  reloadPage(url) {
    if (url && url !== this.data.url) {
      this.setData({ url })
    }
  },
})
