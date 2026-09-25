> This is an independently versioned plugin repository. Local builds use the stable Core SDK from the adjacent `Wonderland_Assistant` checkout; see [Core repository boundaries](../../Wonderland_Assistant/docs/REPOSITORY-BOUNDARIES.md).

# Wonderland 插件模板

这是符合当前动态插件边界的可运行起点：manifest v2、独立构建的 UI、版本化 UI Bridge SDK、Rust stdio 后端和声明式 contract。Core 不静态导入模板代码。

## 构建和调试

在仓库根目录执行：

```powershell
pnpm build
```

生成目录包：`target/template-plugin`。使用 Trae 的 **Core：运行桌面应用** debug 配置，在“设置 → 插件管理”安装这个目录。模板申请 `theme.followHost` 与 `workspace.sidebar` UI 集成，不申请后端能力。

插件主页面会直接填满 Core 提供的内容 Surface。请让插件根页面背景保持透明，以显示 Core 的自定义背景；插件自身需要的卡片和输入面板再使用共享主题令牌绘制。Activity 与 View 都运行在隔离 iframe 中，主题明暗通过 UI SDK 同步。

模板包含一个 Workspace 主 Activity 和一个由 Core 承载的辅助 Sidebar View。工作区只显示主 Activity 一个工具入口；主页面通过 `openWorkspaceView` 打开详情侧栏。Activity 调用后端 `get_info`，并演示主题跟随与 Surface lifecycle。侧栏框架、入口和显隐仍归 Core 管理；插件只提供内容。

## 复制后必须修改

复制到新的 `plugins/<plugin_id>` 后，使用合法且唯一的插件 ID 替换 `template_plugin`，并同步修改：

- `package/manifest.json` 的 `id`、名称、版本、贡献 ID 与 UI 集成声明。
- `package/contract.json` 中的常量和业务方法。
- `src/main.rs` 中的 `PLUGIN_ID`、名称、版本与后端实现。
- `Cargo.toml` package name 与独立版本、UI package name，以及构建脚本中的源码目录和可执行文件名。
- `scripts/build-plugin.mjs` 的构建入口和输出目录，或为新插件建立独立构建入口。

保留 manifest v2 的严格结构；新插件不要加入旧路由字段或适配层。只保留实际使用的 UI integrations 与贡献，不需要侧栏 View 时删除 `workspace.sidebar`、View 声明和相关 UI 代码。`Home` 是 Core 品牌入口，不用于注册插件功能。按最小权限填写 `capabilities`；模板默认不申请任何文件、网络、账号或密钥能力。

当前构建入口只打包 Windows x86_64 MSVC。模板目录用于开发，不包含发布签名；release Core 仍要求符合 P2 的签名策略。安装、授权与 WebView 隔离的验收步骤见[开发环境与 Trae 调试指南](../../Wonderland_Assistant/docs/开发环境与Trae调试指南.md)。
