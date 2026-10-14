import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** compact — sahifa ichiga joylashganда (butun ekran emas). */
  compact?: boolean
}

interface State {
  error: Error | null
}

// ErrorBoundary — render paytidagi kutilmagan xatoni ushlaydi va butun ilova
// "oq ekran" bo'lib qolishining oldini oladi. Foydalanuvchiga tushunarli
// xabar va qayta urinish tugmasini ko'rsatadi.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Konsolga yozamiz — diagnostika uchun (foydalanuvchiga ko'rinmaydi).
    console.error('UI xatosi:', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  private reload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    const compact = this.props.compact
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: compact ? '50vh' : '100vh',
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 16,
            padding: '28px 24px',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
            Nimadir xato ketdi
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted, #64748b)', lineHeight: 1.5, marginBottom: 18 }}>
            Sahifani ko‘rsatishda kutilmagan xatolik yuz berdi. Qayta urinib ko‘ring; muammo
            takrorlansa sahifani yangilang.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={this.reset}>
              Qayta urinish
            </button>
            <button className="btn btn-secondary" onClick={this.reload}>
              Sahifani yangilash
            </button>
          </div>
        </div>
      </div>
    )
  }
}
