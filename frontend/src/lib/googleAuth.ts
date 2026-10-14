// Google OAuth (Authorization Code) — panelga "Google orqali kirish".
//
// client_id ommaviy (maxfiy emas) va build vaqtida beriladi. Maxfiy
// client_secret faqat backendda. Bu yerda biz foydalanuvchini Google'ga
// yo'naltiramiz; qaytib kelgach GoogleCallback sahifasi code'ni backendga
// uzatadi.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const STATE_KEY = 'ps.oauth_state'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

// googleEnabled — client_id berilmagan bo'lsa tugma ko'rsatilmaydi.
export function googleEnabled(): boolean {
  return typeof CLIENT_ID === 'string' && CLIENT_ID.length > 0
}

// googleRedirectUri — joriy domen uchun callback manzili. Google konsolidagi
// "Authorized redirect URIs" ro'yxatiga aynan shu qo'shilishi kerak.
export function googleRedirectUri(): string {
  return `${window.location.origin}/google/oauth/callback`
}

// startGoogleLogin — CSRF state yaratib, foydalanuvchini Google'ga yo'naltiradi.
export function startGoogleLogin(): void {
  if (!CLIENT_ID) return
  const state = randomState()
  try {
    sessionStorage.setItem(STATE_KEY, state)
  } catch {
    // sessionStorage bo'lmasa ham davom etamiz; backend baribir redirect_uri
    // va code'ni tekshiradi.
  }
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
    include_granted_scopes: 'true',
  })
  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`
}

// consumeOAuthState — qaytib kelgan state saqlangan bilan mos kelishini
// tekshiradi (bir martalik).
export function consumeOAuthState(received: string): boolean {
  try {
    const saved = sessionStorage.getItem(STATE_KEY)
    sessionStorage.removeItem(STATE_KEY)
    return saved !== null && saved.length > 0 && saved === received
  } catch {
    return false
  }
}

function randomState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
