import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

import { IconCheck, IconShieldAlert, IconX, IconZap } from './Icons'

export interface ToastItem {
  id: string
  kind: 'success' | 'error' | 'warn' | 'info'
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warn: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ kind, title, message }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newItem: ToastItem = { id, kind, title, message }
      setToasts((prev) => [...prev, newItem])

      setTimeout(() => {
        removeToast(id)
      }, 4500)
    },
    [removeToast]
  )

  const success = useCallback((title: string, message?: string) => toast({ kind: 'success', title, message }), [toast])
  const error = useCallback((title: string, message?: string) => toast({ kind: 'error', title, message }), [toast])
  const warn = useCallback((title: string, message?: string) => toast({ kind: 'warn', title, message }), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warn }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.kind}`}>
            <div className="toast-icon">
              {t.kind === 'success' && <IconCheck size={18} />}
              {t.kind === 'error' && <IconShieldAlert size={18} />}
              {t.kind === 'warn' && <IconZap size={18} />}
              {t.kind === 'info' && <IconCheck size={18} />}
            </div>
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              {t.message && <div className="toast-msg">{t.message}</div>}
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              <IconX size={14} />
            </button>
            <div className="toast-progress" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast ToastProvider ichida chaqirilishi kerak')
  return ctx
}
