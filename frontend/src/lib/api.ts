const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

const ACCESS_KEY = 'ps.access'
const REFRESH_KEY = 'ps.refresh'
const USER_KEY = 'ps.user'

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const tokens = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  user: () => {
    const user = safeParseJSON(localStorage.getItem(USER_KEY), null)
    if (!user) localStorage.removeItem(USER_KEY)
    return user
  },
  set(access: string, refresh: string, user: unknown) {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

// Bir vaqtda bir nechta 401 kelsa — bitta refresh so'rovi yuboriladi.
let refreshing: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refresh = tokens.refresh()
  if (!refresh) return false

  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!res.ok) return false
      const data = await res.json()
      tokens.set(data.access_token, data.refresh_token, data.user)
      return true
    } catch {
      return false
    } finally {
      // Keyingi 401 uchun yangi urinishga ruxsat beramiz.
      setTimeout(() => {
        refreshing = null
      }, 0)
    }
  })()

  return refreshing
}

interface RequestOptions {
  method?: string
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  skipAuth?: boolean
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = {}
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
    const access = tokens.access()
    if (access && !opts.skipAuth) headers.Authorization = `Bearer ${access}`

    return fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  }

  let res = await send()

  if (res.status === 401 && !opts.skipAuth && (await tryRefresh())) {
    res = await send()
  }

  if (res.status === 401 && !opts.skipAuth) {
    tokens.clear()
    window.location.href = '/login'
    throw new ApiError(401, 'unauthorized', 'Sessiya tugadi, qayta kiring')
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = safeParseJSON<Record<string, unknown> | null>(text, null)

  if (!res.ok) {
    throw new ApiError(
      res.status,
      typeof data?.error === 'string' ? data.error : 'unknown',
      typeof data?.message === 'string' ? data.message : text || `So'rov xatosi (${res.status})`,
    )
  }

  return data as T
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export async function downloadFile(path: string, filename: string, query?: RequestOptions['query']) {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  const headers: Record<string, string> = {}
  const access = tokens.access()
  if (access) headers.Authorization = `Bearer ${access}`

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) {
    throw new ApiError(res.status, 'download_failed', `Faylni yuklab bo'lmadi (${res.status})`)
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

/**
 * Opens the device event stream.
 *
 * EventSource cannot send an Authorization header, and putting the JWT in the
 * URL would leak it into proxy access logs. Instead we exchange the access
 * token for a short-lived, single-use ticket and connect with that.
 */
export async function openDeviceEventStream(): Promise<EventSource> {
  const { ticket } = await api.post<{ ticket: string }>('/events/ticket')
  const url = new URL(`${BASE}/events/devices`, window.location.origin)
  url.searchParams.set('ticket', ticket)
  return new EventSource(url.toString())
}
