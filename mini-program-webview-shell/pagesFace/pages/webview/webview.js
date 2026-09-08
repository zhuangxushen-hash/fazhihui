Page({
  data: {
    url: '',
    isRedirect: false
  },

  onLoad(options) {
    this.setData({ url: decodeURIComponent(options.url) })
  },

  onShow() {
    const { isRedirect, url } = this.data
    if (isRedirect) {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const route = '/' + current.route
      wx.redirectTo({ url: route + '?url=' + encodeURIComponent(url) })
    }
  },

  setIsRedirect() {
    this.setData({ isRedirect: true })
  },

  reloadPage(url) {
    this.setData({ url })
  }
})
