export type Role = 'admin' | 'operator' | 'accountant' | 'viewer'
export type Platform = 'ios' | 'android'
export type DeviceStatus = 'pending' | 'active' | 'locked' | 'released' | 'lost'
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial'
export type ContractStatus = 'ongoing' | 'closed' | 'defaulted'

export interface User {
  shop_id?: number | null
  id: number
  email: string
  phone?: string | null
  full_name: string
  role: Role
  is_active: boolean
  is_archived?: boolean
  archived_at?: string | null
  created_at: string
}

export interface Actor {
  UserID: number
  Email: string
  Role: Role
}

export interface Customer {
  id: number
  full_name: string
  phone: string
  passport: string | null
  address: string | null
  telegram_chat_id: string | null
  note: string | null
  is_archived?: boolean
  archived_at?: string | null
  created_at: string
  device_count?: number
}

export interface Shop {
  logo_url?: string | null
  project_name?: string
  id: number
  name: string
  phone: string
  address: string | null
  add_key: string
  add_url: string
  created_at: string
  updated_at: string
}

export interface Device {
  id: number
  customer_id: number | null
  customer_name?: string
  customer_phone?: string
  platform: Platform
  enrollment_id: string | null
  serial_number: string | null
  imei: string | null
  model: string | null
  status: DeviceStatus
  is_locked?: boolean
  is_supervised?: boolean | null
  amapi_name: string | null
  lock_message: string | null
  is_archived?: boolean
  archived_at?: string | null
  last_seen_at: string | null
  enrolled_at: string | null
  created_at: string
}

export interface Payment {
  id: number
  contract_id: number
  device_id: number
  seq: number
  due_date: string
  amount: string
  paid_amount: string
  status: PaymentStatus
  external_ref: string | null
  paid_at: string | null
}

export interface PaymentPenalty {
  payment_id: number
  days_late: number
  grace_days: number
  penalty_days: number
  daily_percent: string
  principal: string
  penalty_amount: string
  total_due: string
  penalty_enabled: boolean
  penalty_waived: boolean
}

export interface PaymentAllocation {
  payment_id: number
  seq: number
  applied: string
  status: PaymentStatus
}

export interface PaymentTransaction {
  id: number
  payment_id: number
  contract_id: number
  device_id: number
  amount: string
  external_ref: string | null
  kind: 'payment' | 'refund'
  status: 'posted' | 'voided'
  reason: string | null
  created_by: number | null
  voided_by: number | null
  voided_at: string | null
  created_at: string
}

export interface AllocatePaymentResult {
  allocations: PaymentAllocation[]
  remaining: string
  contract_closed: boolean
  unlocked: boolean
  released: boolean
  message: string
}

export interface AttentionItem {
  kind: 'overdue_payment' | 'stuck_command' | 'offline_device' | string
  severity: 'high' | 'medium' | 'low' | string
  title: string
  message: string
  device_id?: number
  payment_id?: number
  command_id?: number
  customer?: string
  amount?: string
  created_at?: string
  due_date?: string
  last_seen_at?: string
}

export interface Contract {
  id: number
  device_id: number
  total_amount: string
  down_payment: string
  months: number
  grace_days: number
  start_date: string
  status: ContractStatus
  created_at: string
  payments?: Payment[]
  paid_amount: string
  remaining_amount: string
}

export interface MDMCommand {
  id: number
  device_id: number
  command_type: 'lock' | 'unlock' | 'erase' | 'info' | 'release'
  command_uuid: string | null
  status: 'queued' | 'sent' | 'acknowledged' | 'error' | 'cancelled' | 'failed'
  attempts: number
  last_error: string | null
  next_retry_at: string | null
  created_at: string
  acked_at: string | null
}

export interface AuditEntry {
  id: number
  user_id: number | null
  user_email?: string
  user_name?: string
  user_role?: string
  device_id: number | null
  device_model?: string
  device_platform?: string
  device_imei?: string
  customer_name?: string
  action: string
  reason: string | null
  meta?: unknown
  created_at: string
}

export interface DeviceDetail {
  device: Device
  customer: Customer | null
  contracts: Contract[]
  commands: MDMCommand[]
  audit: AuditEntry[]
}

export interface DashboardStats {
  total_devices: number
  active_devices: number
  locked_devices: number
  pending_devices: number
  released_devices: number
  lost_devices: number
  overdue_payments: number
  due_this_week: number
  total_customers: number
  outstanding_amount: string
  collected_amount: string
  failed_commands: number
}

export interface LockResult {
  device_id: number
  status: DeviceStatus
  command_id: number
  command_uuid: string
  queued: boolean
  message: string
}

export interface Enrollment {
  id: number
  device_id: number
  platform: Platform
  token: string
  qr_payload: string | null
  profile: string | null
  status: 'pending' | 'completed' | 'expired'
  expires_at: string
  created_at: string
}

export interface NotificationTemplate {
  code: string
  channel: string
  body: string
  is_active: boolean
  updated_at: string
}

export interface MDMProviderStatus {
  platform: Platform
  provider: string
  /** false = mock: qurilmalar haqiqatda bloklanmaydi */
  real: boolean
  ready: boolean
  error?: string
}

export interface CollectionItem {
  payment_id: number
  device_id: number
  customer_name: string
  customer_phone: string
  device_model: string
  device_status: string
  due_date: string
  outstanding: string
  days_overdue: number
  grace_days: number
}

export interface CollectionBucket {
  label: string
  count: number
  amount: string
}

export interface CollectionReport {
  total_outstanding: string
  overdue_count: number
  device_count: number
  buckets: CollectionBucket[]
  items: CollectionItem[]
}

export interface DailyReport {
  started_at: string
  marked_overdue: number
  reminders_sent: number
  devices_locked: number
  lock_failures: number
  enrollments_expired: number
  duration: string
}

export interface ListResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface MonthlyTrend {
  month: string
  label: string
  collected: string
  scheduled: string
  contract_qty: number
}

export interface AgingCategory {
  category: string
  count: number
  amount: string
  percent: number
}

export interface PlatformShare {
  platform: 'ios' | 'android'
  count: number
  amount: string
  percent: number
}

export interface TopModelStat {
  model: string
  platform: string
  count: number
  total_sum: string
}

export interface ContractDurationStat {
  months: number
  count: number
  total_sum: string
}

export interface CustomerSegmentStat {
  segment: string
  count: number
  percent: number
}

export interface TopCustomerStat {
  id: number
  full_name: string
  phone: string
  device_count: number
  total_amount: string
  paid_amount: string
  overdue_count: number
}

export interface ReportsAnalytics {
  total_portfolio: string
  collected_total: string
  outstanding_total: string
  overdue_total: string
  active_contracts: number
  closed_contracts: number
  monthly_trends?: MonthlyTrend[]
  aging_summary?: AgingCategory[]
  platforms?: PlatformShare[]
  top_models?: TopModelStat[]
  contract_terms?: ContractDurationStat[]
  customer_segments?: CustomerSegmentStat[]
  top_customers?: TopCustomerStat[]
}
