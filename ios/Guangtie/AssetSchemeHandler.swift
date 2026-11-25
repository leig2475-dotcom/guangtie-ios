import Foundation
import WebKit

/// 把内置 assets 目录当作 https 站点一样提供给 WebView
final class AssetSchemeHandler: NSObject, WKURLSchemeHandler {

    private static let mime: [String: String] = [
        "html": "text/html; charset=utf-8",
        "js": "text/javascript; charset=utf-8",
        "css": "text/css; charset=utf-8",
        "json": "application/json; charset=utf-8",
        "webmanifest": "application/manifest+json; charset=utf-8",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "gif": "image/gif",
        "svg": "image/svg+xml",
        "ttf": "font/ttf",
        "woff2": "font/woff2",
        "txt": "text/plain; charset=utf-8"
    ]

    private lazy var root: URL? = {
        Bundle.main.url(forResource: "assets", withExtension: nil)
    }()

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(NSError(domain: "assets", code: 400))
            return
        }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let rel = path.removingPercentEncoding ?? path
        guard let root = root else {
            urlSchemeTask.didFailWithError(NSError(domain: "assets", code: 404))
            return
        }
        let file = root.appendingPathComponent(rel.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
        guard let data = try? Data(contentsOf: file) else {
            urlSchemeTask.didFailWithError(NSError(domain: "assets", code: 404))
            return
        }
        let ext = file.pathExtension.lowercased()
        let type = AssetSchemeHandler.mime[ext] ?? "application/octet-stream"
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                       headerFields: [
                                        "Content-Type": type,
                                        "Content-Length": String(data.count),
                                        "Access-Control-Allow-Origin": "*",
                                        "Cache-Control": "no-cache"
                                       ])!
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}

/// 注入到页面的 window.Native 兼容层，让 Android 版 app.js 原样复用
enum NativeShim {
    static let source = #"""
(function () {
  if (window.__iosShim) return;
  window.__iosShim = true;
  function post(o) { try { window.webkit.messageHandlers.dsh.postMessage(o); } catch (e) {} }
  function ask(cmd) { try { return String(prompt('__dsh:' + cmd) || ''); } catch (e) { return ''; } }
  var N = {
    systemDark: function () { return ask('dark') === '1'; },
    statusBarHeight: function () { return parseFloat(ask('sat')) || 0; },
    setTheme: function (v) { post({ op: 'theme', v: String(v || 'system') }); },
    setStatusColor: function (c) { post({ op: 'bar', v: String(c || '') }); },
    setBg: function (c) { post({ op: 'bg', v: String(c || '') }); },
    haptic: function () { post({ op: 'haptic' }); },
    setWidgetData: function (j) { post({ op: 'widget', v: String(j || '') }); },
    webdav: function (id, method, server, user, pass, file, body) {
      post({ op: 'webdav', id: String(id), method: String(method), server: String(server || ''),
             user: String(user || ''), pass: String(pass || ''), file: String(file || ''),
             body: String(body || '') });
    },
    exportFile: function (name, mime, text) {
      post({ op: 'export', name: String(name || ''), mime: String(mime || ''), text: String(text || '') });
    },
    importFile: function () { post({ op: 'import' }); }
  };
  window.Native = N;
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (window.__sysTheme) window.__sysTheme();
    });
  } catch (e) {}
})();
"""#
}
