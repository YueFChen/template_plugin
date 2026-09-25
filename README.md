# Wonderland Plugin Template

这是 Wonderland 动态插件的公开起步模板仓库。它只包含一个最小可运行插件、插件 SDK/UI 用法示例和独立构建工具；Core 应用、其他插件和运行数据不属于本仓库。

## 创建插件仓库

将本模板仓库检出到 Core checkout 的 `plugins/template_plugin`。在 Core 根目录运行创建命令，它会复制模板到 `plugins/<plugin-id>`，同步插件元数据、安装依赖、校验结构并初始化一个新的 Git 仓库。源模板不会被修改，Core 也不会把新插件加入自身的 Cargo 或 pnpm workspace。

```powershell
pnpm run create:plugin -- --id my_plugin --name "我的插件" --author "作者名"
```

如果模板仓库没有放在默认路径，可以指定本地目录或 Git 仓库地址：

```powershell
pnpm run create:plugin -- --template .\path\to\template --id my_plugin --name "我的插件" --author "作者名"
pnpm run create:plugin -- --template "https://github.com/<owner>/<repo>.git" --id my_plugin --name "我的插件" --author "作者名"
```

创建命令不会提交初始 Git commit 或配置远端。确认生成内容后，在新插件目录自行提交并按需添加远端。

## 开发与调试

创建成功后，插件仓库位于 `plugins/my_plugin`。以下命令从 Core 根目录执行：

```powershell
pnpm --dir .\plugins\my_plugin run validate
pnpm --dir .\plugins\my_plugin run debug
```

`debug` 会构建 UI 和后端，再启动 Core 开发版。Core 只在 debug 构建读取开发包路径；安装时仍校验 manifest、contract、兼容性和包文件，并自动启用和启动开发插件。请先关闭现有 Core 开发版。修改代码后重新运行调试命令；当前不支持插件热重载。

Core 当前默认关闭动态插件 UI，直到 WebView 隔离原型通过验证。需要试用 UI 时，可显式启用实验模式：

```powershell
pnpm --dir .\plugins\my_plugin run debug:ui
```

实验模式只对 debug Core 设置 `WONDERLAND_PLUGIN_UI_ISOLATION_TEST=1`；release 构建仍忽略该开关。标准调试模式可验证插件后端，实验模式才会加载隔离 iframe 中的 UI。

## 目录与接口

- `package/manifest.json` 声明插件身份、兼容范围、UI 入口、贡献点和所需能力。manifest 使用严格 schema，不要添加未定义字段。
- `package/contract.json` 声明 UI 可调用的后端方法和数据结构；修改接口时同步更新 Rust 实现。
- `src/` 是独立 Rust 后端，通过 `wonderland-plugin-sdk` 接入 Core。标准输出只写协议帧，诊断写到标准错误。
- `ui/` 是独立 React 应用，通过 UI Bridge SDK 调用后端和宿主服务；不要直接调用 Tauri 命令。依赖共享主题时使用 Core 的主题令牌。
- Activity 是 Workspace 主工作区入口；View 是 Core 承载的辅助视图。入口和容器均由 Core 管理。
- `capabilities` 约束插件通过 Core SDK 调用的宿主服务。插件后端仍以当前用户权限运行，Core 不提供操作系统沙箱；安装者应审阅插件代码。

## 构建与发布

环境要求：Windows x86_64 MSVC、Node.js 24、pnpm 11、Rust 1.98.1，以及位于 Core checkout `plugins/<plugin-id>` 下的插件仓库。模板当前只构建 Windows x86_64 插件。

```powershell
pnpm typecheck
pnpm build
pnpm run package:plugin
```

- `pnpm build` 生成 `target/dev-package`，供 Core 插件管理中的手动安装使用。
- `pnpm run package:plugin` 生成优化后的 `.wplug` 与 SHA-256 校验清单。
- `pnpm run validate` 检查 manifest、contract、Cargo/npm 元数据和包入口的一致性。

插件版本遵循 SemVer。SHA-256 清单用于发现包内容不一致，不代表发布者身份，也不是代码安全证明；模板不使用发布签名。作者信息记录在 Cargo/npm 元数据和 `NOTICE.md` 中，不写入当前不接受 `author` 字段的 manifest。

模板内容采用 Apache-2.0 许可。生成插件后请按需要更新插件许可证，并保留模板材料的署名通知。

## CI

CI 会先做独立的元数据检查。配置仓库变量 `WONDERLAND_CORE_REPOSITORY` 为 Core 的 `owner/name` 后，Windows 集成任务会在 `plugins/template_plugin` 布局中构建和检查插件；私有 Core 仓库还需配置可读取它的 `WONDERLAND_CORE_CHECKOUT_TOKEN` Secret。
