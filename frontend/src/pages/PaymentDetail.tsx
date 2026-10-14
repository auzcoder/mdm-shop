import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { api, downloadFile } from '../lib/api'
import { useAuth } from '../lib/auth'
import { usePayments, type PaymentRow } from '../hooks/usePayments'
import { date, dateTime, platformLabel, relativeDays, sum } from '../lib/format'
import {
  IconAndroid,
  IconApple,
  IconCreditCard,
  IconPhone,
  IconPrinter,
  IconReceipt,
  IconSmartphone,
  IconUsers,
} from '../components/Icons'
import { printPaymentReceipt } from '../lib/print'
import type { ListResponse, PaymentPenalty, PaymentTransaction } from '../lib/types'
import { DeviceBadge, Field, Loading, Modal, PaymentBadge } from '../components/ui'
import { MoneyInput } from '../components/MoneyInput'
import { useToast } from '../components/Toast'

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>()
  const paymentId = Number(id)
  const { pay } = usePayments()
  const { allocate } = usePayments('', '', 0, 1)
  const { success, error } = useToast()
  const { can, hasFeature } = useAuth()
  const queryClient = useQueryClient()

  const { data: p, isLoading, refetch } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => api.get<PaymentRow>(`/payments/${paymentId}`),
    enabled: Number.isFinite(paymentId),
  })

  const { data: penalty, refetch: refetchPenalty } = useQuery({
    queryKey: ['payment', paymentId, 'penalty'],
    queryFn: () => api.get<PaymentPenalty>(`/payments/${paymentId}/penalty`),
    enabled: Number.isFinite(paymentId),
  })

  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['payment', paymentId, 'transactions'],
    queryFn: () => api.get<ListResponse<PaymentTransaction>>(`/payments/${paymentId}/transactions`),
    enabled: Number.isFinite(paymentId),
  })

  const [reminding, setReminding] = useState(false)
  const [refundTx, setRefundTx] = useState<PaymentTransaction | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundBusy, setRefundBusy] = useState(false)
  const canRemind = can('admin', 'operator', 'accountant')
  const handleRemind = async () => {
    setReminding(true)
    try {
      await api.post(`/payments/${paymentId}/remind`)
      success('Eslatma yuborildi', 'Mijozga SMS yuborildi')
    } catch (err) {
      error('Yuborilmadi', err instanceof Error ? err.message : 'Eslatma yuborib bo‘lmadi')
    } finally {
      setReminding(false)
    }
  }

  // State for partial/full payment modal or action
  const [payAmount, setPayAmount] = useState<number>(0)
  const [extRef, setExtRef] = useState('')

  if (isLoading) return <Loading />
  if (!p) return <div className="card"><div className="card-body">To‘lov topilmadi</div></div>

  const amountNum = Number(p.amount)
  const paidNum = Number(p.paid_amount)
  const remainingInstallment = Math.max(0, amountNum - paidNum)
  const diff = paidNum - amountNum
  const days = relativeDays(p.due_date)
  const overdueDays = days !== null && days < 0 ? -days : 0
  const pastGrace = overdueDays > p.grace_days

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountToPay = payAmount > 0 ? payAmount : remainingInstallment
    if (amountToPay <= 0) return

    try {
      await pay.mutateAsync({
        paymentId: p.id,
        input: {
          amount: String(amountToPay),
          external_ref: extRef.trim() || undefined,
        },
      })
      success('To‘lov qabul qilindi', `${sum(amountToPay)} muvaffaqiyatli kiritildi`)
      setPayAmount(0)
      setExtRef('')
      void refetch()
      void refetchTransactions()
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'To‘lovni qabul qilib bo‘lmadi')
    }
  }

  const handleAllocateSubmit = async () => {
    const amountToPay = payAmount > 0 ? payAmount : remainingInstallment
    if (amountToPay <= 0) return
    try {
      const res = await allocate.mutateAsync({
        contract_id: p.contract_id,
        amount: String(amountToPay),
        external_ref: extRef.trim() || undefined,
      })
      success('To‘lov taqsimlandi', `${res.allocations.length} ta bo‘lakka yoyildi`)
      setPayAmount(0)
      setExtRef('')
      void refetch()
      void refetchTransactions()
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'To‘lovni taqsimlab bo‘lmadi')
    }
  }

  const handleReceiptPDF = async () => {
    try {
      await downloadFile(`/payments/${p.id}/receipt.pdf`, `payment-${p.id}-receipt.pdf`)
    } catch (err) {
      error('Yuklab bo‘lmadi', err instanceof Error ? err.message : 'Kvitansiya PDF yuklab bo‘lmadi')
    }
  }

  const handleRefund = (tx: PaymentTransaction) => {
    setRefundTx(tx)
    setRefundReason('')
  }

  const confirmRefund = async () => {
    if (!refundTx) return
    setRefundBusy(true)
    try {
      await api.post(`/payment-transactions/${refundTx.id}/refund`, { reason: refundReason.trim() })
      success('To‘lov qaytarildi', `${sum(refundTx.amount)} refund qilindi`)
      setRefundTx(null)
      await refetch()
      await refetchTransactions()
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Refund qilib bo‘lmadi')
    } finally {
      setRefundBusy(false)
    }
  }

  const handlePenaltyWaive = async () => {
    if (!penalty) return
    try {
      await api.post<PaymentPenalty>(`/payments/${p.id}/penalty/waive`, {
        waived: !penalty.penalty_waived,
      })
      success(
        penalty.penalty_waived ? 'Penya qayta yoqildi' : 'Penya bekor qilindi',
        `${p.seq}-to‘lov bo‘yicha penya sozlandi`
      )
      await refetchPenalty()
      await queryClient.invalidateQueries({ queryKey: ['audit'] })
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Penyani sozlab bo‘lmadi')
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumbs */}
      <div className="page-breadcrumb">
        <Link to="/payments">To‘lovlar jurnali</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">To‘lov #{p.id} kvitansiyasi</span>
      </div>

      {/* Page Header */}
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>To‘lov tafsiloti va Kvitansiya</h1>
            <PaymentBadge status={p.status} />
            <span className="badge badge-info plain">ID #{p.id}</span>
          </div>
          <div className="page-desc">
            {p.customer_name} · {p.device_model} ({p.seq}-to‘lov)
          </div>
        </div>

        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={handleReceiptPDF}>
            <IconReceipt size={16} /> Receipt PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => printPaymentReceipt(p)}>
            <IconPrinter size={16} /> Kvitansiyani chop etish
          </button>
          {hasFeature('sms_reminder') && canRemind && p.status !== 'paid' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRemind}
              disabled={reminding || !p.customer_phone}
              title={p.customer_phone ? 'Mijozga SMS eslatma yuborish' : 'Mijoz telefon raqami yo‘q'}
            >
              {reminding ? <span className="spinner" /> : <IconPhone size={16} />}
              Eslatma yuborish
            </button>
          )}
          <Link to={`/devices/${p.device_id}`} className="btn btn-primary">
            <IconSmartphone size={16} /> Qurilma kartochkasi
          </Link>
        </div>
      </div>

      <div className="calc-layout" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(340px, 0.9fr)' }}>
        {/* Left Column: Receipt Details & Payment Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card 1: Kvitansiya Asosiy hisobi */}
          <div className="card">
            <div className="card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconReceipt size={18} style={{ color: 'var(--primary)' }} />
                <h2>To‘lov kvitansiyasi hisob-kitobi</h2>
              </div>
              <span className="mono cell-faint">Sana: {date(p.due_date)}</span>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Visual Status Highlight Banner */}
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: diff < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    border: `1px solid ${diff < 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: diff < 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                      {diff === 0 ? 'To‘lov to‘liq amalga oshirilgan' : diff > 0 ? 'Ortiqcha (Avans) to‘langan' : 'Qarzdorlik / Yetishmovchilik'}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: diff < 0 ? '#ef4444' : '#22c55e', marginTop: 2 }}>
                      {diff === 0 ? '✓ 100% To‘langan' : `${diff > 0 ? '+' : '-'}${sum(Math.abs(diff))}`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="cell-faint" style={{ fontSize: 12 }}>Belgilangan muddat:</div>
                    <div className="cell-strong" style={{ fontSize: 14 }}>{date(p.due_date)}</div>
                    {days !== null && p.status !== 'paid' && (
                      <div style={{ fontSize: 12, color: pastGrace ? '#ef4444' : overdueDays > 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                        {overdueDays > 0 ? `${overdueDays} kun kechikkan` : `${days} kun qoldi`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculation Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <span className="cell-dim">Rejalashtirilgan oylik to‘lov:</span>
                    <strong className="num" style={{ fontSize: 15 }}>{sum(p.amount)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <span className="cell-dim">Haqiqatda to‘langan miqdor:</span>
                    <strong className="num" style={{ fontSize: 16, color: '#22c55e' }}>{sum(p.paid_amount)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <span className="cell-dim">Ushbu bo‘lak bo‘yicha qoldiq:</span>
                    <strong className="num" style={{ color: remainingInstallment > 0 ? '#ef4444' : '#22c55e' }}>
                      {sum(remainingInstallment)}
                    </strong>
                  </div>

                  {p.external_ref && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                      <span className="cell-dim">Kvitansiya / Chek raqami:</span>
                      <span className="mono">{p.external_ref}</span>
                    </div>
                  )}

                  {penalty && penalty.penalty_days > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-soft)', alignItems: 'center' }}>
                      <span className="cell-dim">Penya ({penalty.penalty_days} kun × {penalty.daily_percent}%):</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                        <strong className="num" style={{ color: penalty.penalty_enabled ? '#ef4444' : '#94a3b8' }}>
                          {penalty.penalty_enabled ? sum(penalty.penalty_amount) : penalty.penalty_waived ? 'Bekor qilingan' : 'O‘chiq'}
                        </strong>
                        {can('admin') && (
                          <button type="button" className="btn btn-sm btn-secondary" onClick={handlePenaltyWaive}>
                            {penalty.penalty_waived ? 'Penyani qayta yoqish' : 'Penyani bekor qilish'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {p.paid_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span className="cell-dim">Oxirgi to‘lov vaqti:</span>
                      <span>{dateTime(p.paid_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: To'lov qabul qilish (agar to'lanmagan yoki qisman bo'lsa) */}
          {remainingInstallment > 0 && (
            <form onSubmit={handlePaySubmit}>
              <div className="card">
                <div className="card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconCreditCard size={18} style={{ color: '#22c55e' }} />
                    <h2>Ushbu to‘lovni qabul qilish</h2>
                  </div>
                  <span className="badge badge-active plain">Yetishmovchilik: {sum(remainingInstallment)}</span>
                </div>

                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Field label="To‘lanayotgan summa (so‘m)">
                      <MoneyInput
                        value={payAmount || remainingInstallment}
                        onChange={(num) => setPayAmount(num)}
                        placeholder="Summani kiriting"
                      />
                    </Field>

                    <Field label="Kvitansiya yoki tranzaksiya raqami (ixtiyoriy)">
                      <input
                        className="input mono"
                        value={extRef}
                        onChange={(e) => setExtRef(e.target.value)}
                        placeholder="Masalan: PAYME-9841284 yoki Naqd"
                      />
                    </Field>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={allocate.isPending}
                        onClick={handleAllocateSubmit}
                      >
                        {allocate.isPending && <span className="spinner" />}
                        Eng eski qarzlarga taqsimlash
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={pay.isPending}
                        style={{ minWidth: 180, justifyContent: 'center' }}
                      >
                        {pay.isPending && <span className="spinner" />}
                        To‘lovni tasdiqlash ({sum(payAmount || remainingInstallment)})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          <div className="card">
            <div className="card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconReceipt size={18} style={{ color: 'var(--cyan-neon)' }} />
                <h2>To‘lov ledgeri</h2>
              </div>
              <span className="cell-faint">{transactions?.items?.length || 0} transaction</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Turi</th>
                    <th>Summa</th>
                    <th>Holat</th>
                    <th>Sana</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(transactions?.items || []).map((tx) => (
                    <tr key={tx.id}>
                      <td className="mono">#{tx.id}</td>
                      <td>{tx.kind === 'refund' ? 'Refund' : 'To‘lov'}</td>
                      <td className="num cell-strong">{sum(tx.amount)}</td>
                      <td>
                        <span className={`badge ${tx.status === 'posted' ? 'badge-active' : 'badge-released'} plain`}>
                          {tx.status}
                        </span>
                        {tx.reason && <div className="cell-faint">{tx.reason}</div>}
                      </td>
                      <td className="cell-dim">{dateTime(tx.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {can('admin') && tx.kind === 'payment' && tx.status === 'posted' && (
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleRefund(tx)}>
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Contract Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Customer Profile Card */}
          <div className="settings-card" style={{ background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <IconUsers size={18} style={{ color: 'var(--primary)' }} />
              <div className="cell-strong" style={{ fontSize: 14 }}>Mijoz ma’lumotlari</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="cell-dim">F.I.Sh:</span>
                <strong className="cell-strong">{p.customer_name || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="cell-dim">Telefon:</span>
                <span className="mono">{p.customer_phone}</span>
              </div>
            </div>
          </div>

          {/* Device Profile Card */}
          <div className="settings-card" style={{ background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {p.platform === 'ios' ? <IconApple size={18} /> : <IconAndroid size={18} style={{ color: '#10b981' }} />}
              <div className="cell-strong" style={{ fontSize: 14 }}>Qurilma rekvizitlari</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="cell-dim">Model:</span>
                <strong>{p.device_model || `#${p.device_id}`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="cell-dim">Platforma:</span>
                <span>{platformLabel[p.platform]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="cell-dim">Qurilma holati:</span>
                <DeviceBadge status={p.device_status} />
              </div>
            </div>
          </div>

          {/* Contract Overview */}
          <div className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <IconCreditCard size={18} style={{ color: 'var(--cyan-neon)' }} />
              <div className="cell-strong" style={{ fontSize: 14 }}>Shartnoma #{p.contract_id}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="cell-dim">To‘lov tartibi:</span>
                <strong className="mono" style={{ color: 'var(--primary)' }}>
                  {p.seq}-to‘lov {p.contract_months ? `/ ${p.contract_months} oy` : ''}
                </strong>
              </div>
              {p.contract_total && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="cell-dim">Jami shartnoma:</span>
                  <strong className="num">{sum(p.contract_total)}</strong>
                </div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <Link to={`/devices/${p.device_id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Barcha to‘lovlar grafigini ko‘rish →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {refundTx && (
        <Modal
          title="To‘lovni qaytarish (Refund)"
          onClose={() => setRefundTx(null)}
          footer={
            <>
              <button className="btn" onClick={() => setRefundTx(null)} disabled={refundBusy}>
                Bekor qilish
              </button>
              <button className="btn btn-danger" onClick={confirmRefund} disabled={refundBusy}>
                {refundBusy && <span className="spinner" />}
                {sum(refundTx.amount)} qaytarish
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              {sum(refundTx.amount)} miqdoridagi to‘lov qaytariladi. Bu amal qarz qoldig‘ini qayta oshiradi.
            </div>
            <Field label="Sabab (ixtiyoriy)">
              <textarea
                className="input"
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Masalan: xato kiritilgan to‘lov"
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  )
}
