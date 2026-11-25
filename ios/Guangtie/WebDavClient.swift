import Foundation

/// 坚果云等 WebDAV：测试连接 / 下载 / 上传
struct WebDavClient {
    let server: String
    let user: String
    let pass: String
    let file: String

    private var base: URL? {
        var s = server.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.isEmpty { return nil }
        if !s.hasPrefix("http://") && !s.hasPrefix("https://") { s = "https://" + s }
        if !s.hasSuffix("/") { s += "/" }
        return URL(string: s)
    }

    private var target: URL? {
        guard let base = base else { return nil }
        var name = file.trimmingCharacters(in: .whitespacesAndNewlines)
        if name.isEmpty { name = "ledger.json" }
        let esc = name.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? name
        return URL(string: esc, relativeTo: base)
    }

    private func request(_ method: String, url: URL, body: Data?) -> URLRequest {
        var req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30)
        req.httpMethod = method
        if !user.isEmpty || !pass.isEmpty {
            let token = Data("\(user):\(pass)".utf8).base64EncodedString()
            req.setValue("Basic \(token)", forHTTPHeaderField: "Authorization")
        }
        req.setValue("广铁一号", forHTTPHeaderField: "User-Agent")
        if let body = body {
            req.httpBody = body
            req.setValue("application/json; charset=utf-8", forHTTPHeaderField: "Content-Type")
        }
        return req
    }

    func call(_ method: WebDavMethod, body: String, done: @escaping (Bool, String) -> Void) {
        guard let url = target else { done(false, "服务器地址无效"); return }
        let req: URLRequest
        switch method {
        case .test: req = request("HEAD", url: url, body: nil)
        case .get:  req = request("GET", url: url, body: nil)
        case .put:  req = request("PUT", url: url, body: Data(body.utf8))
        }
        URLSession.shared.dataTask(with: req) { data, response, error in
            if let error = error { done(false, Self.message(error)); return }
            guard let http = response as? HTTPURLResponse else { done(false, "无响应"); return }
            if (200...299).contains(http.statusCode) {
                if method == .get {
                    done(true, String(data: data ?? Data(), encoding: .utf8) ?? "")
                } else {
                    done(true, "ok")
                }
                return
            }
            done(false, Self.message(code: http.statusCode, data: data))
        }.resume()
    }

    private static func message(code: Int, data: Data?) -> String {
        switch code {
        case 401: return "账号或密码不对"
        case 403: return "没有权限"
        case 404: return "云端还没有备份文件"
        case 409: return "目录不存在"
        case 507: return "云端空间不足"
        default:
            if let d = data, let s = String(data: d, encoding: .utf8), !s.isEmpty, s.count < 120 {
                return "HTTP \(code)"
            }
            return "HTTP \(code)"
        }
    }

    private static func message(_ error: Error) -> String {
        let ns = error as NSError
        switch ns.code {
        case NSURLErrorNotConnectedToInternet: return "没有网络"
        case NSURLErrorTimedOut: return "连接超时"
        case NSURLErrorCannotFindHost: return "找不到服务器"
        case NSURLErrorSecureConnectionFailed: return "证书错误"
        case NSURLErrorUserAuthenticationRequired: return "需要登录"
        default: return "网络错误 \(ns.code)"
        }
    }
}
