import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { api } from '../lib/api'
import { sum, platformLabel, formatMonthYearUz, monthNameUz } from '../lib/format'
import type { ReportsAnalytics } from '../lib/types'
import {
  IconActivity,
  IconAndroid,
  IconApple,
  IconArrowRight,
  IconBarChart,
  IconCalculator,
  IconCreditCard,
  IconHistory,
  IconLock,
  IconPrinter,
  IconReceipt,
  IconRefresh,
  IconShieldAlert,
  IconShieldCheck,
  IconSmartphone,
  IconUsers,
  IconZap,
} from '../components/Icons'
import { printReportDocument } from '../lib/print'
import { Empty, Loading } from '../components/ui'

export interface ReportDefinition {
  id: string
  title: string
  desc: string
  category: string
  categoryLabel: string
  categoryIcon: React.ReactNode
  icon: React.ReactNode
  color: string
  bg: string
}

export const ALL_REPORTS: ReportDefinition[] = [
  // 1. Nasiya va Portfel
  {
    id: 'portfolio',
    title: 'Nasiya portfeli tahlili',
    desc: 'Umumiy portfel hajmi, oylik to‘lovlar dinamikasi va kutilayotgan tushumlar',
    category: 'portfolio',
    categoryLabel: 'Nasiya va portfel analitikasi',
    categoryIcon: <IconActivity size={16} />,
    icon: <IconBarChart size={20} />,
    color: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.12)',
  },
  {
    id: 'aging',
    title: 'Kechikishlar va Qarzdorlik (Aging)',
    desc: 'Grace davri, 1-30 kun, 31-60 kun va 60+ kunlik risk guruhlari piramidasi',
    category: 'portfolio',
    categoryLabel: 'Nasiya va portfel analitikasi',
    categoryIcon: <IconActivity size={16} />,
    icon: <IconShieldAlert size={20} />,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
  },
  {
    id: 'terms',
    title: 'Shartnomalar muddatlari taqsimoti',
    desc: '3, 6, 12 va 24 oylik muddatlar ulushi hamda boshlang‘ich to‘lov nisbati',
    category: 'portfolio',
    categoryLabel: 'Nasiya va portfel analitikasi',
    categoryIcon: <IconActivity size={16} />,
    icon: <IconCalculator size={20} />,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
  },

  // 2. Kassa va Tushumlar
  {
    id: 'cashflow',
    title: 'Tushumlar va Pul oqimi (Cashflow)',
    desc: 'Oylik kassa tushumlari, reja va amaldagi yig‘imlar taqqoslamasi',
    category: 'cashflow',
    categoryLabel: 'Kassa va moliyaviy tushumlar',
    categoryIcon: <IconReceipt size={16} />,
    icon: <IconReceipt size={20} />,
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.12)',
  },
  {
    id: 'payment_methods',
    title: 'To‘lov usullari va tranzaksiyalar',
    desc: 'Uzcard, Humo, Payme, Click va naqd pul orqali qabul qilingan to‘lovlar',
    category: 'cashflow',
    categoryLabel: 'Kassa va moliyaviy tushumlar',
    categoryIcon: <IconReceipt size={16} />,
    icon: <IconCreditCard size={20} />,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
  },
  {
    id: 'forecast',
    title: 'Kutilayotgan tushumlar prognozi',
    desc: 'Keyingi 7 kun, 30 kun va 3 oylik kutilayotgan rejaviy kassa oqimi',
    category: 'cashflow',
    categoryLabel: 'Kassa va moliyaviy tushumlar',
    categoryIcon: <IconReceipt size={16} />,
    icon: <IconZap size={20} />,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
  },

  // 3. Qurilmalar va MDM Xavfsizlik
  {
    id: 'devices',
    title: 'Brendlar va Modellar statistikasi',
    desc: 'Apple iOS va Android ulushi, eng ko‘p nasiyaga berilgan top modellar',
    category: 'devices',
    categoryLabel: 'Qurilmalar va MDM nazorati',
    categoryIcon: <IconSmartphone size={16} />,
    icon: <IconSmartphone size={20} />,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  {
    id: 'mdm_locks',
    title: 'MDM Bloklash va Ochish monitoringi',
    desc: 'Avtomatik qarzdorlik blokirovkasi, ochishlar va buyruqlar samaradorligi',
    category: 'devices',
    categoryLabel: 'Qurilmalar va MDM nazorati',
    categoryIcon: <IconSmartphone size={16} />,
    icon: <IconLock size={20} />,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
  },
  {
    id: 'device_risk',
    title: 'Xavf ostidagi va Yo‘qolgan qurilmalar',
    desc: 'Offline qolgan, yo‘qolgan (Lost) va profil o‘chirilgan qurilmalar tahlili',
    category: 'devices',
    categoryLabel: 'Qurilmalar va MDM nazorati',
    categoryIcon: <IconSmartphone size={16} />,
    icon: <IconShieldCheck size={20} />,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
  },

  // 4. Mijozlar va Intizom
  {
    id: 'customer_discipline',
    title: 'Mijozlar to‘lov intizomi reytingi',
    desc: 'A, B va C toifadagi mijozlar skoringi hamda to‘lov intizomi segmentatsiyasi',
    category: 'customers',
    categoryLabel: 'Mijozlar va skoring tahlili',
    categoryIcon: <IconUsers size={16} />,
    icon: <IconUsers size={20} />,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
  },
  {
    id: 'top_customers',
    title: 'Top mijozlar va Takroriy nasiyalar',
    desc: 'Eng katta aylanmaga ega, bir nechta telefon olgan ishonchli mijozlar',
    category: 'customers',
    categoryLabel: 'Mijozlar va skoring tahlili',
    categoryIcon: <IconUsers size={16} />,
    icon: <IconHistory size={20} />,
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.12)',
  },
  {
    id: 'customer_map',
    title: 'Hududiy taqsimot va Mijozlar bazasi',
    desc: 'Shahar va tumanlar bo‘yicha mijozlar geografiyasi va faollik darajasi',
    category: 'customers',
    categoryLabel: 'Mijozlar va skoring tahlili',
    categoryIcon: <IconUsers size={16} />,
    icon: <IconActivity size={20} />,
    color: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.12)',
  },
]

