# Wonderland 插件标准结构

本文按当前 Core 的 manifest v2、`wonderland-plugin` stdio-NDJSON v1、UI Bridge 和插件服务实现编写。模板先给出能运行的最小骨架；下面的可扩展目录按功能需要新增，不要求预先建空目录。

## 推荐目录

```text
my_plugin/
├─ .github/workflows/ci.yml       # 元数据、格式、lint、测试、构建
├─ package/
│  ├─ manifest.json               # 插件身份、兼容范围、UI 入口、权限和服务声明
│  └─ contract.json               # 后端方法、事件及 JSON Schema
├─ scripts/
│  ├─ init-plugin.mjs              # 由模板初始化插件身份
│  ├─ validate-template.mjs        # 检查元数据和入口一致性
│  ├─ build-plugin.mjs             # 构建 UI/backend 并组装安装包
│  └─ debug-plugin.mjs             # 在 Core 开发环境运行
├─ src/
│  ├─ main.rs                      # 协议启动、插件常量和模块装配
│  ├─ commands.rs                  # contract 方法分派、参数解析和错误映射
│  ├─ domain/                      # 业务规则、模型和纯逻辑；按需创建
│  ├─ storage/                     # 用户数据读写、版本迁移；按需创建
│  └─ services/                    # Core 服务调用或外部服务适配；按需创建
├─ tests/
│  ├─ fixtures/                    # 稳定的小型测试样本
│  └─ *.rs                         # 跨模块/协议行为测试
├─ ui/
│  └─ src/
│     ├─ main.tsx                  # React 挂载和全局样式
│     ├─ App.tsx                   # 宿主生命周期与页面选择
│     ├─ api/                      # UI Bridge 与后端调用封装
│     ├─ pages/                    # Activity、View 等页面
│     ├─ features/                 # 按业务域拆分的交互模块；按需创建
│     ├─ components/               # 可复用 UI 组件；按需创建
│     ├─ i18n/                     # 文案和本地化
│     └─ style.css                 # 主题令牌和插件局部样式
├─ mcp/                            # 可选的 Agent/MCP 适配器，独立进程
├─ Cargo.toml / Cargo.lock
├─ package.json / pnpm-lock.yaml
├─ README.md / LICENSE / NOTICE.md
└─ rust-toolchain.toml
```

当前模板实际包含 `src/main.rs`、`src/commands.rs`、`ui/src/App.tsx`、`ui/src/api/plugin.ts` 和两个示例页面；业务增长后再引入 `domain/`、`storage/`、`features/` 等模块。小插件不需要照搬全部目录。

## 文件职责和数据流

1. Core 读取包根目录的 `manifest.json` 和 `contract.json`，检查身份、兼容性、贡献点、能力请求、服务声明和接口 schema。
2. Core 启动 manifest 指定的后端可执行文件，通过 stdin/stdout 交换 NDJSON 协议帧。`src/main.rs` 调用 SDK 的 `serve`；stdout 只能用于协议，日志和诊断写 stderr。
3. UI 的 `api/` 使用 `@wonderland/plugin-ui-sdk` 调用 contract 方法、订阅事件、读取主题/生命周期和请求打开 View。UI 不直接调用 Tauri 命令，也不导入 Core 的 React 状态。
4. Rust 命令入口只校验/解析输入、调用领域逻辑并映射结果。较大的功能把业务规则放在不依赖 UI 的模块中，便于单测和其他适配器复用。
5. `build-plugin.mjs` 只把 manifest、contract、编译后的 `ui/`、后端 `backend/` 和校验和组装进安装包。源代码、密钥、测试数据和开发缓存不进入安装包。

## Manifest、Contract 和 UI

- `manifestVersion` 当前必须为 `2`；ID 使用小写字母开头的字母、数字、`_` 或 `-`，发布后保持稳定。
- `hostCompatibility`、后端 protocol 和 UI bridge 兼容范围应覆盖真实测试过的 Core 版本，不要随意写宽。
- 每个面向用户的插件声明一个 Activity。侧栏工具等辅助入口声明 View，并使用 `workspace.sidebar` integration。
- `integrations` 和 `capabilities` 不是装饰字段：只声明代码确实使用的集成和宿主能力。模板默认能力为空。
- `contract.json` 给每个后端方法定义参数、返回值和超时。输入对象设置 `additionalProperties: false`，字符串、数组、整数及响应体设置合理上限；版本变化要同步 UI API、后端实现和测试。
- 长任务使用协议 request ID、进度事件和 `__cancel`；不要阻塞整个分派器的状态，也不要把无限制任务超时写进接口。
- UI 通过 `followHostTheme`、`onSurfaceLifecycle` 等 Bridge 方法接入宿主状态。页面按 Activity/View 拆分；业务功能增长时再按 feature 拆组件，避免所有状态和调用都堆在 `main.tsx`。
- manifest 中的 UI 命令由 Core CLI 按插件/贡献点路由；通过 UI Bridge 的 `onCommand` 处理，并把只读和有副作用的命令分别标注 `read_only` / `mutating`。这不等同于 Agent/MCP 接口。

