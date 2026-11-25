import UIKit
import WebKit
import UniformTypeIdentifiers

final class WebViewController: UIViewController {

    private var webView: WKWebView!
    private let assetHost = "appassets"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.043, green: 0.043, blue: 0.071, alpha: 1)

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.setURLSchemeHandler(AssetSchemeHandler(), forURLScheme: assetHost)
        config.userContentController.add(self, name: "dsh")
        config.userContentController.addUserScript(WKUserScript(
            source: NativeShim.source, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let wv = WKWebView(frame: view.bounds, configuration: config)
        wv.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        wv.navigationDelegate = self
        wv.uiDelegate = self
        wv.scrollView.bounces = false
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        wv.isOpaque = true
        wv.backgroundColor = view.backgroundColor
        if #available(iOS 16.4, *) { wv.isInspectable = true }
        view.addSubview(wv)
        webView = wv

        if let url = URL(string: "\(assetHost)://local/index.html") {
            wv.load(URLRequest(url: url))
        }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return statusDark ? .darkContent : .lightContent
    }
    private var statusDark = false

    private var statusBarHeight: CGFloat {
        let top = view.window?.safeAreaInsets.top ?? 0
        return top > 0 ? top : 20
    }
}

// MARK: - Native bridge

enum WebDavMethod: String {
    case test, get, put
}

extension WebViewController: WKScriptMessageHandler, WKUIDelegate, WKNavigationDelegate {

    func webView(_ webView: WKWebView,
                 runJavaScriptTextInputPanelWithPrompt prompt: String,
                 defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (String?) -> Void) {
        // 同步取值：JS 侧用 prompt('__dsh:xxx') 拿到结果
        let key = prompt.replacingOccurrences(of: "__dsh:", with: "")
        switch key {
        case "dark":
            completionHandler(traitCollection.userInterfaceStyle == .dark ? "1" : "0")
        case "sat":
            completionHandler(String(format: "%.1f", statusBarHeight))
        default:
            completionHandler(nil)
        }
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let op = body["op"] as? String else { return }

        switch op {
        case "theme":
            let v = body["v"] as? String ?? "system"
            switch v {
            case "light": overrideUserInterfaceStyle = .light
            case "dark": overrideUserInterfaceStyle = .dark
            default: overrideUserInterfaceStyle = .unspecified
            }
            setNeedsStatusBarAppearanceUpdate()

        case "bg":
            if let hex = body["v"] as? String, let c = UIColor(hex: hex) {
                view.backgroundColor = c
                webView.backgroundColor = c
            }

        case "bar":
            if let hex = body["v"] as? String, let c = UIColor(hex: hex) {
                statusDark = !c.isLight
                setNeedsStatusBarAppearanceUpdate()
            }

        case "haptic":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()

        case "webdav":
            let id = body["id"] as? String ?? ""
            let method = WebDavMethod(rawValue: body["method"] as? String ?? "test") ?? .test
            let server = body["server"] as? String ?? ""
            let user = body["user"] as? String ?? ""
            let pass = body["pass"] as? String ?? ""
            let file = body["file"] as? String ?? ""
            let data = body["body"] as? String ?? ""
            WebDavClient(server: server, user: user, pass: pass, file: file)
                .call(method, body: data) { [weak self] ok, text in
                    self?.eval("window.__netCb && window.__netCb('\(id)', \(ok), \(Self.jsString(text)));")
                }

        case "export":
            let name = body["name"] as? String ?? "广铁一号.json"
            let mime = body["mime"] as? String ?? "application/octet-stream"
            let text = body["text"] as? String ?? ""
            exportFile(name: name, mime: mime, text: text)

        case "import":
            importFile()

        case "widget":
            break

        default:
            break
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        eval("document.dispatchEvent(new Event('nativeReady'));")
    }

    // MARK: helpers

    private func eval(_ js: String) {
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    private static func jsString(_ s: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: [s], options: [])
        guard let data = data,
              let str = String(data: data, encoding: .utf8),
              str.count >= 2 else { return "\"\"" }
        return String(str.dropFirst().dropLast())
    }

    private func exportFile(name: String, mime: String, text: String) {
        let safeName = name.replacingOccurrences(of: "/", with: "-")
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(safeName)
        do {
            try text.data(using: .utf8)?.write(to: url)
        } catch {
            eval("window.__exportDone && window.__exportDone(false, '保存失败');")
            return
        }
        let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        sheet.completionWithItemsHandler = { [weak self] _, completed, _, _ in
            self?.eval("window.__exportDone && window.__exportDone(\(completed ? "true" : "false"), \(Self.jsString(completed ? "已导出" : "已取消")));")
        }
        present(sheet, animated: true)
    }

    private func importFile() {
        let picker: UIDocumentPickerViewController
        if #available(iOS 14.0, *) {
            picker = UIDocumentPickerViewController(forOpeningContentTypes: [.item, .text, .data], asCopy: true)
        } else {
            picker = UIDocumentPickerViewController(documentTypes: ["public.data"], in: .import)
        }
        picker.allowsMultipleSelection = false
        picker.delegate = self
        present(picker, animated: true)
    }
}

// MARK: - Document picker

extension WebViewController: UIDocumentPickerDelegate {
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else { return }
        let ok = url.startAccessingSecurityScopedResource()
        defer { if ok { url.stopAccessingSecurityScopedResource() } }
        guard let data = try? Data(contentsOf: url),
              let text = String(data: data, encoding: .utf8) else {
            eval("window.__importDone && window.__importDone(false, '读取失败');")
            return
        }
        eval("window.__importDone && window.__importDone(true, \(Self.jsString(text)));")
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        eval("window.__importDone && window.__importDone(false, '已取消');")
    }
}

// MARK: - UIColor helpers

extension UIColor {
    convenience init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if s.hasPrefix("#") { s.removeFirst() }
        if s.count == 3 {
            s = s.map { "\($0)\($0)" }.joined()
        }
        guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        self.init(red: CGFloat((v >> 16) & 0xFF) / 255,
                  green: CGFloat((v >> 8) & 0xFF) / 255,
                  blue: CGFloat(v & 0xFF) / 255,
                  alpha: 1)
    }

    var isLight: Bool {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        getRed(&r, green: &g, blue: &b, alpha: &a)
        return (0.299 * r + 0.587 * g + 0.114 * b) > 0.6
    }
}
