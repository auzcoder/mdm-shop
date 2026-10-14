import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { date, platformLabel, sum } from '../lib/format'
import type { DeviceDetail as Detail } from '../lib/types'
import { usePayments } from '../hooks/usePayments'
import {
  IconActivity,
  IconAndroid,
  IconApple,
  IconCheck,
  IconClock,
  IconCreditCard,
  IconPercent,
  IconPlus,
  IconSmartphone,
  IconUsers,
} from '../components/Icons'
import { DeviceBadge, Loading } from '../components/ui'
import { MoneyInput } from '../components/MoneyInput'
import { useToast } from '../components/Toast'

const AMOUNT_PRESETS = [
  { label: '10 mln', val: 10_000_000 },
  { label: '20 mln', val: 20_000_000 },
  { label: '30 mln', val: 30_000_000 },
  { label: '50 mln', val: 50_000_000 },
  { label: '100 mln', val: 100_000_000 },
  { label: '150 mln', val: 150_000_000 },
  { label: '200 mln', val: 200_000_000 },
]

const MARKUP_PRESETS = [0, 15, 20, 25, 30, 35, 40, 50]
const DOWN_PERCENT_PRESETS = [0, 10, 15, 20, 25, 30, 40, 50]
const MONTH_PRESETS = [3, 6, 9, 12, 18, 24, 36]

