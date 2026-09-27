import { useEffect, useState } from 'react'
import { host, pluginApi, type PluginInfo } from './api/plugin.ts'
import { DetailsPage } from './pages/DetailsPage.tsx'
import { MainPage } from './pages/MainPage.tsx'

export function App() {
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
    void pluginApi.getInfo().then((result) => {
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

  if (isDetailsView) return <DetailsPage info={info} lifecycle={lifecycle} />
  return (
    <MainPage
      info={info}
      lifecycle={lifecycle}
      error={error}
      onOpenDetails={() => void pluginApi.openDetails()}
    />
  )
}
