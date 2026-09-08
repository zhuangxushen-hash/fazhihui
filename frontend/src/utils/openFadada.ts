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

export interface FadadaOpenOptions {
  /** 后端返回的 actorSignTaskMiniAppInfo（{ wxOriginalId, path }）。
   *  微信小程序 web-view 环境下，把法大大刷脸/互动视频签小程序的 appId/path 透传给
   *  pagesFace 中间页，避免在小程序代码里硬编码 appId。无则走小程序 app.js 配置兜底。 */
  miniAppInfo?: { wxOriginalId?: string; path?: string } | null
}

/**
 * 打开法大大页面链接（个人实名刷脸 / 互动视频签）。
 * - App 内嵌 web-view（UA 含 app_embed）：直接当前页跳转。
 * - 明确桌面浏览器：新窗口打开（保持原行为）。
 * - 其余环境（手机 / 微信内 / 识别不到小程序标记时）：**默认按微信小程序处理**，
 *   通过 wx.miniProgram.navigateTo 桥接到 pagesFace 的 webview 页；法大大 H5 在该页内
 *   于刷脸/互动视频签环节会自动跳转到对应 middle / avsMiddlePage 中间页。把 mini_app_info
 *   的 appId/path 一并透传，供中间页优先使用，避免硬编码。wx SDK 未注入时动态加载 jweixin
 *   后重试，仍失败或超时则降级为新窗口打开。
 * @returns Promise<boolean> —— resolve(true) 表示已开始跳转（已 navigateTo / 已开新窗口）；
 *   resolve(false) 表示跳转失败（wx 不可用且兜底打开也未生效）。调用方可据此决定是否复位 loading。
 */
export function openFadadaUrl(url: string, opts?: FadadaOpenOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!url) {
      resolve(false)
      return
    }
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''

    // 1. App 内嵌 web-view：直接当前页跳转
    if (ua.includes('app_embed')) {
      window.location.href = url
      resolve(true)
      return
    }

    // 2. 明确桌面浏览器：新窗口打开
    if (isDesktopBrowser()) {
      fallbackOpen(url)
      resolve(true)
      return
    }

    // 3. 默认按微信小程序处理（识别不到 UA 标记时不再降级为浏览器）
    //    桥接到 pagesFace 的 webview 页（由法大大 H5 在刷脸/互动视频签环节自动跳转到
    //    对应的 middle / avsMiddlePage 中间页）。把 mini_app_info 的 appId/path 一并带上，
    //    webview 页写入 globalData/storage，供中间页优先使用，避免硬编码 appId。
    const mini = opts?.miniAppInfo
    const q = new URLSearchParams()
    q.set('url', url)
    if (mini?.wxOriginalId) q.set('appId', mini.wxOriginalId)
    if (mini?.path) q.set('path', mini.path)
    const navigateUrl = '/pagesFace/pages/webview/webview?' + q.toString()

    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      resolve(ok)
    }
    const bridge = (): boolean => {
      const wx = (window as any).wx
      if (wx?.miniProgram?.navigateTo) {
        try {
          wx.miniProgram.navigateTo({ url: navigateUrl })
          return true
        } catch {
          return false
        }
      }
      return false
    }
    // 小程序 web-view 内 wx 已注入 → 同步跳转，立即返回成功（避免 loading 过早复位）
    if (bridge()) {
      finish(true)
      return
    }

    // wx JS-SDK 未注入（极少数时序问题）→ 动态加载后重试；失败/超时则降级新窗口
    const degrade = () => {
      if (done) return
      fallbackOpen(url)
      finish(false)
    }
    const script = document.createElement('script')
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
    script.onload = () => {
      if (bridge()) finish(true)
      else degrade()
    }
    script.onerror = degrade
    document.body.appendChild(script)
    // SDK 加载超时兜底（弱网环境）
    window.setTimeout(degrade, 5000)
  })
}
