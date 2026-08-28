package com.legalservice.client;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Button;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.ArrayList;
import java.util.List;

/**
 * C端 WebView 壳入口
 *
 * 直接加载服务器部署的 C 端 H5 页面，支持：
 *   - 下拉刷新 + 顶部进度条
 *   - 网页内跳转拦截（法大大等嵌入页放行，tel/sms/mailto/APP 跳转用系统处理）
 *   - 返回键优先网页回退，到顶后二次确认退出
 *   - 网络错误重试
 *   - 法大大 H5 人脸识别（通过 WebView 访问摄像头）
 *     -> 需运行时申请 CAMERA / RECORD_AUDIO / 存储 权限
 *     -> WebChromeClient 处理 onPermissionRequest 回调
 */
public class MainActivity extends AppCompatActivity {

    // ============ 配置区 ============
    // C 端入口地址
    private static final String CLIENT_URL = "https://test.meichuangmenye.com/client/login";

    // 需要放行的域名（这些是 C 端内部会跳转到的合法业务域名，不应被踢出 WebView）
    // 法大大签约、支付宝/微信支付、短信服务等都需要留在这里
    private static final String[] ALLOWED_DOMAINS = {
        "test.meichuangmenye.com",          // 我们自己的 C 端域名
        "fadada.com",                       // 法大大签约页
        "fadada.net",                       // 法大大备用域名
        "alipay.com",                       // 支付宝支付
        "alipay.net",
        "weixin.qq.com",                    // 微信相关
        "wx.tenpay.com",                    // 微信支付
        "smscode.com",                      // 创蓝短信等短信服务商
        "oss-cn-hangzhou.aliyuncs.com",     // 阿里云 OSS 文件下载
        "cos.ap-shanghai.myqcloud.com",     // 腾讯云 COS
    };
    // ================================

    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefresh;
    private LinearLayout errorLayout;
    private TextView errorText;
    private Button retryButton;

    // 记录当前加载的 URL，用于错误页重试
    private String currentUrl = CLIENT_URL;
    // 记录退出点击时间，实现双击退出
    private long lastBackPressTime = 0;
    // 双击退出间隔（毫秒）
    private static final long DOUBLE_BACK_EXIT_INTERVAL = 2500;

    // 运行时权限申请 Launcher（Android 13+ 的标准写法）
    private ActivityResultLauncher<String[]> permissionLauncher;

