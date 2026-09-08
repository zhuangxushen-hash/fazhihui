Page({
  data: {
    /** 刷脸token */
    bizToken: '',
    /** 刷脸结束回调地址 */
    returnURL: '',
    /** 双录是否完成 */
    isDone: false
  },

  /** 返回上一个页 */
  onNavigateBack() {
    const timeStr = new Date().getTime();
    const url = wx.getStorageSync('returnURL')
    const returnURL = url + (url.includes('?') ? '&' : '?') + `time=${timeStr}`
    const pages = getCurrentPages()
    const previous = pages[pages.length - 2]
    /** 重新加载签署页面 */
    if (previous.reloadPage && typeof previous.reloadPage === 'function') {
      previous.reloadPage(returnURL)
      wx.setStorageSync('isLiveDone', false)
      wx.setStorageSync('returnURL', '')
      wx.navigateBack({
        delta: 1,
      })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function ({ appKey = '', caseno = '', checksum = '', env = undefined }) {
    console.log(appKey);
    console.log(caseno);
    console.log(checksum);
    console.log(env);
    this.setData({
      appKey: appKey,
      caseno: caseno,
      checksum: checksum,
      env: env
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onShow: function () {
    const that = this;
    const isDone = wx.getStorageSync('isLiveDone');
    that.setData({
      isDone: isDone
    }, () => {
      if (isDone) {
        setTimeout(() => {
          that.onNavigateBack()
        }, 1500)
      }
    })
  },

  goFaceLive() {
    const { appKey, caseno, checksum, env } = this.data
    wx.navigateToMiniProgram({
      appId: 'wxe79d5da9faad5f53',
      path: 'pages/notary-face-live/notary-face-live',
      extraData: {
        appKey: appKey,
        caseno: caseno,
        checksum: checksum,
        env: env
      },
      envVersion: 'release',
      success(res) {
        // 打开成功
      }
    })
  }
});
