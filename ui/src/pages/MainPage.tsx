import type { PluginInfo } from '../api/plugin.ts'
import { t } from '../i18n/index.ts'

interface MainPageProps {
  info: PluginInfo | null
  lifecycle: 'active' | 'inactive'
  error: string
  onOpenDetails: () => void
}

export function MainPage({ info, lifecycle, error, onOpenDetails }: MainPageProps) {
  return (
    <main className="panel" data-surface-state={lifecycle}>
      <p className="eyebrow">{t('app.badge')}</p>
      <h1>{info?.name ?? t('app.title')}</h1>
      <p>{t('app.description')}</p>
      {info && <p className="meta">{info.id} · v{info.version} · {lifecycle}</p>}
      {error && <p role="alert" className="error">{t('app.backendError', { error })}</p>}
      <button type="button" onClick={onOpenDetails}>
        {t('app.openView')}
      </button>
      <p className="note">{t('app.note')}</p>
    </main>
  )
}
