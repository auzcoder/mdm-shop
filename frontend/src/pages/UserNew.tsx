import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useUsers } from '../hooks/useUsers'
import type { Role } from '../lib/types'
import { normalizePhone } from '../lib/mask'
import { PhoneInput } from '../components/PhoneInput'
import {
  IconCheck,
  IconEye,
  IconShieldAlert,
  IconShieldCheck,
  IconSmartphone,
  IconUsers,
} from '../components/Icons'
import { Alert, Field } from '../components/ui'
import { useToast } from '../components/Toast'

export default function UserNew() {
  const navigate = useNavigate()
  const { createUser } = useUsers()
  const { success, error } = useToast()

  const [form, setForm] = useState({
    email: '',
    phone: '+998 ',
    full_name: '',
    password: '',
    role: 'operator' as Role,
  })

  const [showPassword, setShowPassword] = useState(false)
  const normalized = normalizePhone(form.phone)
  const isPhoneValid = normalized.length === 13

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || form.password.length < 8) return

    try {
      await createUser.mutateAsync({
        email: form.email.trim(),
        phone: isPhoneValid ? normalized : undefined,
        full_name: form.full_name.trim() || undefined,
        password: form.password,
        role: form.role,
      })
      success('Foydalanuvchi yaratildi', `${form.email} tizimga muvaffaqiyatli qo‘shildi`)
      navigate('/users')
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Foydalanuvchini yaratib bo‘lmadi')
    }
  }

  const roleInfo = {
    operator: {
      title: 'Operator (Xodim)',
      color: 'var(--primary)',
      badge: 'badge-info',
      desc: 'Qurilmalarni boshqarish, yangi mijoz va shartnoma kiritish, to‘lovlarni qabul qilish.',
      permissions: [
        'Qurilmalarni bloklash va ochish buyruqlarini yuborish',
        'Yangi mijozlarni ro‘yxatga olish va shartnoma tuzish',
        'Nasiya to‘lovlarini qabul qilish va kvitansiya chiqarish',
        'Faqat o‘ziga biriktirilgan amallar auditini ko‘rish',
      ],
      restrictions: [
        'Tizim sozlamalari va APNs/AMAPI konfiguratsiyasini o‘zgartira olmaydi',
        'Boshqa foydalanuvchilar akkauntlarini boshqara olmaydi',
      ],
    },
    admin: {
      title: 'Administrator',
      color: 'var(--warning)',
      badge: 'badge-warning',
      desc: 'To‘liq tizim nazorati: sozlamalar, arxivni boshqarish, xodimlar va audit hisoboti.',
      permissions: [
        'Barcha qurilmalar, mijozlar va shartnomalarni to‘liq boshqarish',
        'Qurilmani butunlay o‘chirish yoki arxivdan qayta tiklash',
        'APNs sertifikati, AMAPI va SMS shablonlarini sozlash',
        'Xodimlar va mijozlar akkauntlarini yaratish, rollarini o‘zgartirish',
        'To‘liq tizim auditi va moliyaviy hisobotlarni eksport qilish',
      ],
      restrictions: [],
    },
    accountant: {
      title: 'Buxgalter',
      color: '#f59e0b',
      badge: 'badge-warning',
      desc: 'To‘lovlarni qabul qilish, avtomatik taqsimlash, hisobot va exportlar bilan ishlash.',
      permissions: [
        'To‘lovlarni qabul qilish va eng eski qarzlarga avtomatik taqsimlash',
        'Kvitansiya chiqarish va CSV exportlarni yuklab olish',
        'Moliyaviy hisobotlar va kechikkan qarzlarni kuzatish',
      ],
      restrictions: [
        'Qurilmalarni bloklash, o‘chirish yoki MDM boshqaruvidan chiqarish huquqi yo‘q',
        'Foydalanuvchilar va tizim sozlamalarini boshqara olmaydi',
      ],
    },
    viewer: {
      title: 'Mijoz (Portal ko‘rish)',
      color: '#22c55e',
      badge: 'badge-active',
      desc: 'Mijoz tizimga kirib faqat o‘zining qurilmalari, to‘lovlar grafigi va qarzdorligini ko‘radi.',
      permissions: [
        'O‘ziga tegishli qurilma(lar) holati va bloklash sababini ko‘rish',
        'Shaxsiy nasiya to‘lovlar taqvimi va qoldiq qarzni kuzatish',
        'To‘lov cheklari va amalga oshirilgan to‘lovlar tarixini ko‘rish',
        'Telegram va SMS orqali to‘lov eslatmalarini qabul qilish',
      ],
      restrictions: [
        'Boshqa mijozlar yoki xodimlar ma’lumotlariga mutlaqo ruxsat yo‘q',
        'Hech qanday boshqaruv buyrug‘i bera olmaydi',
      ],
    },
  }[form.role]

  const initials = (form.full_name || form.email || 'U')
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
        <span className="crumb-current">Yangi akkaunt qo‘shish</span>
      </div>

      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Yangi akkaunt yaratish</h1>
            <span className="badge badge-info plain">Xodim yoki Mijoz portali</span>
          </div>
          <div className="page-desc">
            Tizim xodimlari (Admin, Operator) yoki o‘z to‘lovlarini kuzatuvchi mijozlar uchun kirish profilini ochish
          </div>
        </div>

        <div className="btn-row">
          <Link to="/users" className="btn btn-secondary">
            Bekor qilish
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={createUser.isPending || !form.email || form.password.length < 8}
            style={{ minWidth: 160 }}
          >
            {createUser.isPending && <span className="spinner" />}
            Akkauntni yaratish
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {createUser.isError && (
            <Alert kind="error">
              {createUser.error instanceof Error
                ? createUser.error.message
                : 'Yaratib bo‘lmadi'}
            </Alert>
          )}

          {/* Full-width 2-column Dashboard Grid */}
          <div className="calc-layout" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)' }}>
            {/* Left Column: Form Inputs & Role Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Card 1: Asosiy kirish ma'lumotlari */}
              <div className="card">
                <div className="card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconUsers size={18} style={{ color: 'var(--primary)' }} />
                    <h2>1. Akkaunt rekvizitlari</h2>
                  </div>
                  <span className="badge badge-info plain">Kirish ma’lumotlari</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="form-grid">
                      <Field label="Elektron pochta (Email) *">
                        <input
                          className="input"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="xodim@sunicode.uz yoki mijoz@mail.uz"
                          required
                          autoFocus
                        />
                      </Field>

                      <div>
                        <Field label="Telefon raqami (+998 XX XXX XX XX)">
                          <PhoneInput
                            value={form.phone}
                            onChange={(masked) => setForm({ ...form, phone: masked })}
                          />
                        </Field>
                        <div style={{ marginTop: 5, fontSize: 11.5 }}>
                          {isPhoneValid ? (
                            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IconCheck size={13} /> Saqlanadigan format: {normalized}
                            </span>
                          ) : (
                            <span className="cell-faint">Mijozlar telefon raqami orqali ham kirishi mumkin</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Field label="Foydalanuvchi yoki Mijoz F.I.Sh">
                      <input
                        className="input"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        placeholder="Masalan: Karimov Anvar Salimovich"
                      />
                    </Field>

                    <Field label="Maxfiy parol * (kamida 8 belgi)">
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          className="input"
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Kamida 8 ta belgi"
                          required
                          minLength={8}
                          style={{ paddingRight: 45 }}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: 6, padding: '4px 8px' }}
                          title="Parolni ko‘rsatish/yashirish"
                        >
                          <IconEye size={16} />
                        </button>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Card 2: Tizimdagi roli (RBAC) */}
              <div className="card">
                <div className="card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconShieldCheck size={18} style={{ color: 'var(--cyan-neon)' }} />
                    <h2>2. Tizimdagi roli va kirish huquqi (RBAC)</h2>
                  </div>
                  <span className="badge badge-active plain">{roleInfo.title} tanlangan</span>
                </div>
                <div className="card-body">
                  <div className="role-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {/* Operator */}
                    <div
                      className={`role-select-card ${form.role === 'operator' ? 'is-selected' : ''}`}
                      onClick={() => setForm({ ...form, role: 'operator' })}
                      style={{ cursor: 'pointer', padding: 16 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconUsers size={18} />
                        </div>
                        <div className="role-title" style={{ margin: 0, fontSize: 14 }}>Operator</div>
                      </div>
                      <div className="role-desc" style={{ fontSize: 12, lineHeight: 1.4 }}>
                        Xodim — qurilmalarni ro‘yxatga olish, bloklash/ochish, shartnoma kiritish, to‘lovlarni qabul qilish.
                      </div>
                      </div>

                    <div
                      className={`role-select-card ${form.role === 'accountant' ? 'is-selected' : ''}`}
                      onClick={() => setForm({ ...form, role: 'accountant' })}
                      style={{ cursor: 'pointer', padding: 16 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: 'rgba(245, 158, 11, 0.15)',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#f59e0b',
                          }}
                        >
                          <IconShieldAlert size={16} />
                        </div>
                        <div className="role-title" style={{ margin: 0, fontSize: 14 }}>Buxgalter</div>
                      </div>
                      <div className="role-desc" style={{ fontSize: 12, lineHeight: 1.4 }}>
                        To‘lov, kvitansiya, hisobot va CSV exportlar.
                      </div>
                    </div>

                    {/* Admin */}
                    <div
                      className={`role-select-card ${form.role === 'admin' ? 'is-selected' : ''}`}
                      onClick={() => setForm({ ...form, role: 'admin' })}
                      style={{ cursor: 'pointer', padding: 16 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#facc15',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconShieldCheck size={18} />
                        </div>
                        <div className="role-title" style={{ margin: 0, fontSize: 14 }}>Administrator</div>
                      </div>
                      <div className="role-desc" style={{ fontSize: 12, lineHeight: 1.4 }}>
                        Tizim ma’muri — to‘liq nazorat: sozlamalar, arxivni boshqarish, xodimlar va audit nazorati.
                      </div>
                    </div>

                    {/* Mijoz (Viewer) */}
                    <div
                      className={`role-select-card ${form.role === 'viewer' ? 'is-selected' : ''}`}
                      onClick={() => setForm({ ...form, role: 'viewer' })}
                      style={{ cursor: 'pointer', padding: 16 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconSmartphone size={18} />
                        </div>
                        <div className="role-title" style={{ margin: 0, fontSize: 14 }}>Mijoz (Portal)</div>
                      </div>
                      <div className="role-desc" style={{ fontSize: 12, lineHeight: 1.4 }}>
                        Mijoz portali — mijoz tizimga kirib faqat o‘zining qurilmasi va to‘lov grafigini ko‘rishi mumkin.
                      </div>
                    </div>
                  </div>

                  {/* Role Permissions Detailed Breakdown */}
                  <div
                    style={{
                      marginTop: 20,
                      padding: 16,
                      background: 'var(--surface-2)',
                      borderRadius: 12,
                      border: '1px solid var(--border-soft)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 10 }}>
                      «{roleInfo.title}» roli uchun beriladigan ruxsatlar:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: 'var(--text)' }}>
                      {roleInfo.permissions.map((p, i) => (
                        <li key={i} style={{ color: 'var(--text-dim)' }}>
                          <strong style={{ color: '#22c55e' }}>✓</strong> {p}
                        </li>
                      ))}
                      {roleInfo.restrictions.map((r, i) => (
                        <li key={i} style={{ color: 'var(--text-faint)' }}>
                          <strong style={{ color: '#ef4444' }}>✕</strong> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Profile Preview & Security Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Live Profile Card */}
              <div className="settings-card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginBottom: 12 }}>
                  Jonli profil kartochkasi (Preview)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--cyan-neon) 100%)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    {initials || '?'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong" style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.full_name || 'F.I.Sh kiritilmagan'}
                    </div>
                    <div className="cell-faint" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.email || 'email@domen.uz'}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span className={`badge ${roleInfo.badge} plain`} style={{ fontSize: 11, padding: '2px 8px' }}>
                        {roleInfo.title}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cell-dim">Telefon raqami:</span>
                    <strong className="mono">{isPhoneValid ? normalized : (form.phone.trim() || '—')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cell-dim">Kirish usuli:</span>
                    <span>Email yoki Telefon</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cell-dim">Akkaunt holati:</span>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>Faol (Active)</span>
                  </div>
                </div>
              </div>

              {/* Security & Password Guidelines */}
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <IconShieldAlert size={18} style={{ color: 'var(--warning)' }} />
                  <div className="cell-strong" style={{ fontSize: 14 }}>Xavfsizlik va tavsiyalar</div>
                </div>

                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-dim)' }}>
                  <li>Parol kamida 8 ta belgidan iborat bo‘lishi shart.</li>
                  <li>Mijozlar uchun yaratilgan akkauntlar faqat o‘ziga tegishli shartnoma va to‘lovlarni ko‘ra oladi.</li>
                  <li>Administrator huquqini faqat ishonchli xodimlarga bering.</li>
                  <li>Akkaunt yaratilgach, foydalanuvchi darhol login sahifasi orqali kirishi mumkin.</li>
                </ul>
              </div>

              {/* Quick Submit Block */}
              <div style={{ display: 'flex', gap: 12 }}>
                <Link to="/users" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Bekor qilish
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createUser.isPending || !form.email || form.password.length < 8}
                  style={{ flex: 1.5, justifyContent: 'center' }}
                >
                  {createUser.isPending && <span className="spinner" />}
                  Yaratish →
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