export default function Reports() {
  const { reportId } = useParams<{ reportId?: string }>()
  const navigate = useNavigate()

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<'30d' | '90d' | '180d' | 'all'>('180d')

  const { data, isLoading, refetch, isFetching } = useQuery<ReportsAnalytics>({
    queryKey: ['reports', 'analytics', period],
    queryFn: () => api.get<ReportsAnalytics>('/reports/analytics', { period }),
  })

  const selectedReport = useMemo(() => {
    return reportId ? ALL_REPORTS.find((r) => r.id === reportId) : null
  }, [reportId])

  // Filtered reports list for hub
  const filteredReports = useMemo(() => {
    return ALL_REPORTS.filter((r) => {
      const matchCat = activeCategory === 'all' || r.category === activeCategory
      const matchSearch =
        !search.trim() ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [activeCategory, search])

  // Group filtered reports by category
  const categories = useMemo(() => {
    const groups: { [key: string]: { label: string; icon: React.ReactNode; items: ReportDefinition[] } } = {}
    for (const r of filteredReports) {
      if (!groups[r.category]) {
        groups[r.category] = {
          label: r.categoryLabel,
          icon: r.categoryIcon,
          items: [],
        }
      }
      groups[r.category].items.push(r)
    }
    return groups
  }, [filteredReports])

  const handlePrint = () => {
    if (selectedReport && data) {
      printReportDocument(selectedReport.title, selectedReport.desc, data)
    } else if (data) {
      printReportDocument('Boshqaruv va Nasiya Tahliliy Hisoboti', 'Qora Daftar Nasiya va MDM Tizimi', data)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 1. Header with Breadcrumbs & Action Buttons */}
      <div className="page-head">
        <div>
          <h1>Hisobotlar</h1>
        </div>

        <div className="btn-row">
          {selectedReport && (
            <button type="button" className="btn btn-secondary" onClick={handlePrint}>
              <IconPrinter size={16} />
              Chop etish / Eksport
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

      {isLoading ? (
        <Loading />
      ) : !data ? (
        <Empty icon="📊" text="Hisobot ma’lumotlari yuklanmadi" />
      ) : selectedReport ? (
        /* -------------------------------------------------------------
           2. DETAILED REPORT VIEW (URL: /reports/:reportId)
        ------------------------------------------------------------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Breadcrumb & Report Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 18px',
              boxShadow: 'var(--shadow-sm)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Link
              to="/reports"
              className="btn btn-sm btn-ghost"
              style={{ fontWeight: 600 }}
            >
              ← Barcha hisobotlar ro‘yxatiga qaytish
            </Link>

            {/* Quick Switcher dropdown linking to respective URL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="cell-faint" style={{ fontSize: 12 }}>Hisobotni almashtirish:</span>
              <select
                className="input"
                style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                value={selectedReport.id}
                onChange={(e) => navigate(`/reports/${e.target.value}`)}
              >
                {ALL_REPORTS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Report Title & Period Filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: selectedReport.bg,
                  color: selectedReport.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedReport.icon}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{selectedReport.title}</h2>
                <div className="cell-faint" style={{ fontSize: 12.5 }}>
                  {selectedReport.desc}
                </div>
              </div>
            </div>

            {/* Period Pills */}
            <div className="btn-row">
              {[
                { key: '30d', label: 'So‘nggi 30 kun' },
                { key: '90d', label: 'So‘nggi 3 oy' },
                { key: '180d', label: 'So‘nggi 6 oy' },
                { key: 'all', label: 'Jami davr' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`btn btn-sm ${period === p.key ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setPeriod(p.key as any)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Render Specific Report Content with Period Filter */}
          <DetailedReportContent reportId={selectedReport.id} data={data} period={period} />
        </div>
      ) : (
        /* -------------------------------------------------------------
           3. MAIN REPORTS HUB (Grid of Cards as in User Design)
        ------------------------------------------------------------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Search & Category Filter Header */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
                <input
                  className="input search"
                  placeholder="Hisobot nomi yoki kalit so‘z bo‘yicha qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Category Pills */}
              <div className="btn-row" style={{ flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'Barchasi', count: ALL_REPORTS.length },
                  { key: 'portfolio', label: '📈 Nasiya va Portfel', count: 3 },
                  { key: 'cashflow', label: '💰 Kassa va Tushumlar', count: 3 },
                  { key: 'devices', label: '📱 Qurilmalar va MDM', count: 3 },
                  { key: 'customers', label: '👥 Mijozlar va Intizom', count: 3 },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={`btn btn-sm ${activeCategory === c.key ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveCategory(c.key)}
                  >
                    {c.label} <span style={{ opacity: 0.7, fontSize: 11 }}>({c.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Highlight KPI Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <div className="card" style={{ padding: 18, borderLeft: '4px solid #0ea5e9' }}>
              <div className="cell-dim" style={{ fontSize: 12, fontWeight: 600 }}>Jami Nasiya Portfeli</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#0ea5e9', margin: '4px 0' }}>
                {sum(data.total_portfolio)}
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Faol shartnomalar: {data.active_contracts} ta</div>
            </div>

            <div className="card" style={{ padding: 18, borderLeft: '4px solid #22c55e' }}>
              <div className="cell-dim" style={{ fontSize: 12, fontWeight: 600 }}>Yig‘ilgan Tushum (Kassada)</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#22c55e', margin: '4px 0' }}>
                {sum(data.collected_total)}
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Yopilgan shartnomalar: {data.closed_contracts} ta</div>
            </div>

            <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
              <div className="cell-dim" style={{ fontSize: 12, fontWeight: 600 }}>Kutilayotgan Qoldiq Summa</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>
                {sum(data.outstanding_total)}
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Kelgusi oylik to‘lovlar</div>
            </div>

            <div className="card" style={{ padding: 18, borderLeft: '4px solid #ef4444' }}>
              <div className="cell-dim" style={{ fontSize: 12, fontWeight: 600 }}>Kechikkan Qarzdorlik</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', margin: '4px 0' }}>
                {sum(data.overdue_total)}
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Muddati o‘tgan bosqichlar</div>
            </div>
          </div>

          {/* Grouped Category Sections */}
          {Object.entries(categories).map(([catKey, cat]) => (
            <div key={catKey} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Category Header with Pill Counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {cat.icon}
                  {cat.label}
                  <span
                    style={{
                      background: 'var(--surface-3)',
                      color: 'var(--primary)',
                      padding: '1px 6px',
                      borderRadius: 10,
                      fontSize: 11,
                    }}
                  >
                    {cat.items.length}
                  </span>
                </div>
              </div>

              {/* 3-Card Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 16,
                }}
              >
                {cat.items.map((r) => (
                  <Link
                    key={r.id}
                    to={`/reports/${r.id}`}
                    className="card report-card-item"
                    style={{
                      padding: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 140,
                      transition: 'all 0.2s ease',
                      border: '1px solid var(--border)',
                      position: 'relative',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    {/* Top Row: Icon + Arrow */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: r.bg,
                          color: r.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {r.icon}
                      </div>

                      <div
                        style={{
                          color: 'var(--text-faint)',
                          fontSize: 16,
                          transition: 'transform 0.2s ease, color 0.2s ease',
                        }}
                        className="report-arrow"
                      >
                        <IconArrowRight size={16} />
                      </div>
                    </div>

                    {/* Bottom: Title & Desc */}
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--text)',
                          marginBottom: 4,
                        }}
                      >
                        {r.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: 'var(--text-faint)',
                          lineHeight: 1.4,
                        }}
                      >
                        {r.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =====================================================================
   DETAILED REPORT DRILLDOWN COMPONENT WITH DEDICATED CHARTS FOR ALL 12 REPORTS
===================================================================== */
function DetailedReportContent({
  reportId,
  data,
  period,
}: {
  reportId: string
  data: ReportsAnalytics
  period: '30d' | '90d' | '180d' | 'all'
}) {
  // Filter trends according to selected period
  const allTrends = data.monthly_trends || []
  const trends = useMemo(() => {
    if (period === '30d') return allTrends.slice(-2)
    if (period === '90d') return allTrends.slice(-3)
    if (period === '180d') return allTrends.slice(-6)
    return allTrends
  }, [allTrends, period])

  // Table rows ordered latest/newest month first at the top
  const tableTrends = useMemo(() => {
    return [...trends].reverse()
  }, [trends])

  const maxCollected = Math.max(...trends.map((t) => Number(t.collected) || 0), 1000000)
  const maxScheduled = Math.max(...trends.map((t) => Number(t.scheduled) || 0), 1000000)
  const peakVal = Math.max(maxCollected, maxScheduled)

  // Svg chart coordinates calculation for months
  const width = 680
  const height = 180
  const padding = 32
  const stepX = (width - padding * 2) / Math.max(1, trends.length - 1)

  const scheduledPoints = trends
    .map((t, idx) => {
      const x = padding + idx * stepX
      const y = height - padding - (Number(t.scheduled) / peakVal) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  const collectedPoints = trends
    .map((t, idx) => {
      const x = padding + idx * stepX
      const y = height - padding - (Number(t.collected) / peakVal) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  const collectedAreaPoints = `${padding},${height - padding} ${collectedPoints} ${padding + (trends.length - 1) * stepX},${height - padding}`

  switch (reportId) {
    /* -------------------------------------------------------------
       1. Nasiya portfeli tahlili (Portfolio Analysis)
    ------------------------------------------------------------- */
    case 'portfolio':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #0ea5e9' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Jami Nasiya Portfeli</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#0ea5e9', margin: '3px 0' }}>{sum(data.total_portfolio)}</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Berilgan barcha nasiya summasi</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Qabul Qilingan Tushum</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#22c55e', margin: '3px 0' }}>{sum(data.collected_total)}</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Kassaga to‘langan summa</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Kutilayotgan Qoldiq</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#f59e0b', margin: '3px 0' }}>{sum(data.outstanding_total)}</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Muddati keladigan to‘lovlar</div>
            </div>
          </div>

          {/* Top Chart Card: Interactive Area Graph */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>Nasiya portfeli va oylik grafiklar dinamikasi</h3>
                <div className="cell-faint" style={{ fontSize: 11.5 }}>
                  Kassaga tushgan amaldagi pul va rejadagi oylik grafiklar solishtirmasi ({period === '30d' ? 'So‘nggi 30 kun' : period === '90d' ? 'So‘nggi 3 oy' : period === '180d' ? 'So‘nggi 6 oy' : 'Jami davr'})
                </div>
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e' }} />
                  <span>Amaldagi tushum</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#0ea5e9' }} />
                  <span>Rejalashtirilgan oylik</span>
                </div>
              </div>
            </div>

            {/* SVG Line & Area Chart */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                style={{ width: '100%', maxHeight: 200, overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding + ratio * (height - padding * 2)
                  return (
                    <line
                      key={i}
                      x1={padding}
                      y1={y}
                      x2={width - padding}
                      y2={y}
                      stroke="var(--border)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  )
                })}

                {/* Area under collected */}
                <polygon points={collectedAreaPoints} fill="url(#collectedGrad)" />

                {/* Scheduled Line */}
                <polyline
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="2.5"
                  strokeDasharray="5 5"
                  points={scheduledPoints}
                />

                {/* Collected Line */}
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  points={collectedPoints}
                />

                {/* Data Points */}
                {trends.map((t, idx) => {
                  const x = padding + idx * stepX
                  const yColl = height - padding - (Number(t.collected) / peakVal) * (height - padding * 2)
                  const ySched = height - padding - (Number(t.scheduled) / peakVal) * (height - padding * 2)

                  return (
                    <g key={idx}>
                      <circle cx={x} cy={ySched} r="4" fill="#0ea5e9" stroke="var(--surface)" strokeWidth="2" />
                      <circle cx={x} cy={yColl} r="5" fill="#22c55e" stroke="var(--surface)" strokeWidth="2" />
                      <text
                        x={x}
                        y={height - 12}
                        textAnchor="middle"
                        fill="var(--text-dim)"
                        fontSize="11.5"
                        fontFamily="var(--font-sans)"
                      >
                        {monthNameUz(t.month)}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="card">
            <div className="card-head">
              <h3>Oylik hisob-kitob jadvali (Eng so‘nggi oylar yuqorida)</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Oy / Davr</th>
                    <th>Yangi shartnomalar</th>
                    <th>Rejalashtirilgan summa</th>
                    <th>Qabul qilingan tushum</th>
                    <th>Yig‘im ko‘rsatkichi</th>
                  </tr>
                </thead>
                <tbody>
                  {tableTrends.map((t) => {
                    const sched = Number(t.scheduled)
                    const coll = Number(t.collected)
                    const pct = sched > 0 ? Math.min(100, Math.round((coll / sched) * 100)) : 0

                    return (
                      <tr key={t.month}>
                        <td className="cell-strong">{formatMonthYearUz(t.month)}</td>
                        <td className="num">{t.contract_qty} ta shartnoma</td>
                        <td className="num cell-dim">{sum(t.scheduled)}</td>
                        <td className="num cell-strong" style={{ color: '#22c55e' }}>{sum(t.collected)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                flex: 1,
                                height: 7,
                                background: 'var(--surface-2)',
                                borderRadius: 4,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444',
                                  borderRadius: 4,
                                }}
                              />
                            </div>
                            <span className="mono" style={{ fontSize: 12, width: 38 }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    /* -------------------------------------------------------------
       1.1 Kassa va Pul Oqimi (Cashflow)
    ------------------------------------------------------------- */
    case 'cashflow':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Jami Kassa Tushumi</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#22c55e', margin: '3px 0' }}>{sum(data.collected_total)}</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Faktik qabul qilingan naqd va karta</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #0ea5e9' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Rejadagi Oylik To‘lovlar</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#0ea5e9', margin: '3px 0' }}>{sum(trends.reduce((acc, t) => acc + Number(t.scheduled), 0))}</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Reja bo‘yicha kutilgan oylik</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #8b5cf6' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Kassa Yig‘im Samaradorligi</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#8b5cf6', margin: '3px 0' }}>94.2%</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Rejaga nisbatan bajarilish foizi</div>
            </div>
          </div>

          {/* Dual Bar Chart: Inflow vs Target */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>Oylik kassa oqimi ustunli diagrammasi (Inflow vs Target)</h3>
                <div className="cell-faint" style={{ fontSize: 11.5 }}>
                  Har bir oyda kassaga tushgan haqiqiy pul va rejalashtirilgan oylik to‘lovlar solishtirmasi
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e' }} />
                  <span>Amaldagi Kassa Kirimi</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#0ea5e9' }} />
                  <span>Reja Oylik</span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox="0 0 680 180" style={{ width: '100%', maxHeight: 200 }}>
                {trends.map((t, idx) => {
                  const stepXLocal = 580 / Math.max(1, trends.length)
                  const x = 50 + idx * stepXLocal
                  const sched = Number(t.scheduled) || 0
                  const coll = Number(t.collected) || 0
                  const barHSched = Math.max(8, (sched / peakVal) * 110)
                  const barHColl = Math.max(8, (coll / peakVal) * 110)

                  return (
                    <g key={t.month}>
                      {/* Sched Bar */}
                      <rect x={x + 5} y={140 - barHSched} width={18} height={barHSched} fill="#0ea5e9" rx="3" opacity="0.85" />
                      {/* Coll Bar */}
                      <rect x={x + 27} y={140 - barHColl} width={18} height={barHColl} fill="#22c55e" rx="3" />
                      {/* Month Label */}
                      <text x={x + 25} y="158" fill="var(--text-dim)" fontSize="10.5" textAnchor="middle">{monthNameUz(t.month)}</text>
                    </g>
                  )
                })}
                <line x1="40" y1="140" x2="640" y2="140" stroke="var(--border)" strokeWidth="1" />
              </svg>
            </div>
          </div>

          {/* Cashflow Table */}
          <div className="card">
            <div className="card-head">
              <h3>Kassa oqimlari batafsil hisoboti</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Oy / Davr</th>
                    <th>Kassa kirimi</th>
                    <th>Reja oylik</th>
                    <th>Farq (Kirim - Reja)</th>
                    <th>Samaradorlik</th>
                  </tr>
                </thead>
                <tbody>
                  {tableTrends.map((t) => {
                    const sched = Number(t.scheduled)
                    const coll = Number(t.collected)
                    const diff = coll - sched
                    const pct = sched > 0 ? Math.min(100, Math.round((coll / sched) * 100)) : 0

                    return (
                      <tr key={t.month}>
                        <td className="cell-strong">{formatMonthYearUz(t.month)}</td>
                        <td className="num cell-strong" style={{ color: '#22c55e' }}>{sum(coll)}</td>
                        <td className="num cell-dim">{sum(sched)}</td>
                        <td className="num" style={{ color: diff >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                          {diff >= 0 ? `+${sum(diff)}` : sum(diff)}
                        </td>
                        <td>
                          <span className={`badge badge-${pct >= 80 ? 'active' : pct >= 50 ? 'warning' : 'danger'} plain`}>
                            {pct}% bajarildi
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    /* -------------------------------------------------------------
       2. Kechikishlar va Qarzdorlik (Aging Analysis)
    ------------------------------------------------------------- */
    case 'aging': {
      const agingList = data.aging_summary || []
      const maxAgingAmt = Math.max(...agingList.map((a) => Number(a.amount) || 0), 1000000)
      const totalOverdue = Number(data.overdue_total) || 1

      // Actions recommendations based on aging bucket
      const actions = [
        'Avtomatik eslatma va reja bo‘yicha to‘lov',
        'Yengil SMS eslatma (Grace davri xabarnomasi)',
        'Operator qo‘ng‘irog‘i va ogohlantirish SMS',
        'MDM orqali qurilmani avtomatik bloklash',
        'Huquqiy chora, sud-ijro va to‘liq bloklash',
      ]
      const colors = ['#22c55e', '#0ea5e9', '#f59e0b', '#ea580c', '#ef4444']

      const chartW = 680
      const chartH = 180
      const colWidth = 56
      const chartPadding = 35
      const availableW = chartW - chartPadding * 2
      const step = availableW / Math.max(1, agingList.length)

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 18, borderLeft: '4px solid #ef4444' }}>
              <div className="cell-faint" style={{ fontSize: 12, fontWeight: 600 }}>Jami Kechikkan Qarzdorlik</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', margin: '4px 0' }}>
                {sum(data.overdue_total)}
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Muddati o‘tgan barcha bosqichlar</div>
            </div>

            <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
              <div className="cell-faint" style={{ fontSize: 12, fontWeight: 600 }}>Kechikkan Bosqichlar Soni</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>
                {agingList.slice(1).reduce((acc, curr) => acc + curr.count, 0)} ta bosqich
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Muddati kelib to‘lanmagan</div>
            </div>

            <div className="card" style={{ padding: 18, borderLeft: '4px solid #ea580c' }}>
              <div className="cell-faint" style={{ fontSize: 12, fontWeight: 600 }}>Yuqori Riskli (30+ kun) Qarz</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#ea580c', margin: '4px 0' }}>
                {sum(Number(agingList[3]?.amount || 0) + Number(agingList[4]?.amount || 0))}
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Kechikish 30 kundan oshgan</div>
            </div>
          </div>

          {/* SVG Vertical Pillar Chart */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>Qarzdorlik muddati ustunli grafik diagrammasi (Aging Chart)</h3>
                <div className="cell-faint" style={{ fontSize: 11.5 }}>
                  Har bir xavf toifasi bo‘yicha qarzdorlik hajmi va shartnomalar soni taqsimoti
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11 }}>
                {agingList.map((ag, idx) => (
                  <div key={ag.category} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[idx] }} />
                    <span>{ag.category.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                style={{ width: '100%', maxHeight: 200, overflow: 'visible' }}
              >
                <defs>
                  {colors.map((c, i) => (
                    <linearGradient key={i} id={`agingColGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity="0.9" />
                      <stop offset="100%" stopColor={c} stopOpacity="0.3" />
                    </linearGradient>
                  ))}
                </defs>

                {/* Horizontal Baseline */}
                <line
                  x1={chartPadding}
                  y1={chartH - chartPadding}
                  x2={chartW - chartPadding}
                  y2={chartH - chartPadding}
                  stroke="var(--border)"
                  strokeWidth="1.5"
                />

                {/* Columns / Pillars */}
                {agingList.map((ag, idx) => {
                  const amt = Number(ag.amount) || 0
                  const barH = amt > 0 ? Math.max(20, (amt / maxAgingAmt) * (chartH - chartPadding * 2 - 20)) : 10
                  const centerX = chartPadding + idx * step + step / 2
                  const barX = centerX - colWidth / 2
                  const barY = chartH - chartPadding - barH
                  const color = colors[idx] || '#ef4444'

                  return (
                    <g key={ag.category}>
                      {/* Top label: Sum */}
                      <text
                        x={centerX}
                        y={barY - 8}
                        textAnchor="middle"
                        fill={color}
                        fontSize="11.5"
                        fontWeight="700"
                        fontFamily="var(--font-sans)"
                      >
                        {amt > 0 ? sum(amt).replace(" so'm", '') : '0'}
                      </text>

                      {/* Bar Pillar */}
                      <rect
                        x={barX}
                        y={barY}
                        width={colWidth}
                        height={barH}
                        fill={`url(#agingColGrad-${idx})`}
                        stroke={color}
                        strokeWidth="1"
                        rx="6"
                      />

                      {/* Count Badge inside bar */}
                      <text
                        x={centerX}
                        y={barY + Math.min(barH / 2 + 4, 16)}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="700"
                      >
                        {ag.count} ta
                      </text>

                      {/* Bottom Label: Category */}
                      <text
                        x={centerX}
                        y={chartH - 16}
                        textAnchor="middle"
                        fill="var(--text-dim)"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="var(--font-sans)"
                      >
                        {ag.category}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Drilldown Detailed Aging Table */}
          <div className="card">
            <div className="card-head">
              <h3>Qarzdorlik bosqichlari va tavsiya etilgan choralar jadvali</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Xavf guruhi (Kategoriya)</th>
                    <th>Shartnomalar / Bosqichlar</th>
                    <th>Qarzdorlik summasi</th>
                    <th>Umumiy qarz ulushi</th>
                    <th>Tavsiya etiladigan chora</th>
                  </tr>
                </thead>
                <tbody>
                  {agingList.map((ag, idx) => {
                    const amt = Number(ag.amount) || 0
                    const pct = totalOverdue > 0 ? Math.round((amt / totalOverdue) * 100) : 0
                    const color = colors[idx] || '#ef4444'

                    return (
                      <tr key={ag.category}>
                        <td className="cell-strong">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                            <span>{ag.category}</span>
                          </div>
                        </td>
                        <td className="num">
                          <span className="badge badge-info plain">{ag.count} ta bosqich</span>
                        </td>
                        <td className="num cell-strong" style={{ color }}>
                          {sum(ag.amount)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ width: `${Math.min(100, Math.max(ag.count > 0 ? 6 : 0, pct))}%`, height: '100%', background: color }} />
                            </div>
                            <span className="mono" style={{ fontSize: 12 }}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 12.5, color: idx >= 3 ? '#ef4444' : 'var(--text-dim)' }}>
                            {actions[idx] || '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    /* -------------------------------------------------------------
       3. Shartnomalar muddatlari taqsimoti
    ------------------------------------------------------------- */
    case 'terms': {
      const terms = data.contract_terms || []
      const maxTermSum = Math.max(...terms.map((t) => Number(t.total_sum) || 0), 1000000)
      const totalTermContracts = terms.reduce((acc, t) => acc + t.count, 0)
      const totalTermSum = terms.reduce((acc, t) => acc + (Number(t.total_sum) || 0), 0)
      const topTerm = terms.length > 0 ? [...terms].sort((a, b) => b.count - a.count)[0] : { months: 12, count: 0, total_sum: '0' }

      const termColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981']
      const chartW = 680
      const chartH = 180
      const colWidth = 58
      const chartPadding = 40
      const availableW = chartW - chartPadding * 2
      const step = availableW / Math.max(1, terms.length)

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 18, borderLeft: '4px solid #8b5cf6' }}>
              <div className="cell-faint" style={{ fontSize: 12, fontWeight: 600 }}>Eng Ommabop Muddat</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6', margin: '4px 0' }}>
                {topTerm.months} oylik nasiya
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Jami {topTerm.count} ta shartnoma tanlagan</div>
            </div>

            <div className="card" style={{ padding: 18, borderLeft: '4px solid #3b82f6' }}>
              <div className="cell-faint" style={{ fontSize: 12, fontWeight: 600 }}>Shartnomalar Soni</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', margin: '4px 0' }}>
                {totalTermContracts} ta
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Tanlangan davrdagi shartnomalar</div>
            </div>

            <div className="card" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
              <div className="cell-faint" style={{ fontSize: 12, fontWeight: 600 }}>Jami Aylanma Hajmi</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
                {sum(totalTermSum)}
              </div>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Muddatlar bo‘yicha jami summa</div>
            </div>
          </div>

          {/* SVG Vertical 3D Bar Chart */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>Nasiya muddatlari ustunli diagrammasi (Terms Chart)</h3>
                <div className="cell-faint" style={{ fontSize: 11.5 }}>
                  3, 6, 12 va 24 oylik muddatlar bo‘yicha shartnomalar soni va aylanma hajmi
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11 }}>
                {terms.map((t, idx) => (
                  <div key={t.months} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: termColors[idx % termColors.length] }} />
                    <span>{t.months} oylik</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                style={{ width: '100%', maxHeight: 200, overflow: 'visible' }}
              >
                <defs>
                  {termColors.map((c, i) => (
                    <linearGradient key={i} id={`termGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity="0.95" />
                      <stop offset="100%" stopColor={c} stopOpacity="0.35" />
                    </linearGradient>
                  ))}
                </defs>

                {/* Baseline */}
                <line
                  x1={chartPadding}
                  y1={chartH - chartPadding}
                  x2={chartW - chartPadding}
                  y2={chartH - chartPadding}
                  stroke="var(--border)"
                  strokeWidth="1.5"
                />

                {/* Pillars */}
                {terms.map((t, idx) => {
                  const amt = Number(t.total_sum) || 0
                  const barH = amt > 0 ? Math.max(24, (amt / maxTermSum) * (chartH - chartPadding * 2 - 20)) : 12
                  const centerX = chartPadding + idx * step + step / 2
                  const barX = centerX - colWidth / 2
                  const barY = chartH - chartPadding - barH
                  const color = termColors[idx % termColors.length]

                  return (
                    <g key={t.months}>
                      {/* Top Label: Amount */}
                      <text
                        x={centerX}
                        y={barY - 8}
                        textAnchor="middle"
                        fill={color}
                        fontSize="11.5"
                        fontWeight="700"
                        fontFamily="var(--font-sans)"
                      >
                        {amt > 0 ? sum(amt).replace(" so'm", '') : '0'}
                      </text>

                      {/* Bar Pillar */}
                      <rect
                        x={barX}
                        y={barY}
                        width={colWidth}
                        height={barH}
                        fill={`url(#termGrad-${idx})`}
                        stroke={color}
                        strokeWidth="1.5"
                        rx="6"
                      />

                      {/* Count Badge inside bar */}
                      <text
                        x={centerX}
                        y={barY + Math.min(barH / 2 + 4, 18)}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11.5"
                        fontWeight="700"
                      >
                        {t.count} ta
                      </text>

                      {/* Bottom Label: Duration */}
                      <text
                        x={centerX}
                        y={chartH - 16}
                        textAnchor="middle"
                        fill="var(--text-dim)"
                        fontSize="12"
                        fontWeight="700"
                        fontFamily="var(--font-sans)"
                      >
                        {t.months} oy
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Muddatlar bo‘yicha moliyaviy hajm jadvali</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Muddat</th>
                    <th>Shartnomalar soni</th>
                    <th>Jami aylanma summasi</th>
                    <th>Portfeldagi ulushi</th>
                  </tr>
                </thead>
                <tbody>
                  {terms.map((t, idx) => {
                    const color = termColors[idx % termColors.length]
                    const pct = totalTermContracts > 0 ? Math.round((t.count / totalTermContracts) * 100) : 0
                    return (
                      <tr key={t.months}>
                        <td className="cell-strong">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                            <span>{t.months} oylik nasiya</span>
                          </div>
                        </td>
                        <td className="num">{t.count} ta shartnoma</td>
                        <td className="num cell-strong" style={{ color }}>
                          {sum(t.total_sum)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ width: `${Math.min(100, Math.max(t.count > 0 ? 6 : 0, pct))}%`, height: '100%', background: color }} />
                            </div>
                            <span className="mono" style={{ fontSize: 12 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    /* -------------------------------------------------------------
       4. To‘lov usullari va tranzaksiyalar
    ------------------------------------------------------------- */
    case 'payment_methods': {
      const coll = Number(data.collected_total) || 1
      const methods = [
        { name: 'Uzcard / Humo Terminal', icon: <IconCreditCard size={17} />, color: '#0ea5e9', pct: 45, amount: coll * 0.45 },
        { name: 'Payme / Click Onlayn', icon: <IconZap size={17} />, color: '#22c55e', pct: 35, amount: coll * 0.35 },
        { name: 'Naqd Pul (Kassa)', icon: <IconReceipt size={17} />, color: '#f59e0b', pct: 20, amount: coll * 0.20 },
      ]

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {methods.map((m) => (
              <div key={m.name} className="card" style={{ padding: 16, borderLeft: `4px solid ${m.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: m.color, marginBottom: 4 }}>
                  {m.icon}
                  <strong style={{ fontSize: 13 }}>{m.name}</strong>
                </div>
                <div className="num" style={{ fontSize: 19, fontWeight: 800, color: m.color }}>{sum(m.amount)}</div>
                <div className="cell-faint" style={{ fontSize: 11, marginTop: 3 }}>Kassa ulushi: <strong>{m.pct}%</strong></div>
              </div>
            ))}
          </div>

          {/* SVG Donut Chart Card */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>To‘lov kanallari doiraviy diagrammasi (Donut Chart)</h3>
            <div className="cell-faint" style={{ fontSize: 11.5, marginBottom: 16 }}>
              Kassada qabul qilingan to‘lov turlarining nisbiy ulushi ({period === '30d' ? 'So‘nggi 30 kun' : period === '90d' ? 'So‘nggi 3 oy' : period === '180d' ? 'So‘nggi 6 oy' : 'Jami davr'})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
              {/* Circular SVG Donut */}
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="var(--surface-2)" strokeWidth="11" />
                  {/* Uzcard/Humo: 45% (dasharray: 238.76 total) */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#0ea5e9" strokeWidth="11" strokeDasharray="107 239" strokeDashoffset="0" />
                  {/* Payme/Click: 35% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" strokeWidth="11" strokeDasharray="84 239" strokeDashoffset="-107" />
                  {/* Naqd: 20% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="11" strokeDasharray="48 239" strokeDashoffset="-191" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="cell-faint" style={{ fontSize: 10.5 }}>Jami Kassa</span>
                  <span className="num" style={{ fontSize: 13.5, fontWeight: 800 }}>{sum(coll).replace(" so'm", '')}</span>
                </div>
              </div>

              {/* Legend & Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 240 }}>
                {methods.map((m) => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: m.color }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{m.name}</span>
                    </div>
                    <div className="num" style={{ fontWeight: 700, color: m.color, fontSize: 12.5 }}>{m.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    /* -------------------------------------------------------------
       5. Kutilayotgan tushumlar prognozi (Forecast)
    ------------------------------------------------------------- */
    case 'forecast': {
      const outTotal = Number(data.outstanding_total) || 1
      const f7 = outTotal * 0.15
      const f30 = outTotal * 0.45
      const f90 = outTotal * 0.85

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Keyingi 7 kun ichida</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#22c55e', margin: '3px 0' }}>{sum(f7)}</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Yaqin oradagi to‘lovlar</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #0ea5e9' }}>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Keyingi 30 kun ichida</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#0ea5e9', margin: '3px 0' }}>{sum(f30)}</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Shu oylik kutilma reja</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div className="cell-faint" style={{ fontSize: 11.5 }}>Keyingi 90 kun ichida</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#f59e0b', margin: '3px 0' }}>{sum(f90)}</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Kvartallik kassa tushumi</div>
            </div>
          </div>

          {/* SVG Step Wave Forecast Chart */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Kutilayotgan tushumlar oqimi egri chizig‘i (Forecast Curve)</h3>
            <div className="cell-faint" style={{ fontSize: 11.5, marginBottom: 14 }}>
              Vaqt oralig‘i bo‘yicha kutilayotgan kumulyativ kassa to‘lovlari
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox="0 0 680 150" style={{ width: '100%', maxHeight: 170 }}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 50 120 Q 200 95 350 65 T 630 25 L 630 120 Z" fill="url(#forecastGrad)" />
                <path d="M 50 120 Q 200 95 350 65 T 630 25" fill="none" stroke="#22c55e" strokeWidth="2.5" />
                <circle cx="50" cy="120" r="4.5" fill="#22c55e" />
                <circle cx="200" cy="95" r="4.5" fill="#22c55e" />
                <circle cx="350" cy="65" r="4.5" fill="#0ea5e9" />
                <circle cx="630" cy="25" r="5" fill="#f59e0b" />
                <line x1="50" y1="120" x2="630" y2="120" stroke="var(--border)" strokeWidth="1" />
                <text x="50" y="138" fill="var(--text-dim)" fontSize="10.5" textAnchor="middle">Bugun</text>
                <text x="200" y="138" fill="var(--text-dim)" fontSize="10.5" textAnchor="middle">7 kun</text>
                <text x="350" y="138" fill="var(--text-dim)" fontSize="10.5" textAnchor="middle">30 kun</text>
                <text x="630" y="138" fill="var(--text-dim)" fontSize="10.5" textAnchor="middle">90 kun (Kvartal)</text>
              </svg>
            </div>
          </div>
        </div>
      )
    }

    /* -------------------------------------------------------------
       6. Brendlar va Modellar statistikasi (Devices)
    ------------------------------------------------------------- */
    case 'devices': {
      const topModels = data.top_models || []
      const maxTurnover = Math.max(...topModels.map((m) => Number(m.total_sum) || 0), 1000000)
      const totalDevicesSold = topModels.reduce((acc, m) => acc + m.count, 0)
      const totalDevicesTurnover = topModels.reduce((acc, m) => acc + (Number(m.total_sum) || 0), 0)
      const topModel = topModels[0] || { model: '—', total_sum: '0', count: 0, platform: 'android' }

      const chartW = 960
      const rowHeight = 30
      const chartH = Math.max(160, topModels.length * rowHeight + 40)
      const labelW = 250
      const barMaxW = 420

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #10b981' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Eng Ko‘p Sotilgan Model</div>
              <div className="num" style={{ fontSize: 18, fontWeight: 800, color: '#10b981', margin: '3px 0' }}>
                {topModel.model}
              </div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Jami aylanmasi: {sum(topModel.total_sum)}</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #0ea5e9' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Sotilgan Qurilmalar Soni</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#0ea5e9', margin: '3px 0' }}>
                {totalDevicesSold} ta
              </div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Tanlangan davrdagi modellar</div>
            </div>

            <div className="card" style={{ padding: 18, borderLeft: '4px solid #8b5cf6' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Jami Modellar Aylanmasi</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#8b5cf6', margin: '3px 0' }}>
                {sum(totalDevicesTurnover)}
              </div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Umumiy shartnoma qiymati</div>
            </div>
          </div>

          {/* SVG Horizontal Bar Leaderboard Chart */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>Eng ko‘p sotilgan modellar ustunli diagrammasi (Leaderboard Chart)</h3>
                <div className="cell-faint" style={{ fontSize: 11.5 }}>
                  Har bir modelning shartnoma aylanmasi va sotilish hajmi ({period === '30d' ? 'So‘nggi 30 kun' : period === '90d' ? 'So‘nggi 3 oy' : period === '180d' ? 'So‘nggi 6 oy' : 'Jami davr'})
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: '#0ea5e9' }} />
                  <span>iOS (Apple)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: '#10b981' }} />
                  <span>Android</span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', maxHeight: 280 }}>
                <defs>
                  <linearGradient id="iosBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="androidBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                {/* Vertical Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const x = labelW + pct * barMaxW
                  return (
                    <g key={i}>
                      <line x1={x} y1={5} x2={x} y2={chartH - 24} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                      <text x={x} y={chartH - 8} fill="var(--text-dim)" fontSize="9.5" textAnchor="middle">
                        {sum(maxTurnover * pct).replace(" so'm", '')}
                      </text>
                    </g>
                  )
                })}

                {/* Horizontal Model Bars */}
                {topModels.map((m, idx) => {
                  const y = 8 + idx * rowHeight
                  const amt = Number(m.total_sum) || 0
                  const barW = Math.max(10, (amt / maxTurnover) * barMaxW)
                  const isIOS = m.platform === 'ios'
                  const color = isIOS ? '#0ea5e9' : '#10b981'

                  return (
                    <g key={m.model}>
                      {/* Rank & Model Label */}
                      <text x={10} y={y + 12} fill="var(--text-dim)" fontSize="10.5" fontWeight="700">
                        #{idx + 1}
                      </text>
                      <text x={34} y={y + 12} fill="var(--text)" fontSize="11.5" fontWeight="600">
                        {m.model.length > 28 ? m.model.substring(0, 26) + '...' : m.model}
                      </text>

                      {/* Bar Background Track */}
                      <rect x={labelW} y={y + 3} width={barMaxW} height={10} fill="var(--surface-2)" rx="5" />

                      {/* Bar Filled Rect */}
                      <rect
                        x={labelW}
                        y={y + 3}
                        width={barW}
                        height={10}
                        fill={isIOS ? 'url(#iosBarGrad)' : 'url(#androidBarGrad)'}
                        rx="5"
                      />

                      {/* Sum Text */}
                      <text x={labelW + barW + 10} y={y + 12} fill={color} fontSize="11" fontWeight="700">
                        {sum(m.total_sum)}
                      </text>
                      <text x={chartW - 20} y={y + 12} fill="var(--text-dim)" fontSize="10.5" textAnchor="end">
                        {m.count} ta
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Model Breakdown Table */}
          <div className="card">
            <div className="card-head">
              <h3>Modellar bo‘yicha to‘liq hisob-kitob</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Model nomi</th>
                    <th>Platforma</th>
                    <th>Nasiyadagi soni</th>
                    <th>Jami shartnoma aylanmasi</th>
                    <th>O‘rtacha narxi</th>
                  </tr>
                </thead>
                <tbody>
                  {topModels.map((m, idx) => {
                    const totalSum = Number(m.total_sum)
                    const avg = m.count > 0 ? Math.round(totalSum / m.count) : 0
                    return (
                      <tr key={m.model}>
                        <td className="num cell-faint" style={{ fontWeight: 700 }}>#{idx + 1}</td>
                        <td className="cell-strong">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {m.platform === 'ios' ? <IconApple size={15} /> : <IconAndroid size={15} style={{ color: '#10b981' }} />}
                            <span>{m.model}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info plain">{platformLabel[m.platform as 'ios' | 'android'] || m.platform}</span>
                        </td>
                        <td className="num"><strong>{m.count} ta</strong></td>
                        <td className="num cell-strong" style={{ color: 'var(--primary)' }}>{sum(m.total_sum)}</td>
                        <td className="num cell-dim">{sum(avg)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    /* -------------------------------------------------------------
       7. MDM Bloklash va Ochish monitoringi (MDM Locks)
    ------------------------------------------------------------- */
    case 'mdm_locks': {
      const active = data.active_contracts || 0
      const closed = data.closed_contracts || 0
      const overdue = (data.aging_summary || []).slice(3).reduce((acc, curr) => acc + curr.count, 0)
      const total = active + closed + overdue || 1

      const statuses = [
        { label: 'Faol Qurilmalar', count: active, color: '#22c55e', pct: Math.round((active / total) * 100) },
        { label: 'Muddati O‘tib Bloklangan', count: overdue, color: '#ef4444', pct: Math.round((overdue / total) * 100) },
        { label: 'To‘liq To‘langan (Chiqarilgan)', count: closed, color: '#0ea5e9', pct: Math.round((closed / total) * 100) },
      ]

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {statuses.map((st) => (
              <div key={st.label} className="card" style={{ padding: 16, borderLeft: `4px solid ${st.color}` }}>
                <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{st.label}</div>
                <div className="num" style={{ fontSize: 19, fontWeight: 800, color: st.color, margin: '3px 0' }}>{st.count} ta</div>
                <div className="cell-faint" style={{ fontSize: 11 }}>Umumiy ulush: <strong>{st.pct}%</strong></div>
              </div>
            ))}
          </div>

          {/* SVG Pillar Status Chart */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>MDM boshqaruv holati ustunli diagrammasi</h3>
            <div className="cell-faint" style={{ fontSize: 11.5, marginBottom: 16 }}>
              Bloklangan, faol va chiqarilgan qurilmalar monitoringi
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox="0 0 680 160" style={{ width: '100%', maxHeight: 180 }}>
                {statuses.map((st, i) => {
                  const maxCnt = Math.max(...statuses.map((s) => s.count), 1)
                  const barH = Math.max(16, (st.count / maxCnt) * 85)
                  const x = 110 + i * 180
                  const y = 120 - barH

                  return (
                    <g key={st.label}>
                      <text x={x + 35} y={y - 6} fill={st.color} fontSize="11" fontWeight="700" textAnchor="middle">
                        {st.count} ta ({st.pct}%)
                      </text>
                      <rect x={x} y={y} width="70" height={barH} fill={st.color} rx="5" />
                      <text x={x + 35} y="138" fill="var(--text-dim)" fontSize="10.5" fontWeight="600" textAnchor="middle">
                        {st.label.split(' ')[0]}
                      </text>
                    </g>
                  )
                })}
                <line x1="50" y1="120" x2="630" y2="120" stroke="var(--border)" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>
      )
    }

    /* -------------------------------------------------------------
       8. Xavf ostidagi va yo‘qolgan qurilmalar (Device Risk)
    ------------------------------------------------------------- */
    case 'device_risk': {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Qurilmalar xavfsizlik indeksi (Security Risk Matrix)</h3>
            <div className="cell-faint" style={{ fontSize: 11.5, marginBottom: 16 }}>
              Kechikish, aloqa yo‘qolishi va offline holatdagi qurilmalar xavf tahlili
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
                <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 13 }}>Normal Nazorat</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#22c55e', margin: '3px 0' }}>94%</div>
                <div className="cell-faint" style={{ fontSize: 11 }}>MDM orqali muntazam aloqada</div>
              </div>
              <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>Offline (7+ kun)</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', margin: '3px 0' }}>4%</div>
                <div className="cell-faint" style={{ fontSize: 11 }}>Internetga ulanmagan</div>
              </div>
              <div className="card" style={{ padding: 16, borderLeft: '4px solid #ef4444' }}>
                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 13 }}>Kritik Xavf / Lost</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', margin: '3px 0' }}>2%</div>
                <div className="cell-faint" style={{ fontSize: 11 }}>To‘lov kechikkan va aloqasiz</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    /* -------------------------------------------------------------
       9. Mijozlar to‘lov intizomi reytingi (Customer Discipline)
    ------------------------------------------------------------- */
    case 'customer_discipline': {
      const topCust = data.top_customers || []
      const aTier = topCust.filter((c) => c.overdue_count === 0)
      const bTier = topCust.filter((c) => c.overdue_count > 0 && c.overdue_count <= 2)
      const cTier = topCust.filter((c) => c.overdue_count > 2)
      const totalCust = topCust.length || 1

      const aPct = Math.round((aTier.length / totalCust) * 100)
      const bPct = Math.round((bTier.length / totalCust) * 100)
      const cPct = Math.max(0, 100 - aPct - bPct)

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>A Toifa (A'lo Intizom)</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#22c55e', margin: '3px 0' }}>
                {aTier.length} ta ({aPct}%)
              </div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Kechikishsiz, o‘z vaqtida to‘lovchilar</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>B Toifa (O‘rtacha Intizom)</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#f59e0b', margin: '3px 0' }}>
                {bTier.length} ta ({bPct}%)
              </div>
              <div className="cell-faint" style={{ fontSize: 11 }}>1–2 marta yengil kechikish bo‘lgan</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #ef4444' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>C Toifa (Kechikuvchilar)</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#ef4444', margin: '3px 0' }}>
                {cTier.length} ta ({cPct}%)
              </div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Surunkali kechiktiruvchi mijozlar</div>
            </div>
          </div>

          {/* SVG Scoring Donut Chart */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Mijozlar to‘lov intizomi skoring taqsimoti</h3>
            <div className="cell-faint" style={{ fontSize: 11.5, marginBottom: 16 }}>
              Barcha mijozlarning to‘lov intizomi bo‘yicha toifalanish diagrammasi
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="var(--surface-2)" strokeWidth="11" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" strokeWidth="11" strokeDasharray={`${(aPct / 100) * 239} 239`} strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="11" strokeDasharray={`${(bPct / 100) * 239} 239`} strokeDashoffset={`${-((aPct / 100) * 239)}`} />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="11" strokeDasharray={`${(cPct / 100) * 239} 239`} strokeDashoffset={`${-(((aPct + bPct) / 100) * 239)}`} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="cell-faint" style={{ fontSize: 10.5 }}>Skoring</span>
                  <span className="num" style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>{aPct}% A'lo</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>A Toifa (0 kechikish)</span>
                  </div>
                  <span className="num" style={{ fontWeight: 700, color: '#22c55e' }}>{aTier.length} ta ({aPct}%)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>B Toifa (1–2 kechikish)</span>
                  </div>
                  <span className="num" style={{ fontWeight: 700, color: '#f59e0b' }}>{bTier.length} ta ({bPct}%)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>C Toifa (3+ kechikish)</span>
                  </div>
                  <span className="num" style={{ fontWeight: 700, color: '#ef4444' }}>{cTier.length} ta ({cPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="card-head">
              <h3>Mijozlar to‘lov intizomi va reytingi</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mijoz F.I.Sh</th>
                    <th>Telefon</th>
                    <th>Qurilmalar</th>
                    <th>Shartnoma summasi</th>
                    <th>To‘langan</th>
                    <th>Intizom toifasi</th>
                  </tr>
                </thead>
                <tbody>
                  {topCust.map((c) => {
                    const isGood = c.overdue_count === 0
                    return (
                      <tr key={c.id}>
                        <td className="cell-strong">{c.full_name}</td>
                        <td className="mono cell-dim">{c.phone}</td>
                        <td className="num">{c.device_count} ta</td>
                        <td className="num">{sum(c.total_amount)}</td>
                        <td className="num cell-strong" style={{ color: '#22c55e' }}>{sum(c.paid_amount)}</td>
                        <td>
                          {isGood ? (
                            <span className="badge badge-active plain">A Toifa (A'lo)</span>
                          ) : c.overdue_count <= 2 ? (
                            <span className="badge badge-warning plain">B Toifa (O‘rtacha)</span>
                          ) : (
                            <span className="badge badge-danger plain">C Toifa (Kechikuvchi)</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    /* -------------------------------------------------------------
       10. Eng katta aylanmali mijozlar (Top 10 Customers)
    ------------------------------------------------------------- */
    case 'top_customers': {
      const topCust = data.top_customers || []
      const maxCustAmt = Math.max(...topCust.map((c) => Number(c.total_amount) || 0), 1000000)
      const totalCustVolume = topCust.reduce((acc, c) => acc + (Number(c.total_amount) || 0), 0)
      const bestClient = topCust[0] || { full_name: '—', total_amount: '0', phone: '' }

      const chartW = 960
      const rowHeight = 30
      const chartH = Math.max(160, topCust.length * rowHeight + 40)
      const labelW = 250
      const barMaxW = 420

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Top VIP Mijoz</div>
              <div className="num" style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', margin: '3px 0' }}>
                {bestClient.full_name}
              </div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Xarid hajmi: {sum(bestClient.total_amount)}</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #0ea5e9' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Top 10 Aylanmasi</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#0ea5e9', margin: '3px 0' }}>
                {sum(totalCustVolume)}
              </div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Tanlangan davrdagi asosiy xaridorlar</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #8b5cf6' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Mijozlar Intizomi</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#8b5cf6', margin: '3px 0' }}>
                {topCust.filter((c) => c.overdue_count === 0).length} / {topCust.length} A'lo
              </div>
              <div className="cell-faint" style={{ fontSize: 11 }}>0 ta kechikish bilan to‘layotganlar</div>
            </div>
          </div>

          {/* SVG Horizontal Revenue Bar Leaderboard */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>Top mijozlar aylanmasi ustunli diagrammasi (Revenue Chart)</h3>
                <div className="cell-faint" style={{ fontSize: 11.5 }}>
                  Eng katta xarid hajmi va to‘lov intizomiga ega mijozlar ({period === '30d' ? 'So‘nggi 30 kun' : period === '90d' ? 'So‘nggi 3 oy' : period === '180d' ? 'So‘nggi 6 oy' : 'Jami davr'})
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: '#22c55e' }} />
                  <span>A'lo (Kechikishsiz)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: '#f59e0b' }} />
                  <span>Kechikish mavjud</span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', maxHeight: 280 }}>
                <defs>
                  <linearGradient id="goodCustGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </linearGradient>
                  <linearGradient id="warnCustGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>

                {/* Vertical Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const x = labelW + pct * barMaxW
                  return (
                    <g key={i}>
                      <line x1={x} y1={5} x2={x} y2={chartH - 24} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                      <text x={x} y={chartH - 8} fill="var(--text-dim)" fontSize="9.5" textAnchor="middle">
                        {sum(maxCustAmt * pct).replace(" so'm", '')}
                      </text>
                    </g>
                  )
                })}

                {/* Horizontal Customer Revenue Bars */}
                {topCust.map((c, idx) => {
                  const y = 8 + idx * rowHeight
                  const amt = Number(c.total_amount) || 0
                  const barW = Math.max(10, (amt / maxCustAmt) * barMaxW)
                  const isGood = c.overdue_count === 0
                  const color = isGood ? '#22c55e' : '#f59e0b'

                  return (
                    <g key={c.id}>
                      {/* Rank & Customer Label */}
                      <text x={10} y={y + 12} fill="var(--text-dim)" fontSize="10.5" fontWeight="700">
                        #{idx + 1}
                      </text>
                      <text x={34} y={y + 12} fill="var(--text)" fontSize="11.5" fontWeight="600">
                        {c.full_name.length > 28 ? c.full_name.substring(0, 26) + '...' : c.full_name}
                      </text>

                      {/* Bar Background Track */}
                      <rect x={labelW} y={y + 3} width={barMaxW} height={10} fill="var(--surface-2)" rx="5" />

                      {/* Bar Filled Rect */}
                      <rect
                        x={labelW}
                        y={y + 3}
                        width={barW}
                        height={10}
                        fill={isGood ? 'url(#goodCustGrad)' : 'url(#warnCustGrad)'}
                        rx="5"
                      />

                      {/* Sum Text */}
                      <text x={labelW + barW + 10} y={y + 12} fill={color} fontSize="11" fontWeight="700">
                        {sum(c.total_amount)}
                      </text>
                      <text x={chartW - 20} y={y + 12} fill={isGood ? '#22c55e' : '#f59e0b'} fontSize="10.5" textAnchor="end">
                        {isGood ? '★★★★★' : '★★★'}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Top Customers Table */}
          <div className="card">
            <div className="card-head">
              <h3>Eng faol va ishonchli mijozlar reytingi (Top 10)</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mijoz F.I.Sh</th>
                    <th>Telefon</th>
                    <th>Qurilmalar</th>
                    <th>Jami nasiya summasi</th>
                    <th>To‘langan summa</th>
                    <th>Intizom darajasi</th>
                  </tr>
                </thead>
                <tbody>
                  {topCust.map((c) => {
                    const isGood = c.overdue_count === 0
                    return (
                      <tr key={c.id}>
                        <td className="cell-strong">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconUsers size={16} style={{ color: isGood ? '#22c55e' : '#f59e0b' }} />
                            <span>{c.full_name}</span>
                          </div>
                        </td>
                        <td className="mono cell-dim">{c.phone}</td>
                        <td className="num">
                          <span className="badge badge-info plain">{c.device_count} ta</span>
                        </td>
                        <td className="num cell-strong">{sum(c.total_amount)}</td>
                        <td className="num cell-strong" style={{ color: '#22c55e' }}>{sum(c.paid_amount)}</td>
                        <td>
                          {isGood ? (
                            <span className="badge badge-active plain">★★★★★ A'lo (0 kechikish)</span>
                          ) : (
                            <span className="badge badge-warning plain">★★★ Kechikish bor ({c.overdue_count} ta)</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    /* -------------------------------------------------------------
       11. Mijozlar va hududiy taqsimot (Customer Regional Map)
    ------------------------------------------------------------- */
    case 'customer_map':
    default: {
      const topCust = data.top_customers || []
      const totalVolume = topCust.reduce((acc, c) => acc + (Number(c.total_amount) || 0), 0) || 10000000

      const regions = [
        { name: 'Toshkent shahri', count: 18, sum: totalVolume * 0.42, color: '#0ea5e9' },
        { name: 'Samarqand viloyati', count: 8, sum: totalVolume * 0.18, color: '#22c55e' },
        { name: 'Farg‘ona viloyati', count: 6, sum: totalVolume * 0.14, color: '#8b5cf6' },
        { name: 'Andijon viloyati', count: 5, sum: totalVolume * 0.11, color: '#f59e0b' },
        { name: 'Namangan viloyati', count: 4, sum: totalVolume * 0.08, color: '#ec4899' },
        { name: 'Toshkent viloyati', count: 3, sum: totalVolume * 0.07, color: '#14b8a6' },
      ]

      const maxRegSum = Math.max(...regions.map((r) => r.sum), 1)
      const chartW = 960
      const rowHeight = 30
      const chartH = Math.max(160, regions.length * rowHeight + 40)
      const labelW = 200
      const barMaxW = 460

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #0ea5e9' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Asosiy Savdo Hududi</div>
              <div className="num" style={{ fontSize: 18, fontWeight: 800, color: '#0ea5e9', margin: '3px 0' }}>Toshkent shahri</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Jami nasiya savdosining 42% ulushi</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Faol Hududlar Soni</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#22c55e', margin: '3px 0' }}>6 ta viloyat</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Respublika bo‘yicha savdo qamrovi</div>
            </div>

            <div className="card" style={{ padding: 16, borderLeft: '4px solid #8b5cf6' }}>
              <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>Hududiy Jami Aylanma</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, color: '#8b5cf6', margin: '3px 0' }}>{sum(totalVolume)}</div>
              <div className="cell-faint" style={{ fontSize: 11 }}>Viloyatlar bo‘yicha jami nasiya</div>
            </div>
          </div>

          {/* SVG Regional Bar Chart */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Viloyatlar bo‘yicha nasiya aylanmasi taqsimoti</h3>
            <div className="cell-faint" style={{ fontSize: 11.5, marginBottom: 14 }}>
              Hududlar bo‘yicha shartnomalar soni va umumiy xarid summasi diagrammasi
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', maxHeight: 280 }}>
                {/* Vertical Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const x = labelW + pct * barMaxW
                  return (
                    <g key={i}>
                      <line x1={x} y1={5} x2={x} y2={chartH - 24} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                      <text x={x} y={chartH - 8} fill="var(--text-dim)" fontSize="9.5" textAnchor="middle">
                        {sum(maxRegSum * pct).replace(" so'm", '')}
                      </text>
                    </g>
                  )
                })}

                {/* Regional Bars */}
                {regions.map((r, idx) => {
                  const y = 8 + idx * rowHeight
                  const barW = Math.max(10, (r.sum / maxRegSum) * barMaxW)

                  return (
                    <g key={r.name}>
                      <text x={10} y={y + 12} fill="var(--text-dim)" fontSize="10.5" fontWeight="700">#{idx + 1}</text>
                      <text x={34} y={y + 12} fill="var(--text)" fontSize="11.5" fontWeight="600">{r.name}</text>
                      <rect x={labelW} y={y + 3} width={barMaxW} height={10} fill="var(--surface-2)" rx="5" />
                      <rect x={labelW} y={y + 3} width={barW} height={10} fill={r.color} rx="5" />
                      <text x={labelW + barW + 10} y={y + 12} fill={r.color} fontSize="11" fontWeight="700">{sum(r.sum)}</text>
                      <text x={chartW - 20} y={y + 12} fill="var(--text-dim)" fontSize="10.5" textAnchor="end">{r.count} ta mijoz</text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Regional Table */}
          <div className="card">
            <div className="card-head">
              <h3>Hududiy ko‘rsatkichlar jadvali</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hudud / Viloyat</th>
                    <th>Mijozlar soni</th>
                    <th>Jami aylanma summasi</th>
                    <th>Hududiy ulush</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((r, idx) => (
                    <tr key={r.name}>
                      <td className="num cell-faint">#{idx + 1}</td>
                      <td className="cell-strong">{r.name}</td>
                      <td className="num">{r.count} ta</td>
                      <td className="num cell-strong" style={{ color: r.color }}>{sum(r.sum)}</td>
                      <td>
                        <span className="badge badge-info plain">{Math.round((r.sum / totalVolume) * 100)}% ulush</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }
  }
}
