Page({
  data: {
    /** 刷脸Id */
    bizToken: '',

    /** 认证小程序appId */
    miniProgramAppId: '',

    /** 认证小程序跳转页地址 */
    miniProgramPath: '',

    /** 刷脸结束回调地址 */
    miniProgramCallBackUrl: '',

    /** 是否已跳转认证小程序 */
    goFaceDone: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad({ bizToken = '', miniProgramAppId = '', miniProgramPath = '', miniProgramCallBackUrl = '', isRedirect = false }) {
    this.setData({
      bizToken: decodeURIComponent(bizToken),
      miniProgramAppId: decodeURIComponent(miniProgramAppId),
      miniProgramPath: decodeURIComponent(miniProgramPath),
      miniProgramCallBackUrl: decodeURIComponent(miniProgramCallBackUrl)
    })

    if (isRedirect) {
      const pages = getCurrentPages()
      const prev = pages[pages.length - 2]
      prev.setIsRedirect && prev.setIsRedirect()
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const {goFaceDone, miniProgramCallBackUrl} = this.data

    /** 防止从认证进入后直接返回 */
    if(!goFaceDone) return

    /** 已跳转认证小程序，重置 */
    this.setData({ goFaceDone: false })

    /** getEnterOptionsSync 基础库 2.9.4 开始支持，低版本需做兼容处理 */
    const options = wx.getEnterOptionsSync()

    /** 从认证小程序返回 */
    if (options.scene === 1038 && options.referrerInfo.extraData && options.referrerInfo.extraData.faceResult) {
      const pages = getCurrentPages()
      const previous = pages[pages.length - 2]

      /** 重新加载认证页面 */
      if (previous.reloadPage && typeof previous.reloadPage === 'function') {
        previous.reloadPage(miniProgramCallBackUrl)
        wx.navigateBack({ delta: 1 })
      }
    }
  },

  /**
   * 点击前往认证
   */
  onJump() {
    const { bizToken, miniProgramAppId, miniProgramPath } = this.data
    wx.navigateToMiniProgram({
      appId: miniProgramAppId,
      path: miniProgramPath + '?bizToken=' + bizToken,
      success:() => this.setData({ goFaceDone: true })
    })
  }
})
