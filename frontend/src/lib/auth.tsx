import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { api, request, tokens } from './api'
import type { Role, User } from './types'

interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

interface GoogleLoginResponse extends Partial<LoginResponse> {
  mfa_required?: boolean
  mfa_token?: string
}

export interface GoogleLoginResult {
  mfaRequired: boolean
  mfaToken?: string
}

const SHOP_ONLY_ERROR =
  'Bu markaziy administrator hisobi. Do‘kon uchun yaratilgan superuser emaili bilan kiring. Markaziy panel: apple.tayyor.app'

interface AuthValue {
  user: User | null
  login: (email: string, password: string, domain?: string) => Promise<void>
  googleLogin: (code: string, redirectUri: string, domain?: string) => Promise<GoogleLoginResult>
  googleMFA: (mfaToken: string, code: string) => Promise<void>
  logout: () => Promise<void>
  can: (...roles: Role[]) => boolean
  /** Do'kon uchun modul/funksiya yoqilganmi. Backend baribir enforce qiladi;
   *  bu faqat UI (nav/tugmalarni yashirish) uchun. Features yuklanmaguncha
   *  true qaytaradi (yoqilgan modul miltillab yashirinmasligi uchun). */
  hasFeature: (key: string) => boolean
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = tokens.user() as User | null
    if (saved && (String(saved.role) === 'platform_admin' || !saved.shop_id)) {
      tokens.clear()
      return null
    }
    return saved
  })

  const login = useCallback(async (email: string, password: string, domain?: string) => {
    const data = await api.post<LoginResponse>('/auth/login', { email, password, domain })
    if (String(data.user.role) === 'platform_admin' || !data.user.shop_id) {
      tokens.clear()
      setUser(null)
      throw new Error('Bu markaziy administrator hisobi. Do‘kon uchun yaratilgan superuser emaili va paroli bilan kiring. Markaziy panel: apple.tayyor.app')
    }
    tokens.set(data.access_token, data.refresh_token, data.user)
    setUser(data.user)
  }, [])

  // skipAuth: login 401 qaytarsa odatiy refresh+redirect o'rniga xatoni ko'rsatamiz.
  const googleLogin = useCallback(async (code: string, redirectUri: string, domain?: string): Promise<GoogleLoginResult> => {
    const data = await request<GoogleLoginResponse>('/auth/google', {
      method: 'POST',
      body: { code, redirect_uri: redirectUri, domain },
      skipAuth: true,
    })
    if (data.mfa_required) {
      return { mfaRequired: true, mfaToken: data.mfa_token }
    }
    if (!data.user || String(data.user.role) === 'platform_admin' || !data.user.shop_id) {
      tokens.clear()
      setUser(null)
      throw new Error(SHOP_ONLY_ERROR)
    }
    tokens.set(data.access_token!, data.refresh_token!, data.user)
    setUser(data.user)
    return { mfaRequired: false }
  }, [])

  const googleMFA = useCallback(async (mfaToken: string, code: string) => {
    const data = await request<LoginResponse>('/auth/google/mfa', {
      method: 'POST',
      body: { mfa_token: mfaToken, code },
      skipAuth: true,
    })
    if (String(data.user.role) === 'platform_admin' || !data.user.shop_id) {
      tokens.clear()
      setUser(null)
      throw new Error(SHOP_ONLY_ERROR)
    }
    tokens.set(data.access_token, data.refresh_token, data.user)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Server javob bermasa ham lokal sessiyani tozalaymiz.
    }
    tokens.clear()
    setUser(null)
  }, [])

  const can = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  )

  // Yoqilgan modullar — /auth/me dan. null = hali yuklanmadi.
  const [features, setFeatures] = useState<Record<string, boolean> | null>(null)
  useEffect(() => {
    if (!user) {
      setFeatures(null)
      return
    }
    let cancelled = false
    api
      .get<{ features?: Record<string, boolean> }>('/auth/me')
      .then((d) => {
        if (!cancelled) setFeatures(d.features ?? {})
      })
      .catch(() => {
        // Yuklanmasa UI'ni ochiq qoldiramiz (fail-open); backend enforce qiladi.
        if (!cancelled) setFeatures(null)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const hasFeature = useCallback(
    (key: string) => {
      if (!user) return false
      if (String(user.role) === 'platform_admin') return true
      if (!features) return true // hali yuklanmadi — yashirmaymiz
      return features[key] !== false
    },
    [user, features],
  )

  const value = useMemo(
    () => ({ user, login, googleLogin, googleMFA, logout, can, hasFeature }),
    [user, login, googleLogin, googleMFA, logout, can, hasFeature],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider ichida chaqirilishi kerak')
  return ctx
}
