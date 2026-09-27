import type { PluginInfo } from '../api/plugin.ts'
import { t } from '../i18n/index.ts'

interface DetailsPageProps {
  info: PluginInfo | null
  lifecycle: 'active' | 'inactive'
}

export function DetailsPage({ info, lifecycle }: DetailsPageProps) {
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
