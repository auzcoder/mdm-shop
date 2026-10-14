import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { useAuth } from '../lib/auth'
import { useCustomers } from '../hooks/useCustomers'
import { useDebounce } from '../hooks/useDebounce'
import { date } from '../lib/format'
import { formatPhone } from '../lib/mask'
import type { Customer } from '../lib/types'
import { IconHistory, IconPlus, IconTrash, IconUsers } from '../components/Icons'
import { ConfirmModal, Empty, Loading, Pagination } from '../components/ui'
import { useToast } from '../components/Toast'

const LIMIT = 25

export default function Customers() {
  const { can } = useAuth()
  const { success, error } = useToast()
  const [params, setParams] = useSearchParams()
  // Kiritish lahzali, API qidiruvi esa debounce bilan (har harfga so'rov emas).
  const [term, setTerm] = useState(params.get('search') ?? '')
  const debouncedTerm = useDebounce(term, 300)
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [offset, setOffset] = useState(0)
  const [archiveTarget, setArchiveTarget] = useState<Customer | null>(null)

  const isArchived = activeTab === 'archived'
  const { data, isLoading, deleteCustomer, restoreCustomer } = useCustomers(debouncedTerm, offset, LIMIT, isArchived)

  useEffect(() => {
    setParams(debouncedTerm ? { search: debouncedTerm } : {}, { replace: true })
    setOffset(0)
    // setParams/setOffset barqaror — faqat debouncedTerm o'zgarganda ishlaydi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm])

  const handleArchive = async () => {
    if (!archiveTarget) return
    try {
      await deleteCustomer.mutateAsync(archiveTarget.id)
      success('Arxivlandi', `Mijoz "${archiveTarget.full_name}" arxivga o‘tkazildi`)
      setArchiveTarget(null)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Arxivlab bo‘lmadi')
    }
  }

  const handleRestore = async (c: Customer) => {
    try {
      await restoreCustomer.mutateAsync(c.id)
      success('Tiklandi', `Mijoz "${c.full_name}" arxivdan qayta tiklandi`)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Tiklab bo‘lmadi')
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mijozlar</h1>
        </div>
        {can('admin', 'operator') && (
          <Link to="/customers/new" className="btn btn-primary">
            <IconPlus size={16} />
            Mijoz qo‘shish
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
          <IconUsers size={15} />
          Faol mijozlar
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
          <input
            className="input search"
            placeholder="F.I.Sh, telefon yoki passport bo‘yicha qidirish…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Loading />
        ) : !data?.items.length ? (
          <Empty
            icon={<IconUsers size={26} />}
            text={isArchived ? 'Arxivlangan mijozlar yo‘q' : 'Mijozlar topilmadi'}
            hint={debouncedTerm ? 'Qidiruvni o‘zgartiring.' : isArchived ? undefined : 'Birinchi mijozni kiriting.'}
            action={
              !isArchived && !debouncedTerm && can('admin', 'operator') ? (
                <Link to="/customers/new" className="btn btn-primary">Mijoz qo‘shish</Link>
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
                    <th>F.I.Sh</th>
                    <th>Telefon</th>
                    <th>Passport</th>
                    <th>Qurilmalar</th>
                    <th>{isArchived ? "Arxivlangan sana" : "Qo‘shilgan"}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.id}>
                      <td data-label="ID" className="num cell-faint">#{c.id}</td>
                      <td data-label="F.I.Sh">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <IconUsers size={16} style={{ color: isArchived ? 'var(--text-faint)' : 'var(--cyan-neon)' }} />
                          <span className={isArchived ? "cell-dim" : "cell-strong"}>{c.full_name}</span>
                          {isArchived && <span className="badge badge-locked" style={{ fontSize: 10, padding: '1px 6px' }}>Arxivda</span>}
                        </div>
                      </td>
                      <td data-label="Telefon" className="mono">{formatPhone(c.phone)}</td>
                      <td data-label="Passport" className="cell-dim">{c.passport || '—'}</td>
                      <td data-label="Qurilmalar" className="num">
                        <span className="badge badge-info plain">{c.device_count ?? 0} ta</span>
                      </td>
                      <td data-label="Qo‘shilgan" className="cell-faint">{date(isArchived && c.archived_at ? c.archived_at : c.created_at)}</td>
                      <td className="actions-cell" style={{ textAlign: 'right' }}>
                        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
                          {!isArchived && can('admin', 'operator') && (
                            <Link
                              to={`/customers/${c.id}/edit`}
                              className="btn btn-sm btn-ghost"
                            >
                              Tahrirlash
                            </Link>
                          )}
                          {!isArchived && can('admin') && (
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => setArchiveTarget(c)}
                              title="Arxivga olish"
                            >
                              <IconTrash size={14} />
                            </button>
                          )}
                          {isArchived && can('admin') && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleRestore(c)}
                              disabled={restoreCustomer.isPending}
                            >
                              Qayta tiklash
                            </button>
                          )}
                        </div>
                      </td>
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
          title="Mijozni arxivga olish"
          message={`Haqiqatan ham "${archiveTarget.full_name}" mijozini arxivga o‘tkazmoqchimisiz? Tizimdan hech narsa o‘chirilmaydi, ma’lumotlar arxivda saqlanadi va istalgan payt qayta tiklanishi mumkin.`}
          confirmLabel="Arxivga o‘tkazish"
          danger
          isLoading={deleteCustomer.isPending}
          onConfirm={handleArchive}
          onClose={() => setArchiveTarget(null)}
        />
      )}
    </>
  )
}
