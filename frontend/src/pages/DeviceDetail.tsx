import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { api, openDeviceEventStream } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useDeviceControl } from '../hooks/useDeviceControl'
import { usePayments } from '../hooks/usePayments'
import {
  actionLabel,
  date,
  dateTime,
  platformLabel,
  reasonLabel,
  relativeDays,
  sum,
} from '../lib/format'
import type { Contract, DeviceDetail as Detail, Enrollment, LockResult, Payment } from '../lib/types'
import { Card3D } from '../components/Card3D'
import {
  IconAlertTriangle,
  IconCreditCard,
  IconEdit,
  IconHistory,
  IconLock,
  IconPrinter,
  IconQrCode,
  IconSmartphone,
  IconTerminal,
  IconTrash,
  IconUnlock,
  IconUsers,
} from '../components/Icons'
import { MoneyInput } from '../components/MoneyInput'
import { Phone3DViewer } from '../components/Phone3DViewer'
import { QRCodeDisplay } from '../components/QRCodeSVG'
import { getEnrollmentConfiguratorUrl, getEnrollmentOtaUrl } from '../lib/enrollment'
import { printContractDocument } from '../lib/print'
import {
  Alert,
  ConfirmModal,
  DeviceBadge,
  Empty,
  Field,
  Loading,
  Modal,
  Pagination,
  PaymentBadge,
} from '../components/ui'
import { useToast } from '../components/Toast'