## 权限、数据和网络边界

当前 Core 认可的宿主能力如下。能力只控制插件对 **Core 提供的服务** 的调用：

| 能力 | Core 服务 | 适用场景 |
| --- | --- | --- |
| `account.read` | `core.account.snapshot` | 读取当前账号摘要 |
| `account.authed_get` | `core.account.authed_get` | 使用已登录会话请求受支持的账号接口 |
| `network.public` | `core.network.public` | 经 Core 发起公共 HTTP 请求 |
| `network.model` | `core.network.model` | 经 Core 调用模型服务；当前还要求 `secrets.plugin` |
| `secrets.plugin` | `core.secrets.plugin.*` | 读写插件自己的密钥 |
| `files.pick` | `core.files.pick`、`core.files.read` | 让用户选文件并读取已选择文件 |
| `files.export` | `core.files.export`、`core.files.export_dir` | 通过 Core 导出文件 |
| `files.reveal_own` | `core.files.reveal_own` | 在文件管理器中显示该插件允许展示的目录 |
| `browser.open_official` | `core.browser.open_official` | 打开 Core 认可的官方链接 |
| `services.call` | `core.services.resolve`、`core.services.invoke` | 调用 manifest `requires` 中声明的其他插件服务 |

**这不是进程沙箱。** 当前后端以用户身份运行；能力授权不会阻止后端自行访问操作系统文件或直接联网。即使使用 `network.public`，它也只门控 Core 的 HTTP 服务，不是对插件进程所有网络出口的强制限制。安装前仍应审阅来源和代码。

- Core 通过 `WONDERLAND_PLUGIN_DATA_DIR` 给后端提供该插件的持久数据目录。持久状态写在该目录下，不写入安装目录、临时目录或 Core 源码树。
- 插件负责自己的数据 schema 版本、迁移、损坏恢复、导出和删除说明。不要把令牌/密码放入普通配置文件；需要凭据时用 `secrets.plugin`。
- 用户数据目录与安装包版本分离；升级应兼容已有数据。删除插件数据可能不可逆，UI/文档应说明会删除什么。
- `files.pick` / `files.export` 是 Core 提供的受控文件交互，不会把插件整个进程限制在所选文件范围内。
- 申请权限前先考虑是否可由用户选择文件、Core 服务或插件服务完成。一个 capability 应对应真实功能，避免把未使用权限放在模板默认清单里。

## 插件互操作和 Agent 接入

- Core 插件间服务用 manifest 顶层的 `provides` 与 `requires` 声明稳定服务 ID、版本和方法，并在 contract 中定义方法 schema。消费者还需要 `services.call` 授权；Core 只允许调用已声明且兼容的服务方法。
- `provides/requires` 是 Wonderland Core 插件之间的协议，不会自动变成 Codex、PI 或其他 Agent 的 MCP 工具。
- 若功能需要直接提供给 Agent，可增加可选 `mcp/` 适配器作为独立可执行程序，复用 `domain/` 业务层并对外提供明确的只读/有副作用工具。MCP 进程和 Core 插件后端是不同协议入口，分别配置、打包和测试。
- 当前 Core manifest 没有声明或托管 MCP server 的字段；模板不会假定 Core 自动启动该适配器。需要的 Agent 客户端应由用户配置可执行文件及参数。之后 Core 若增加受管理的 MCP 集成，再更新模板。

## 仓库、依赖与验证

- 插件是独立 Git 仓库和独立版本；`plugins/<id>` 是 Core 开发布局，不表示插件并入 Core 的 Cargo/pnpm workspace，也不应在 Core 仓库里提交插件仓库文件。
- 当前 SDK 与 UI 依赖通过相对路径链接到 Core checkout，因此模板能在 Core 的 `plugins/` 下开发和 CI 构建。**当前模板不能脱离匹配版本的 Core checkout 独立编译**；将 SDK/UI 发布到版本化注册源后，才适合完全独立 clone/build。
- 改动接口时至少运行 `pnpm run validate`、`cargo fmt --all -- --check`、`cargo clippy --all-targets --locked -- -D warnings`、`cargo test --locked`、`pnpm typecheck` 和 `pnpm build`。Core 集成 CI 另外验证创建新插件、开发运行和 release package。
- 当前模板发布目标是 Windows x86_64 MSVC。新增平台要同步处理 Cargo target、manifest 平台、打包后端文件名、CI runner 和安装检查。
