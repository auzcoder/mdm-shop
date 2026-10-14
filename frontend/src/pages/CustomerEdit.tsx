import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import { useCustomers } from '../hooks/useCustomers'
import type { Customer } from '../lib/types'
import { formatPhone, normalizePhone } from '../lib/mask'
import { PhoneInput } from '../components/PhoneInput'
import { PassportInput } from '../components/PassportInput'
import { IconCheck, IconMapPin, IconUsers } from '../components/Icons'
import { Alert, Field, Loading } from '../components/ui'
import { useToast } from '../components/Toast'

export default function CustomerEdit() {
  const { id } = useParams<{ id: string }>()
  const customerId = Number(id)
  const navigate = useNavigate()
  const { updateCustomer } = useCustomers()
  const { success, error } = useToast()

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => api.get<Customer>(`/customers/${customerId}`),
    enabled: Number.isFinite(customerId),
  })

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    passport: '',
    address: '',
    telegram_chat_id: '',
    note: '',
  })

  useEffect(() => {
    if (customer) {
      setForm({
        full_name: customer.full_name,
        phone: formatPhone(customer.phone),
        passport: customer.passport || '',
        address: customer.address || '',
        telegram_chat_id: customer.telegram_chat_id || '',
        note: customer.note || '',
      })
    }
  }, [customer])

  const normalized = normalizePhone(form.phone)
  const isPhoneValid = normalized.length === 13

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) return
    if (!isPhoneValid) {
      error('Telefon xatosi', 'Iltimos, to‘liq 9 xonali telefon raqamini kiriting (+998 XX XXX XX XX)')
      return
    }

    try {
      await updateCustomer.mutateAsync({
        id: customerId,
        input: {
          full_name: form.full_name.trim(),
          phone: normalized,
          passport: form.passport.trim() || null,
          address: form.address.trim() || null,
          telegram_chat_id: form.telegram_chat_id.trim() || null,
          note: form.note.trim() || null,
        },
      })
      success('Mijoz yangilandi', `"${form.full_name}" ma’lumotlari muvaffaqiyatli saqlandi`)
      navigate('/customers')
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Mijozni yangilab bo‘lmadi')
    }
  }

  if (isLoading) return <Loading />

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
        <span className="crumb-current">Mijozni tahrirlash</span>
      </div>

      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Mijoz ma’lumotlarini tahrirlash</h1>
            <span className="badge badge-info plain">ID #{customerId}</span>
          </div>
          <div className="page-desc">ID #{customerId} mijoz ma’lumotlarini yangilang</div>
        </div>

        <div className="btn-row">
          <Link to="/customers" className="btn btn-secondary">
            Orqaga
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={updateCustomer.isPending || !form.full_name.trim() || !isPhoneValid}
            style={{ minWidth: 160 }}
          >
            {updateCustomer.isPending && <span className="spinner" />}
            Saqlash
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {updateCustomer.isError && (
            <Alert kind="error">
              {updateCustomer.error instanceof Error
                ? updateCustomer.error.message
                : 'Mijozni saqlashda xatolik'}
            </Alert>
          )}

          <div className="calc-layout" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)' }}>
            {/* Left Column: Form Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconUsers size={18} style={{ color: 'var(--primary)' }} />
                    <h2>1. Shaxsiy ma’lumotlar</h2>
                  </div>
                  <span className="badge badge-info plain">ID #{customerId}</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <Field label="Familiya, Ism va Sharif (F.I.Sh) *">
                      <input
                        className="input"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
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
                              <IconCheck size={13} /> Bazadagi format: {normalized}
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

                    <Field label="Telegram chat ID (ixtiyoriy)">
                      <input
                        className="input mono"
                        value={form.telegram_chat_id}
                        onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
                        placeholder="Masalan: 123456789"
                      />
                    </Field>
                  </div>
                </div>
              </div>

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
                      />
                    </Field>

                    <Field label="Qo‘shimcha izoh yoki kafil ma’lumoti">
                      <textarea
                        className="input"
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        rows={3}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Customer Card Preview */}
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
                    }}
                  >
                    {initials || '?'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong" style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.full_name || 'F.I.Sh'}
                    </div>
                    <div className="cell-faint mono" style={{ fontSize: 13 }}>
                      {isPhoneValid ? normalized : form.phone}
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
                    <span className="cell-dim">Qurilmalar soni:</span>
                    <strong className="num">{customer?.device_count ?? 0} ta</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Link to="/customers" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Bekor qilish
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updateCustomer.isPending || !form.full_name.trim() || !isPhoneValid}
                  style={{ flex: 1.5, justifyContent: 'center' }}
                >
                  {updateCustomer.isPending && <span className="spinner" />}
                  Saqlash →
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
