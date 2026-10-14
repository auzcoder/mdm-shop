import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useUsers } from '../hooks/useUsers'
import type { Role } from '../lib/types'
import { formatPhone, normalizePhone } from '../lib/mask'
import { PhoneInput } from '../components/PhoneInput'
import {
  IconCheck,
  IconLock,
  IconShieldCheck,
  IconSmartphone,
  IconUsers,
} from '../components/Icons'
import { Field, Loading } from '../components/ui'
import { useToast } from '../components/Toast'

export default function UserEdit() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const navigate = useNavigate()
  const { data, isLoading, updateUser, changePassword } = useUsers()
  const { success, error } = useToast()

  const user = data?.items.find((u) => u.id === userId)

  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('operator')
  const [isActive, setIsActive] = useState(true)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (user) {
      setPhone(user.phone ? formatPhone(user.phone) : '+998 ')
      setFullName(user.full_name || '')
      setRole(user.role)
      setIsActive(user.is_active)
    }
  }, [user])

  const normalized = normalizePhone(phone)
  const isPhoneValid = normalized.length === 13

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword && newPassword.trim().length < 8) {
      error('Parol xatosi', 'Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak')
      return
    }

    try {
      await updateUser.mutateAsync({
        id: userId,
        phone: isPhoneValid ? normalized : undefined,
        full_name: fullName,
        role,
        is_active: isActive,
        password: newPassword.trim() || undefined,
      })
      success('Foydalanuvchi yangilandi', newPassword ? `${user?.email} ning paroli va ma’lumotlari muvaffaqiyatli saqlandi` : user?.email)
      setNewPassword('')
      navigate('/users')
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Yangilab bo‘lmadi')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) return

    try {
      await changePassword.mutateAsync({ id: userId, password: newPassword })
      success('Parol yangilandi', `${user?.email} ning paroli muvaffaqiyatli almashtirildi`)
      setNewPassword('')
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Parolni almashtirib bo‘lmadi')
    }
  }

  if (isLoading || !user) return <Loading />

  const roleTitle = {
    operator: 'Operator',
    admin: 'Administrator',
    accountant: 'Buxgalter',
    viewer: 'Mijoz (Portal)',
  }[role]

  const initials = (fullName || user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumbs */}
      <div className="page-breadcrumb">
        <Link to="/users">Foydalanuvchilar</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{user.email}</span>
      </div>

      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Akkauntni tahrirlash</h1>
            <span className="badge badge-info plain">ID #{userId}</span>
          </div>
          <div className="page-desc">{user.email} hisobining roli, telefon raqami va parolini boshqarish</div>
        </div>

        <div className="btn-row">
          <Link to="/users" className="btn btn-secondary">
            Orqaga
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpdate}
            disabled={updateUser.isPending}
            style={{ minWidth: 160 }}
          >
            {updateUser.isPending && <span className="spinner" />}
            Saqlash
          </button>
        </div>
      </div>

      <div className="calc-layout" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)' }}>
        {/* Left Column: Profile Details & Role Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <form onSubmit={handleUpdate}>
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconUsers size={18} style={{ color: 'var(--primary)' }} />
                  <h2>Asosiy ma’lumotlar</h2>
                </div>
                <span className="badge badge-info plain">Profil sozlamalari</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="form-grid">
                    <Field label="Elektron pochta (Email)">
                      <input className="input" value={user.email} disabled />
                    </Field>

                    <div>
                      <Field label="Telefon raqami (+998 XX XXX XX XX)">
                        <PhoneInput
                          value={phone}
                          onChange={(masked) => setPhone(masked)}
                        />
                      </Field>
                      <div style={{ marginTop: 4, fontSize: 11.5 }}>
                        {isPhoneValid ? (
                          <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconCheck size={12} /> Format: {normalized}
                          </span>
                        ) : (
                          <span className="cell-faint">Mijozlar telefon orqali ham kirishi mumkin</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Field label="Foydalanuvchi F.I.Sh">
                    <input
                      className="input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Karimov Anvar"
                    />
                  </Field>

                  <Field label="Tizimdagi roli va huquqlari">
                    <div className="role-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div
                        className={`role-select-card ${role === 'operator' ? 'is-selected' : ''}`}
                        onClick={() => setRole('operator')}
                        style={{ cursor: 'pointer', padding: 14 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <IconUsers size={16} style={{ color: 'var(--primary)' }} />
                          <div className="role-title" style={{ margin: 0, fontSize: 13.5 }}>Operator</div>
                        </div>
                        <div className="role-desc" style={{ fontSize: 11.5 }}>Qurilmalarni boshqarish, mijozlar va to‘lovlar.</div>
                      </div>

                      <div
                        className={`role-select-card ${role === 'admin' ? 'is-selected' : ''}`}
                        onClick={() => setRole('admin')}
                        style={{ cursor: 'pointer', padding: 14 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <IconShieldCheck size={16} style={{ color: 'var(--warning)' }} />
                          <div className="role-title" style={{ margin: 0, fontSize: 13.5 }}>Administrator</div>
                        </div>
                        <div className="role-desc" style={{ fontSize: 11.5 }}>To‘liq huquq: sozlamalar, arxiv, xodimlar.</div>
                      </div>

                      <div
                        className={`role-select-card ${role === 'accountant' ? 'is-selected' : ''}`}
                        onClick={() => setRole('accountant')}
                        style={{ cursor: 'pointer', padding: 14 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <IconLock size={16} style={{ color: '#f59e0b' }} />
                          <div className="role-title" style={{ margin: 0, fontSize: 13.5 }}>Buxgalter</div>
                        </div>
                        <div className="role-desc" style={{ fontSize: 11.5 }}>To‘lov qabul qilish, hisobot va exportlar.</div>
                      </div>

                      <div
                        className={`role-select-card ${role === 'viewer' ? 'is-selected' : ''}`}
                        onClick={() => setRole('viewer')}
                        style={{ cursor: 'pointer', padding: 14 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <IconSmartphone size={16} style={{ color: '#22c55e' }} />
                          <div className="role-title" style={{ margin: 0, fontSize: 13.5 }}>Mijoz (Portal)</div>
                        </div>
                        <div className="role-desc" style={{ fontSize: 11.5 }}>Faqat o‘zining shartnomasi va to‘lov grafigi.</div>
                      </div>
                    </div>
                  </Field>

                  <Field label="Yangi maxfiy parol (agar o‘zgartirmoqchi bo‘lsangiz, kamida 8 ta belgi)">
                    <input
                      className="input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yangi parolni kiriting (bo‘sh qoldirilsa o‘zgarmaydi)"
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </Field>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5 }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Akkaunt faol (o‘chirilsa barcha faol sessiyalari to‘xtatiladi)</span>
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={updateUser.isPending}
                      style={{ minWidth: 160 }}
                    >
                      {updateUser.isPending && <span className="spinner" />}
                      O‘zgarishlarni saqlash
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Profile Card Preview & Change Password Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile Card */}
          <div className="settings-card" style={{ background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--cyan-neon) 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {initials || '?'}
              </div>

              <div>
                <div className="cell-strong" style={{ fontSize: 15 }}>{fullName || user.email}</div>
                <div className="cell-faint" style={{ fontSize: 12 }}>{user.email}</div>
                <div style={{ marginTop: 4 }}>
                  <span className="badge badge-info plain" style={{ fontSize: 10.5 }}>{roleTitle}</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="cell-dim">Telefon:</span>
                <strong className="mono">{phone.trim() || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="cell-dim">Holat:</span>
                <span style={{ color: isActive ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {isActive ? 'Faol (Active)' : 'Bloklangan (Inactive)'}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordChange}>
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconLock size={18} style={{ color: 'var(--warn)' }} />
                  <h2>Parolni yangilash</h2>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Yangi parol (kamida 8 ta belgi)">
                    <input
                      className="input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                    />
                  </Field>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      disabled={changePassword.isPending || newPassword.length < 8}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {changePassword.isPending && <span className="spinner" />}
                      Yangi parolni o‘rnatish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
