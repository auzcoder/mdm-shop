import { useState } from 'react'
import '../shop-workspace.css'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import type { DashboardStats } from '../lib/types'
import { CommandPalette } from './CommandPalette'
import { ErrorBoundary } from './ErrorBoundary'
import {
  IconActivity,
  IconBarChart,
  IconBook,
  IconAlertTriangle,
  IconCalculator,
  IconCreditCard,
  IconHistory,
  IconMenu,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSmartphone,
  IconSun,
  IconUsers,
  IconX,
} from './Icons'
import logoImg from '../assets/logo.png'
import MDMBanner from './MDMBanner'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  accountant: 'Buxgalter',
  viewer: 'Faqat ko‘rish',
}

interface NavEntry {
  to: string
  label: string
  icon: React.ReactNode
  count?: number
  adminOnly?: boolean
  /** Modul kaliti (domain/features.go). Belgilangan bo'lsa, do'kon uchun
   *  o'chirilган modul navdan yashiriladi. */
  feature?: string
}

export default function Layout() {
  const { user, logout, can, hasFeature } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
    refetchInterval: 60_000,
  })
  const { data: brand } = useQuery({
    queryKey: ['shop-brand', window.location.hostname],
    queryFn: () => api.get<{ project_name: string; logo_url?: string | null }>('/public/shop', { domain: window.location.hostname }),
    staleTime: 10 * 60_000,
  })

  const main: NavEntry[] = [
    { to: '/', label: 'Boshqaruv paneli', icon: <IconActivity size={18} />, feature: 'dashboard' },
    { to: '/devices', label: 'Qurilmalar', icon: <IconSmartphone size={18} />, count: stats?.total_devices, feature: 'devices' },
    { to: '/customers', label: 'Mijozlar', icon: <IconUsers size={18} />, count: stats?.total_customers, feature: 'customers' },
    { to: '/payments', label: 'To‘lovlar', icon: <IconCreditCard size={18} />, count: stats?.overdue_payments, feature: 'payments' },
    { to: '/collection', label: 'Qarzdorlik', icon: <IconAlertTriangle size={18} />, count: stats?.overdue_payments, feature: 'collection' },
    { to: '/calculator', label: 'Nasiya kalkulyatori', icon: <IconCalculator size={18} />, feature: 'calculator' },
    { to: '/reports', label: 'Hisobotlar', icon: <IconBarChart size={18} />, feature: 'reports' },
  ]

  const system: NavEntry[] = [
    { to: '/help/apple-configurator', label: 'Apple Configurator', icon: <IconBook size={18} /> },
    { to: '/models', label: 'Modellar', icon: <IconSmartphone size={18} />, feature: 'models' },
    { to: '/audit', label: 'Audit jurnali', icon: <IconHistory size={18} />, feature: 'audit' },
    { to: '/settings', label: 'Sozlamalar', icon: <IconSettings size={18} />, feature: 'settings' },
    { to: '/users', label: 'Foydalanuvchilar', icon: <IconUsers size={18} />, adminOnly: true, feature: 'users' },
  ]

  const initials = (user?.full_name || user?.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')

  const renderNav = (entries: NavEntry[]) =>
    entries
      .filter((e) => !e.adminOnly || can('admin'))
      .filter((e) => !e.feature || hasFeature(e.feature))
      .map((e) => (
        <NavLink
          key={e.to}
          to={e.to}
          end={e.to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        >
          <span className="nav-icon">{e.icon}</span>
          {e.label}
          {e.count !== undefined && e.count > 0 && <span className="nav-count">{e.count}</span>}
        </NavLink>
      ))

  return (
    <div className="shell">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="brand-mark">
            <img src={brand?.logo_url || logoImg} alt={brand?.project_name || 'Qora daftar'} className="brand-logo-img" />
            <div>
              <div style={{ fontSize: 16.5, fontWeight: 800, lineHeight: 1.15, color: 'var(--text)' }}>
                {brand?.project_name || 'Qora daftar'}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.02em', marginTop: 2 }}>
                Boshqaruvi
              </div>
            </div>
          </div>

          {/* Close button inside sidebar for mobile */}
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Menyuni yopish"
          >
            <IconX size={18} />
          </button>
        </div>

        <nav className="nav">
          {renderNav(main)}
          <div className="nav-label">Tizim</div>
          {renderNav(system)}
        </nav>

        <div className="sidebar-foot">
          <div className="who">
            <div className="avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="who-name">{user?.full_name || user?.email}</div>
              <div className="who-role">
                {ROLE_LABELS[user?.role ?? ''] ?? 'Faqat ko‘rish'}
              </div>
            </div>
          </div>
          <button className="btn btn-sm" style={{ width: '100%' }} onClick={() => void logout()}>
            Chiqish
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Menyuni ochish"
            >
              <IconMenu size={20} />
            </button>

            <div className="topbar-search-trigger" onClick={() => setPaletteOpen(true)}>
              <IconSearch size={15} />
              <span className="topbar-search-text">Tezkor qidirish (Ctrl+K)…</span>
            </div>
          </div>

          <div className="topbar-actions">
            {stats && stats.locked_devices > 0 && (
              <span className="badge badge-locked topbar-badge-desktop">{stats.locked_devices} bloklangan</span>
            )}
            {stats && stats.overdue_payments > 0 && (
              <span className="badge badge-pending topbar-badge-desktop">{stats.overdue_payments} kechikkan</span>
            )}

            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Tungi rejimga o‘tish' : 'Kunduzgi rejimga o‘tish'}
              aria-label="Rejimni almashtirish"
            >
              {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
            </button>
          </div>
        </header>

        <main className="content">
          {/* Sahifa mazmuni alohida himoyalangan: bir sahifaдаги xato butun
              panelni (yon menyu, topbar) buzmaydi va navigatsiyada tiklanadi. */}
          <ErrorBoundary compact key={location.pathname}>
            <MDMBanner />
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} onOpen={() => setPaletteOpen(true)} />
    </div>
  )
}
