import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useSettings } from '../hooks/useSettings'
import { dateTime } from '../lib/format'
import type { NotificationTemplate, Shop } from '../lib/types'
import { Alert, Field, Loading } from '../components/ui'
import { useToast } from '../components/Toast'

const TEMPLATE_META: Record<
  string,
  { label: string; desc: string; sample: Record<string, string> }
> = {
  reminder_7: {
    label: 'Eslatma — 7 kun oldin',
    desc: 'To‘lov muddatiga 7 kun qolganda yuboriladigan xabar',
    sample: { customer: 'Ali Valiyev', due_date: '28.08.2026', amount: '850 000' },
  },
  reminder_3: {
    label: 'Eslatma — 3 kun oldin',
    desc: 'To‘lov muddatiga 3 kun qolganda yuboriladigan xabar',
    sample: { customer: 'Ali Valiyev', due_date: '28.08.2026', amount: '850 000' },
  },
  reminder_1: {
    label: 'Eslatma — 1 kun oldin',
    desc: 'To‘lov muddatiga 1 kun qolganda (ertaga) yuboriladigan xabar',
    sample: { customer: 'Ali Valiyev', due_date: '28.08.2026', amount: '850 000' },
  },
  locked: {
    label: 'Qurilma bloklanganda',
    desc: 'Muddati o‘tib grace period tugaganda mijozga yuboriladigan SMS',
    sample: { shop_phone: '+998 90 123 45 67' },
  },
  unlocked: {
    label: 'Qurilma ochilganda',
    desc: 'Qarz to‘langach qurilma ochilgani haqida xabar',
    sample: {},
  },
}