export default function Calculator() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceIdParam = searchParams.get('device_id')
  const deviceId = deviceIdParam ? Number(deviceIdParam) : null

  const { createContract } = usePayments()
  const { can } = useAuth()
  // Shartnoma tuzishni faqat admin/operator bajaradi (backend ham shuni talab qiladi).
  const canCreateContract = can('admin', 'operator')
  const { success, error } = useToast()

  // Fetch device details if device_id is linked
  const { data: detail, isLoading: loadingDevice } = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => api.get<Detail>(`/devices/${deviceId}`),
    enabled: !!deviceId && Number.isFinite(deviceId),
  })

  // Base product price
  const [basePrice, setBasePrice] = useState<number>(20_000_000)
  // Markup / interest percent added to price (e.g. 30%)
  const [markupPercent, setMarkupPercent] = useState<number>(30)
  // Down payment percent (e.g. 20%)
  const [downPercent, setDownPercent] = useState<number>(20)
  // Term in months
  const [months, setMonths] = useState<number>(12)
  // Grace period days
  const [graceDays, setGraceDays] = useState<number>(3)
  // Start date
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))

  // Calculations
  const markupAmount = Math.round((basePrice * markupPercent) / 100)
  const totalAmount = basePrice + markupAmount
  const downPayment = Math.round((totalAmount * downPercent) / 100)
  const financedAmount = Math.max(0, totalAmount - downPayment)
  const monthlyPayment = months > 0 ? Math.round(financedAmount / months) : 0

  // Schedule generator
  const start = new Date(startDate || new Date().toISOString().slice(0, 10))
  let runningBalance = financedAmount

  const schedule = Array.from({ length: Math.max(1, months) }, (_, i) => {
    const dueDate = new Date(start.getFullYear(), start.getMonth() + i + 1, start.getDate())
    const principalPart = months > 0 ? Math.round(basePrice * (1 - downPercent / 100) / months) : 0
    const markupPart = monthlyPayment - principalPart
    runningBalance = Math.max(0, runningBalance - monthlyPayment)

    return {
      seq: i + 1,
      dueDate: dueDate.toISOString().slice(0, 10),
      amount: monthlyPayment,
      principal: principalPart,
      markup: markupPart,
      balance: runningBalance,
    }
  })

  const handleCopySchedule = () => {
    const lines = [
      `📱 NASIYA TO‘LOV GRAFIGI`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      detail?.device ? `Qurilma: #${detail.device.id} ${detail.device.model || ''}` : '',
      detail?.customer ? `Mijoz: ${detail.customer.full_name} (${detail.customer.phone})` : '',
      `Tovar narxi: ${sum(basePrice)}`,
      `Ustama (${markupPercent}%): +${sum(markupAmount)}`,
      `Jami summa: ${sum(totalAmount)}`,
      `Boshlang‘ich to‘lov (${downPercent}%): ${sum(downPayment)}`,
      `Qolgan qarz: ${sum(financedAmount)}`,
      `Muddat: ${months} oy (${months} ta to‘lov)`,
      `Oylik to‘lov: ${sum(monthlyPayment)} / oy`,
      `Grace period: ${graceDays} kun`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `JADVAL:`,
      ...schedule.map(
        (s) => `${s.seq}. ${date(s.dueDate)} — ${sum(s.amount)} (qoldiq: ${sum(s.balance)})`
      ),
    ].filter(Boolean)

    void navigator.clipboard.writeText(lines.join('\n'))
    success('Nusxalandi', 'To‘lov grafigi to‘liq nusxalandi')
  }

  // Handle custom down payment in so'm
  const handleDownPaymentAmountChange = (num: number) => {
    if (totalAmount > 0) {
      const calculatedPct = Math.min(100, Math.round((num / totalAmount) * 100))
      setDownPercent(calculatedPct)
    }
  }

  // Submit and bind contract to target device
  const handleConfirmContract = async () => {
    if (!deviceId) return
    if (totalAmount <= 0) {
      error('Xatolik', 'Umumiy summa 0 dan katta bo‘lishi kerak')
      return
    }

    try {
      await createContract.mutateAsync({
        device_id: deviceId,
        total_amount: String(totalAmount),
        down_payment: String(downPayment),
        months,
        grace_days: graceDays,
        start_date: startDate,
      })
      success('Shartnoma tasdiqlandi', `Qurilma #${deviceId} uchun ${months} oylik grafik biriktirildi`)
      navigate(`/devices/${deviceId}`)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Shartnoma tuzishda xatolik')
    }
  }

  if (loadingDevice) return <Loading />

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumbs if device linked */}
      {detail?.device ? (
        <div className="page-breadcrumb">
          <Link to="/devices">Qurilmalar</Link>
          <span className="crumb-sep">/</span>
          <Link to={`/devices/${detail.device.id}`}>
            {detail.device.model || `Qurilma #${detail.device.id}`}
          </Link>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">Nasiya kalkulyatori va Shartnoma tuzish</span>
        </div>
      ) : null}

      <div className="page-head">
        <div>
          <h1>Nasiya kalkulyatori</h1>
        </div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={handleCopySchedule}>
            <IconCheck size={16} />
            Grafikni nusxalash
          </button>

          {detail?.device && canCreateContract ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmContract}
              disabled={createContract.isPending}
            >
              {createContract.isPending && <span className="spinner" />}
              Shartnomani tasdiqlash va biriktirish →
            </button>
          ) : (
            <Link to="/devices" className="btn btn-primary">
              <IconPlus size={16} />
              Qurilmalar ro‘yxati
            </Link>
          )}
        </div>
      </div>

      {/* Target Device & Customer Linked Banner */}
      {detail?.device && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)',
            border: '1px solid var(--primary-glow)',
            marginBottom: 20,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {detail.device.platform === 'ios' ? <IconApple size={22} /> : <IconAndroid size={22} style={{ color: '#10b981' }} />}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 16 }}>{detail.device.model || `Qurilma #${detail.device.id}`}</strong>
                  <span className="badge badge-info plain">ID #{detail.device.id}</span>
                  <DeviceBadge status={detail.device.status} />
                </div>
                <div className="cell-faint" style={{ fontSize: 12.5, marginTop: 2 }}>
                  Platforma: {platformLabel[detail.device.platform]} · IMEI: {detail.device.imei || '—'}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
              <IconUsers size={16} style={{ color: 'var(--cyan-neon)' }} />
              <div>
                <div className="cell-strong" style={{ fontSize: 13 }}>
                  {detail.customer ? detail.customer.full_name : 'Mijoz biriktirilmagan'}
                </div>
                {detail.customer && (
                  <div className="cell-faint mono" style={{ fontSize: 11.5 }}>
                    {detail.customer.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="calc-layout" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(340px, 0.9fr)' }}>
        {/* Left Column: Interactive Controls with Custom Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 1. Asl tovar narxi */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title">
                <IconCreditCard size={18} style={{ color: 'var(--primary)' }} />
                1. Tovarning asl narxi
              </div>
              <strong className="num" style={{ fontSize: 16, color: 'var(--primary)' }}>
                {sum(basePrice)}
              </strong>
            </div>

            <div className="calc-preset-pills" style={{ marginBottom: 14 }}>
              {AMOUNT_PRESETS.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  className={`calc-preset-btn ${basePrice === p.val ? 'active' : ''}`}
                  onClick={() => setBasePrice(p.val)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MoneyInput
                value={basePrice}
                onChange={(num) => setBasePrice(num)}
              />

              <input
                type="range"
                min="1000000"
                max="250000000"
                step="500000"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="sim-slider"
              />
            </div>
          </div>

          {/* 2. Ustama foizi (Marja) */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title">
                <IconPercent size={18} style={{ color: 'var(--primary)' }} />
                2. Ustama foizi (Marja)
              </div>
              <strong className="num" style={{ fontSize: 16, color: 'var(--primary)' }}>
                +{markupPercent}% (+{sum(markupAmount)})
              </strong>
            </div>

            <div className="calc-preset-pills" style={{ marginBottom: 14 }}>
              {MARKUP_PRESETS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`calc-preset-btn ${markupPercent === pct ? 'active' : ''}`}
                  onClick={() => setMarkupPercent(pct)}
                >
                  {pct}%
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(Number(e.target.value))}
                className="sim-slider"
              />

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max="200"
                  className="input num"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(Math.max(0, Number(e.target.value)))}
                  style={{ paddingRight: 32, textAlign: 'right', fontWeight: 700 }}
                />
                <span
                  className="cell-faint"
                  style={{ position: 'absolute', right: 12, pointerEvents: 'none', fontWeight: 600 }}
                >
                  %
                </span>
              </div>
            </div>
          </div>

          {/* 3. Boshlang‘ich to‘lov */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title">
                <IconCreditCard size={18} style={{ color: '#10b981' }} />
                3. Boshlang‘ich to‘lov
              </div>
              <strong className="num" style={{ fontSize: 16, color: '#10b981' }}>
                {downPercent}% ({sum(downPayment)})
              </strong>
            </div>

            <div className="calc-preset-pills" style={{ marginBottom: 14 }}>
              {DOWN_PERCENT_PRESETS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`calc-preset-btn ${downPercent === pct ? 'active' : ''}`}
                  onClick={() => setDownPercent(pct)}
                >
                  {pct}%
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, alignItems: 'center' }}>
                <MoneyInput
                  value={downPayment}
                  onChange={handleDownPaymentAmountChange}
                  placeholder="Boshlang‘ich to‘lov (so‘m)"
                />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input num"
                    value={downPercent}
                    onChange={(e) => setDownPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    style={{ paddingRight: 32, textAlign: 'right', fontWeight: 700 }}
                  />
                  <span
                    className="cell-faint"
                    style={{ position: 'absolute', right: 12, pointerEvents: 'none', fontWeight: 600 }}
                  >
                    %
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={downPercent}
                onChange={(e) => setDownPercent(Number(e.target.value))}
                className="sim-slider"
              />
            </div>
          </div>

          {/* 4. Muddat va Grace period */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title">
                <IconClock size={18} style={{ color: 'var(--cyan-neon)' }} />
                4. To‘lov muddati va Grace period
              </div>
              <strong className="num" style={{ fontSize: 16 }}>
                {months} oy · {graceDays} kun grace
              </strong>
            </div>

            <div className="calc-preset-pills" style={{ marginBottom: 14 }}>
              {MONTH_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`calc-preset-btn ${months === m ? 'active' : ''}`}
                  onClick={() => setMonths(m)}
                >
                  {m} oy
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Month direct input & slider */}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 6, fontWeight: 600 }}>
                  Nasiya muddati (oylar soni):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, alignItems: 'center' }}>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="sim-slider"
                  />

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      className="input num"
                      value={months}
                      onChange={(e) => setMonths(Math.max(1, Number(e.target.value)))}
                      style={{ paddingRight: 36, textAlign: 'right', fontWeight: 700 }}
                    />
                    <span
                      className="cell-faint"
                      style={{ position: 'absolute', right: 12, pointerEvents: 'none', fontWeight: 600 }}
                    >
                      oy
                    </span>
                  </div>
                </div>
              </div>

              {/* Grace period direct input & slider */}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 6, fontWeight: 600 }}>
                  Grace period (to‘lov kechikkanida bloklanishgacha beriladigan imtiyozli kunlar):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, alignItems: 'center' }}>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={Math.min(graceDays, 30)}
                    onChange={(e) => setGraceDays(Number(e.target.value))}
                    className="sim-slider"
                  />

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      step="1"
                      className="input num"
                      value={graceDays}
                      onChange={(e) => setGraceDays(Math.max(0, Number(e.target.value)))}
                      style={{ paddingRight: 42, textAlign: 'right', fontWeight: 700 }}
                    />
                    <span
                      className="cell-faint"
                      style={{ position: 'absolute', right: 12, pointerEvents: 'none', fontWeight: 600 }}
                    >
                      kun
                    </span>
                  </div>
                </div>
              </div>

              {/* Shartnoma boshlanish sanasi */}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 6, fontWeight: 600 }}>
                  Shartnoma boshlanish sanasi (oylik grafik hisobi):
                </div>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Results & Confirmation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="calc-summary-box">
            <div className="calc-highlight-metric">
              <div className="cell-dim" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Oylik to‘lov summasi
              </div>
              <div className="calc-highlight-val">{sum(monthlyPayment)}</div>
              <div className="cell-faint" style={{ fontSize: 12 }}>
                Har oy {start.getDate()}-sanasida to‘lanadi ({months} oy davomida)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div className="calc-breakdown-row">
                <span className="cell-dim">Tovarning asl narxi:</span>
                <strong className="num">{sum(basePrice)}</strong>
              </div>

              <div className="calc-breakdown-row">
                <span className="cell-dim">Ustama miqdori ({markupPercent}%):</span>
                <span className="num" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  +{sum(markupAmount)}
                </span>
              </div>

              <div className="calc-breakdown-row">
                <span className="cell-dim">Jami to‘lov summasi:</span>
                <strong className="num" style={{ color: 'var(--text)', fontSize: 15 }}>
                  {sum(totalAmount)}
                </strong>
              </div>

              <div className="calc-breakdown-row">
                <span className="cell-dim">Boshlang‘ich to‘lov ({downPercent}%):</span>
                <span className="num" style={{ color: '#10b981', fontWeight: 700 }}>
                  {sum(downPayment)}
                </span>
              </div>

              <div className="calc-breakdown-row" style={{ borderTop: '2px solid var(--border)', marginTop: 4, paddingTop: 12 }}>
                <span className="cell-strong">Bo‘lib to‘lanadigan qoldiq:</span>
                <strong className="num" style={{ color: 'var(--primary)', fontSize: 16 }}>
                  {sum(financedAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Action Card: Confirmation for linked device OR navigation */}
          {detail?.device ? (
            <div className="settings-card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <IconCreditCard size={22} style={{ color: 'var(--primary)' }} />
                <div>
                  <div className="cell-strong" style={{ fontSize: 14 }}>Shartnomani tasdiqlash</div>
                  <div className="cell-faint" style={{ fontSize: 12 }}>
                    Qurilma #{detail.device.id} ga {months} oylik grafik biriktiriladi
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {canCreateContract ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmContract}
                    disabled={createContract.isPending}
                    style={{ width: '100%', justifyContent: 'center', fontSize: 14.5, padding: '12px 16px' }}
                  >
                    {createContract.isPending && <span className="spinner" />}
                    Shartnomani tasdiqlash va biriktirish →
                  </button>
                ) : (
                  <div className="cell-faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '10px 0' }}>
                    Shartnoma tuzish uchun admin yoki operator huquqi kerak.
                  </div>
                )}

                <Link
                  to={`/devices/${detail.device.id}`}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Bekor qilish
                </Link>
              </div>
            </div>
          ) : (
            <div className="settings-card" style={{ background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <IconSmartphone size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <div className="cell-strong" style={{ fontSize: 14 }}>Qurilmaga biriktirish</div>
                  <div className="cell-faint" style={{ fontSize: 12 }}>
                    Qurilma kartochkasiga o‘tib, to‘g‘ridan-to‘g‘ri shartnoma tuzishingiz mumkin
                  </div>
                </div>
              </div>

              <Link to="/devices" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Qurilmalar ro‘yxatiga o‘tish →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Full Monthly Schedule Table */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconActivity size={18} style={{ color: 'var(--primary)' }} />
            <h2>Batafsil to‘lov grafigi ({months} oy)</h2>
          </div>
          <span className="cell-faint">
            Oylik to‘lov: {sum(monthlyPayment)} · Boshlang‘ich: {sum(downPayment)}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>To‘lov sanasi</th>
                <th>Oylik to‘lov</th>
                <th>Asosiy qarz</th>
                <th>Ustama (marja)</th>
                <th>Qolgan qarz</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s) => (
                <tr key={s.seq}>
                  <td className="num cell-faint">#{s.seq}</td>
                  <td>
                    <div className="cell-strong">{date(s.dueDate)}</div>
                  </td>
                  <td className="num cell-strong" style={{ color: 'var(--primary)' }}>
                    {sum(s.amount)}
                  </td>
                  <td className="num cell-dim">{sum(s.principal)}</td>
                  <td className="num cell-faint">+{sum(s.markup)}</td>
                  <td className="num cell-dim">{sum(s.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
