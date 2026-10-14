import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { MDMProviderStatus } from '../lib/types'

const PLATFORM_LABEL: Record<string, string> = { ios: 'iOS', android: 'Android', macos: 'macOS' }

// MDMBanner — markaziy MDM provayderi ishlamay turgan bo'lsa ogohlantiradi.
// "Mock (sinov) rejimi" — qurilmalar panelda "bloklandi" ko'rinsa ham haqiqatda
// bloklanmaydi, shuning uchun operator bundan xabardor bo'lishi shart.
export default function MDMBanner() {
  const { data } = useQuery({
    queryKey: ['system', 'mdm'],
    // Endpoint {providers: [...]} qaytaradi (bare massiv emas).
    queryFn: () => api.get<{ providers: MDMProviderStatus[] }>('/system/mdm'),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: false,
  })

  const providers = data?.providers
  if (!providers || providers.length === 0) return null

  // Android ataylab o'chirilgan (do'kon faqat iOS bilan ishlaydi), shuning uchun
  // kutilgan android-mock holati ogohlantirish chiqarmaydi — faqat haqiqiy
  // ulanish xatosi yoki iOS mock rejimi ko'rsatiladi.
  const problems = providers.filter((p) => !p.ready || (!p.real && p.platform !== 'android'))
  if (problems.length === 0) return null

  const hasError = problems.some((p) => !p.ready)
  const accent = hasError ? '220,38,38' : '217,119,6' // red | amber

  return (
    <div
      role="alert"
      style={{
        margin: '0 0 16px',
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.45,
        color: `rgb(${accent})`,
        background: `rgba(${accent}, 0.1)`,
        border: `1px solid rgba(${accent}, 0.3)`,
      }}
    >
      <strong>MDM ogohlantirishi:</strong>{' '}
      {problems
        .map((p) => {
          const label = PLATFORM_LABEL[p.platform] ?? p.platform
          const reason = !p.ready
            ? p.error
              ? `ulanmadi (${p.error})`
              : 'ulanmadi'
            : 'sinov (mock) rejimi — qurilmalar haqiqatda bloklanmaydi'
          return `${label}: ${reason}`
        })
        .join(' · ')}
    </div>
  )
}
