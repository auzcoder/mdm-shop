import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useDebounce } from '../hooks/useDebounce'
import { useDeviceControl } from '../hooks/useDeviceControl'
import { dateTime } from '../lib/format'
import type { Device, ListResponse } from '../lib/types'
import { CustomSelect } from '../components/CustomSelect'
import { IconAndroid, IconApple, IconHistory, IconPlus, IconSmartphone, IconTrash } from '../components/Icons'
import { ConfirmModal, DeviceBadge, Empty, Loading, Pagination } from '../components/ui'
import { useToast } from '../components/Toast'

const LIMIT = 25

const STATUS_OPTIONS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'active', label: 'Faol' },
  { value: 'locked', label: 'Bloklangan' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'released', label: 'Chiqarilgan' },
  { value: 'lost', label: 'Yo‘qolgan' },
]

const PLATFORM_OPTIONS = [
  { value: '', label: 'Barcha platformalar' },
  { value: 'ios', label: 'iOS (Apple)' },
  { value: 'android', label: 'Android' },
]

export default function Devices() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const { success, error } = useToast()

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [platform, setPlatform] = useState('')
  const [offset, setOffset] = useState(0)
  const [archiveTarget, setArchiveTarget] = useState<Device | null>(null)

  const isArchived = activeTab === 'archived'
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['devices', { search: debouncedSearch, status, platform, offset, archived: isArchived }],
    queryFn: () =>
      api.get<ListResponse<Device>>('/devices', {
        search: debouncedSearch,
        status,
        platform,
        archived: isArchived,
        limit: LIMIT,
        offset,
      }),
  })

  const { deleteDevice, restoreDevice } = useDeviceControl()

  const handleArchive = async () => {
    if (!archiveTarget) return
    try {
      await deleteDevice.mutateAsync(archiveTarget.id)
      success('Arxivlandi', `Qurilma #${archiveTarget.id} (${archiveTarget.model || ''}) arxivga olindi`)
      setArchiveTarget(null)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Arxivlab bo‘lmadi')
    }
  }

  const handleRestore = async (d: Device) => {
    try {
      await restoreDevice.mutateAsync(d.id)
      success('Tiklandi', `Qurilma #${d.id} arxivdan qayta tiklandi`)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Tiklab bo‘lmadi')
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Qurilmalar</h1>
        </div>
        {can('admin', 'operator') && (
          <Link to="/devices/new" className="btn btn-primary">
            <IconPlus size={16} />
            Qurilma qo‘shish
          </Link>
        )}
      </div>

      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('active')
            setOffset(0)
          }}
        >
          <IconSmartphone size={15} />
          Faol qurilmalar
        </button>
        <button
          className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('archived')
            setOffset(0)
          }}
        >
          <IconHistory size={15} />
          Arxivlanganlar
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="filters" style={{ flex: 1 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <input
                className="input search"
                placeholder="Seriya raqami, IMEI, model yoki mijoz bo‘yicha qidirish…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setOffset(0)
                }}
              />
            </div>

            <div style={{ width: 180 }}>
              <CustomSelect
                value={status}
                onChange={(val) => {
                  setStatus(val)
                  setOffset(0)
                }}
                options={STATUS_OPTIONS}
                placeholder="Holat bo‘yicha"
              />
            </div>

            <div style={{ width: 190 }}>
              <CustomSelect
                value={platform}
                onChange={(val) => {
                  setPlatform(val)
                  setOffset(0)
                }}
                options={PLATFORM_OPTIONS}
                placeholder="Platforma bo‘yicha"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : !data?.items?.length ? (
          <Empty
            icon={<IconSmartphone size={26} />}
            text={isArchived ? 'Arxivlangan qurilmalar yo‘q' : 'Qurilmalar topilmadi'}
            hint={
              debouncedSearch || status || platform
                ? 'Qidiruv yoki filtrlarni o‘zgartiring.'
                : isArchived
                  ? undefined
                  : 'Birinchi qurilmani ro‘yxatga oling.'
            }
            action={
              !isArchived && !debouncedSearch && !status && !platform && can('admin', 'operator') ? (
                <Link to="/devices/new" className="btn btn-primary">
                  <IconPlus size={16} /> Qurilma qo‘shish
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table-cards">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mijoz</th>
                    <th>Qurilma</th>
                    <th>Platforma</th>
                    <th>Seriya / IMEI</th>
                    <th>Holat</th>
                    <th>{isArchived ? "Arxivlangan sana" : "Oxirgi aloqa"}</th>
                    {can('admin') && <th />}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((d) => (
                    <tr
                      key={d.id}
                      className="clickable"
                      tabIndex={0}
                      role="link"
                      aria-label={`${d.model || 'Qurilma'} #${d.id} — tafsilot`}
                      onClick={() => navigate(`/devices/${d.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/devices/${d.id}`)
                        }
                      }}
                    >
                      <td data-label="ID" className="num cell-faint">#{d.id}</td>
                      <td data-label="Mijoz">
                        <div className="cell-strong">{d.customer_name || '—'}</div>
                        <div className="cell-faint">{d.customer_phone || ''}</div>
                      </td>
                      <td data-label="Qurilma">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <IconSmartphone size={16} style={{ color: isArchived ? 'var(--text-faint)' : 'var(--primary)' }} />
                          <span className={isArchived ? "cell-dim" : "cell-strong"}>{d.model || '—'}</span>
                          {isArchived && <span className="badge badge-locked" style={{ fontSize: 10, padding: '1px 6px' }}>Arxivda</span>}
                        </div>
                      </td>
                      <td data-label="Platforma">
                        {d.platform === 'ios' ? (
                          <span
                            className="badge badge-info plain"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px' }}
                          >
                            <IconApple size={14} /> Apple iOS
                          </span>
                        ) : (
                          <span
                            className="badge badge-active plain"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', color: '#22c55e' }}
                          >
                            <IconAndroid size={14} /> Android
                          </span>
                        )}
                      </td>
                      <td data-label="Seriya / IMEI" className="mono cell-dim">
                        {d.serial_number || '—'}
                        {d.imei && <div className="cell-faint">{d.imei}</div>}
                      </td>
                      <td data-label="Holat">
                        <DeviceBadge status={d.status} />
                      </td>
                      <td data-label="Oxirgi aloqa" className="cell-faint">{dateTime(isArchived && d.archived_at ? d.archived_at : d.last_seen_at)}</td>
                      {can('admin') && (
                        <td
                          className="actions-cell"
                          style={{ textAlign: 'right' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isArchived ? (
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => setArchiveTarget(d)}
                              title="Arxivga olish"
                            >
                              <IconTrash size={14} />
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleRestore(d)}
                              disabled={restoreDevice.isPending}
                            >
                              Qayta tiklash
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={data.total} limit={LIMIT} offset={offset} onChange={setOffset} />
          </>
        )}
      </div>

      {archiveTarget && (
        <ConfirmModal
          title="Qurilmani arxivga olish"
          message={`Haqiqatan ham #${archiveTarget.id} (${archiveTarget.model || 'noma’lum model'}) qurilmasini arxivga o‘tkazmoqchimisiz? Tizimdan hech narsa o‘chirilmaydi, ma’lumotlar arxivda saqlanadi va istalgan payt qayta tiklanishi mumkin.`}
          confirmLabel="Arxivga o‘tkazish"
          danger
          isLoading={deleteDevice.isPending}
          onConfirm={handleArchive}
          onClose={() => setArchiveTarget(null)}
        />
      )}
    </>
  )
}
