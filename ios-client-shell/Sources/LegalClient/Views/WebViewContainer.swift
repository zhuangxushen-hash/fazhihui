import SwiftUI
import UIKit
import WebKit

// SwiftUI 包装器：把 UIKit 的 WKWebView 嵌进 SwiftUI
struct WebViewContainer: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> WebViewController {
        let controller = WebViewController()
        controller.load(url: url)
        return controller
    }

    func updateUIViewController(_ uiViewController: WebViewController, context: Context) {
        // SwiftUI 重绘时 WebView 不需要做什么
    }
}

// 核心控制器：管理 WKWebView + 顶部进度条 + 下拉刷新
final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {

    private var webView: WKWebView!
    private var progressView: UIProgressView!
    private var refreshControl: UIRefreshControl!
    private var errorView: UIView?

    // KVO 观察进度
    private var progressObserver: NSKeyValueObservation?
    private var titleObserver: NSKeyValueObservation?
    private var urlObserver: NSKeyValueObservation?

    // 返回手势是否启用
    private var swipeBackEnabled = false

    // 允许的白名单（从 AppConfig 引入）
    private let allowedDomains = AppConfig.allowedDomains
    private let specialSchemes = AppConfig.specialSchemes

    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupProgressView()
        setupRefreshControl()
        setupErrorView()
        setupSwipeBackGesture()
    }

    // MARK: - 初始化 WKWebView

    private func setupWebView() {
        // 1. 配置 WKWebViewConfiguration（注入 JS 桥、开启摄像头权限、允许内联媒体）
        let config = WKWebViewConfiguration()

        // ==== 持久化存储配置 ====
        // 使用 .default() → Cookie + localStorage + sessionStorage 全部写入磁盘
        // App 退出/重启后登录态自动保留（跟 Safari 一样）
        // 如果用 .nonPersistent() 就完全不存（类似无痕模式，我们不用）
        config.websiteDataStore = .default
        // 显式开启 JS（iOS 默认就是 true，写上是为了保险）
        config.preferences.javaScriptEnabled = true
        // 允许画中画（法大大视频通话/视频签约可能用到）
        if #available(iOS 14.0, *) {
            config.allowsPictureInPictureMediaPlayback = true
        }

        // 用户脚本：禁用 pinch zoom，移动端体验更像 App
        let userScript = WKUserScript(
            source: """
            var meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
            """,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        config.userContentController.addUserScript(userScript)

        // 自动登录恢复：壳每次启动都 load /client/login，
        // 如果 localStorage 里已经有 client_token，直接跳 /client 首页，不用让用户再看到登录表单
        let autoJump = WKUserScript(
            source: "(function(){if(window.location.pathname==='/client/login'){var t=localStorage.getItem('client_token');if(t){window.location.replace('/client');}}})();",
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        config.userContentController.addUserScript(autoJump)

        // 2. 开启内联视频播放（iOS 默认会全屏弹播放器）
        if #available(iOS 14.0, *) {
            config.mediaTypesRequiringUserActionForPlayback = []
        }
        config.allowsInlineMediaPlayback = true
        config.allowsAirPlayForMediaPlayback = true

        // 3. 默认摄像头/麦克风权限策略：允许（法大大人脸识别需要）
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        config.setValue(true, forKey: "suppressesIncrementalRendering")

        // 4. 创建 WKWebView
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.backgroundColor = .clear
        webView.isOpaque = false
        webView.allowsBackForwardNavigationGestures = true  // iOS 原生左滑返回
        webView.navigationDelegate = self
        webView.uiDelegate = self

        // 5. 反指纹：自定义 UA，让法大大能识别为正常移动浏览器
        let originalUA = webView.value(forKey: "userAgent") as? String ?? ""
        webView.customUserAgent = originalUA + " LegalClientApp/1.0"

        view.addSubview(webView)

        // 6. KVO：观察加载进度、标题、URL
        progressObserver = webView.observe(\.estimatedProgress, options: .new) { [weak self] webView, _ in
            self?.progressView.progress = Float(webView.estimatedProgress)
            self?.progressView.isHidden = webView.estimatedProgress >= 1.0
        }

        titleObserver = webView.observe(\.title, options: .new) { [weak self] webView, _ in
            self?.title = webView.title
        }

        urlObserver = webView.observe(\.url, options: .new) { [weak self] webView, _ in
            self?.swipeBackEnabled = webView.canGoBack
        }

        // 7. 下拉刷新嵌入（iOS 15+ 的 WKWebView 自带，但兼容旧版本）
        if #available(iOS 15.0, *) {
            webView.scrollView.refreshControl = refreshControl
        } else {
            webView.scrollView.addSubview(refreshControl)
        }
    }

    private func setupProgressView() {
        progressView = UIProgressView(progressViewStyle: .default)
        progressView.trackTintColor = .clear
        progressView.progressTintColor = UIColor(red: 28/255, green: 112/255, blue: 219/255, alpha: 1.0)
        progressView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(progressView)
        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressView.heightAnchor.constraint(equalToConstant: 2)
        ])
        progressView.isHidden = true
    }

    private func setupRefreshControl() {
        refreshControl = UIRefreshControl()
        refreshControl.tintColor = UIColor(red: 28/255, green: 112/255, blue: 219/255, alpha: 1.0)
        refreshControl.addTarget(self, action: #selector(onRefresh), for: .valueChanged)
    }

    private func setupErrorView() {
        // 简单的网络错误提示页（404 / 断网 时显示）
        let errorBox = UIView(frame: .zero)
        errorBox.backgroundColor = .white
        errorBox.translatesAutoresizingMaskIntoConstraints = false

        let label = UILabel()
        label.text = "网络似乎不太通畅，请检查后重试"
        label.textColor = .darkGray
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        errorBox.addSubview(label)

        let retryBtn = UIButton(type: .system)
        retryBtn.setTitle("重新加载", for: .normal)
        retryBtn.setTitleColor(UIColor(red: 28/255, green: 112/255, blue: 219/255, alpha: 1.0), for: .normal)
        retryBtn.addTarget(self, action: #selector(onRetry), for: .touchUpInside)
        retryBtn.translatesAutoresizingMaskIntoConstraints = false
        errorBox.addSubview(retryBtn)

        view.addSubview(errorBox)
        NSLayoutConstraint.activate([
            errorBox.topAnchor.constraint(equalTo: view.topAnchor),
            errorBox.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            errorBox.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            errorBox.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            label.centerYAnchor.constraint(equalTo: errorBox.centerYAnchor, constant: -20),
            label.leadingAnchor.constraint(equalTo: errorBox.leadingAnchor, constant: 20),
            label.trailingAnchor.constraint(equalTo: errorBox.trailingAnchor, constant: -20),
            retryBtn.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 16),
            retryBtn.centerXAnchor.constraint(equalTo: errorBox.centerXAnchor)
        ])
        errorBox.isHidden = true
        errorView = errorBox
    }

    private func setupSwipeBackGesture() {
        // iOS 13+ 原生侧滑返回
        navigationController?.interactivePopGestureRecognizer?.delegate = self
    }

    // MARK: - 公开方法

    func load(url: URL) {
        showError(false)
        let request = URLRequest(url: url)
        webView.load(request)
    }

    // MARK: - 下拉刷新 / 重试

    @objc private func onRefresh() {
        webView.reload()
    }

    @objc private func onRetry() {
        showError(false)
        webView.reload()
    }

    private func showError(_ show: Bool) {
        errorView?.isHidden = !show
        webView.isHidden = show
    }

    // MARK: - WKNavigationDelegate

    // 决定是否允许导航：拦截外链 / 特殊协议
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        let scheme = url.scheme?.lowercased() ?? ""
        let host = url.host?.lowercased() ?? ""

        // 1. 特殊协议（tel: / sms: / alipays:// / weixin://）→ 跳系统 App
        if AppConfig.specialSchemes.contains(scheme) {
            DispatchQueue.main.async {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
            }
            decisionHandler(.cancel)
            return
        }

        // 2. http/https 域名白名单检查
        if ["http", "https"].contains(scheme) {
            let isAllowed = AppConfig.allowedDomains.contains { host.hasSuffix($0) }
            if !isAllowed {
                // 不在白名单的域名 → 跳到 Safari（法大大签约 / 微信支付等三方页）
                DispatchQueue.main.async {
                    UIApplication.shared.open(url, options: [:], completionHandler: nil)
                }
                decisionHandler(.cancel)
                return
            }
        }

        // 3. 其余正常加载
        showError(false)
        decisionHandler(.allow)
    }

    // 主文档加载完成 → 隐藏进度条 / 停止刷新
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        progressView.progress = 1.0
        progressView.isHidden = true
        if #available(iOS 15.0, *) {
            webView.scrollView.refreshControl?.endRefreshing()
        } else {
            refreshControl.endRefreshing()
        }
    }

    // 主文档加载失败 → 显示错误页
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        // -999 是用户取消（跳转新 URL），不算真错误
        if (error as NSError).code != -999 {
            showError(true)
        }
        progressView.isHidden = true
    }

    // MARK: - WKUIDelegate（处理 alert/confirm/prompt + 新窗口请求）

    // JS alert → 原生弹窗
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "提示", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    // JS confirm → 原生弹窗
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "确认", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }

    // JS prompt → 原生输入框（法大大签约过程中偶尔用到）
    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let alert = UIAlertController(title: prompt, message: nil, preferredStyle: .alert)
        alert.addTextField { tf in tf.text = defaultText }
        alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in completionHandler(nil) })
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in
            completionHandler(alert.textFields?.first?.text ?? defaultText)
        })
        present(alert, animated: true)
    }

    // 新窗口请求 → 在当前 WebView 里继续加载（iOS 没 Android 那么多窗口模式，直接 load）
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            // 直接 load，相当于 Android 的 onCreateWindow return true
            DispatchQueue.main.async {
                webView.load(URLRequest(url: url))
            }
        }
        return nil  // 返回 nil 表示不创建新 WebView
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        // 预留：JS → Native 桥接（比如后面要加分享、支付）
    }

    // MARK: - deinit

    deinit {
        progressObserver = nil
        titleObserver = nil
        urlObserver = nil
        webView?.stopLoading()
    }
}

// MARK: - UIGestureRecognizerDelegate（侧滑返回）

extension WebViewController: UIGestureRecognizerDelegate {
    func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        return webView.canGoBack
    }
}
