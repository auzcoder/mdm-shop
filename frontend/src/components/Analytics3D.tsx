import { useState } from 'react'

import { sum } from '../lib/format'
import type { DashboardStats } from '../lib/types'

export function DonutChart3D({ stats }: { stats: DashboardStats }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const items = [
    { label: 'Faol', key: 'active', count: stats.active_devices, color: '#10b981' },
    { label: 'Bloklangan', key: 'locked', count: stats.locked_devices, color: '#ef4444' },
    { label: 'Kutilmoqda', key: 'pending', count: stats.pending_devices, color: '#f59e0b' },
    { label: 'Chiqarilgan', key: 'released', count: stats.released_devices, color: '#64748b' },
    { label: 'Yo‘qolgan', key: 'lost', count: stats.lost_devices, color: '#a855f7' },
  ].filter((i) => i.count > 0)

  const total = items.reduce((acc, i) => acc + i.count, 0) || 1
  let cumulative = 0

  const radius = 68
  const strokeWidth = 16
  const circumference = 2 * Math.PI * radius

  return (
    <div className="donut-3d-wrap">
      <div className="donut-3d-svg-box">
        <svg viewBox="0 0 200 200" className="donut-3d-svg">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {items.map((item) => {
            const strokeDasharray = `${(item.count / total) * circumference} ${circumference}`
            const strokeDashoffset = -cumulative
            cumulative += (item.count / total) * circumference

            const isHov = hovered === item.key

            return (
              <circle
                key={item.key}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHov ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="donut-segment"
                onMouseEnter={() => setHovered(item.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  filter: isHov ? `drop-shadow(0 0 8px ${item.color})` : undefined,
                  transition: 'stroke-width 0.2s, filter 0.2s',
                  cursor: 'pointer',
                }}
              />
            )
          })}
        </svg>

        <div className="donut-3d-center">
          <div className="donut-center-num">{stats.total_devices}</div>
          <div className="donut-center-label">Qurilmalar</div>
        </div>
      </div>

      <div className="donut-3d-legend">
        {items.map((item) => (
          <div
            key={item.key}
            className={`legend-item ${hovered === item.key ? 'legend-item-active' : ''}`}
            onMouseEnter={() => setHovered(item.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="legend-dot" style={{ background: item.color }} />
            <span className="legend-name">{item.label}</span>
            <span className="legend-val num">{item.count}</span>
            <span className="legend-pct num">
              {((item.count / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CollectionGauge({
  collected,
  outstanding,
}: {
  collected: string
  outstanding: string
}) {
  const numCollected = Number(collected) || 0
  const numOutstanding = Number(outstanding) || 0
  const total = numCollected + numOutstanding || 1
  const rate = Math.min(100, Math.round((numCollected / total) * 100))

  return (
    <div className="gauge-3d-card">
      <div className="gauge-header">
        <div className="gauge-title">Yig‘ish ko‘rsatkichi</div>
        <div className="gauge-pct-badge">{rate}%</div>
      </div>

      <div className="gauge-bar-track">
        <div className="gauge-bar-fill" style={{ width: `${rate}%` }} />
      </div>

      <div className="gauge-footer-stats">
        <div className="stat-col">
          <span className="col-label">Yig‘ilgan summa</span>
          <span className="col-val num" style={{ color: '#10b981' }}>
            {sum(collected)}
          </span>
        </div>
        <div className="stat-col" style={{ textAlign: 'right' }}>
          <span className="col-label">Qolgan qarz</span>
          <span className="col-val num" style={{ color: '#f59e0b' }}>
            {sum(outstanding)}
          </span>
        </div>
      </div>
    </div>
  )
}
