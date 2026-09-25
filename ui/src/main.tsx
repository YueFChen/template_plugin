import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { createPluginHostClient } from '@wonderland/plugin-ui-sdk'

import './style.css'

const host = createPluginHostClient('template_plugin')

interface PluginInfo {
  id: string
  name: string
  version: string
}

function App() {
  const [info, setInfo] = useState<PluginInfo | null>(null)
  const [error, setError] = useState('')
  const [lifecycle, setLifecycle] = useState<'active' | 'inactive'>('inactive')
  const params = new URLSearchParams(window.location.search)
  const isDetailsView = params.get('wonderlandSurface') === 'view'
    && params.get('wonderlandContribution') === 'details'

  useEffect(() => {
    let disposed = false
    let stopTheme: () => void = () => {}
    let stopLifecycle: () => void = () => {}

    void host.followHostTheme(({ resolved }) => {
      document.documentElement.dataset.theme = resolved
    }).then((stop) => {
      if (disposed) stop()
      else stopTheme = stop
    })
    void host.onSurfaceLifecycle((state) => setLifecycle(state)).then((stop) => {
      if (disposed) stop()
      else stopLifecycle = stop
    })
    void host.call<PluginInfo>('get_info').then((result) => {
      if (!disposed) setInfo(result)
    }).catch((cause: unknown) => {
      if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
    })

    return () => {
      disposed = true
      stopTheme()
      stopLifecycle()
    }
  }, [])

  if (isDetailsView) {
    return (
      <main className="panel">
        <p className="eyebrow">CORE OWNED VIEW</p>
        <h1>插件详情</h1>
        <p>这个内容通过 manifest 注册为 Workspace 侧栏 View。侧栏容器、入口与显隐由 Core 管理。</p>
        <dl>
          <dt>插件 ID</dt><dd>{info?.id ?? '加载中…'}</dd>
          <dt>Surface</dt><dd>{lifecycle}</dd>
        </dl>
      </main>
    )
  }

  return (
    <main className="panel" data-surface-state={lifecycle}>
      <p className="eyebrow">WONDERLAND PLUGIN TEMPLATE</p>
      <h1>{info?.name ?? '插件模板'}</h1>
      <p>页面在独立插件包中构建，通过版本化 UI SDK 调用后端。</p>
      {info && <p className="meta">{info.id} · v{info.version} · {lifecycle}</p>}
      {error && <p role="alert" className="error">无法连接插件后端：{error}</p>}
      <button type="button" onClick={() => void host.openWorkspaceView('details')}>
        打开 Core 侧栏 View
      </button>
      <p className="note">移除不需要的示例集成或贡献，并按最小权限申请 Core 能力。</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
