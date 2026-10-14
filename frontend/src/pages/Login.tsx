import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { googleEnabled, startGoogleLogin } from '../lib/googleAuth'
import { useTheme } from '../lib/theme'
import { normalizePhone } from '../lib/mask'
import { PhoneInput } from '../components/PhoneInput'
import { IconMoon, IconSmartphone, IconSun, IconUsers } from '../components/Icons'
import { Alert, Field } from '../components/ui'
import logoImg from '../assets/logo.png'

export default function Login() {
  const { user, login } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Login mode: 'email' or 'phone'
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+998 ')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [brand, setBrand] = useState<{ project_name: string; logo_url?: string | null } | null>(null)
  // Google ulangan bo'lsa asosiy kirish o'sha; parol forma yashirin turadi.
  const googleOn = googleEnabled()
  const [showPassword, setShowPassword] = useState(!googleOn)

  useEffect(() => {
    api.get<{ project_name: string; logo_url?: string | null }>('/public/shop', { domain: window.location.hostname }).then(setBrand).catch(() => undefined)
  }, [])

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)

    let identifier = ''
    if (loginMode === 'email') {
      identifier = email.trim()
      if (!identifier) {
        setError('Iltimos, elektron pochta manzilingizni kiriting')
        setBusy(false)
        return
      }
    } else {
      const normalized = normalizePhone(phone)
      if (normalized.length !== 13) {
        setError('Iltimos, to‘liq 9 xonali telefon raqamini kiriting (+998 XX XXX XX XX)')
        setBusy(false)
        return
      }
      identifier = normalized
    }

    try {
      await login(identifier, password, window.location.hostname)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kirishda xatolik yuz berdi. Parol yoki loginni tekshiring.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Tungi rejimga o‘tish' : 'Kunduzgi rejimga o‘tish'}
          aria-label="Rejimni almashtirish"
        >
          {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
        </button>
      </div>

      <div className="login-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20, textAlign: 'center' }}>
          <img
            src={brand?.logo_url || logoImg}
            alt={brand?.project_name || 'Qora daftar'}
            style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 10, borderRadius: 12 }}
          />
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.2 }}>
            {brand?.project_name || 'Qora daftar'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.04em', marginTop: 2 }}>
            Boshqaruvi
          </div>
        </div>

        <div className="login-title" style={{ fontSize: 16 }}>Tizimga kirish</div>
        <div className="login-sub">Nasiya va qurilmalar xavfsizligini boshqarish paneli</div>
        <p className="login-sub">Do‘kon uchun berilgan hisob bilan kiring. Markaziy administrator uchun <a href="https://apple.tayyor.app">markaziy panel</a>.</p>

        {googleOn && (
          <div style={{ marginTop: 6 }}>
            <button
              type="button"
              className="btn"
              onClick={startGoogleLogin}
              style={{
                width: '100%', height: 44, gap: 10, background: 'var(--surface, #fff)',
                color: 'var(--text)', border: '1px solid var(--border, #e2e8f0)', fontWeight: 600,
              }}
            >
              <GoogleG />
              Google orqali kirish
            </button>
            {!showPassword && (
              <button
                type="button"
                onClick={() => { setShowPassword(true); setError('') }}
                style={{
                  width: '100%', marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted, #64748b)', fontSize: 13, fontWeight: 600,
                }}
              >
                Parol bilan kirish
              </button>
            )}
            {showPassword && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 4px', color: 'var(--muted, #94a3b8)', fontSize: 12 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--border, #e2e8f0)' }} />
                yoki parol bilan
                <span style={{ flex: 1, height: 1, background: 'var(--border, #e2e8f0)' }} />
              </div>
            )}
          </div>
        )}

        {!showPassword ? null : (<>
        {/* Login Method Tabs */}
        <div className="tab-nav" style={{ marginBottom: 18, marginTop: 4 }}>
          <button
            type="button"
            className={`tab-btn ${loginMode === 'email' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('email')
              setError('')
            }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <IconUsers size={14} />
            Email orqali
          </button>
          <button
            type="button"
            className={`tab-btn ${loginMode === 'phone' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('phone')
              setError('')
            }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <IconSmartphone size={14} />
            Telefon raqam orqali
          </button>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          {error && <Alert kind="error">{error}</Alert>}

          {loginMode === 'email' ? (
            <Field label="Elektron pochta manzili">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sunicode.uz"
                autoComplete="email"
                required
                autoFocus
              />
            </Field>
          ) : (
            <Field label="Telefon raqami (+998 XX XXX XX XX)">
              <PhoneInput
                value={phone}
                onChange={setPhone}
                required
                autoFocus
              />
            </Field>
          )}

          <Field label="Maxfiy parol">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>

          <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 6, height: 42 }}>
            {busy && <span className="spinner" />}
            {busy ? 'Tekshirilmoqda…' : 'Kirish'}
          </button>
        </form>
        </>)}
      </div>
    </div>
  )
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
