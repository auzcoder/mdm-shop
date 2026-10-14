import type { DeviceStatus, PaymentStatus, Platform } from './types'

const money = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 })

export function sum(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '—'
  return `${money.format(Math.round(n))} so'm`
}

export function date(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeDays(value: string | null | undefined): number | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

export const deviceStatusLabel: Record<DeviceStatus, string> = {
  pending: 'Kutilmoqda',
  active: 'Faol',
  locked: 'Bloklangan',
  released: 'Chiqarilgan',
  lost: 'Yo‘qolgan',
}

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: 'Kutilmoqda',
  paid: 'Yakunlandi',
  overdue: 'Kechikkan',
  partial: 'Qisman',
}

export const platformLabel: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
}

export const actionLabel: Record<string, string> = {
  api_request_started: 'So‘rov boshlandi',
  api_request: 'So‘rov natijasi',
  entity_insert: 'Yangi yozuv saqlandi',
  entity_update: 'Ma’lumot o‘zgartirildi',
  command_acknowledged: 'Buyruq qurilmada bajarildi',
  command_failed: 'Qurilma buyruqni rad etdi',
  shop_gateway_key_changed: 'Do‘kon ulanish kaliti o‘zgartirildi',
  shop_policy_update: 'Obuna va limitlar o‘zgartirildi',
  mfa_enabled: 'Ikki bosqichli kirish yoqildi',
  mfa_disabled: 'Ikki bosqichli kirish o‘chirildi',
  login: 'Tizimga kirish',
  lock: 'Bloklash',
  unlock: 'Ochish',
  release: 'Boshqaruvdan chiqarish',
  erase: 'Tozalash',
  payment: 'To‘lov',
  enrolled: 'Ro‘yxatdan o‘tdi',
  enroll_token: 'Enrollment yaratildi',
  device_create: 'Qurilma qo‘shildi',
  device_update: 'Qurilma tahrirlandi',
  device_delete: 'Qurilma arxivlandi',
  device_archive: 'Qurilma arxivlandi',
  device_restore: 'Qurilma tiklandi',
  device_lost: 'Yo‘qolgan deb belgilandi',
  customer_create: 'Mijoz qo‘shildi',
  customer_update: 'Mijoz tahrirlandi',
  customer_delete: 'Mijoz arxivlandi',
  customer_archive: 'Mijoz arxivlandi',
  customer_restore: 'Mijoz tiklandi',
  contract_create: 'Shartnoma tuzildi',
  contract_reschedule: 'To‘lov grafigi tahrirlandi',
  payment_allocate: 'To‘lov taqsimlandi',
  penalty_waive: 'Penya bekor qilindi',
  penalty_restore: 'Penya qayta yoqildi',
  daily_job: 'Kunlik avtomatik tekshiruv',
  cert_warning: 'Sertifikat ogohlantirishi',
  user_create: 'Foydalanuvchi qo‘shildi',
  user_update: 'Foydalanuvchi tahrirlandi',
  user_delete: 'Foydalanuvchi arxivlandi',
  user_archive: 'Foydalanuvchi arxivlandi',
  user_restore: 'Foydalanuvchi tiklandi',
  password_change: 'Parol o‘zgartirildi',
  settings_update: 'Sozlamalar yangilandi',
  template_update: 'Shablon yangilandi',
}

export const reasonLabel: Record<string, string> = {
  overdue: 'Kechikish',
  manual: 'Qo‘lda',
  paid: 'To‘lov',
  system: 'Tizim',
}

export const uzbekMonths: Record<string, string> = {
  '01': 'Yanvar',
  '02': 'Fevral',
  '03': 'Mart',
  '04': 'Aprel',
  '05': 'May',
  '06': 'Iyun',
  '07': 'Iyul',
  '08': 'Avgust',
  '09': 'Sentabr',
  '10': 'Oktabr',
  '11': 'Noyabr',
  '12': 'Dekabr',
}

export function formatMonthYearUz(ym: string | null | undefined): string {
  if (!ym) return '—'
  const parts = ym.split('-')
  if (parts.length >= 2) {
    const month = parts[1]
    const name = uzbekMonths[month] || month
    return `${ym} (${name})`
  }
  return ym
}

export function monthNameUz(ymOrNum: string | null | undefined): string {
  if (!ymOrNum) return ''
  const parts = ymOrNum.split('-')
  const m = parts.length >= 2 ? parts[1] : String(ymOrNum).padStart(2, '0')
  return uzbekMonths[m] || ymOrNum
}
