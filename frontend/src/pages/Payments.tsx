import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../lib/auth'
import { downloadFile } from '../lib/api'
import { useDebounce } from '../hooks/useDebounce'
import { usePayments, type PaymentRow } from '../hooks/usePayments'
import { date, dateTime, platformLabel, relativeDays, sum } from '../lib/format'
import {
  IconActivity,
  IconAndroid,
  IconApple,
  IconArrowRight,
  IconCreditCard,
  IconHistory,
  IconReceipt,
  IconShieldAlert,
  IconSmartphone,
  IconTrash,
} from '../components/Icons'
import { ConfirmModal, DeviceBadge, Empty, Loading, Pagination, PaymentBadge } from '../components/ui'
import { useToast } from '../components/Toast'

const LIMIT = 25

const SCOPES = [
  { value: 'overdue', label: '🔴 Kechikkan to‘lovlar' },
  { value: 'upcoming', label: '🟡 Kelayotgan to‘lovlar' },
  { value: 'paid', label: '🟢 Yakunlangan to‘lovlar' },
  { value: '', label: 'Barcha to‘lovlar' },
]

export default function Payments() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const { success, error } = useToast()

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [scope, setScope] = useState('overdue')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [archiveTarget, setArchiveTarget] = useState<PaymentRow | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<PaymentRow | null>(null)

  const isArchived = activeTab === 'archived'
  const debouncedSearch = useDebounce(search, 300)
  const { data, isLoading, archiveDevice, restoreDevice } = usePayments(scope, debouncedSearch, offset, LIMIT, isArchived)

  // Financial calculations from current list
  const totalCollected = data?.items.reduce((acc, p) => acc + Number(p.paid_amount), 0) ?? 0
  const paidCount = data?.items.filter((p) => Number(p.paid_amount) >= Number(p.amount)).length ?? 0
  const partialCount = data?.items.filter((p) => Number(p.paid_amount) > 0 && Number(p.paid_amount) < Number(p.amount)).length ?? 0
  // Kechikkan = muddati o'tgan VA to'liq to'lanmagan. Karta bu summани
  // ko'rsatadi (jami to'lanmagan emas) — Qarzdorlik sahifasi bilan mos bo'lsin.
  const overdueItems = data?.items.filter((p) => {
    const days = relativeDays(p.due_date)
    return days !== null && days < 0 && Number(p.paid_amount) < Number(p.amount)
  }) ?? []
  const overdueCount = overdueItems.length
  const overdueAmount = overdueItems.reduce((acc, p) => acc + (Number(p.amount) - Number(p.paid_amount)), 0)

  const handleArchive = async () => {
    if (!archiveTarget) return
    try {
      await archiveDevice.mutateAsync(archiveTarget.device_id)
      success(
        'Arxivlandi',
        `"${archiveTarget.device_model || 'Qurilma'}" va unga tegishli to‘lovlar arxivga o‘tkazildi`
      )
      setArchiveTarget(null)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Arxivlab bo‘lmadi')
    }
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    try {
      await restoreDevice.mutateAsync(restoreTarget.device_id)
      success(
        'Tiklandi',
        `"${restoreTarget.device_model || 'Qurilma'}" to‘lovlari faol ro‘yxatga qayta tiklandi`
      )
      setRestoreTarget(null)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Tiklab bo‘lmadi')
    }
  }

  const handleExport = async () => {
    try {
      await downloadFile('/exports/payments.csv', 'payments.csv', {
        scope,
        search,
        limit: 5000,
      })
      success('Export tayyor', 'To‘lovlar CSV faylga chiqarildi')
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Export qilib bo‘lmadi')
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>To‘lovlar</h1>
        </div>

        <div className="btn-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
          >
            <IconReceipt size={16} /> CSV export
          </button>
          <Link to="/calculator" className="btn btn-secondary">
            <IconCreditCard size={16} /> Nasiya kalkulyatori
          </Link>
          <Link to="/devices" className="btn btn-primary">
            <IconSmartphone size={16} /> Qurilmalar ro‘yxati
          </Link>
        </div>
      </div>

      {/* Tabs Navigation: Active vs Archived */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('active')
            setOffset(0)
          }}
        >
          <IconReceipt size={15} />
          Faol to‘lovlar
        </button>
        <button
          className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('archived')
            setOffset(0)
          }}
        >
          <IconHistory size={15} />
          Arxivlangan to‘lovlar (Yakunlangan)
        </button>
      </div>

      {/* Summary KPI Statistic Cards (Clean 4-card Grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Card 1: Jami tushum */}
        <div
          className="card"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconReceipt size={22} />
          </div>
          <div>
            <div className="cell-dim" style={{ fontSize: 12, fontWeight: 600 }}>Jami tushum (Kassada)</div>
            <div className="num" style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', margin: '2px 0' }}>
              {sum(totalCollected)}
            </div>
            <div className="cell-faint" style={{ fontSize: 11 }}>Qabul qilingan summalar</div>
          </div>
        </div>

        {/* Card 2: Kechikkan qarz */}
        <div
          className="card"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconShieldAlert size={22} />
          </div>
          <div>
            <div className="cell-dim" style={{ fontSize: 12, fontWeight: 600 }}>Kechikkan qarzdorlik</div>
            <div className="num" style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', margin: '2px 0' }}>
              {overdueCount} ta · {sum(overdueAmount)}
            </div>
            <div className="cell-faint" style={{ fontSize: 11 }}>Muddati o‘tgan to‘lovlar</div>
          </div>
        </div>

        {/* Card 3: Yakunlangan to‘lovlar */}
        <div
          className="card"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(14, 165, 233, 0.15)',
              color: '#0ea5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconCreditCard size={22} />
          </div>
          <div>
            <div className="cell-dim" style={{ fontSize: 12, fontWeight: 600 }}>Yakunlandi (To‘liq to‘langan)</div>
            <div className="num" style={{ fontSize: 18, fontWeight: 800, color: '#0ea5e9', margin: '2px 0' }}>
              {paidCount} ta bosqich
            </div>
            <div className="cell-faint" style={{ fontSize: 11 }}>100% yopilgan grafiklar</div>
          </div>
        </div>

        {/* Card 4: Qisman to‘langan */}
        <div
          className="card"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#facc15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconActivity size={22} />
          </div>
          <div>
            <div className="cell-dim" style={{ fontSize: 12, fontWeight: 600 }}>Qisman to‘lovlar</div>
            <div className="num" style={{ fontSize: 18, fontWeight: 800, color: '#facc15', margin: '2px 0' }}>
              {partialCount} ta
            </div>
            <div className="cell-faint" style={{ fontSize: 11 }}>Qoldiq kutilmoqda</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-head">
          <div className="filters" style={{ flex: 1, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="input search"
              placeholder="Mijoz F.I.Sh, telefon, IMEI, model yoki chek bo‘yicha qidiring..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setOffset(0)
              }}
              style={{ minWidth: 280 }}
            />
            <div className="btn-row">
              {SCOPES.map((s) => (
                <button
                  key={s.value}
                  className={`btn btn-sm${scope === s.value ? ' btn-primary' : ' btn-ghost'}`}
                  onClick={() => {
                    setScope(s.value)
                    setOffset(0)
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : !data?.items?.length ? (
          <Empty
            icon={isArchived ? '📦' : '⊞'}
            text={isArchived ? 'Arxivlangan to‘lovlar yo‘q' : 'To‘lovlar topilmadi'}
            hint={
              debouncedSearch
                ? 'Qidiruvni o‘zgartiring.'
                : isArchived
                  ? undefined
                  : scope === 'overdue'
                    ? 'Kechikkan to‘lov yo‘q — barchasi muddatida. Yuqoridan boshqa holatni tanlang.'
                    : 'Yuqoridan boshqa holat yoki “Barcha to‘lovlar”ni tanlang.'
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table-cards">
                <thead>
                  <tr>
                    <th>Mijoz va Bog‘lanish</th>
                    <th>Qurilma modeli</th>
                    <th>To‘lov bosqichi</th>
                    <th>Muddat & Kechikish</th>
                    <th>Oylik reja</th>
                    <th>To‘langan miqdor</th>
                    <th>Farq / Hisob-kitob</th>
                    <th>Holat</th>
                    <th style={{ textAlign: 'right' }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => {
                    const days = relativeDays(p.due_date)
                    const overdueDays = days !== null && days < 0 ? -days : 0
                    const pastGrace = overdueDays > p.grace_days
                    const amountNum = Number(p.amount)
                    const paidNum = Number(p.paid_amount)
                    const diff = paidNum - amountNum
                    const isFullyPaid = paidNum >= amountNum || p.status === 'paid'

                    return (
                      <tr
                        key={p.id}
                        className="clickable"
                        onClick={() => navigate(`/payments/${p.id}`)}
                      >
                        {/* 1. Customer */}
                        <td data-label="Mijoz">
                          <div className="cell-strong">{p.customer_name || '—'}</div>
                          <div className="cell-faint mono" style={{ fontSize: 11.5 }}>
                            {p.customer_phone}
                          </div>
                        </td>

                        {/* 2. Device */}
                        <td data-label="Qurilma">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {p.platform === 'ios' ? (
                              <IconApple size={15} style={{ color: 'var(--text)' }} />
                            ) : (
                              <IconAndroid size={15} style={{ color: '#10b981' }} />
                            )}
                            <span className="cell-strong" style={{ fontSize: 13 }}>
                              {p.device_model || `#${p.device_id}`}
                            </span>
                            {isArchived && (
                              <span className="badge badge-locked" style={{ fontSize: 10, padding: '1px 5px' }}>
                                Arxivda
                              </span>
                            )}
                          </div>
                          <div className="cell-faint" style={{ fontSize: 11 }}>
                            {platformLabel[p.platform]} · ID #{p.device_id}
                          </div>
                        </td>

                        {/* 3. Installment Sequence */}
                        <td data-label="Bosqich">
                          <div className="mono cell-strong" style={{ color: 'var(--primary)', fontSize: 13 }}>
                            {p.seq}-to‘lov
                            {p.contract_months ? (
                              <span className="cell-faint" style={{ fontSize: 11.5, fontWeight: 'normal' }}>
                                {' '}/ {p.contract_months} oy
                              </span>
                            ) : null}
                          </div>
                          <div className="cell-faint" style={{ fontSize: 11 }}>
                            Shartnoma #{p.contract_id}
                          </div>
                        </td>

                        {/* 4. Due Date & Grace */}
                        <td data-label="Muddat">
                          <div className="cell-strong">{date(p.due_date)}</div>
                          {days !== null && p.status !== 'paid' && (
                            <div
                              className="cell-faint"
                              style={{
                                fontSize: 11,
                                color: pastGrace ? '#ef4444' : overdueDays > 0 ? '#f59e0b' : '#10b981',
                                fontWeight: 600,
                              }}
                            >
                              {overdueDays > 0
                                ? `${overdueDays} kun kechikdi${pastGrace ? ' (Grace o‘tdi)' : ''}`
                                : days === 0
                                  ? 'Bugun to‘lash kuni'
                                  : `${days} kun qoldi`}
                            </div>
                          )}
                        </td>

                        {/* 5. Scheduled Amount */}
                        <td data-label="Oylik reja" className="num">
                          <strong style={{ fontSize: 13.5 }}>{sum(p.amount)}</strong>
                        </td>

                        {/* 6. Paid Amount */}
                        <td data-label="To‘langan" className="num">
                          {paidNum > 0 ? (
                            <div>
                              <strong style={{ color: '#22c55e', fontSize: 13.5 }}>{sum(p.paid_amount)}</strong>
                              {p.paid_at && (
                                <div className="cell-faint" style={{ fontSize: 11 }}>
                                  {dateTime(p.paid_at)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="cell-faint">0 so‘m</span>
                          )}
                        </td>

                        {/* 7. Difference / Detail Analysis */}
                        <td data-label="Farq">
                          {isFullyPaid ? (
                            diff > 0 ? (
                              <span className="badge badge-active plain" style={{ fontSize: 11 }}>
                                +{sum(diff)} ortiqcha
                              </span>
                            ) : (
                              <span className="badge badge-active plain" style={{ fontSize: 11 }}>
                                ✓ Yakunlandi
                              </span>
                            )
                          ) : paidNum > 0 ? (
                            <span className="badge badge-warning plain" style={{ fontSize: 11 }}>
                              -{sum(Math.abs(diff))} kam
                            </span>
                          ) : (
                            <span className="badge badge-danger plain" style={{ fontSize: 11 }}>
                              -{sum(amountNum)} to‘lanmagan
                            </span>
                          )}
                        </td>

                        {/* 8. Status */}
                        <td data-label="Holat">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <PaymentBadge status={p.status} />
                            <DeviceBadge status={p.device_status} />
                          </div>
                        </td>

                        {/* 9. Actions */}
                        <td className="actions-cell" style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div className="btn-row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => navigate(`/payments/${p.id}`)}
                              title="To‘lov sahifasiga o‘tish"
                            >
                              Tafsilot <IconArrowRight size={13} />
                            </button>

                            {/* Archive button (in active list) */}
                            {!isArchived && can('admin', 'operator') && (
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => setArchiveTarget(p)}
                                title="To‘liq yakunlangan yoki yopilgan qurilma va to‘lovlarni arxivga olish"
                              >
                                <IconTrash size={14} />
                              </button>
                            )}

                            {/* Restore button (in archived list) */}
                            {isArchived && can('admin') && (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => setRestoreTarget(p)}
                                disabled={restoreDevice.isPending}
                                title="To‘lovlarni faol ro‘yxatga qayta tiklash"
                              >
                                Qayta tiklash
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Pagination total={data.total} limit={LIMIT} offset={offset} onChange={setOffset} />
          </>
        )}
      </div>

      {/* Archive Modal */}
      {archiveTarget && (
        <ConfirmModal
          title="Qurilma va to‘lovlarni arxivga olish"
          message={`Haqiqatan ham "${archiveTarget.customer_name}" mijozining "${archiveTarget.device_model || 'Qurilma'}" (ID: #${archiveTarget.device_id}) qurilmasi va unga tegishli to‘lovlarini arxivga o‘tkazmoqchimisiz? Shunda faol to‘lovlar ro‘yxati toza turadi va istalgan payt arxivdan qayta tiklash mumkin.`}
          confirmLabel="Arxivga o‘tkazish"
          danger
          isLoading={archiveDevice.isPending}
          onConfirm={handleArchive}
          onClose={() => setArchiveTarget(null)}
        />
      )}

      {/* Restore Modal */}
      {restoreTarget && (
        <ConfirmModal
          title="To‘lovlarni arxivdan qayta tiklash"
          message={`"${restoreTarget.customer_name}" mijozining "${restoreTarget.device_model || 'Qurilma'}" (ID: #${restoreTarget.device_id}) qurilmasi va barcha to‘lovlarini faol to‘lovlar ro‘yxatiga qayta tiklamoqchimisiz?`}
          confirmLabel="Faol ro‘yxatga tiklash"
          isLoading={restoreDevice.isPending}
          onConfirm={handleRestore}
          onClose={() => setRestoreTarget(null)}
        />
      )}
    </>
  )
}