    // 当前待处理的 WebView 权限请求（摄像头/麦克风等），等用户授权后回调
    private PermissionRequest pendingWebPermissionRequest;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 注册权限申请回调（结果回来后给 WebView 的 PermissionRequest 放行）
        permissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestMultiplePermissions(),
                result -> handlePermissionResult(result)
        );

        // 找控件
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        errorLayout = findViewById(R.id.errorLayout);
        errorText = findViewById(R.id.errorText);
        retryButton = findViewById(R.id.retryButton);

        // 配置 WebView
        setupWebView();

        // 下拉刷新监听
        swipeRefresh.setOnRefreshListener(() -> {
            if (errorLayout.getVisibility() == View.VISIBLE) {
                retryLoad();
            } else {
                webView.reload();
            }
        });

        // 重试按钮
        retryButton.setOnClickListener(v -> retryLoad());

        // 先检查运行时权限再加载（Android 6.0+）
        ensureRuntimePermissions();

        // 恢复或首次加载：
        //   - Activity 被系统回收后重建时 savedInstanceState 不为 null → 恢复之前的页面和登录态
        //   - 全新启动时 savedInstanceState 为 null → 加载首页
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(CLIENT_URL);
        }
    }

    /**
     * 确保摄像头/麦克风/存储等危险权限已授权
     * Android 6.0+ (API 23+) 需要动态申请
     */
    private void ensureRuntimePermissions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return; // Android 5.x 及以下不需要运行时申请
        }

        // 收集未授权的危险权限
        String[] dangerousPermissions = {
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                Manifest.permission.READ_EXTERNAL_STORAGE,
        };

        List<String> needRequest = new ArrayList<>();
        for (String p : dangerousPermissions) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                needRequest.add(p);
            }
        }

        if (!needRequest.isEmpty()) {
            permissionLauncher.launch(needRequest.toArray(new String[0]));
        }
    }

    /**
     * 权限申请结果处理
     * 授权通过后，如果之前有 WebView 的摄像头请求挂起，放它继续
     */
    private void handlePermissionResult(java.util.Map<String, Boolean> result) {
        boolean allGranted = true;
        for (Boolean v : result.values()) {
            if (v == null || !v) {
                allGranted = false;
                break;
            }
        }

        if (allGranted) {
            // 全部放行，WebView 里待处理的摄像头请求可以执行了
            if (pendingWebPermissionRequest != null) {
                pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
                pendingWebPermissionRequest = null;
            }
        } else {
            // 权限拒绝，摄像头人脸识别用不了；给出提示
            if (pendingWebPermissionRequest != null) {
                pendingWebPermissionRequest.deny();
                pendingWebPermissionRequest = null;
            }
        }
    }

    /**
     * 配置 WebView 设置 + WebViewClient + WebChromeClient
     */
    @SuppressLint({"SetJavaScriptEnabled", "ClickableViewAccessibility"})
    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // 基础能力
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // 支持各种 HTML5 特性
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        // 摄像头/地理位置/文件访问（法大大人脸识别 + 证书下载需要）
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setDefaultTextEncodingName("utf-8");
        settings.setSupportZoom(true);

        // 允许 WebView 使用摄像头等硬件（getUserMedia）
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Cookie 持久化配置 —— 登录态（JWT token / session cookie）存在 WebView 里
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptFileSchemeCookies(true);
        // Android 5.0+ 显式允许第三方 Cookie（法大大 iframe 嵌套需要）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }

        // ============ WebViewClient：处理页面内跳转、错误、SSL ============
        webView.setWebViewClient(new WebViewClient() {

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                currentUrl = url;
                errorLayout.setVisibility(View.GONE);
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);

                // 自动登录恢复：如果当前在 /client/login 且 localStorage 里有 client_token，直接跳 /client
                String autoJump = "(function(){" +
                    "if(window.location.pathname==='/client/login'){" +
                    "var t=localStorage.getItem('client_token');" +
                    "if(t){window.location.replace('/client');}" +
                    "}})();";
                webView.evaluateJavascript(autoJump, null);
            }

            /**
             * URL 拦截逻辑：
             *   - http(s) 协议 + 在允许域名列表内 -> 留在 WebView 里（法大大签约页走这里）
             *   - http(s) 协议 + 不在允许域名列表内 -> 也留在 WebView（更宽松，避免误杀）
             *   - tel: / sms: / mailto: / weixin:// / alipay:// 等特殊协议 -> 交给系统处理
             */
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // 特殊协议：tel 打电话、sms 发短信、mailto 发邮件、deep link 跳转 App
                if (url.startsWith("tel:") || url.startsWith("sms:")
                        || url.startsWith("mailto:") || url.startsWith("intent://")
                        || url.startsWith("weixin://") || url.startsWith("alipays://")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {
                        return false;
                    }
                }

                // http(s) 协议：一律留在 WebView 内
                // 法大大 embedUrl 虽然域名不同，但也是正常 http(s) 页面，不应该被踢出
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false;
                }

                // 其他未知协议也尝试交给系统
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception ignored) {
                    return false;
                }
            }

            /**
             * 主文档加载错误 -> 显示自定义错误页
             */
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    showErrorPage("网络连接失败，请检查后重试");
                }
            }

            /**
             * 忽略 SSL 证书错误（内网/自签名场景）
             * 生产环境如果用了正规证书可以删除此方法
             */
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, android.net.http.SslError error) {
                handler.proceed();
            }
        });

        // ============ WebChromeClient：处理摄像头权限、进度条、弹窗 ============
        webView.setWebChromeClient(new WebChromeClient() {

            /**
             * WebView 发起摄像头/麦克风请求（法大大 H5 人脸识别触发）
             * -> 先查运行时权限，已授权则直接 grant，未授权则触发 ActivityResultLauncher
             */
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // 保存起来，等权限结果回来再 grant
                pendingWebPermissionRequest = request;

                // 收集需要的权限
                List<String> need = new ArrayList<>();
                for (String res : request.getResources()) {
                    switch (res) {
                        case PermissionRequest.RESOURCE_VIDEO_CAPTURE:
                            need.add(Manifest.permission.CAMERA);
                            break;
                        case PermissionRequest.RESOURCE_AUDIO_CAPTURE:
                            need.add(Manifest.permission.RECORD_AUDIO);
                            break;
                        case PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID:
                            // 数字版权相关，默认放行
                            break;
                    }
                }

                if (need.isEmpty()) {
                    // 无需申请的类型直接放行
                    request.grant(request.getResources());
                    pendingWebPermissionRequest = null;
                    return;
                }

                // 检查已授权的
                List<String> stillNeed = new ArrayList<>();
                for (String p : need) {
                    if (ContextCompat.checkSelfPermission(MainActivity.this, p)
                            != PackageManager.PERMISSION_GRANTED) {
                        stillNeed.add(p);
                    }
                }

                if (stillNeed.isEmpty()) {
                    // 权限都有，直接 grant
                    request.grant(request.getResources());
                    pendingWebPermissionRequest = null;
                } else {
                    // 触发运行时申请，结果在 handlePermissionResult 里处理
                    permissionLauncher.launch(stillNeed.toArray(new String[0]));
                }
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                super.onPermissionRequestCanceled(request);
                if (pendingWebPermissionRequest == request) {
                    pendingWebPermissionRequest = null;
                }
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                progressBar.setProgress(newProgress);
                if (newProgress >= 100) {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                // 拦截新窗口请求，继续在当前 WebView 打开
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(view);
                resultMsg.sendToTarget();
                return true;
            }
        });

        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
    }

    /**
     * 显示错误页
     */
    private void showErrorPage(String msg) {
        errorText.setText(msg);
        errorLayout.setVisibility(View.VISIBLE);
        webView.setVisibility(View.INVISIBLE);
        progressBar.setVisibility(View.GONE);
        swipeRefresh.setRefreshing(false);
    }

    /**
     * 重新加载当前页
     */
    private void retryLoad() {
        errorLayout.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        webView.loadUrl(currentUrl);
    }

    /**
     * 返回键逻辑
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (errorLayout.getVisibility() == View.VISIBLE) {
                showExitConfirm();
                return true;
            }
            if (webView.canGoBack()) {
                webView.goBack();
                return true;
            }
            long now = System.currentTimeMillis();
            if (now - lastBackPressTime < DOUBLE_BACK_EXIT_INTERVAL) {
                showExitConfirm();
                return true;
            }
            lastBackPressTime = now;
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    /**
     * 退出确认对话框
     */
    private void showExitConfirm() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.exit_title)
                .setMessage(R.string.exit_message)
                .setPositiveButton(R.string.exit_ok, (d, w) -> finish())
                .setNegativeButton(R.string.exit_cancel, null)
                .show();
    }

    /**
     * 销毁时清理 WebView，防内存泄漏
     */
    // 把 WebView 状态（页面栈 + localStorage + Cookie）存到 Bundle
    // Activity 被系统回收后重建时能恢复登录态和当前页面
    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    // App 切到后台 → 把内存里的 Cookie 立刻写回磁盘
    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            CookieManager.getInstance().flush();
        }
    }

    // App 回到前台 → 刷新 Cookie 管理器
    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            CookieManager.getInstance().flush();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.removeAllViews();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
