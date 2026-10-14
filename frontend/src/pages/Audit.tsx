import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api, downloadFile } from '../lib/api'
import { useAuth } from '../lib/auth'
import { actionLabel, dateTime, platformLabel, reasonLabel } from '../lib/format'
import type { AuditEntry, ListResponse } from '../lib/types'
import {
  IconActivity,
  IconAndroid,
  IconApple,
  IconCheck,
  IconCreditCard,
  IconHistory,
  IconInfo,
  IconLock,
  IconRefresh,
  IconShieldCheck,
  IconSmartphone,
  IconTerminal,
  IconTrash,
  IconUnlock,
  IconUsers,
} from '../components/Icons'
import { Empty, Loading, Modal, Pagination } from '../components/ui'
import { useToast } from '../components/Toast'

const LIMIT = 50

const ACTION_GROUPS = [
  { value: 'entity_update', label: 'Oldingi va yangi qiymatlar' },
  { value: 'command_acknowledged', label: 'Qurilma tasdiqlagan buyruqlar' },
  { value: 'command_failed', label: 'Qurilma rad etgan buyruqlar' },
  { value: 'api_request', label: 'API amallari va ko‘rishlar' },
  { value: '', label: 'Barcha amallar' },
  { value: 'lock', label: '🔒 Bloklash' },
  { value: 'unlock', label: '🔓 Ochish' },
  { value: 'release', label: '🛡️ Chiqarish' },
  { value: 'erase', label: '🗑️ Tozalash (Wipe)' },
  { value: 'payment', label: '💳 To‘lov qabul qilish' },
  { value: 'contract_create', label: '📄 Shartnoma tuzish' },
  { value: 'contract_reschedule', label: '📅 Grafik tahriri' },
  { value: 'penalty_waive', label: '⚠️ Penya bekor qilish' },
  { value: 'penalty_restore', label: '⚠️ Penya qayta yoqish' },
  { value: 'enrolled', label: '📱 Qurilma ulandi' },
  { value: 'enroll_token', label: '🔑 Ulanish QR/Token yaratildi' },
  { value: 'daily_job', label: '⚙️ Kunlik avtomatik tekshiruv' },
  { value: 'device_create', label: '📱 Yangi qurilma qo‘shildi' },
  { value: 'customer_create', label: '👤 Yangi mijoz qo‘shildi' },
  { value: 'login', label: '🔑 Tizimga kirish' },
]

