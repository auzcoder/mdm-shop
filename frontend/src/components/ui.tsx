import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { deviceStatusLabel, paymentStatusLabel } from '../lib/format'
import type { DeviceStatus, PaymentStatus } from '../lib/types'

export function Loading({ text = 'Yuklanmoqda…' }: { text?: string }) {
  return (
    <div className="loading">
      <span className="spinner" />
      {text}
    </div>
  )
}

export function Empty({
  icon = '∅',
  text,
  hint,
  action,
}: {
  icon?: ReactNode
  text: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-text">{text}</div>
      {hint && <div className="empty-hint">{hint}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

export function Alert({
  kind = 'info',
  children,
}: {
  kind?: 'error' | 'success' | 'warn' | 'info'
  children: ReactNode
}) {
  return <div className={`alert alert-${kind}`}>{children}</div>
}

const deviceBadgeClass: Record<DeviceStatus, string> = {
  pending: 'badge-pending',
  active: 'badge-active',
  locked: 'badge-locked',
  released: 'badge-released',
  lost: 'badge-lost',
}

export function DeviceBadge({ status }: { status: DeviceStatus }) {
  return (
    <span className={`badge ${deviceBadgeClass[status] ?? 'badge-released'}`}>
      {deviceStatusLabel[status] ?? status}
    </span>
  )
}

const paymentBadgeClass: Record<PaymentStatus, string> = {
  pending: 'badge-released',
  paid: 'badge-active',
  overdue: 'badge-locked',
  partial: 'badge-pending',
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge ${paymentBadgeClass[status] ?? 'badge-released'}`}>
      {paymentStatusLabel[status] ?? status}
    </span>
  )
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
  className = '',
}: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  className?: string
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal${wide ? ' wide' : ''}${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Tasdiqlash',
  cancelLabel = 'Bekor qilish',
  danger = false,
  isLoading = false,
  onConfirm,
  onClose,
}: {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <span className="spinner" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{message}</div>
    </Modal>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  // <label> butun maydonni o'raydi — matnni bosganda ichidagi input fokuslanadi
  // (implicit bog'lanish, qo'shimcha id shart emas).
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function Pagination({
  total,
  limit,
  offset,
  onChange,
}: {
  total: number
  limit: number
  offset: number
  onChange: (offset: number) => void
}) {
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)

  return (
    <div className="pagination">
      <span>
        {from}–{to} / {total} ta
      </span>
      <div className="btn-row">
        <button
          className="btn btn-sm"
          disabled={offset === 0}
          onClick={() => onChange(Math.max(0, offset - limit))}
        >
          ← Oldingi
        </button>
        <button
          className="btn btn-sm"
          disabled={offset + limit >= total}
          onClick={() => onChange(offset + limit)}
        >
          Keyingi →
        </button>
      </div>
    </div>
  )
}
