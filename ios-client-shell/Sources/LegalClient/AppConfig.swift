import Foundation

// App 全局配置
enum AppConfig {
    // 老板的 C 端入口地址
    static let clientURL = "https://test.meichuangmenye.com/client/login"

    // 允许留在 WebView 内加载的域名（外链拦截白名单）
    // 非白名单域名会跳到系统 Safari
    static let allowedDomains: Set<String> = [
        "test.meichuangmenye.com",
        "meichuangmenye.com",
        "fadada.com",
        "fadada.net",
        "alipay.com",
        "alipay.net",
        "weixin.qq.com",
        "wx.tenpay.com"
    ]

    // 需要跳到系统 App 的特殊协议
    static let specialSchemes: Set<String> = [
        "tel",      // 拨打电话
        "sms",      // 发短信
        "mailto",   // 发邮件
        "alipays",  // 支付宝 App
        "weixin",   // 微信 App
        "weixinpay",
        "wexin"
    ]
}
