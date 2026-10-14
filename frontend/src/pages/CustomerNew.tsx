import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useCustomers } from '../hooks/useCustomers'
import { normalizePhone } from '../lib/mask'
import { PhoneInput } from '../components/PhoneInput'
import { PassportInput } from '../components/PassportInput'
import { IconCheck, IconMapPin, IconSmartphone, IconUsers } from '../components/Icons'
import { Alert, Field } from '../components/ui'
import { useToast } from '../components/Toast'

export default function CustomerNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('return_to')

  const { createCustomer } = useCustomers()
  const { success, error } = useToast()

  const [form, setForm] = useState({
    full_name: '',
    phone: '+998 ',
    passport: '',
    address: '',
    telegram_chat_id: '',
    note: '',
  })

  const normalized = normalizePhone(form.phone)
  const isPhoneValid = normalized.length === 13 // e.g. +998901234567

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) return
    if (!isPhoneValid) {
      error('Telefon xatosi', 'Iltimos, to‘liq 9 xonali telefon raqamini kiriting (+998 XX XXX XX XX)')
      return
    }

    try {
      const customer = await createCustomer.mutateAsync({
        full_name: form.full_name.trim(),
        phone: normalized,
        passport: form.passport.trim() || null,
        address: form.address.trim() || null,
        telegram_chat_id: form.telegram_chat_id.trim() || null,
        note: form.note.trim() || null,
      })
      success('Mijoz qo‘shildi', `"${customer.full_name}" bazaga muvaffaqiyatli saqlandi`)
      if (returnTo) {
        const sep = returnTo.includes('?') ? '&' : '?'
        navigate(`${returnTo}${sep}customer_id=${customer.id}`)
      } else {
        navigate('/customers')
      }
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Mijozni saqlab bo‘lmadi')
    }
  }

  const initials = (form.full_name || 'M')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumbs */}
      <div className="page-breadcrumb">
        <Link to="/customers">Mijozlar</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Yangi mijoz qo‘shish</span>
      </div>

      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Yangi mijoz qo‘shish</h1>
            <span className="badge badge-info plain">Nasiya anketasi</span>
          </div>
          <div className="page-desc">Nasiya shartnomasi rasmiylashtirish uchun mijoz anketasini to‘ldiring</div>
        </div>

        <div className="btn-row">
          <Link to={returnTo || '/customers'} className="btn btn-secondary">
            Bekor qilish
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={createCustomer.isPending || !form.full_name.trim() || !isPhoneValid}
            style={{ minWidth: 160 }}
          >
            {createCustomer.isPending && <span className="spinner" />}
            Mijozni saqlash
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {createCustomer.isError && (
            <Alert kind="error">
              {createCustomer.error instanceof Error
                ? createCustomer.error.message
                : 'Mijozni saqlashda xatolik'}
            </Alert>
          )}

          <div className="calc-layout" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)' }}>
            {/* Left Column: Customer Form Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section 1: Asosiy shaxsiy ma'lumotlar */}
              <div className="card">
                <div className="card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconUsers size={18} style={{ color: 'var(--primary)' }} />
                    <h2>1. Mijoz shaxsiy ma’lumotlari</h2>
                  </div>
                  <span className="badge badge-info plain">Asosiy profil</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <Field label="Familiya, Ism va Sharif (F.I.Sh) *">
                      <input
                        className="input"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        placeholder="Masalan: Aliyev Vali Salimovich"
                        required
                        autoFocus
                      />
                    </Field>

                    <div className="form-grid">
                      <div>
                        <Field label="Telefon raqami * (+998 XX XXX XX XX)">
                          <PhoneInput
                            value={form.phone}
                            onChange={(masked) => setForm({ ...form, phone: masked })}
                            required
                          />
                        </Field>
                        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                          {isPhoneValid ? (
                            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IconCheck size={13} /> Saqlanadigan format: {normalized}
                            </span>
                          ) : (
                            <span className="cell-faint">
                              Format: +998 90 123 45 67 (9 ta raqam)
                            </span>
                          )}
                        </div>
                      </div>

                      <Field label="Passport / ID karta seriyasi">
                        <PassportInput
                          value={form.passport}
                          onChange={(masked) => setForm({ ...form, passport: masked })}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Manzil va Qo'shimcha ma'lumotlar */}
              <div className="card">
                <div className="card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconMapPin size={18} style={{ color: 'var(--cyan-neon)' }} />
                    <h2>2. Manzil va qo‘shimcha qaydlar</h2>
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <Field label="Doimiy yashash manzili">
                      <input
                        className="input"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Toshkent sh., Yunusobod t., 4-mavze, 12-uy"
                      />
                    </Field>

                    <Field label="Telegram chat ID (ixtiyoriy)">
                      <input
                        className="input mono"
                        value={form.telegram_chat_id}
                        onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
                        placeholder="Masalan: 123456789"
                      />
                    </Field>

                    <Field label="Qo‘shimcha izoh yoki kafil ma’lumoti">
                      <textarea
                        className="input"
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="Mijoz haqida qo‘shimcha qaydlar, ikkinchi telefon raqami, kafil yoki ish joyi"
                        rows={3}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Customer Profile Card & Tips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="settings-card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginBottom: 12 }}>
                  Mijoz kartochkasi (Preview)
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
                    <div className="cell-faint mono" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isPhoneValid ? normalized : (form.phone.trim() || '—')}
                    </div>
                    {form.passport && (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge badge-info plain mono" style={{ fontSize: 11, padding: '2px 8px' }}>
                          {form.passport}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cell-dim">Manzil:</span>
                    <span style={{ maxWidth: 180, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.address || 'Kiritilmagan'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cell-dim">Nasiya holati:</span>
                    <span className="cell-faint">Yangi mijoz (0 ta qurilma)</span>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <IconSmartphone size={18} style={{ color: 'var(--primary)' }} />
                  <div className="cell-strong" style={{ fontSize: 14 }}>Keyingi qadamlar</div>
                </div>

                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-dim)' }}>
                  <li>Mijoz saqlangach, qurilmalar ro‘yxatidan unga telefon biriktirishingiz mumkin.</li>
                  <li>Shartnoma tuzilganda to‘lovlar grafigi avtomatik hisoblanadi.</li>
                  <li>Mijoz uchun telefon raqami orqali kabinet ochish mumkin.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Link to={returnTo || '/customers'} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Bekor qilish
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createCustomer.isPending || !form.full_name.trim() || !isPhoneValid}
                  style={{ flex: 1.5, justifyContent: 'center' }}
                >
                  {createCustomer.isPending && <span className="spinner" />}
                  Mijozni saqlash →
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
