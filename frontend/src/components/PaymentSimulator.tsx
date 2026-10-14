import { useState } from 'react'
import { Link } from 'react-router-dom'

import { date, sum } from '../lib/format'
import { IconCalculator } from './Icons'

const QUICK_AMOUNTS = [
  { label: '10 mln', val: 10_000_000 },
  { label: '30 mln', val: 30_000_000 },
  { label: '50 mln', val: 50_000_000 },
  { label: '100 mln', val: 100_000_000 },
  { label: '150 mln', val: 150_000_000 },
  { label: '200 mln', val: 200_000_000 },
]

export function PaymentSimulator() {
  const [basePrice, setBasePrice] = useState<number>(30_000_000)
  const [markupPercent, setMarkupPercent] = useState<number>(30)
  const [downPercent, setDownPercent] = useState<number>(20)
  const [months, setMonths] = useState<number>(12)
  const [graceDays, setGraceDays] = useState<number>(3)

  const markupAmount = Math.round((basePrice * markupPercent) / 100)
  const totalAmount = basePrice + markupAmount
  const downPayment = Math.round((totalAmount * downPercent) / 100)
  const financedAmount = Math.max(0, totalAmount - downPayment)
  const monthlyPayment = months > 0 ? Math.round(financedAmount / months) : 0

  const today = new Date()
  const schedule = Array.from({ length: months }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i + 1, today.getDate())
    return {
      seq: i + 1,
      dueDate: d.toISOString().slice(0, 10),
      amount: monthlyPayment,
    }
  })

  return (
    <div className="simulator-card">
      <div className="simulator-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="simulator-icon">
            <IconCalculator size={20} />
          </div>
          <div>
            <div className="simulator-title">Nasiya to‘lov simulyatori</div>
            <div className="simulator-desc">Oylik to‘lov va jadvalni interaktiv hisoblash</div>
          </div>
        </div>

        <Link to="/calculator" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
          To‘liq kalkulyator sahifasi →
        </Link>
      </div>

      <div className="calc-preset-pills" style={{ marginBottom: 16 }}>
        {QUICK_AMOUNTS.map((p) => (
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

      <div className="simulator-grid">
        <div className="sim-controls">
          <div className="sim-control-group">
            <div className="control-label-row">
              <span>Asl narx:</span>
              <strong className="num">{sum(basePrice)}</strong>
            </div>
            <input
              type="range"
              min={1000000}
              max={100000000}
              step={500000}
              value={Math.min(basePrice, 100000000)}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="sim-slider"
            />
          </div>

          <div className="sim-control-group">
            <div className="control-label-row">
              <span>Ustama foizi (+{markupPercent}%):</span>
              <strong className="num" style={{ color: 'var(--primary)' }}>+{sum(markupAmount)}</strong>
            </div>
            <div className="btn-row" style={{ marginTop: 4 }}>
              {[0, 15, 20, 30, 40, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`btn btn-sm ${markupPercent === pct ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setMarkupPercent(pct)}
                  style={{ padding: '4px 8px', fontSize: 11.5 }}
                >
                  {pct === 0 ? '0%' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="sim-control-group">
            <div className="control-label-row">
              <span>Boshlang‘ich to‘lov ({downPercent}%):</span>
              <strong className="num">{sum(downPayment)}</strong>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={downPercent}
              onChange={(e) => setDownPercent(Number(e.target.value))}
              className="sim-slider"
            />
          </div>

          <div className="sim-control-group">
            <div className="control-label-row">
              <span>Muddat:</span>
              <strong>{months} oy</strong>
            </div>
            <div className="btn-row">
              {[3, 6, 9, 12, 18, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`btn btn-sm ${months === m ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setMonths(m)}
                >
                  {m} oy
                </button>
              ))}
            </div>
          </div>

          <div className="sim-control-group">
            <div className="control-label-row">
              <span>Grace period (kechikish ruxsati):</span>
              <strong>{graceDays} kun</strong>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={graceDays}
              onChange={(e) => setGraceDays(Number(e.target.value))}
              className="sim-slider"
            />
          </div>
        </div>

        <div className="sim-result-panel">
          <div className="sim-result-box">
            <div className="result-label">Oylik to‘lov</div>
            <div className="result-amount num">{sum(monthlyPayment)}</div>
            <div className="result-note">
              har oy 1 martadan · {months} oy davomida
            </div>
          </div>

          <div className="sim-breakdown">
            <div className="breakdown-row">
              <span>Jami summa (ustama bilan):</span>
              <strong className="num">{sum(totalAmount)}</strong>
            </div>
            <div className="breakdown-row">
              <span>Boshlang‘ich to‘lov:</span>
              <strong className="num">{sum(downPayment)}</strong>
            </div>
            <div className="breakdown-row">
              <span>Nasiya qoldig‘i:</span>
              <strong className="num">{sum(financedAmount)}</strong>
            </div>
            <div className="breakdown-row">
              <span>Grace period:</span>
              <span className="cell-faint">{graceDays} kun kechiksa bloklanadi</span>
            </div>
          </div>

          <div className="sim-schedule-preview">
            <div className="preview-title">To‘lovlar taqvimi</div>
            <div className="preview-list">
              {schedule.slice(0, 3).map((s) => (
                <div key={s.seq} className="schedule-item">
                  <span className="seq-badge">#{s.seq}</span>
                  <span className="due-date">{date(s.dueDate)}</span>
                  <strong className="due-amount num">{sum(s.amount)}</strong>
                </div>
              ))}
              {schedule.length > 3 && (
                <div className="schedule-more">va yana {schedule.length - 3} ta to‘lov…</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