export default function Audit() {
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const { can } = useAuth()
  const { error } = useToast()
  // Eksport admin/operator/buxgalter uchun; to'liq backup faqat admin uchun.
  const canExport = can('admin', 'operator', 'accountant')
  const canBackup = can('admin')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit', { action, offset }],
    queryFn: () => api.get<ListResponse<AuditEntry>>('/audit', { action, limit: LIMIT, offset }),
  })

  const handleExport = async () => {
    try {
      await downloadFile('/exports/audit.csv', 'audit.csv', { action })
    } catch (err) {
      error('Yuklab bo‘lmadi', err instanceof Error ? err.message : 'CSV eksport amalga oshmadi')
    }
  }

  const handleBackup = async () => {
    try {
      await downloadFile('/exports/backup.zip', 'phone-seller-backup.zip')
    } catch (err) {
      error('Yuklab bo‘lmadi', err instanceof Error ? err.message : 'Backup yuklab bo‘lmadi')
    }
  }

  // Client-side search filter for instantaneous search across model, customer, email, reason
  const filteredItems = (data?.items || []).filter((item) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    const actionText = (actionLabel[item.action] || item.action).toLowerCase()
    const reasonText = (reasonLabel[item.reason || ''] || item.reason || '').toLowerCase()
    const userText = (item.user_email || item.user_name || '').toLowerCase()
    const deviceText = (item.device_model || item.device_imei || '').toLowerCase()
    const custText = (item.customer_name || '').toLowerCase()
    const idText = String(item.device_id || '')

    return (
      actionText.includes(q) ||
      reasonText.includes(q) ||
      userText.includes(q) ||
      deviceText.includes(q) ||
      custText.includes(q) ||
      idText.includes(q)
    )
  })

  const getActionBadge = (a: string) => {
    switch (a) {
      case 'lock':
        return {
          icon: <IconLock size={14} />,
          badgeClass: 'badge-danger',
          label: 'Bloklash',
        }
      case 'unlock':
        return {
          icon: <IconUnlock size={14} />,
          badgeClass: 'badge-success',
          label: 'Ochish',
        }
      case 'release':
        return {
          icon: <IconShieldCheck size={14} />,
          badgeClass: 'badge-info',
          label: 'Chiqarish',
        }
      case 'erase':
        return {
          icon: <IconTrash size={14} />,
          badgeClass: 'badge-danger',
          label: 'Tozalash',
        }
      case 'payment':
        return {
          icon: <IconCreditCard size={14} />,
          badgeClass: 'badge-success',
          label: 'To‘lov',
        }
      case 'contract_create':
        return {
          icon: <IconCreditCard size={14} />,
          badgeClass: 'badge-info',
          label: 'Shartnoma',
        }
      case 'enrolled':
      case 'enroll_token':
        return {
          icon: <IconSmartphone size={14} />,
          badgeClass: 'badge-purple',
          label: 'Ulanish (MDM)',
        }
      case 'daily_job':
        return {
          icon: <IconActivity size={14} />,
          badgeClass: 'badge-info plain',
          label: 'Kunlik job',
        }
      case 'login':
        return {
          icon: <IconUsers size={14} />,
          badgeClass: 'badge-info plain',
          label: 'Kirish',
        }
      default:
        return {
          icon: <IconTerminal size={14} />,
          badgeClass: 'badge-info plain',
          label: actionLabel[a] || a,
        }
    }
  }

  const getReasonBadge = (r: string | null) => {
    if (!r) return <span className="cell-faint">—</span>
    switch (r) {
      case 'overdue':
        return <span className="badge badge-danger plain">Qarzdorlik</span>
      case 'paid':
        return <span className="badge badge-success plain">To‘lov</span>
      case 'manual':
        return <span className="badge badge-info plain">Qo‘lda</span>
      case 'system':
        return <span className="badge badge-purple plain">Tizim</span>
      default:
        return <span className="badge badge-info plain">{reasonLabel[r] || r}</span>
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Audit jurnali</h1>
            <span className="badge badge-info plain">Xavfsizlik va Voqealar</span>
          </div>
          <div className="page-desc">
            Tizimdagi barcha amallar, qurilmalarni bloklash/ochish, to‘lovlar va avtomatik joblar tarixi
          </div>
        </div>

        <div className="btn-row">
          {canExport && (
            <button type="button" className="btn btn-secondary" onClick={handleExport}>
              CSV export
            </button>
          )}
          {canBackup && (
            <button type="button" className="btn btn-secondary" onClick={handleBackup}>
              Backup ZIP
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <IconRefresh size={16} className={isFetching ? 'spin' : ''} />
            Yangilash
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="card">
        <div className="card-head">
          <div className="filters" style={{ flex: 1, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="input search"
              placeholder="F.I.Sh, Email, Model, IMEI yoki ID bo‘yicha qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 280, flex: 1 }}
            />

            <select
              className="input"
              style={{ width: 'auto', minWidth: 200 }}
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setOffset(0)
              }}
            >
              {ACTION_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : !filteredItems.length ? (
          <Empty
            icon="📜"
            text="Audit yozuvlari topilmadi"
            hint={search || action ? 'Qidiruv yoki amal filtrini o‘zgartiring.' : 'Tizimdagi amallar shu yerda ko‘rinadi.'}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Vaqt</th>
                    <th>Amal</th>
                    <th>Sabab</th>
                    <th>Qurilma / Obyekt</th>
                    <th>Mijoz</th>
                    <th>Ijrochi (Kim bajargan)</th>
                    <th style={{ textAlign: 'right' }}>Tafsilot</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((a) => {
                    const badge = getActionBadge(a.action)
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedEntry(a)}
                        style={{ cursor: 'pointer' }}
                        className="clickable-row"
                        title="Batafsil ma’lumotni ochish uchun bosing"
                      >
                        {/* ID */}
                        <td className="cell-faint mono" style={{ fontSize: 12 }}>
                          #{a.id}
                        </td>

                        {/* Created At */}
                        <td>
                          <div className="cell-strong" style={{ fontSize: 13 }}>
                            {dateTime(a.created_at)}
                          </div>
                        </td>

                        {/* Action */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span className={`badge ${badge.badgeClass}`}>
                              {badge.icon}
                              {actionLabel[a.action] || badge.label}
                            </span>
                          </div>
                        </td>

                        {/* Reason */}
                        <td>{getReasonBadge(a.reason)}</td>

                        {/* Device / Target */}
                        <td>
                          {a.device_id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 6,
                                  background: 'var(--surface-2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: a.device_platform === 'ios' ? 'var(--text)' : '#10b981',
                                }}
                              >
                                {a.device_platform === 'ios' ? <IconApple size={14} /> : <IconAndroid size={14} />}
                              </div>
                              <div>
                                <Link
                                  to={`/devices/${a.device_id}`}
                                  className="cell-strong mono"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ color: 'var(--primary)', textDecoration: 'none' }}
                                >
                                  {a.device_model || `Qurilma #${a.device_id}`}
                                </Link>
                                <div className="cell-faint mono" style={{ fontSize: 11 }}>
                                  ID: #{a.device_id} {a.device_imei ? `· ${a.device_imei}` : ''}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="cell-faint">Tizim darajasida</span>
                          )}
                        </td>

                        {/* Customer */}
                        <td>
                          {a.customer_name ? (
                            <div className="cell-dim" style={{ fontSize: 13 }}>
                              {a.customer_name}
                            </div>
                          ) : (
                            <span className="cell-faint">—</span>
                          )}
                        </td>

                        {/* Actor (User / System) */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="cell-strong" style={{ fontSize: 13 }}>
                              {a.user_email ? a.user_email : '🤖 Tizim (Job)'}
                            </span>
                            {a.user_name && (
                              <span className="cell-faint" style={{ fontSize: 11.5 }}>
                                {a.user_name} {a.user_role ? `(${a.user_role})` : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action view button */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEntry(a)
                            }}
                            title="Tafsilotlarni ko‘rish"
                          >
                            <IconInfo size={15} /> Tafsilot
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="card-foot">
              <Pagination
                total={data?.total ?? 0}
                limit={LIMIT}
                offset={offset}
                onChange={setOffset}
              />
            </div>
          </>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedEntry && (
        <AuditDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  )
}

function AuditDetailModal({
  entry,
  onClose,
}: {
  entry: AuditEntry
  onClose: () => void
}) {
  const { success } = useToast()
  const [copied, setCopied] = useState(false)

  // Parse meta payload safely
  let metaJsonString = ''
  let parsedMeta: Record<string, unknown> | null = null

  if (entry.meta) {
    try {
      if (typeof entry.meta === 'string') {
        try { parsedMeta = JSON.parse(entry.meta) }
        catch { parsedMeta = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(entry.meta), c => c.charCodeAt(0)))) }
        metaJsonString = JSON.stringify(parsedMeta, null, 2)
      } else {
        parsedMeta = entry.meta as Record<string, unknown>
        metaJsonString = JSON.stringify(entry.meta, null, 2)
      }
    } catch {
      metaJsonString = String(entry.meta)
    }
  }

  const handleCopy = () => {
    void navigator.clipboard.writeText(metaJsonString || JSON.stringify(entry, null, 2))
    setCopied(true)
    success('Nusxalandi', 'Meta ma’lumotlar clipboardga nusxalandi')
    setTimeout(() => setCopied(false), 2500)
  }

  const actionName = actionLabel[entry.action] || entry.action

  return (
    <Modal
      title={`Audit tafsiloti: #${entry.id} · ${actionName}`}
      onClose={onClose}
      wide
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          {entry.device_id ? (
            <Link to={`/devices/${entry.device_id}`} className="btn btn-secondary">
              <IconSmartphone size={16} /> Qurilma sahifasiga o‘tish ↗
            </Link>
          ) : <div />}
          <button className="btn btn-primary" onClick={onClose}>
            Yopish
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Section 1: Top Overview Grid */}
        <div className="grid grid-2" style={{ gap: 16 }}>
          {/* Card 1: Amal va Sabab */}
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <IconHistory size={18} style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: 14 }}>Amal ma’lumotlari</strong>
            </div>

            <dl className="kv-list" style={{ margin: 0 }}>
              <dt>Amal turi:</dt>
              <dd>
                <strong style={{ color: 'var(--text)' }}>{actionName}</strong>
                <span className="cell-faint mono" style={{ fontSize: 11, marginLeft: 6 }}>
                  ({entry.action})
                </span>
              </dd>

              <dt>Sabab (Trigger):</dt>
              <dd>
                <strong style={{ color: 'var(--primary)' }}>
                  {reasonLabel[entry.reason || ''] || entry.reason || 'Kiritilmagan'}
                </strong>
              </dd>

              <dt>Ijro vaqti:</dt>
              <dd className="mono cell-strong">{dateTime(entry.created_at)}</dd>
            </dl>
          </div>

          {/* Card 2: Ijrochi (Kim bajargan) */}
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <IconUsers size={18} style={{ color: 'var(--cyan-neon)' }} />
              <strong style={{ fontSize: 14 }}>Ijrochi (Foydalanuvchi)</strong>
            </div>

            <dl className="kv-list" style={{ margin: 0 }}>
              <dt>Email:</dt>
              <dd className="mono cell-strong">{entry.user_email || '🤖 Tizim (Scheduler/Job)'}</dd>

              <dt>F.I.Sh:</dt>
              <dd>{entry.user_name || 'Tizim xizmati'}</dd>

              <dt>Tizimdagi roli:</dt>
              <dd>
                <span className="badge badge-info plain" style={{ textTransform: 'capitalize' }}>
                  {entry.user_role || 'System'}
                </span>
              </dd>
            </dl>
          </div>
        </div>

        {/* Section 2: Qurilma va Mijoz (agar mavjud bo'lsa) */}
        {entry.device_id && (
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconSmartphone size={18} style={{ color: 'var(--primary)' }} />
                <strong style={{ fontSize: 14 }}>Bog‘langan qurilma va mijoz</strong>
              </div>

              <Link
                to={`/devices/${entry.device_id}`}
                className="btn btn-sm btn-ghost"
                style={{ fontSize: 12 }}
              >
                Qurilmani ochish ↗
              </Link>
            </div>

            <div className="grid grid-2" style={{ gap: 14 }}>
              <dl className="kv-list" style={{ margin: 0 }}>
                <dt>Qurilma ID:</dt>
                <dd className="mono cell-strong">#{entry.device_id}</dd>

                <dt>Model nomi:</dt>
                <dd className="cell-strong">{entry.device_model || '—'}</dd>

                <dt>Platforma:</dt>
                <dd>
                  <span className="badge badge-info plain">
                    {entry.device_platform ? platformLabel[entry.device_platform as 'ios' | 'android'] : '—'}
                  </span>
                </dd>
              </dl>

              <dl className="kv-list" style={{ margin: 0 }}>
                <dt>Mijoz F.I.Sh:</dt>
                <dd className="cell-strong">{entry.customer_name || 'Biriktirilmagan'}</dd>

                <dt>IMEI raqami:</dt>
                <dd className="mono">{entry.device_imei || '—'}</dd>
              </dl>
            </div>
          </div>
        )}

        {/* Section 3: Meta Payload JSON Viewer */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTerminal size={16} style={{ color: 'var(--cyan-neon)' }} />
              <strong style={{ fontSize: 13.5 }}>Texnik parametrlar va Meta ma’lumotlar</strong>
            </div>

            {metaJsonString && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={handleCopy}>
                <IconCheck size={14} />
                {copied ? 'Nusxalandi ✓' : 'JSON nusxalash'}
              </button>
            )}
          </div>

          {metaJsonString && metaJsonString !== '{}' && metaJsonString !== 'null' ? (
            <pre
              className="qr-box"
              style={{
                background: 'var(--surface-3, #0f172a)',
                color: '#38bdf8',
                padding: 14,
                borderRadius: 10,
                fontSize: 12.5,
                maxHeight: 240,
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {metaJsonString}
            </pre>
          ) : (
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--surface-2)',
                borderRadius: 10,
                color: 'var(--text-faint)',
                fontSize: 13,
                textAlign: 'center',
                border: '1px dashed var(--border)',
              }}
            >
              Ushbu amal uchun qo‘shimcha texnik meta ma’lumotlar yozilmagan.
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
