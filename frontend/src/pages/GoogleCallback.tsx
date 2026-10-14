import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { consumeOAuthState, googleRedirectUri } from '../lib/googleAuth'
import { Alert, Field } from '../components/ui'

export default function GoogleCallback() {
  const navigate = useNavigate()
  const { googleLogin, googleMFA } = useAuth()

  const [error, setError] = useState('')
  const [mfaToken, setMfaToken] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const ran = useRef(false)

  useEffect(() => {
    // Authorization code bir martalik — StrictMode ikki marta chaqirmasin.
    if (ran.current) return
    ran.current = true

    const params = new URLSearchParams(window.location.search)
    const authCode = params.get('code')
    const state = params.get('state')
    const oauthErr = params.get('error')

    // Code'ni URL'dan darhol tozalaymiz (keshga/tarixga tushmasin).
    window.history.replaceState(null, '', '/google/oauth/callback')

    if (oauthErr) {
      setError('Google kirishi bekor qilindi.')
      return
    }
    if (!authCode || !state || !consumeOAuthState(state)) {
      setError('Kirish seansi yaroqsiz. Iltimos, qaytadan urinib ko‘ring.')
      return
    }

    // Do'kon paneli har doim o'z domenini yuboradi (parol login bilan bir xil).
    googleLogin(authCode, googleRedirectUri(), window.location.hostname)
      .then((res) => {
        if (res.mfaRequired && res.mfaToken) {
          setMfaToken(res.mfaToken)
        } else {
          navigate('/', { replace: true })
        }
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Google orqali kirishda xatolik yuz berdi.'))
  }, [googleLogin, navigate])

  async function onMfaSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await googleMFA(mfaToken, code)
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Kod noto‘g‘ri. Qaytadan urinib ko‘ring.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        {mfaToken ? (
          <>
            <div className="login-title" style={{ fontSize: 16 }}>Ikki bosqichli tasdiqlash</div>
            <div className="login-sub">Authenticator yoki tiklash kodini kiriting</div>
            <form className="login-form" onSubmit={onMfaSubmit}>
              {error && <Alert kind="error">{error}</Alert>}
              <Field label="Authenticator yoki tiklash kodi">
                <input
                  className="input"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  maxLength={24}
                  autoFocus
                />
              </Field>
              <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 6, height: 42 }}>
                {busy && <span className="spinner" />}
                {busy ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
              </button>
            </form>
          </>
        ) : error ? (
          <>
            <div className="login-title" style={{ fontSize: 16 }}>Kirib bo‘lmadi</div>
            <Alert kind="error">{error}</Alert>
            <Link className="btn btn-primary" to="/login" replace style={{ marginTop: 12, height: 42, textDecoration: 'none' }}>
              Kirish sahifasiga qaytish
            </Link>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
            <span className="spinner" />
            <div className="login-sub" style={{ margin: 0 }}>Google orqali kirilmoqda…</div>
          </div>
        )}
      </div>
    </div>
  )
}
