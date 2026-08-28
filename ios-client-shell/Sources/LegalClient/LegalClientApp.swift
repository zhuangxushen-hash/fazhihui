import SwiftUI
import UIKit

// iOS App 入口（iOS 14+ SwiftUI 生命周期）
@main
struct LegalClientApp: App {
    // 监听 App 前后台切换
    @Environment(\.scenePhase) private var scenePhase

    init() {
        configureWKWebView()
    }

    var body: some Scene {
        WindowGroup {
            WebViewContainer(url: URL(string: AppConfig.clientURL)!)
                .preferredColorScheme(.light)
                .statusBarHidden(false)
                // 监听 App 前后台切换 —— 从后台回来时刷新 Cookie 存储
                .onChange(of: scenePhase) { _, newPhase in
                    if newPhase == .active {
                        // App 从后台切回前台 → 刷新 Cookie 存储
                        WKWebsiteDataStore.default().httpCookieStore.getAllCookies { _ in }
                    }
                }
        }
    }

    // WKWebView 全局初始化
    private func configureWKWebView() {
        // 允许跨域 Cookie（法大大 H5 签约需要 Cookie 共享）
        WKWebsiteDataStore.default().httpCookieStore.getAllCookies { _ in }
    }
}
