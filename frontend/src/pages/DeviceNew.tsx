import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useCustomers } from '../hooks/useCustomers'
import { useDeviceControl } from '../hooks/useDeviceControl'
import { CustomSelect } from '../components/CustomSelect'
import {
  IconAndroid,
  IconApple,
  IconMac,
  IconPlus,
  IconSmartphone,
  IconUsers,
} from '../components/Icons'
import { Alert, Field } from '../components/ui'
import { useToast } from '../components/Toast'
import { useDeviceModels } from '../hooks/useDeviceModels'

export default function DeviceNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedCustomerId = searchParams.get('customer_id')

  const { createDevice } = useDeviceControl()
  const { data: customers, isLoading: loadingCustomers } = useCustomers('', 0, 500)
  const { success, error } = useToast()

  // Default platform: Apple iOS as requested
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios')
  const [customerId, setCustomerId] = useState(preselectedCustomerId || '')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [imei, setImei] = useState('')

  // Sync if preselectedCustomerId changes in URL
  useEffect(() => {
    if (preselectedCustomerId) {
      setCustomerId(preselectedCustomerId)
    }
  }, [preselectedCustomerId])

  // Fetch active models from database
  const { models: dbModels, isLoading: loadingModels } = useDeviceModels(platform, true)

  const selectedCustomer = customers?.items.find((c) => String(c.id) === customerId)

  // Options for custom model select (only active models from DB)
  const modelOptions = [
    { value: '', label: '— Modelni tanlang yoki qo‘lda yozing —' },
    ...dbModels.map((m) => ({
      value: m.name,
      label: m.name,
      icon: platform === 'ios' ? <IconApple size={16} /> : <IconAndroid size={16} />,
    })),
  ]

  const customerOptions = [
    { value: '', label: '— Mijoz keyin biriktiriladi —' },
    ...(customers?.items.map((c) => ({
      value: String(c.id),
      label: c.full_name,
      sublabel: `${c.phone}${c.passport ? ` · ${c.passport}` : ''}`,
      icon: <IconUsers size={16} />,
    })) ?? []),
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!model.trim()) {
      error('Model kerak', 'Qurilma modelini ro‘yxatdan tanlang yoki qo‘lda kiriting')
      return
    }
    try {
      const device = await createDevice.mutateAsync({
        customer_id: customerId ? Number(customerId) : null,
        platform,
        model: model.trim() || null,
        serial_number: serialNumber.trim() || null,
        imei: imei.trim() || null,
      })
      success('Qurilma qo‘shildi', `#${device.id} (${device.model || platform.toUpperCase()}) muvaffaqiyatli saqlandi`)
      navigate(`/devices/${device.id}`)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Qurilmani saqlab bo‘lmadi')
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumbs */}
      <div className="page-breadcrumb">
        <Link to="/devices">Qurilmalar</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Yangi qurilma qo‘shish</span>
      </div>

      <div className="page-head">
        <div>
          <h1>Yangi qurilma qo‘shish</h1>
        </div>

        <div className="btn-row">
          <Link to="/devices" className="btn btn-secondary">
            Bekor qilish
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={createDevice.isPending}
            style={{ minWidth: 160 }}
          >
            {createDevice.isPending && <span className="spinner" />}
            Qurilmani saqlash
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {createDevice.isError && (
            <Alert kind="error">
              {createDevice.error instanceof Error
                ? createDevice.error.message
                : 'Qurilmani saqlashda xatolik yuz berdi'}
            </Alert>
          )}

          <div className="calc-layout" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)' }}>
            {/* Left Column: Form Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 1. Platformani tanlash */}
              <div className="card">
                <div className="card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconSmartphone size={18} style={{ color: 'var(--primary)' }} />
                    <h2>1. Platformani tanlang</h2>
                  </div>
                </div>
                <div className="card-body">
                  <div className="platform-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {/* 1. Apple iOS */}
                    <div
                      className={`platform-card ${platform === 'ios' ? 'is-selected' : ''}`}
                      onClick={() => setPlatform('ios')}
                      style={{ cursor: 'pointer', padding: '14px 16px' }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-strong)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconApple size={24} />
                      </div>
                      <div className="platform-info">
                        <div className="platform-name" style={{ fontSize: 14 }}>Apple iPhone / iPad</div>
                      </div>
                      <div className="platform-radio">
                        <span className="radio-dot" />
                      </div>
                    </div>

                    {/* 2. Google Android */}
                    <div
                      className="platform-card"
                      style={{ cursor: 'not-allowed', padding: '14px 16px', opacity: 0.45, borderStyle: 'dashed' }}
                      title="Android qurilma qo‘shish vaqtincha o‘chirilgan"
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconAndroid size={24} />
                      </div>
                      <div className="platform-info">
                        <div className="platform-name" style={{ fontSize: 14 }}>Google Android</div>
                        <div className="platform-desc">Vaqtincha o‘chirilgan</div>
                      </div>
                      <div className="platform-radio">
                        <span className="radio-dot" />
                      </div>
                    </div>

                    {/* 3. Apple macOS (Disabled) */}
                    <div
                      className="platform-card"
                      style={{
                        opacity: 0.45,
                        cursor: 'not-allowed',
                        borderStyle: 'dashed',
                        background: 'var(--surface-2)',
                        padding: '14px 16px',
                      }}
                      title="macOS tez kunda qo‘shiladi"
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: 'var(--surface-3)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-faint)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconMac size={22} />
                      </div>
                      <div className="platform-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="platform-name" style={{ fontSize: 13.5 }}>macOS (MacBook, iMac)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Mijozni biriktirish */}
              <div className="card">
                <div className="card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconUsers size={18} style={{ color: 'var(--cyan-neon)' }} />
                    <h2>2. Mijozni tanlang</h2>
                  </div>
                  <Link
                    to="/customers/new?return_to=/devices/new"
                    className="btn btn-sm btn-primary"
                  >
                    <IconPlus size={14} /> Yangi mijoz qo‘shish
                  </Link>
                </div>
                <div className="card-body">
                  <Field label="Mijoz (F.I.Sh, telefon yoki passport bo‘yicha qidiring)">
                    <CustomSelect
                      value={customerId}
                      onChange={setCustomerId}
                      options={customerOptions}
                      searchable
                      disabled={loadingCustomers}
                      placeholder="Mijozni qidirish uchun yozing..."
                    />
                  </Field>
                </div>
              </div>

              {/* 3. Qurilma modeli va rekvizitlari */}
              <div className="card">
                <div className="card-head">
                  <h2>3. Qurilma modeli va rekvizitlari</h2>
                  <Link to="/models" target="_blank" className="btn btn-sm btn-ghost" style={{ fontSize: 12 }}>
                    Modellarni boshqarish ↗
                  </Link>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="form-grid">
                      <Field label={`Qurilma modeli (${platform === 'ios' ? 'Apple iPhone' : 'Android'}) *`}>
                        <CustomSelect
                          value={model}
                          onChange={setModel}
                          options={modelOptions}
                          searchable
                          disabled={loadingModels}
                          placeholder="Modelni tanlang yoki qidiring..."
                        />
                      </Field>

                      <Field label="Yoki qo‘lda to‘g‘rilang (ro‘yxatda bo‘lmasa)">
                        <input
                          className="input"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder="Masalan: iPhone 16 Pro Max 512GB"
                        />
                      </Field>
                    </div>

                    <div className="form-grid">
                      <Field label="IMEI raqami (15 xonali)">
                        <input
                          className="input mono"
                          value={imei}
                          onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                          placeholder="358941091234567"
                          inputMode="numeric"
                          maxLength={15}
                        />
                      </Field>

                      <Field label="Seriya raqami (Serial Number)">
                        <input
                          className="input mono"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                          placeholder="F2LZ90K8MD6M"
                          maxLength={32}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Device Card Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="settings-card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginBottom: 14 }}>
                  Qurilma kartochkasi (Preview)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: 'var(--surface-3)',
                      color: 'var(--text-strong)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {platform === 'ios' ? <IconApple size={28} /> : <IconAndroid size={26} style={{ color: '#10b981' }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong" style={{ fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {model || (platform === 'ios' ? 'Apple iPhone' : 'Android qurilma')}
                    </div>
                    <div className="cell-faint" style={{ fontSize: 12 }}>
                      {platform === 'ios' ? 'Apple iOS' : 'Google Android'}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span className="badge badge-info plain" style={{ fontSize: 10.5, padding: '1px 8px' }}>
                        Kutilmoqda (Pending)
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cell-dim">Biriktirilgan mijoz:</span>
                    <strong style={{ maxWidth: 180, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedCustomer ? selectedCustomer.full_name : 'Biriktirilmagan'}
                    </strong>
                  </div>
                  {selectedCustomer && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="cell-dim">Mijoz telefoni:</span>
                      <span className="mono">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cell-dim">IMEI:</span>
                    <span className="mono">{imei.trim() || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cell-dim">Seriya raqami:</span>
                    <span className="mono">{serialNumber.trim() || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <Link to="/devices" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Bekor qilish
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createDevice.isPending}
                  style={{ flex: 1.5, justifyContent: 'center' }}
                >
                  {createDevice.isPending && <span className="spinner" />}
                  Qurilmani saqlash →
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