const HISTORY_PAGE_SIZE = 10

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>()
  const deviceId = Number(id)
  const { can, hasFeature } = useAuth()
  const { success, error, warn } = useToast()
  const queryClient = useQueryClient()

  const [lockOpen, setLockOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<Payment | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [commandOffset, setCommandOffset] = useState(0)
  const [auditOffset, setAuditOffset] = useState(0)

  useEffect(() => {
    setCommandOffset(0)
    setAuditOffset(0)
  }, [deviceId])

  const handleCheckStatus = async () => {
    setCheckingStatus(true)
    try {
      const res = await api.post<{ status: string; queued: boolean; message: string }>(`/devices/${deviceId}/check-status`)
      success('Qurilma javobi kutilmoqda', res.message || 'So‘rov yuborildi. Holat qurilma javobidan keyin yangilanadi.')
      queryClient.invalidateQueries({ queryKey: ['device', deviceId] })
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Holatni tekshirib bo‘lmadi')
    } finally {
      setTimeout(() => setCheckingStatus(false), 800)
    }
  }

  const handleCancelCommand = async (cmdId: number) => {
    setCancellingId(cmdId)
    try {
      await api.post(`/devices/${deviceId}/commands/${cmdId}/cancel`)
      success('Bekor qilindi', 'Buyruq navbatdan muvaffaqiyatli o‘chirildi')
      queryClient.invalidateQueries({ queryKey: ['device', deviceId] })
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Buyruqni bekor qilib bo‘lmadi')
    } finally {
      setCancellingId(null)
    }
  }

  // Confirmation dialog state
  const [confirmUnlock, setConfirmUnlock] = useState(false)
  const [confirmRelease, setConfirmRelease] = useState(false)
  const [confirmLost, setConfirmLost] = useState(false)
  const [confirmErase, setConfirmErase] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editModel, setEditModel] = useState('')
  const [editImei, setEditImei] = useState('')
  const [editSerial, setEditSerial] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => api.get<Detail>(`/devices/${deviceId}`),
    enabled: Number.isFinite(deviceId),
    // Jonli yangilanish SSE orqali keladi; bu faqat zaxira so'rov (har 15s),
    // oyna fonda bo'lganda to'xtaydi — mobil trafik va yukni kamaytiradi.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })

  // Real-Time SSE Events: jonli holat va buyruqlar sinxronizatsiyasi.
  // Ulanish bir martalik chipta orqali autentifikatsiya qilinadi.
  useEffect(() => {
    let eventSource: EventSource | null = null
    let cancelled = false

    void (async () => {
      try {
        const es = await openDeviceEventStream()
        if (cancelled) {
          es.close()
          return
        }
        eventSource = es

        es.onmessage = (e) => {
          try {
            const ev = JSON.parse(e.data)
            if (!ev || ev.type === 'connected') return

            const matchesDevice =
              ev.device_id === deviceId ||
              (!ev.device_id &&
                data?.device?.enrollment_id &&
                ev.udid === data.device.enrollment_id)
            if (!matchesDevice) return

            queryClient.invalidateQueries({ queryKey: ['device', deviceId] })
            queryClient.invalidateQueries({ queryKey: ['devices'] })

            if (ev.type === 'command_updated' && ev.command_status === 'acknowledged') {
              success('Bajarildi ✓', ev.message || 'Buyruq qurilma tomonidan bajarildi')
            } else if (ev.type === 'command_updated' && ev.command_status === 'error') {
              error('Xatolik', ev.message || 'Buyruq qurilma tomonidan bajarilmadi')
            }
          } catch (_) {}
        }
      } catch (_) {
        // Chipta olinmadi (sessiya tugagan) — refetchInterval zaxira sifatida ishlaydi.
      }
    })()

    return () => {
      cancelled = true
      eventSource?.close()
    }
  }, [deviceId, data?.device?.enrollment_id, queryClient, success, error])

  const { unlock, release, markLost, erase, enroll, updateDevice } = useDeviceControl(deviceId)

  const handleUnlock = async () => {
    try {
      const res = await unlock.mutateAsync(deviceId)
      if (res.queued) {
        warn('Navbatga qo‘yildi', res.message)
      } else {
        success('Qurilma ochildi', res.message)
      }
      setConfirmUnlock(false)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Amalni bajarib bo‘lmadi')
    }
  }

  const handleRelease = async () => {
    try {
      await release.mutateAsync(deviceId)
      success('Chiqarildi', 'Qurilma MDM boshqaruvidan to‘liq chiqarildi')
      setConfirmRelease(false)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Amalni bajarib bo‘lmadi')
    }
  }

  const handleMarkLost = async () => {
    try {
      await markLost.mutateAsync({ id: deviceId })
      warn('Yo‘qolgan', 'Qurilma yo‘qolgan deb belgilandi')
      setConfirmLost(false)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Amalni bajarib bo‘lmadi')
    }
  }

  const handleErase = async () => {
    try {
      await erase.mutateAsync(deviceId)
      warn('O‘chirish buyrug‘i yuborildi', 'Qurilma MDM bilan aloqaga chiqqach to‘liq tozalanadi')
      setConfirmErase(false)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Amalni bajarib bo‘lmadi')
    }
  }

  const handleEnroll = async () => {
    try {
      const res = await enroll.mutateAsync(deviceId)
      setEnrollment(res)
      success('Enrollment tayyor', 'QR va token muvaffaqiyatli yaratildi')
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Enrollment yaratib bo‘lmadi')
    }
  }

  if (isLoading) return <Loading />
  if (!data)
    return (
      <div style={{ padding: '48px 0' }}>
        <Empty icon="⚠️" text="Qurilma ma’lumotini yuklab bo‘lmadi. Sahifani yangilang." />
      </div>
    )

  const { device, customer, contracts, commands, audit } = data
  const visibleCommands = commands.slice(commandOffset, commandOffset + HISTORY_PAGE_SIZE)
  const visibleAudit = audit.slice(auditOffset, auditOffset + HISTORY_PAGE_SIZE)
  const activeContract = contracts.find((c) => c.status === 'ongoing') ?? contracts[0]
  const canAct = can('admin', 'operator')
  const canTakePayment = can('admin', 'operator', 'accountant')

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1>{device.model || `Qurilma #${device.id}`}</h1>
            <DeviceBadge status={device.status} />
            <span className="badge badge-info plain">{platformLabel[device.platform]}</span>
          </div>
          <div className="page-desc">
            <Link to="/devices">← Qurilmalar</Link>
            {customer && (
              <>
                {' · '}
                <Link to={`/customers?search=${encodeURIComponent(customer.phone)}`}>
                  {customer.full_name} ({customer.phone})
                </Link>
              </>
            )}
          </div>
        </div>

        {canAct && (
          <div className="btn-row">
            <button
              className={device.status === 'pending' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={handleEnroll}
              disabled={enroll.isPending}
              title="Qurilmani tizimga ulash uchun QR kod va havolani ochish"
            >
              {enroll.isPending ? <span className="spinner" /> : <IconQrCode size={16} />}
              {device.status === 'pending' ? 'Qurilmani tizimga ulash' : 'Qayta ulash (QR kod)'}
            </button>
            {device.status !== 'pending' && (
              <button
                className="btn btn-secondary"
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                title="Apple APNs orqali iPhone Lost Mode va xavfsizlik holatini jonli tekshirish"
              >
                {checkingStatus ? <span className="spinner" /> : <IconTerminal size={16} />}
                Holatni tekshirish
              </button>
            )}

            {device.platform === 'ios' && (
              <span role="status" className="badge">
                {device.is_supervised === true ? 'Supervised · Lost Mode mavjud' :
                  device.is_supervised === false ? 'Supervised emas · Bloklash mavjud emas' :
                    "Supervised noma’lum · Holatni tekshiring"}
              </span>
            )}
            {(device.is_locked || device.status === 'locked') ? (
              <button
                className="btn btn-success"
                onClick={() => setConfirmUnlock(true)}
                disabled={unlock.isPending}
                style={{ fontWeight: 600 }}
              >
                {unlock.isPending ? <span className="spinner" /> : <IconUnlock size={16} />}
                [ Qulfni ochish ]
              </button>
            ) : (
              hasFeature('device_lock') && device.status !== 'released' && device.status !== 'pending' && device.status !== 'lost' && (
                <button
                  className="btn btn-danger"
                  onClick={() => setLockOpen(true)}
                  disabled={device.platform === 'ios' && device.is_supervised !== true}
                  title={device.platform === 'ios' && device.is_supervised !== true ? 'Lost Mode uchun Supervised talab qilinadi' : undefined}
                  style={{ fontWeight: 600 }}
                >
                  <IconLock size={16} />
                  [ Qulflash ]
                </button>
              )
            )}
            {activeContract && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => printContractDocument(device, customer, activeContract)}
                title="Rasmiy nasiya shartnomasini chiroyli A4 ko‘rinishda ochish va PDF sifatida saqlash"
              >
                <IconPrinter size={16} />
                Shartnoma PDF / Chop etish
              </button>
            )}
            {!activeContract && device.status !== 'released' && (
              <Link to={`/calculator?device_id=${deviceId}`} className="btn btn-primary">
                <IconCreditCard size={16} />
                Nasiya hisoblash va shartnoma tuzish
              </Link>
            )}
            {canAct && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditModel(device.model ?? '')
                  setEditImei(device.imei ?? '')
                  setEditSerial(device.serial_number ?? '')
                  setEditOpen(true)
                }}
                title="Model, IMEI yoki seriya raqamini to‘g‘rilash"
              >
                Tahrirlash
              </button>
            )}
            {can('admin') && device.status !== 'released' && (
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmRelease(true)}
                disabled={release.isPending}
              >
                Chiqarish
              </button>
            )}
            {can('admin') && hasFeature('device_lost') && device.status !== 'released' && device.status !== 'pending' && device.status !== 'lost' && (
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmLost(true)}
                disabled={markLost.isPending}
                title="Qurilma yo‘qolgan/o‘g‘irlangan deb belgilash"
              >
                Yo‘qolgan deb belgilash
              </button>
            )}
            {can('admin') && hasFeature('device_erase') && device.status !== 'released' && device.status !== 'pending' && (
              <button
                className="btn btn-ghost"
                style={{ color: 'var(--danger, #dc2626)' }}
                onClick={() => setConfirmErase(true)}
                disabled={erase.isPending}
                title="Qurilmani butunlay o‘chirish (factory wipe) — qaytarib bo‘lmaydi"
              >
                O‘chirish (Erase)
              </button>
            )}
            {can('admin') && device.is_archived && (
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await api.post(`/devices/${deviceId}/restore`)
                    success('Tiklandi', `Qurilma #${deviceId} arxivdan qayta tiklandi`)
                    queryClient.invalidateQueries({ queryKey: ['device', deviceId] })
                  } catch (err) {
                    error('Xatolik', err instanceof Error ? err.message : 'Tiklab bo‘lmadi')
                  }
                }}
              >
                Qayta tiklash
              </button>
            )}
          </div>
        )}
      </div>

      {device.status === 'lost' && (
        <div style={{ marginBottom: 20 }}>
          <Alert kind="warn">
            <strong>Diqqat:</strong> Qurilmadan MDM profili o‘chirilgan. Boshqaruvni qayta tiklash uchun yuqoridagi <strong>[Qayta ulash (QR kod)]</strong> tugmasi orqali yangi profilni o‘rnating.
          </Alert>
        </div>
      )}

      {device.is_archived && (
        <div style={{ marginBottom: 20 }}>
          <Alert kind="warn">
            <strong>Diqqat:</strong> Ushbu qurilma arxivga olingan. Barcha to‘lovlar va MDM tarixi saqlanib qolgan.
          </Alert>
        </div>
      )}

      {device.status === 'locked' && device.lock_message && (
        <div style={{ marginBottom: 20 }}>
          <Alert kind="warn">
            MDM bloklash ekranidagi matn: <strong>{device.lock_message}</strong>
          </Alert>
        </div>
      )}

      {/* Main Grid: Info + 3D Phone Preview */}
      <div className="grid grid-2" style={{ marginBottom: 24, alignItems: 'start' }}>
        {/* Left Column: Device Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card3D max={6} scale={1.01}>
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconSmartphone size={18} style={{ color: 'var(--primary)' }} />
                  <h2>Qurilma parametrlari</h2>
                </div>
              </div>
              <div className="card-body">
                <dl className="kv">
                  <dt>Model</dt>
                  <dd className="cell-strong">{device.model || '—'}</dd>
                  <dt>Seriya raqami</dt>
                  <dd className="mono">{device.serial_number || '—'}</dd>
                  <dt>IMEI</dt>
                  <dd className="mono">{device.imei || '—'}</dd>
                  <dt>Enrollment ID</dt>
                  <dd className="mono cell-faint">{device.enrollment_id || '—'}</dd>
                  {device.platform === 'android' && (
                    <>
                      <dt>AMAPI resurs</dt>
                      <dd className="mono cell-faint">{device.amapi_name || '—'}</dd>
                    </>
                  )}
                  <dt>Ro‘yxatdan o‘tgan</dt>
                  <dd>{dateTime(device.enrolled_at)}</dd>
                  <dt>Oxirgi aloqa</dt>
                  <dd>{dateTime(device.last_seen_at)}</dd>
                </dl>
              </div>
            </div>
          </Card3D>

          <Card3D max={6} scale={1.01}>
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconUsers size={18} style={{ color: 'var(--cyan-neon)' }} />
                  <h2>Biriktirilgan mijoz</h2>
                </div>
              </div>
              <div className="card-body">
                {!customer ? (
                  <Empty text="Mijoz biriktirilmagan" />
                ) : (
                  <dl className="kv">
                    <dt>F.I.Sh</dt>
                    <dd className="cell-strong">{customer.full_name}</dd>
                    <dt>Telefon</dt>
                    <dd className="mono">{customer.phone}</dd>
                    <dt>Passport</dt>
                    <dd className="cell-dim">{customer.passport || '—'}</dd>
                    <dt>Manzil</dt>
                    <dd className="cell-dim">{customer.address || '—'}</dd>
                    <dt>Izoh</dt>
                    <dd className="cell-faint">{customer.note || '—'}</dd>
                  </dl>
                )}
              </div>
            </div>
          </Card3D>
        </div>

        {/* Right Column: 3D Live Phone Simulator */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Phone3DViewer
            detail={data}
            onUnlockClick={device.status === 'locked' && canAct ? () => setConfirmUnlock(true) : undefined}
            onLockClick={device.status === 'active' && canAct && hasFeature('device_lock') ? () => setLockOpen(true) : undefined}
          />
        </div>
      </div>

      {/* Payment Schedule Card */}
      {activeContract && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconCreditCard size={18} style={{ color: 'var(--success)' }} />
              <h2>Nasiya to‘lov jadvali</h2>
            </div>
            <div className="btn-row">
              <span className="cell-faint">
                {activeContract.months} oy · grace {activeContract.grace_days} kun ·{' '}
                {activeContract.status === 'ongoing' ? 'faol shartnoma' : 'yopilgan'}
              </span>
              {canAct && activeContract.status === 'ongoing' && (
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setRescheduleOpen(true)}>
                  <IconEdit size={14} />
                  Grafikni tahrirlash
                </button>
              )}
            </div>
          </div>
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <ContractSummary contract={activeContract} />
          </div>
          <div className="table-wrap" style={{ marginTop: 18 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Muddat</th>
                  <th>Summa</th>
                  <th>To‘langan</th>
                  <th>Holat</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {activeContract.payments?.map((p) => {
                  const days = relativeDays(p.due_date)
                  return (
                    <tr key={p.id}>
                      <td className="num cell-faint">#{p.seq}</td>
                      <td>
                        <div className="cell-strong">{date(p.due_date)}</div>
                        {p.status !== 'paid' && days !== null && (
                          <div className="cell-faint">
                            {days < 0 ? `${-days} kun kechikdi` : days === 0 ? 'bugun' : `${days} kun qoldi`}
                          </div>
                        )}
                      </td>
                      <td className="num cell-strong">{sum(p.amount)}</td>
                      <td className="num cell-dim">{sum(p.paid_amount)}</td>
                      <td>
                        <PaymentBadge status={p.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {canTakePayment && p.status !== 'paid' && (
                          <button className="btn btn-sm btn-primary" onClick={() => setPayTarget(p)}>
                            To‘lovni qayd etish
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs / Logs Section */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTerminal size={18} style={{ color: 'var(--primary)' }} />
              <h2>MDM buyruqlari terminali</h2>
            </div>
          </div>
          {!commands.length ? (
            <div className="card-body">
              <Empty text="Buyruqlar yuborilmagan" />
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Buyruq</th>
                    <th>Holat</th>
                    <th>Urinish</th>
                    <th>Vaqt</th>
                    <th>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCommands.map((c) => (
                    <tr key={c.id}>
                      <td>{renderCommandType(c.command_type)}</td>
                      <td>
                        {renderCommandStatus(c.status)}
                        {c.last_error && (
                          <div className="cell-faint" style={{ color: '#f87171', fontSize: 11, marginTop: 2 }} title={c.last_error}>
                            {c.last_error.slice(0, 60)}
                          </div>
                        )}
                      </td>
                      <td className="num cell-dim">{c.attempts}</td>
                      <td className="cell-faint">{dateTime(c.created_at)}</td>
                      <td>
                        {(c.status === 'queued' || c.status === 'sent') && (
                          <button
                            className="btn btn-outline"
                            onClick={() => handleCancelCommand(c.id)}
                            disabled={cancellingId === c.id}
                            style={{ padding: '3px 8px', fontSize: 11, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                            title="Navbatdagi buyruqni bekor qilish"
                          >
                            {cancellingId === c.id ? '...' : 'Bekor qilish'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {commands.length > HISTORY_PAGE_SIZE && (
            <Pagination
              total={commands.length}
              limit={HISTORY_PAGE_SIZE}
              offset={commandOffset}
              onChange={setCommandOffset}
            />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconHistory size={18} style={{ color: 'var(--cyan-neon)' }} />
              <h2>Bloklash va audit tarixi</h2>
            </div>
          </div>
          <div className="card-body">
            {!audit.length ? (
              <Empty text="Tarix bo‘sh" />
            ) : (
              <div className="activity-feed">
                {visibleAudit.map((a) => {
                  const isUnlock = a.action === 'unlock' || a.action.includes('restore')
                  const isLock = a.action === 'lock' || a.action.includes('delete') || a.action.includes('archive') || a.action === 'erase'
                  const isJob = a.action === 'daily_job'
                  const isPayment = a.action === 'payment' || a.action === 'contract_create'

                  const iconBg = isUnlock
                    ? 'rgba(34, 197, 94, 0.15)'
                    : isLock
                      ? 'rgba(239, 68, 68, 0.15)'
                      : isJob
                        ? 'rgba(6, 182, 212, 0.15)'
                        : isPayment
                          ? 'rgba(168, 85, 247, 0.15)'
                          : 'rgba(59, 130, 246, 0.15)'

                  const iconColor = isUnlock
                    ? '#22c55e'
                    : isLock
                      ? '#ef4444'
                      : isJob
                        ? '#06b6d4'
                        : isPayment
                          ? '#a855f7'
                          : '#3b82f6'

                  return (
                    <div className="activity-row" key={a.id}>
                      <div className="activity-icon-wrap" style={{ background: iconBg, color: iconColor }}>
                        {isUnlock ? (
                          <IconUnlock size={16} />
                        ) : isLock ? (
                          <IconLock size={16} />
                        ) : isJob ? (
                          <IconTerminal size={16} />
                        ) : isPayment ? (
                          <IconCreditCard size={16} />
                        ) : (
                          <IconSmartphone size={16} />
                        )}
                      </div>

                      <div className="activity-main">
                        <div className="activity-header">
                          <span className="activity-action-name">
                            {actionLabel[a.action] ?? a.action}
                          </span>
                          {a.reason && (
                            <span className="badge-subtle">
                              {reasonLabel[a.reason] ?? a.reason}
                            </span>
                          )}
                        </div>

                        <div className="activity-meta">
                          <span className="activity-actor">
                            <IconUsers size={12} />
                            {a.user_email || 'Tizim (avtomatik)'}
                          </span>
                        </div>
                      </div>

                      <div className="activity-time">
                        {dateTime(a.created_at)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {audit.length > HISTORY_PAGE_SIZE && (
            <Pagination
              total={audit.length}
              limit={HISTORY_PAGE_SIZE}
              offset={auditOffset}
              onChange={setAuditOffset}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {lockOpen && (
        <LockModal
          deviceId={deviceId}
          onClose={() => setLockOpen(false)}
          onDone={(res) => {
            if (res.queued) warn('Navbatga olindi', res.message)
            else success('Bloklandi', res.message)
            setLockOpen(false)
          }}
        />
      )}

      {payTarget && (
        <PayModal
          payment={payTarget}
          onClose={() => setPayTarget(null)}
          onDone={(message) => {
            success('To‘lov qabul qilindi', message)
            setPayTarget(null)
          }}
        />
      )}

      {enrollment && <EnrollmentModal enrollment={enrollment} onClose={() => setEnrollment(null)} />}

      {rescheduleOpen && activeContract && (
        <ScheduleEditModal
          contract={activeContract}
          onClose={() => setRescheduleOpen(false)}
          onDone={() => {
            success('Grafik yangilandi', 'To‘lov sanalari va summalari saqlandi')
            setRescheduleOpen(false)
            queryClient.invalidateQueries({ queryKey: ['device', deviceId] })
            queryClient.invalidateQueries({ queryKey: ['payments'] })
          }}
        />
      )}

      {confirmUnlock && (
        <ConfirmModal
          title="Qurilmani ochish"
          message="Qurilmani blokdan ochish buyrug‘i yuborilsinmi? Qurilma MDM bilan aloqaga chiqqach bloklash ekrani olib tashlanadi."
          confirmLabel="Ochish"
          isLoading={unlock.isPending}
          onConfirm={handleUnlock}
          onClose={() => setConfirmUnlock(false)}
        />
      )}

      {confirmRelease && (
        <ConfirmModal
          title="Qurilmani chiqarish"
          message="Qurilmani MDM boshqaruvidan to‘liq chiqarishni tasdiqlaysizmi? Qurilma avval ochiladi, so‘ng MDM profili o‘chiriladi."
          confirmLabel="Chiqarish"
          danger
          isLoading={release.isPending}
          onConfirm={handleRelease}
          onClose={() => setConfirmRelease(false)}
        />
      )}

      {confirmLost && (
        <ConfirmModal
          title="Yo‘qolgan deb belgilash"
          message="Qurilma yo‘qolgan deb belgilansinmi? Bu holat qurilma nazoratdan chiqqanini bildiradi."
          confirmLabel="Belgilash"
          danger
          isLoading={markLost.isPending}
          onConfirm={handleMarkLost}
          onClose={() => setConfirmLost(false)}
        />
      )}

      {confirmErase && (
        <ConfirmModal
          title="Qurilmani to‘liq o‘chirish"
          message="DIQQAT: bu qurilmani zavod holatiga qaytaradi — barcha ma’lumot o‘chadi va buni QAYTARIB BO‘LMAYDI. Faqat qurilma qaytarib olinganda yoki yakuniy chora sifatida ishlating. Davom etilsinmi?"
          confirmLabel="Ha, o‘chirish"
          danger
          isLoading={erase.isPending}
          onConfirm={handleErase}
          onClose={() => setConfirmErase(false)}
        />
      )}

      {editOpen && (
        <Modal
          title="Qurilma ma’lumotlarini tahrirlash"
          onClose={() => setEditOpen(false)}
          footer={
            <>
              <button className="btn" onClick={() => setEditOpen(false)} disabled={updateDevice.isPending}>
                Bekor qilish
              </button>
              <button
                className="btn btn-primary"
                disabled={updateDevice.isPending || !editModel.trim()}
                onClick={async () => {
                  try {
                    await updateDevice.mutateAsync({
                      id: deviceId,
                      input: {
                        platform: device.platform,
                        model: editModel.trim() || null,
                        imei: editImei.trim() || null,
                        serial_number: editSerial.trim() || null,
                        customer_id: customer?.id ?? null,
                      },
                    })
                    success('Saqlandi', 'Qurilma ma’lumotlari yangilandi')
                    setEditOpen(false)
                  } catch (err) {
                    error('Xatolik', err instanceof Error ? err.message : 'Saqlab bo‘lmadi')
                  }
                }}
              >
                {updateDevice.isPending && <span className="spinner" />}
                Saqlash
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Model">
              <input className="input" value={editModel} onChange={(e) => setEditModel(e.target.value)} placeholder="iPhone 15 Pro 256GB" />
            </Field>
            <Field label="IMEI (15 xonali)">
              <input className="input mono" value={editImei} inputMode="numeric" maxLength={15} onChange={(e) => setEditImei(e.target.value.replace(/\D/g, ''))} placeholder="358941091234567" />
            </Field>
            <Field label="Seriya raqami">
              <input className="input mono" value={editSerial} maxLength={32} onChange={(e) => setEditSerial(e.target.value.toUpperCase())} placeholder="F2LZ90K8MD6M" />
            </Field>
          </div>
        </Modal>
      )}
    </>
  )
}

function renderCommandType(type: string) {
  switch (type) {
    case 'lock':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f87171', fontWeight: 600 }}>
          <IconLock size={15} />
          Bloklash
        </span>
      )
    case 'unlock':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4ade80', fontWeight: 600 }}>
          <IconUnlock size={15} />
          Ochish
        </span>
      )
    case 'release':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a78bfa', fontWeight: 600 }}>
          <IconTrash size={15} />
          Chiqarish
        </span>
      )
    case 'erase':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 600 }}>
          <IconTrash size={15} />
          Tozalash
        </span>
      )
    case 'lost':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fb923c', fontWeight: 600 }}>
          <IconAlertTriangle size={15} />
          Yo‘qolgan
        </span>
      )
    case 'info':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600 }}>
          <IconSmartphone size={15} />
          Tekshirish
        </span>
      )
    default:
      return <span className="cell-strong">{type}</span>
  }
}

function renderCommandStatus(status: string) {
  switch (status) {
    case 'acknowledged':
      return (
        <span
          className="badge badge-active"
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#4ade80',
            borderColor: 'rgba(74, 222, 128, 0.3)',
            fontWeight: 600,
          }}
        >
          Bajarildi ✓
        </span>
      )
    case 'sent':
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(234, 179, 8, 0.15)',
            color: '#facc15',
            borderColor: 'rgba(250, 204, 21, 0.3)',
            fontWeight: 600,
          }}
        >
          Yuborildi
        </span>
      )
    case 'queued':
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            borderColor: 'rgba(56, 189, 248, 0.3)',
            fontWeight: 600,
          }}
        >
          Navbatda
        </span>
      )
    case 'cancelled':
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(148, 163, 184, 0.15)',
            color: '#94a3b8',
            borderColor: 'rgba(148, 163, 184, 0.3)',
          }}
        >
          Bekor qilindi
        </span>
      )
    case 'error':
    case 'failed':
      return (
        <span
          className="badge badge-locked"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            borderColor: 'rgba(248, 113, 113, 0.3)',
            fontWeight: 600,
          }}
        >
          Xatolik ✕
        </span>
      )
    default:
      return <span className="badge">{status}</span>
  }
}

function ContractSummary({ contract }: { contract: Contract }) {
  const total = Number(contract.total_amount)
  const paid = Number(contract.paid_amount)
  const percent = total > 0 ? Math.min(100, (paid / total) * 100) : 0

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
        <span className="cell-dim">
          To‘langan: <span className="num cell-strong" style={{ color: '#10b981' }}>{sum(contract.paid_amount)}</span>
        </span>
        <span className="cell-dim">
          Qoldiq: <span className="num cell-strong" style={{ color: '#f59e0b' }}>{sum(contract.remaining_amount)}</span>
        </span>
      </div>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="cell-faint" style={{ marginTop: 8 }}>
        Umumiy {sum(contract.total_amount)} · boshlang‘ich {sum(contract.down_payment)} · boshlanish{' '}
        {date(contract.start_date)}
      </div>
    </>
  )
}

function LockModal({
  deviceId,
  onClose,
  onDone,
}: {
  deviceId: number
  onClose: () => void
  onDone: (res: LockResult) => void
}) {
  const [message, setMessage] = useState('')
  const { lock } = useDeviceControl(deviceId)

  const handleLock = async () => {
    try {
      const res = await lock.mutateAsync({ id: deviceId, message, reason: 'manual' })
      onDone(res)
    } catch {
      // error handled by mutation
    }
  }

  return (
    <Modal
      className="lock-modal"
      title={
        <span className="lock-modal-title">
          <span className="lock-modal-title-icon"><IconLock size={18} /></span>
          Qurilmani bloklash
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <button className="btn lock-modal-cancel" onClick={onClose} disabled={lock.isPending}>
            Bekor qilish
          </button>
          <button className="btn btn-danger lock-modal-submit" onClick={handleLock} disabled={lock.isPending}>
            {lock.isPending && <span className="spinner" />}
            {!lock.isPending && <IconLock size={16} />}
            {lock.isPending ? 'Buyruq yuborilmoqda…' : 'Qurilmani bloklash'}
          </button>
        </>
      }
    >
      <div className="lock-modal-content">
        {lock.isError && (
          <Alert kind="error">
            {lock.error instanceof Error ? lock.error.message : 'Bloklab bo‘lmadi'}
          </Alert>
        )}

        <Field label="Ekranda ko‘rinadigan xabar">
          <textarea
            className="input lock-message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Masalan: Qurilma bo‘yicha do‘kon bilan bog‘laning"
            rows={4}
          />
          <span className="lock-field-help">Ixtiyoriy · bo‘sh qoldirilsa standart xabar ishlatiladi</span>
        </Field>

        <div className="lock-action-note">
          <span className="lock-action-note-icon"><IconAlertTriangle size={18} /></span>
          <div>
            <strong>Bloklash buyrug‘i yuboriladi</strong>
            <span>Qurilma internetga ulangan zahoti buyruq bajariladi.</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function PayModal({
  payment,
  onClose,
  onDone,
}: {
  payment: Payment
  onClose: () => void
  onDone: (message: string) => void
}) {
  const remaining = Number(payment.amount) - Number(payment.paid_amount)
  const [amount, setAmount] = useState(String(remaining))
  const [ref, setRef] = useState('')
  const { pay } = usePayments()

  const handlePay = async () => {
    try {
      const res = await pay.mutateAsync({
        paymentId: payment.id,
        input: { amount, external_ref: ref || undefined },
      })
      onDone(res.message ?? 'To‘lov qabul qilindi')
    } catch {
      // error handled by mutation
    }
  }

  return (
    <Modal
      title={`${payment.seq}-to‘lovni qayd etish`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Bekor qilish
          </button>
          <button
            className="btn btn-success"
            onClick={handlePay}
            disabled={pay.isPending || !amount}
          >
            {pay.isPending && <span className="spinner" />}
            To‘lovni qayd etish
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {pay.isError && (
          <Alert kind="error">
            {pay.error instanceof Error ? pay.error.message : 'To‘lov qayd etilmadi'}
          </Alert>
        )}

        <dl className="kv">
          <dt>Muddat</dt>
          <dd>{date(payment.due_date)}</dd>
          <dt>Bo‘lak summasi</dt>
          <dd className="num">{sum(payment.amount)}</dd>
          <dt>Qolgan</dt>
          <dd className="num cell-strong">{sum(remaining)}</dd>
        </dl>

        <Field label="To‘lov summasi *">
          <MoneyInput
            value={amount}
            onChange={(num) => setAmount(String(num))}
            placeholder="0"
            required
            autoFocus
          />
        </Field>

        <Field label="Tashqi to‘lov ID (ixtiyoriy)">
          <input
            className="input mono"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="payme-4837291"
          />
        </Field>

        <Alert kind="info">
          Agar qurilma bloklangan bo‘lsa va kechikkan qarz qolmasa — to‘lovdan so‘ng qurilma
          avtomatik ochiladi.
        </Alert>
      </div>
    </Modal>
  )
}

function ScheduleEditModal({
  contract,
  onClose,
  onDone,
}: {
  contract: Contract
  onClose: () => void
  onDone: () => void
}) {
  const [graceDays, setGraceDays] = useState(String(contract.grace_days))
  const [items, setItems] = useState(
    (contract.payments || []).map((p) => ({
      id: p.id,
      seq: p.seq,
      due_date: toDateInput(p.due_date),
      amount: Number(p.amount),
      paid_amount: Number(p.paid_amount),
    }))
  )
  const [saving, setSaving] = useState(false)
  const { error } = useToast()

  const updateItem = (id: number, patch: Partial<(typeof items)[number]>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const shiftMonth = (id: number) => {
    const current = items.find((item) => item.id === id)
    if (!current?.due_date) return
    const next = new Date(`${current.due_date}T00:00:00`)
    next.setMonth(next.getMonth() + 1)
    updateItem(id, { due_date: toDateInput(next.toISOString()) })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post<Contract>(`/contracts/${contract.id}/reschedule`, {
        grace_days: Number(graceDays),
        payments: items.map((item) => ({
          id: item.id,
          due_date: item.due_date,
          amount: String(item.amount),
        })),
      })
      onDone()
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Grafikni saqlab bo‘lmadi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="To‘lov grafigini tahrirlash"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>
            Bekor qilish
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !items.length}>
            {saving && <span className="spinner" />}
            Saqlash
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Grace period (kun)">
          <input
            className="input num"
            type="number"
            min={0}
            max={60}
            value={graceDays}
            onChange={(e) => setGraceDays(e.target.value)}
          />
        </Field>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Yangi muddat</th>
                <th>Summa</th>
                <th>To‘langan</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="num cell-faint">#{item.seq}</td>
                  <td>
                    <input
                      className="input"
                      type="date"
                      value={item.due_date}
                      onChange={(e) => updateItem(item.id, { due_date: e.target.value })}
                    />
                  </td>
                  <td style={{ minWidth: 180 }}>
                    <MoneyInput
                      value={item.amount}
                      onChange={(num) => updateItem(item.id, { amount: num })}
                      min={1}
                    />
                  </td>
                  <td className="num cell-dim">{sum(item.paid_amount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => shiftMonth(item.id)}>
                      +1 oy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Alert kind="info">
          Sana yoki summa o‘zgarsa, tizim har bir bo‘lak holatini qayta hisoblaydi. To‘langan summa yangi
          summadan oshsa, bo‘lak avtomatik yopiladi.
        </Alert>
      </div>
    </Modal>
  )
}

function toDateInput(value: string) {
  return value.slice(0, 10)
}

function EnrollmentModal({
  enrollment,
  onClose,
}: {
  enrollment: Enrollment
  onClose: () => void
}) {
  const isIOS = enrollment.platform === 'ios'
  const [copied, setCopied] = useState(false)

  const otaUrl = enrollment.qr_payload || getEnrollmentOtaUrl(enrollment.token)
  const configuratorUrl = getEnrollmentConfiguratorUrl(enrollment.token)
  const [copiedKind, setCopiedKind] = useState<'ota' | 'configurator' | null>(null)

  const handleDownloadMobileConfig = () => {
    window.location.href = `${otaUrl}&download=1`
  }

  const handleCopy = (text: string, kind: 'ota' | 'configurator' = 'ota') => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setCopiedKind(kind)
    setTimeout(() => {
      setCopied(false)
      setCopiedKind(null)
    }, 2500)
  }

  return (
    <Modal
      title={isIOS ? 'Apple iOS qurilmasini tizimga ulash' : 'Google Android qurilmasini tizimga ulash'}
      onClose={onClose}
      wide
      footer={
        <button className="btn btn-primary" onClick={onClose}>
          Yopish
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* QR Kod amal qilish muddati info box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}
        >
          <span className="cell-dim" style={{ fontSize: 13 }}>QR kod amal qilish muddati:</span>
          <strong className="mono" style={{ color: 'var(--primary)', fontSize: 13.5 }}>
            {dateTime(enrollment.expires_at)}
          </strong>
        </div>

        {isIOS ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'center' }}>
              <div style={{ textAlign: 'center', background: '#fff', padding: 14, borderRadius: 16, border: '1px solid var(--border)' }}>
                <QRCodeDisplay value={otaUrl} size={170} />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontWeight: 600 }}>iPhone kamera orqali skanerlang</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="cell-strong" style={{ fontSize: 15 }}>
                  Safari havolasi va yuklab olish
                </div>
                <div className="cell-dim" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  1. iPhone kamerasini ushbu QR kodga qarating yoki Safari orqali havolani oching.<br />
                  2. Sozlamalar (Settings) bo‘limidan profilni o‘rnatishni tasdiqlang.
                </div>
                <div className="btn-row" style={{ marginTop: 6 }}>
                  <button className="btn btn-primary" onClick={() => handleCopy(otaUrl, 'ota')}>
                    {copied && copiedKind === 'ota' ? 'Havola nusxalandi ✓' : 'Safari havolasini nusxalash'}
                  </button>
                  <button className="btn btn-secondary" onClick={handleDownloadMobileConfig}>
                    Yuklab olish (.mobileconfig)
                  </button>
                  <a
                    href={otaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                  >
                    Brauzerda ochish ↗
                  </a>
                </div>
              </div>
            </div>

            {/*
              Apple Configurator nusxasi. Bu faylda PayloadRemovalDisallowed
              bo'ladi va profil o'chirilmaydigan bo'lib qoladi — lekin iOS bu
              bayroqni FAQAT Configurator/ADE orqali o'rnatilganda qabul qiladi.
              Shuning uchun QR va Safari havolasi oddiy (o'chiriladigan)
              nusxaga ishora qiladi, bu esa alohida turadi.
            */}
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                padding: 14,
              }}
            >
              <div className="cell-strong" style={{ fontSize: 13.5, marginBottom: 4 }}>
                Apple Configurator orqali (o‘chirilmaydigan profil)
              </div>
              <div className="cell-dim" style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 10 }}>
                Qurilma <strong>supervised</strong> bo‘lsa, bu nusxa
                <strong> Remove Management</strong> tugmasini yo‘q qiladi.
                <br />
                1. Faylni Mac’ga yuklab oling (yoki havolani nusxalab Mac’da oching).
                <br />
                2. Apple Configurator → qurilmani belgilang → <strong>Add → Profiles…</strong> → shu fayl.
              </div>
              <div className="btn-row">
                <a href={configuratorUrl} className="btn btn-primary">
                  Configurator uchun yuklab olish
                </a>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleCopy(configuratorUrl, 'configurator')}
                >
                  {copied && copiedKind === 'configurator'
                    ? 'Havola nusxalandi ✓'
                    : 'Havolani nusxalash (Mac uchun)'}
                </button>
              </div>
              <div className="cell-dim" style={{ fontSize: 12, marginTop: 8 }}>
                Diqqat: bu faylni Safari orqali telefonga o‘rnatib bo‘lmaydi — iOS
                “a profile containing an MDM payload must be removable” xatosini beradi.
                Telefonga to‘g‘ridan-to‘g‘ri o‘rnatish uchun yuqoridagi QR/Safari havolasidan foydalaning.
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: 14,
              }}
            >
              <div className="cell-strong" style={{ fontSize: 13.5, marginBottom: 4 }}>
                Apple Business Manager (ABM / ADE) avtomatik ulanish
              </div>
              <div className="cell-dim" style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                Agar qurilma <strong>Apple Business Manager</strong>ga kiritilgan bo‘lsa, iPhone birinchi marta
                yoqilganda ushbu profil va Remote Management xizmati avtomatik yuklanadi.
              </div>
            </div>

            <Field label="Ulanish tokeni (Token)">
              <input className="input mono" readOnly value={enrollment.token} />
            </Field>

            {enrollment.profile && (
              <details style={{ marginTop: 6 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--text-dim)' }}>
                  .mobileconfig profil kodi (XML preview)
                </summary>
                <pre className="qr-box" style={{ marginTop: 8 }}>{enrollment.profile}</pre>
              </details>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'center' }}>
              <div style={{ textAlign: 'center', background: '#fff', padding: 14, borderRadius: 16, border: '1px solid var(--border)' }}>
                <QRCodeDisplay value={enrollment.qr_payload || ''} size={170} />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontWeight: 600 }}>Android kamera orqali skanerlang</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="cell-strong" style={{ fontSize: 15 }}>
                  Android Device Policy skaneri
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  <li>Telefonni yoqing (Welcome / Xush kelibsiz ekrani)</li>
                  <li>Ekranning bo‘sh joyiga ketma-ket 6 marta bosing</li>
                  <li>Kamera ochilgach, ushbu QR kodni skanerlang</li>
                  <li>Wi-Fi ga ulang — MDM avtomatik o‘rnatiladi</li>
                </ol>
                <div className="btn-row" style={{ marginTop: 6 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCopy(enrollment.qr_payload || '')}
                  >
                    {copied ? 'Nusxalandi ✓' : 'JSON konfiguratsiyasini nusxalash'}
                  </button>
                </div>
              </div>
            </div>

            <Field label="Android DPC ulanish tokeni">
              <input className="input mono" readOnly value={enrollment.token} />
            </Field>

            {enrollment.qr_payload && (
              <details style={{ marginTop: 6 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--text-dim)' }}>
                  QR ma’lumoti (JSON konfiguratsiya)
                </summary>
                <pre className="qr-box" style={{ marginTop: 8 }}>{enrollment.qr_payload}</pre>
              </details>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