export default function Settings() {
  const { can } = useAuth()
  const editable = can('admin')
  const { success, error } = useToast()
  const { settings, isLoadingSettings, templates, isLoadingTemplates, saveSettings } = useSettings()
  const profile = useQuery({ queryKey: ['shop'], queryFn: () => api.get<Shop>('/shop') })
  const [tab, setTab] = useState<'general' | 'templates'>('general')
  const [values, setValues] = useState({
    default_grace_days: '3',
    allow_partial_payment: 'true',
    penalty_enabled: 'false',
    penalty_daily_percent: '0.2',
    lock_screen_message: "To'lov muddati o'tdi. Qurilma bloklandi.",
  })
  useEffect(() => { if (settings) setValues(current => Object.fromEntries(Object.keys(current).map(key => [key, settings[key] ?? current[key as keyof typeof current]])) as typeof current) }, [settings])
  async function save() {
    if (!Number.isInteger(Number(values.default_grace_days)) || Number(values.default_grace_days) < 0 || !Number.isFinite(Number(values.penalty_daily_percent)) || Number(values.penalty_daily_percent) < 0) { error('Qiymatni tekshiring', 'Kun va foiz manfiy bo‘lmasligi kerak.'); return }
    try { await saveSettings.mutateAsync(values); success('Saqlandi', 'Do‘kon to‘lov qoidalari yangilandi.') } catch (err) { error('Saqlanmadi', err instanceof Error ? err.message : 'Qayta urinib ko‘ring') }
  }
  if (isLoadingSettings || profile.isLoading) return <Loading />
  return <div className="shop-settings">
    <div className="page-head"><div><h1>Do‘kon sozlamalari</h1><p className="page-desc">Profil, to‘lov qoidalari va mijozlarga xabarnomalar.</p></div><Link className="btn" to="/audit">Amallar tarixi →</Link></div>
    {(profile.isError || !settings) && <Alert kind="error">Ma’lumotlarni yuklab bo‘lmadi. Sahifani yangilang.</Alert>}
    <section className="shop-profile-card"><div className="shop-profile-avatar">{profile.data?.logo_url ? <img src={profile.data.logo_url} alt="Do‘kon logosi" /> : profile.data?.name?.slice(0, 1)}</div><div><h2>{profile.data?.project_name || profile.data?.name}</h2><p>{profile.data?.phone || 'Telefon kiritilmagan'} · {profile.data?.address || 'Manzil kiritilmagan'}</p><small>Do‘kon nomi, domeni va logosi markaziy administrator tomonidan boshqariladi.</small></div></section>
    <div className="tab-nav" aria-label="Sozlamalar bo‘limlari"><button className={`tab-btn ${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>To‘lov qoidalari</button><button className={`tab-btn ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>Xabarnomalar</button></div>
    {tab === 'general' ? <section className="settings-card"><div className="settings-card-header"><div><h2>To‘lov va kechikishlar</h2><p className="settings-card-desc">Yangi shartnomalar uchun do‘kon qoidalari.</p></div></div>
    <div className="shop-settings-fields"><Field label="Imtiyozli muddat (kun)"><input className="input" type="number" min="0" step="1" disabled={!editable} value={values.default_grace_days} onChange={e => setValues({ ...values, default_grace_days: e.target.value })} /></Field><Field label="Kunlik penya (%)"><input className="input" type="number" min="0" step="0.01" disabled={!editable || values.penalty_enabled !== 'true'} value={values.penalty_daily_percent} onChange={e => setValues({ ...values, penalty_daily_percent: e.target.value })} /></Field></div>
    <div className="shop-preferences">{(['allow_partial_payment', 'penalty_enabled'] as const).map(key => <label className="shop-preference" key={key}><div><strong>{key === 'allow_partial_payment' ? 'Qisman to‘lov' : 'Kechikish uchun penya'}</strong><small>{key === 'allow_partial_payment' ? 'Mijoz to‘lovni bo‘lib amalga oshirishi mumkin.' : 'Belgilangan foiz bo‘yicha penya hisoblash.'}</small></div><input type="checkbox" role="switch" disabled={!editable} checked={values[key] === 'true'} onChange={e => setValues({ ...values, [key]: String(e.target.checked) })} /></label>)}</div>
    <div className="lock-screen-settings">
      <div className="lock-screen-settings-copy"><span className="settings-eyebrow">Qulflash ekrani</span><h3>Standart bloklash xabari</h3><p>Qo‘lda xabar yozilmaganda ushbu matn qurilmaga yuboriladi. iPhone’da aloqa raqami do‘kon profilidan alohida ko‘rsatiladi.</p></div>
      <Field label="Ekranda ko‘rinadigan matn"><textarea className="input lock-screen-message-input" rows={4} disabled={!editable} value={values.lock_screen_message} onChange={e => setValues({ ...values, lock_screen_message: e.target.value })} placeholder="Masalan: To‘lov muddati o‘tdi. Iltimos, do‘konga murojaat qiling." /><small className="field-hint">Avtomatik bloklashda <code>{'{{days_overdue}}'}</code> o‘rniga kechikkan kunlar soni qo‘yiladi.</small></Field>
    </div>
    {editable && <div className="shop-settings-footer"><span>O‘zgarishlar markaziy serverda saqlanadi.</span><button className="btn btn-primary" disabled={saveSettings.isPending || !settings} onClick={() => void save()}>{saveSettings.isPending ? 'Saqlanmoqda…' : 'O‘zgarishlarni saqlash'}</button></div>}</section> : <div>{isLoadingTemplates ? <Loading /> : templates?.map(template => <ModernTemplateEditor key={template.code} template={template} editable={editable} shopName={profile.data?.name || ''} shopPhone={profile.data?.phone || ''} />)}</div>}
  </div>
}

function ModernTemplateEditor({
  template,
  editable,
  shopName,
  shopPhone,
}: {
  template: NotificationTemplate
  editable: boolean
  shopName: string
  shopPhone: string
}) {
  const { saveTemplate } = useSettings()
  const { success, error } = useToast()
  const [body, setBody] = useState(template.body)
  const [isActive, setIsActive] = useState(template.is_active)

  const meta = TEMPLATE_META[template.code] ?? {
    label: template.code,
    desc: 'SMS xabarnoma shabloni',
    sample: {},
  }

  const dirty = body !== template.body || isActive !== template.is_active

  const handleSave = async () => {
    try {
      await saveTemplate.mutateAsync({
        code: template.code,
        channel: template.channel,
        body,
        is_active: isActive,
      })
      success('Saqlandi', `"${meta.label}" shabloni yangilandi`)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Shablonni saqlab bo‘lmadi')
    }
  }

  const insertTag = (tag: string) => {
    setBody((prev) => prev + ' ' + tag)
  }

  // Generate live sample preview
  let previewText = body
  const sampleData: Record<string, string> = {
    '{{customer}}': meta.sample.customer || 'Ali Valiyev',
    '{{due_date}}': meta.sample.due_date || '25.08.2026',
    '{{amount}}': meta.sample.amount || '750 000',
    '{{shop_phone}}': shopPhone,
    '{{shop_name}}': shopName,
  }

  for (const [k, v] of Object.entries(sampleData)) {
    previewText = previewText.replaceAll(k, v)
  }

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="cell-strong" style={{ fontSize: 14.5 }}>{meta.label}</span>
            <span className="badge badge-info plain" style={{ fontSize: 11 }}>{template.code}</span>
          </div>
          <div className="settings-card-desc">{meta.desc}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label className="switch-label">
            <input
              type="checkbox"
              className="switch-input"
              checked={isActive}
              disabled={!editable}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <div className="switch-track">
              <div className="switch-thumb" />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: isActive ? 'var(--success)' : 'var(--text-faint)' }}>
              {isActive ? 'Faol' : 'O‘chirilgan'}
            </span>
          </label>

          {editable && (
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={!dirty || saveTemplate.isPending}
            >
              {saveTemplate.isPending && <span className="spinner" />}
              Saqlash
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div className="cell-faint" style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Mavjud o‘zgaruvchilar (qo‘shish uchun bosing):
        </div>
        <div className="tag-chips-row">
          {['{{customer}}', '{{due_date}}', '{{amount}}', '{{shop_phone}}', '{{shop_name}}'].map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-chip"
              disabled={!editable}
              onClick={() => insertTag(tag)}
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="input"
        rows={2}
        value={body}
        readOnly={!editable}
        onChange={(e) => setBody(e.target.value)}
        placeholder="SMS matnini kiriting…"
      />

      <div className="sms-preview-bubble">
        <div className="sms-preview-sender">{shopName} (SMS)</div>
        <div>{previewText}</div>
      </div>

      <div className="cell-faint" style={{ fontSize: 11, marginTop: 8, textAlign: 'right' }}>
        Oxirgi yangilanish: {dateTime(template.updated_at)}
      </div>
    </div>
  )
}
