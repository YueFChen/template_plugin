import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { createPluginHostClient } from '@wonderland/plugin-ui-sdk'
import { t } from './i18n/index.ts'

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
        <p className="eyebrow">{t('view.badge')}</p>
        <h1>{t('view.title')}</h1>
        <p>{t('view.description')}</p>
        <dl>
          <dt>{t('view.pluginId')}</dt><dd>{info?.id ?? t('status.loading')}</dd>
          <dt>{t('view.surface')}</dt><dd>{lifecycle}</dd>
        </dl>
      </main>
    )
  }

  return (
    <main className="panel" data-surface-state={lifecycle}>
      <p className="eyebrow">{t('app.badge')}</p>
      <h1>{info?.name ?? t('app.title')}</h1>
      <p>{t('app.description')}</p>
      {info && <p className="meta">{info.id} · v{info.version} · {lifecycle}</p>}
      {error && <p role="alert" className="error">{t('app.backendError', { error })}</p>}
      <button type="button" onClick={() => void host.openWorkspaceView('details')}>
        {t('app.openView')}
      </button>
      <p className="note">{t('app.note')}</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
