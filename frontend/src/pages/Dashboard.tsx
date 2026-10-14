import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import './Dashboard.css'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { actionLabel, dateTime, reasonLabel, sum } from '../lib/format'
import type { AttentionItem, AuditEntry, DailyReport, DashboardStats } from '../lib/types'
import { CollectionGauge, DonutChart3D } from '../components/Analytics3D'
import {
  IconActivity,
  IconBarChart,
  IconCreditCard,
  IconHistory,
  IconLock,
  IconSmartphone,
  IconUnlock,
  IconUsers,
  IconZap,
} from '../components/Icons'
import { Alert, Empty, Loading } from '../components/ui'
import { useToast } from '../components/Toast'

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

function Kpi({ label, value, hint, icon, tone }: { label: string; value: string | number; hint?: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className={`kpi-card kpi-${tone}`}>
      <div className="kpi-top">
        <span className="kpi-icon">{icon}</span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { can, user } = useAuth()
  const qc = useQueryClient()
  const { success, error } = useToast()
  const [report, setReport] = useState<DailyReport | null>(null)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  })
  const { data: activity } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => api.get<{ items: AuditEntry[] }>('/dashboard/activity', { limit: 10 }),
  })
  const { data: attention } = useQuery({
    queryKey: ['operations', 'attention'],
    queryFn: () => api.get<{ items: AttentionItem[] }>('/operations/attention', { limit: 12 }),
  })

  const runJob = useMutation({
    mutationFn: () => api.post<DailyReport>('/jobs/daily'),
    onSuccess: (data) => {
      setReport(data)
      success('Kunlik job bajarildi', `Kechikkan: ${data.marked_overdue}, bloklandi: ${data.devices_locked}`)
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['devices'] })
    },
    onError: () => error('Xatolik', 'Kunlik jobni ishga tushirib bo‘lmadi'),
  })

  if (isLoading) return <Loading />
  if (!stats)
    return (
      <div style={{ padding: '48px 0' }}>
        <Empty icon="⚠️" text="Ma’lumotni yuklab bo‘lmadi. Internet aloqasini tekshirib, sahifani yangilang." />
      </div>
    )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 18 ? 'Xayrli kun' : 'Xayrli kech'
  const firstName = (user?.full_name || '').split(' ')[0]
  const now = new Date()
  const dateLabel = `${now.getDate()}-${UZ_MONTHS[now.getMonth()]}, ${now.getFullYear()}`

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h1>Boshqaruv paneli</h1>
          <p className="dash-sub">{greeting}{firstName ? `, ${firstName}` : ''} · {dateLabel}</p>
        </div>
        {can('admin') && (
          <button className="btn btn-primary" onClick={() => runJob.mutate()} disabled={runJob.isPending}>
            {runJob.isPending ? <span className="spinner" /> : <IconZap size={16} />}
            Kunlik jobni qo‘lda yurgizish
          </button>
        )}
      </div>

      {report && (
        <Alert kind="success">
          Kunlik tekshiruv yakunlandi — kechikkan deb belgilandi: {report.marked_overdue}, eslatma: {report.reminders_sent}, bloklandi: {report.devices_locked}, xatolar: {report.lock_failures} ({report.duration})
        </Alert>
      )}

      <div className="kpi-grid">
        <Kpi label="Faol qurilmalar" value={stats.active_devices} hint={`Jami ${stats.total_devices} ta ro‘yxatda`} icon={<IconSmartphone size={17} />} tone="emerald" />
        <Kpi label="Bloklangan" value={stats.locked_devices} hint="To‘lov kechikishi sababli" icon={<IconLock size={17} />} tone="rose" />
        <Kpi label="Kechikkan to‘lovlar" value={stats.overdue_payments} hint={`Bu hafta muddati: ${stats.due_this_week} ta`} icon={<IconCreditCard size={17} />} tone="amber" />
        <Kpi label="Kutilayotgan qarz" value={sum(stats.outstanding_amount)} hint={`Yig‘ilgan: ${sum(stats.collected_amount)}`} icon={<IconActivity size={17} />} tone="blue" />
      </div>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <h2><IconBarChart size={17} style={{ color: 'var(--primary)' }} /> Qurilmalar holati va yig‘im</h2>
            <Link to="/devices" className="btn btn-ghost btn-sm">Barchasi →</Link>
          </div>
          <div className="panel-body">
            <DonutChart3D stats={stats} />
            <div style={{ marginTop: 20 }}>
              <CollectionGauge collected={stats.collected_amount} outstanding={stats.outstanding_amount} />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2><IconActivity size={17} style={{ color: '#f59e0b' }} /> Diqqat kerak</h2>
            {!!attention?.items?.length && <span className="badge badge-warning plain">{attention.items.length} ta</span>}
          </div>
          {!attention?.items?.length ? (
            <div className="panel-body"><Empty text="Hammasi joyida — diqqat talab qiladigan holat yo‘q." /></div>
          ) : (
            <div className="panel-body attention-scroll">
              <div className="activity-feed">
                {attention.items.map((item, idx) => (
                  <div className="activity-row" key={`${item.kind}-${item.device_id ?? ''}-${item.payment_id ?? ''}-${item.command_id ?? ''}-${idx}`}>
                    <div className="activity-icon-wrap" style={{ background: item.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: item.severity === 'high' ? '#ef4444' : '#f59e0b' }}>
                      {item.kind === 'overdue_payment' ? <IconCreditCard size={16} /> : <IconSmartphone size={16} />}
                    </div>
                    <div className="activity-main">
                      <div className="activity-header">
                        <span className="activity-action-name">{item.title}</span>
                        {item.device_id && <Link to={`/devices/${item.device_id}`} className="badge badge-info plain" style={{ fontSize: 11 }}>Qurilma #{item.device_id}</Link>}
                        {item.payment_id && <Link to={`/payments/${item.payment_id}`} className="badge badge-warning plain" style={{ fontSize: 11 }}>To‘lov #{item.payment_id}</Link>}
                      </div>
                      <div className="activity-meta">{item.message}{item.amount ? ` · ${sum(item.amount)}` : ''}</div>
                    </div>
                    <div className="activity-time">{item.due_date ? dateTime(item.due_date) : item.last_seen_at ? dateTime(item.last_seen_at) : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2><IconHistory size={17} style={{ color: 'var(--primary)' }} /> So‘nggi tizim amallari</h2>
          <Link to="/audit" className="btn btn-ghost btn-sm">Audit jurnali →</Link>
        </div>
        <div className="panel-body">
          {!activity?.items?.length ? (
            <Empty text="Hozircha amallar yo‘q" />
          ) : (
            <div className="activity-feed">
              {activity.items.map((entry) => {
                const isUnlock = entry.action === 'unlock' || entry.action.includes('restore')
                const isLock = entry.action === 'lock' || entry.action.includes('delete') || entry.action.includes('archive') || entry.action === 'erase'
                const isJob = entry.action === 'daily_job'
                const isPayment = entry.action === 'payment' || entry.action === 'contract_create'
                const isEnroll = entry.action === 'enroll_token' || entry.action === 'enrolled'
                const iconBg = isUnlock ? 'rgba(34, 197, 94, 0.15)' : isLock ? 'rgba(239, 68, 68, 0.15)' : isJob ? 'rgba(6, 182, 212, 0.15)' : isPayment ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)'
                const iconColor = isUnlock ? '#22c55e' : isLock ? '#ef4444' : isJob ? '#06b6d4' : isPayment ? '#a855f7' : '#3b82f6'
                return (
                  <div className="activity-row" key={entry.id}>
                    <div className="activity-icon-wrap" style={{ background: iconBg, color: iconColor }}>
                      {isUnlock ? <IconUnlock size={16} /> : isLock ? <IconLock size={16} /> : isJob ? <IconZap size={16} /> : isPayment ? <IconCreditCard size={16} /> : isEnroll ? <IconSmartphone size={16} /> : <IconActivity size={16} />}
                    </div>
                    <div className="activity-main">
                      <div className="activity-header">
                        <span className="activity-action-name">{actionLabel[entry.action] ?? entry.action}</span>
                        {entry.device_id && <Link to={`/devices/${entry.device_id}`} className="badge badge-info plain" style={{ fontSize: 11 }}>Qurilma #{entry.device_id}</Link>}
                        {entry.reason && <span className="badge-subtle">{reasonLabel[entry.reason] ?? entry.reason}</span>}
                      </div>
                      <div className="activity-meta">
                        <span className="activity-actor"><IconUsers size={12} />{entry.user_email || 'Tizim (avtomatik)'}</span>
                      </div>
                    </div>
                    <div className="activity-time">{dateTime(entry.created_at)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
