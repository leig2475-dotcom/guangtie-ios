# 广铁一号 · iOS 版（免费路线：GitHub Actions + SideStore）

界面和逻辑完全复用 `assets/`，这里是原生外壳：WKWebView + 本地资源 + `window.Native` 兼容层。
所以改动 Android 端的 `assets/app.js`、`styles.css` 后，iOS 版重新跑一次 workflow 就是同一套界面。

## 一、出包（不需要 Mac）

1. 注册 GitHub（免费），新建一个**公开**仓库（公开仓库的 macOS runner 不计费）。
2. 把整个 `ledger2` 目录推上去，确保包含 `ios/`、`assets/`、`.github/workflows/ios.yml`。
3. 打开仓库 → Actions → 左侧 `build-ipa` → Run workflow。
4. 等 3~5 分钟跑完，在该次运行页面底部下载 artifact `guangtie-ipa`，解压得到 `广铁一号.ipa`。
5. 把 ipa 传到 iPhone（隔空投送、iCloud Drive、或微信文件传到「文件」App 都行）。

## 二、用 SideStore 安装（免费 Apple ID）

准备工作只需做一次，需要一个 Windows 或 Mac：

1. 电脑安装 [SideStore 官方文档](https://sidestore.io/) 里的依赖（Windows 需要 iTunes 和 iCloud，装完用 AltServer 把 SideStore 装到手机）。
2. 打开手机上的 SideStore，按提示导入配对文件（电脑上生成，一次即可）。
3. 手机装 StosVPN（App Store 免费），在 SideStore 里连上，这样续签不用连电脑。

之后装 App：

1. SideStore → My Apps → 右上角 `+` → 选择刚才的 `广铁一号.ipa`。
2. 输入你的 Apple ID（免费账号即可），等待签名安装完成。
3. 每 7 天在 SideStore 里点一次 Refresh（开着 StosVPN 可以自动刷新）。

> 免费账号限制：同时最多 3 个自签 App，证书 7 天有效；不支持 App Group，所以 iOS 版暂时没有桌面小组件。

## 三、第一次打开的注意事项

- App 数据存在 WKWebView 的本地存储里，SideStore 续签不会清数据。
- 换过来先在 Android 端「导出备份」，把 json 传到 iPhone，再在 iOS 版「导入数据」；
  或者两端都配好坚果云 WebDAV，直接「从云端恢复」。
- 底部导航在 iOS 上是贴底的，没有 PWA 那层系统玻璃条。

## 四、怎么改

- 界面/逻辑：改 `assets/`（与 Android 共用）。
- 原生能力：`ios/Guangtie/` 下
  - `WebViewController.swift`：桥接（主题、状态栏、震动、导出、导入）
  - `WebDavClient.swift`：坚果云同步
  - `AssetSchemeHandler.swift`：本地资源服务 + `window.Native` 注入
- 版本号：`ios/project.yml` 里的 `CFBundleShortVersionString` / `CFBundleVersion`。
