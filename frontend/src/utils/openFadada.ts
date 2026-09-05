/**
 * 打开法大大页面（个人实名刷脸 / 互动视频签）的统一入口。
 *
 * 背景：微信小程序内 H5 被 <web-view> 承载，法大大页面走到「人脸识别 / 互动视频签」
 * 环节时需要跳转到法大大的人脸 / 音视频小程序。但 web-view 无法直接唤起小程序，
 * 必须借助法大大官方「刷脸 + 互动视频签小程序跳转中间页 DEMO」包（pagesFace）做桥接：
 * 由 pagesFace 的 webview 页加载法大大链接，内部负责「跳刷脸 / 互动视频签小程序
 * → 返回 → 二次重定向拿结果」。
 *
 * 参考文档：
 * - 微信小程序集成法大大页面开发流程（刷脸）：https://dev.fadada.com/api-help/EJ7BTI5DGW/EUOXLYDFCTHRD3ZA
 * - 微信小程序集成法大大页面开发流程（刷脸 + 互动视频签）：https://dev.fadada.com/api-help/6YHMCFJJC4/FIJYQHAS802K7UD9
 */

/** 是否处于微信小程序 web-view 环境（明确识别：UA 含 miniProgram，或链接带 mp_env=weapp） */
export function isInWeChatMiniProgram(): boolean {
  if (typeof navigator === 'undefined') return false
  // 微信 web-view 的 UA 含 miniProgram（iOS 上该标记经常丢失，不能只依赖它）
  if (/miniProgram/i.test(navigator.userAgent)) return true
  // 小程序 webview.js 会向 H5 透传 mp_env=weapp，作为双重保险
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mp_env') === 'weapp') return true
  } catch {
    /* ignore */
  }
  return false
}

/** 是否为明确的桌面浏览器（仅用于兜底分流：桌面仍走新窗口，其余默认按小程序处理） */
function isDesktopBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // 含 mobile / iphone / ipad / android / micromessenger 之一视为非桌面
  return !/iphone|ipad|ipod|android|mobile|micromessenger/i.test(ua)
}

/** 降级打开方式：新窗口，失败（如小程序 webview 拦截弹窗）则当前页跳转 */
function fallbackOpen(url: string): void {
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) window.location.href = url
}

/**
 * 打开法大大页面链接。
 * - App 内嵌 web-view（UA 含 app_embed）：直接当前页跳转。
 * - 明确桌面浏览器：新窗口打开（保持原行为）。
 * - 其余环境（手机 / 微信内 / 识别不到小程序标记时）：**默认按微信小程序处理**，
 *   通过 wx.miniProgram.navigateTo 桥接到 pagesFace 中间页；wx SDK 未注入时
 *   动态加载 jweixin 后重试，仍失败或超时则降级为新窗口打开。
 */
export function openFadadaUrl(url: string): void {
  if (!url) return
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''

  // 1. App 内嵌 web-view：直接当前页跳转
  if (ua.includes('app_embed')) {
    window.location.href = url
    return
  }

  // 2. 明确桌面浏览器：新窗口打开
  if (isDesktopBrowser()) {
    fallbackOpen(url)
    return
  }

  // 3. 默认按微信小程序处理（识别不到 UA 标记时不再降级为浏览器）
  let handled = false
  const bridge = (): boolean => {
    const wx = (window as any).wx
    if (wx?.miniProgram?.navigateTo) {
      wx.miniProgram.navigateTo({
        url: '/pagesFace/pages/webview/webview?url=' + encodeURIComponent(url),
      })
      return true
    }
    return false
  }
  if (bridge()) return

  // wx JS-SDK 未注入（小程序 webview 首次进入）→ 动态加载后重试
  const degrade = () => {
    if (handled) return
    handled = true
    fallbackOpen(url)
  }
  const script = document.createElement('script')
  script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
  script.onload = () => {
    if (!bridge()) degrade()
  }
  script.onerror = degrade
  document.body.appendChild(script)
  // SDK 加载超时兜底（弱网环境）
  window.setTimeout(degrade, 5000)
}
