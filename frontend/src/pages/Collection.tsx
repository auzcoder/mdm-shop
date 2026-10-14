import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { date, sum } from '../lib/format'
import type { CollectionItem, CollectionReport } from '../lib/types'
import { Empty, Loading, PaymentBadge } from '../components/ui'
import { useToast } from '../components/Toast'
import { IconAlertTriangle, IconClock, IconCreditCard, IconPhone, IconSmartphone } from '../components/Icons'

function overdueColor(days: number): string {
  if (days <= 7) return '#d97706'
  if (days <= 30) return '#ea580c'
  return '#dc2626'
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="stat-3d">
      <div className="stat-3d-glow" />
      <div className="stat-3d-header">
        <span className="stat-3d-label">{label}</span>
        <div className="stat-3d-icon">{icon}</div>
      </div>
      <div className="stat-3d-val">{value}</div>
    </div>
  )
}

export default function Collection() {
  const { can, hasFeature } = useAuth()
  const { success, error } = useToast()
  const qc = useQueryClient()
  const [remindingId, setRemindingId] = useState<number | null>(null)
  const canRemind = can('admin', 'operator', 'accountant')

  const { data, isLoading } = useQuery({
    queryKey: ['collection'],
    queryFn: () => api.get<CollectionReport>('/reports/collection'),
    refetchInterval: 60_000,
  })

  const remind = useMutation({
    mutationFn: (paymentId: number) => api.post(`/payments/${paymentId}/remind`),
    onMutate: (id: number) => setRemindingId(id),
    onSuccess: () => {
      success('Eslatma yuborildi', 'Mijozga SMS yuborildi')
      void qc.invalidateQueries({ queryKey: ['audit'] })
    },
    onError: (err) => error('Yuborilmadi', err instanceof ApiError ? err.message : 'Eslatma yuborib bo‘lmadi'),
    onSettled: () => setRemindingId(null),
  })

  if (isLoading) return <Loading />
  if (!data)
    return (
      <div style={{ padding: '48px 0' }}>
        <Empty icon="⚠️" text="Ma’lumotni yuklab bo‘lmadi. Internet aloqasini tekshirib, sahifani yangilang." />
      </div>
    )

  const { items, buckets } = data

  return (
    <div style={{ width: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Qarzdorlik (Collection)</h1>
          <p className="page-sub">Muddati o‘tgan to‘lovlar — eng eski birinchi</p>
        </div>
      </div>

      {/* Umumiy ko‘rsatkichlar */}
      <div className="grid grid-stats" style={{ marginBottom: 18 }}>
        <StatCard label="Umumiy qarzdorlik" value={sum(data.total_outstanding)} icon={<IconAlertTriangle size={18} />} />
        <StatCard label="Kechikkan to‘lov" value={String(data.overdue_count)} icon={<IconCreditCard size={18} />} />
        <StatCard label="Qarzdor qurilma" value={String(data.device_count)} icon={<IconSmartphone size={18} />} />
      </div>

      {/* Aging (kechikish davri bo‘yicha) */}
      <div className="grid grid-stats" style={{ marginBottom: 18 }}>
        {buckets.map((b) => (
          <StatCard key={b.label} label={`${b.label} · ${b.count} ta`} value={sum(b.amount)} icon={<IconClock size={18} />} />
        ))}
      </div>

      {/* Ro‘yxat */}
      <div className="card">
        <div className="table-wrap">
          <table className="table table-cards">
            <thead>
              <tr>
                <th>Mijoz</th>
                <th>Qurilma</th>
                <th>Muddat</th>
                <th style={{ textAlign: 'center' }}>Kechikish</th>
                <th style={{ textAlign: 'right' }}>Qarz</th>
                <th>Holat</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Empty text="Kechikkan to‘lov yo‘q — barcha mijozlar muddatida" />
                  </td>
                </tr>
              ) : (
                items.map((it: CollectionItem) => (
                  <tr key={it.payment_id}>
                    <td data-label="Mijoz">
                      <Link to={`/devices/${it.device_id}`} className="cell-strong" style={{ textDecoration: 'none' }}>
                        {it.customer_name || '—'}
                      </Link>
                      <div className="cell-faint" style={{ fontSize: 12 }}>{it.customer_phone || '—'}</div>
                    </td>
                    <td data-label="Qurilma">{it.device_model || '—'}</td>
                    <td data-label="Muddat">{date(it.due_date)}</td>
                    <td data-label="Kechikish" style={{ textAlign: 'center' }}>
                      <span
                        className="badge"
                        style={{ color: overdueColor(it.days_overdue), background: `${overdueColor(it.days_overdue)}1a`, fontWeight: 700 }}
                      >
                        {it.days_overdue} kun
                      </span>
                    </td>
                    <td data-label="Qarz" style={{ textAlign: 'right', fontWeight: 600 }}>{sum(it.outstanding)}</td>
                    <td data-label="Holat"><PaymentBadge status="overdue" /></td>
                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                      {canRemind && hasFeature('sms_reminder') && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => remind.mutate(it.payment_id)}
                          disabled={remindingId === it.payment_id || !it.customer_phone}
                          title={it.customer_phone ? 'Mijozga SMS eslatma yuborish' : 'Telefon raqami yo‘q'}
                        >
                          {remindingId === it.payment_id ? <span className="spinner" /> : <IconPhone size={14} />}
                          Eslatma
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
