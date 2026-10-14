import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useUsers } from '../hooks/useUsers'
import { date } from '../lib/format'
import { formatPhone } from '../lib/mask'
import type { Role, User } from '../lib/types'
import { IconHistory, IconPlus, IconSettings, IconTrash, IconUsers } from '../components/Icons'
import { ConfirmModal, Empty, Loading } from '../components/ui'
import { useToast } from '../components/Toast'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  accountant: 'Buxgalter',
  viewer: 'Mijoz (Portal)',
}

export default function Users() {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [archiveTarget, setArchiveTarget] = useState<User | null>(null)
  const { success, error } = useToast()

  const isArchived = activeTab === 'archived'
  const { data, isLoading, deleteUser, restoreUser } = useUsers(isArchived)

  const handleArchive = async () => {
    if (!archiveTarget) return
    try {
      await deleteUser.mutateAsync(archiveTarget.id)
      success('Arxivlandi', `Foydalanuvchi ${archiveTarget.email} arxivga o‘tkazildi`)
      setArchiveTarget(null)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Arxivlab bo‘lmadi')
    }
  }

  const handleRestore = async (u: User) => {
    try {
      await restoreUser.mutateAsync(u.id)
      success('Tiklandi', `Foydalanuvchi ${u.email} arxivdan qayta tiklandi`)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Tiklab bo‘lmadi')
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Foydalanuvchilar</h1>
            <span className="badge badge-info plain">RBAC tizimi</span>
          </div>
          <div className="page-desc">Panel foydalanuvchilari, ularning rollari va ruxsatlari</div>
        </div>
        <Link to="/users/new" className="btn btn-primary">
          <IconPlus size={16} />
          Foydalanuvchi qo‘shish
        </Link>
      </div>

      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <IconUsers size={15} />
          Faol foydalanuvchilar
        </button>
        <button
          className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          <IconHistory size={15} />
          Arxivlanganlar
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <Loading />
        ) : !data?.items.length ? (
          <Empty text={isArchived ? "Arxivlangan foydalanuvchilar yo‘q" : "Foydalanuvchilar yo‘q"} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Telefon</th>
                  <th>F.I.Sh</th>
                  <th>Rol</th>
                  <th>Holat</th>
                  <th>{isArchived ? "Arxivlangan sana" : "Qo‘shilgan"}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IconUsers size={16} style={{ color: isArchived ? 'var(--text-faint)' : 'var(--primary)' }} />
                        <span className={isArchived ? "cell-dim" : "cell-strong"}>{u.email}</span>
                        {isArchived && <span className="badge badge-locked" style={{ fontSize: 10, padding: '1px 6px' }}>Arxivda</span>}
                      </div>
                    </td>
                    <td className="mono cell-dim">
                      {u.phone ? formatPhone(u.phone) : '—'}
                    </td>
                    <td>{u.full_name || '—'}</td>
                    <td>
                      <span className="badge badge-info plain">{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-active' : 'badge-released'}`}>
                        {u.is_active ? 'Faol' : 'Bloklangan'}
                      </span>
                    </td>
                    <td className="cell-faint">{date(isArchived && u.archived_at ? u.archived_at : u.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
                        {!isArchived && (
                          <>
                            <Link
                              to={`/users/${u.id}/edit`}
                              className="btn btn-sm btn-ghost"
                            >
                              <IconSettings size={14} />
                              Boshqarish
                            </Link>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => setArchiveTarget(u)}
                              title="Arxivga olish"
                            >
                              <IconTrash size={14} />
                            </button>
                          </>
                        )}
                        {isArchived && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleRestore(u)}
                            disabled={restoreUser.isPending}
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
        )}
      </div>

      {archiveTarget && (
        <ConfirmModal
          title="Foydalanuvchini arxivga olish"
          message={`Haqiqatan ham "${archiveTarget.email}" foydalanuvchisini arxivga o‘tkazmoqchimisiz? Tizimdan hech narsa o‘chirilmaydi, u faolsizlantiriladi va arxivda saqlanadi.`}
          confirmLabel="Arxivga o‘tkazish"
          danger
          isLoading={deleteUser.isPending}
          onConfirm={handleArchive}
          onClose={() => setArchiveTarget(null)}
        />
      )}
    </>
  )
}
