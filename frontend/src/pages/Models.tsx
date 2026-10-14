import { useState } from 'react'

import { useAuth } from '../lib/auth'
import { useDeviceModels, type DeviceModel } from '../hooks/useDeviceModels'
import {
  IconAndroid,
  IconApple,
  IconEdit,
  IconMac,
  IconPlus,
  IconSmartphone,
  IconTrash,
} from '../components/Icons'
import { ConfirmModal, Empty, Field, Loading } from '../components/ui'
import { useToast } from '../components/Toast'

export default function Models() {
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  // State for Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<DeviceModel | null>(null)
  const [formData, setFormData] = useState({
    platform: 'ios',
    name: '',
    is_active: true,
    sort_order: 0,
  })

  // Always load all models to compute stable tab counts
  const { models: allModels, isLoading, createModel, updateModel, toggleModel, deleteModel } =
    useDeviceModels('', false, '')
  const { success, error } = useToast()
  const { can } = useAuth()
  // Model katalogini faqat admin o'zgartiradi (backend ham admin talab qiladi).
  const canManage = can('admin')

  const iosCount = allModels.filter((m) => m.platform === 'ios').length
  const androidCount = allModels.filter((m) => m.platform === 'android').length
  const macosCount = allModels.filter((m) => m.platform === 'macos').length

  // Filtered for table display
  const displayModels = allModels.filter((m) => {
    if (platformFilter && m.platform !== platformFilter) return false
    if (search.trim() && !m.name.toLowerCase().includes(search.toLowerCase().trim())) return false
    return true
  })

  const openCreate = () => {
    setEditingModel(null)
    setFormData({
      platform: platformFilter || 'ios',
      name: '',
      is_active: true,
      sort_order: (allModels.length + 1) * 5,
    })
    setModalOpen(true)
  }

  const openEdit = (m: DeviceModel) => {
    setEditingModel(m)
    setFormData({
      platform: m.platform,
      name: m.name,
      is_active: m.is_active,
      sort_order: m.sort_order,
    })
    setModalOpen(true)
  }

  const handleToggle = async (m: DeviceModel) => {
    try {
      await toggleModel.mutateAsync(m.id)
      success(
        m.is_active ? 'Model nofaollashtirildi' : 'Model faollashtirildi',
        `"${m.name}" ${m.is_active ? 'select ro‘yxatidan yashirildi' : 'select ro‘yxatida ko‘rinadi'}`
      )
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Holatni o‘zgartirib bo‘lmadi')
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<DeviceModel | null>(null)
  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteModel.mutateAsync(deleteTarget.id)
      success('Model o‘chirildi', `"${deleteTarget.name}" muvaffaqiyatli olib tashlandi`)
      setDeleteTarget(null)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Modelni o‘chirib bo‘lmadi')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      if (editingModel) {
        await updateModel.mutateAsync({
          id: editingModel.id,
          data: {
            name: formData.name.trim(),
            is_active: formData.is_active,
            sort_order: Number(formData.sort_order) || 0,
          },
        })
        success('Model yangilandi', `"${formData.name}" muvaffaqiyatli saqlandi`)
      } else {
        await createModel.mutateAsync({
          platform: formData.platform,
          name: formData.name.trim(),
          is_active: formData.is_active,
          sort_order: Number(formData.sort_order) || 0,
        })
        success('Yangi model qo‘shildi', `"${formData.name}" ro‘yxatga kiritildi`)
      }
      setModalOpen(false)
    } catch (err) {
      error('Xatolik', err instanceof Error ? err.message : 'Modelni saqlab bo‘lmadi')
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Qurilma modellari</h1>
        </div>

        <div className="btn-row">
          {canManage && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <IconPlus size={16} /> Yangi model qo‘shish
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="card">
        <div className="card-head">
          <div className="filters" style={{ flex: 1, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="input search"
              placeholder="Model nomi bo‘yicha qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 260 }}
            />

            {/* Platform Filter Tabs */}
            <div className="btn-row">
              <button
                type="button"
                className={`btn btn-sm ${platformFilter === '' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPlatformFilter('')}
              >
                Barchasi ({allModels.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${platformFilter === 'ios' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPlatformFilter('ios')}
              >
                <IconApple size={14} /> Apple ({iosCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${platformFilter === 'android' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPlatformFilter('android')}
              >
                <IconAndroid size={14} style={{ color: '#10b981' }} /> Android ({androidCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${platformFilter === 'macos' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPlatformFilter('macos')}
              >
                <IconMac size={14} /> Mac ({macosCount})
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : !displayModels.length ? (
          <Empty
            icon="📱"
            text="Modellar topilmadi"
            hint={search || platformFilter ? 'Qidiruv yoki platforma filtrini o‘zgartiring.' : 'Qurilma modellarini qo‘shing.'}
            action={
              canManage && !search && !platformFilter ? (
                <button className="btn btn-primary" onClick={openCreate}>
                  <IconPlus size={16} /> Model qo‘shish
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table-cards">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <th>Platforma</th>
                  <th>Model nomi</th>
                  <th>Holati (Selectda ko‘rinishi)</th>
                  <th style={{ textAlign: 'right' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {displayModels.map((m, idx) => (
                  <tr key={m.id}>
                    {/* Index */}
                    <td data-label="#" className="cell-faint mono" style={{ fontSize: 12 }}>
                      {idx + 1}
                    </td>

                    {/* Platform */}
                    <td data-label="Platforma">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {m.platform === 'ios' ? (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <IconApple size={15} />
                          </div>
                        ) : m.platform === 'android' ? (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <IconAndroid size={15} />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: 'var(--surface-3)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-faint)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <IconMac size={14} />
                          </div>
                        )}

                        <span className="cell-strong" style={{ fontSize: 13 }}>
                          {m.platform === 'ios' ? 'Apple iOS' : m.platform === 'android' ? 'Google Android' : 'macOS'}
                        </span>
                      </div>
                    </td>

                    {/* Model Name */}
                    <td data-label="Model">
                      <strong className="cell-strong" style={{ fontSize: 14 }}>{m.name}</strong>
                    </td>

                    {/* Active / Inactive Status */}
                    <td data-label="Holat">
                      <button
                        type="button"
                        onClick={() => handleToggle(m)}
                        disabled={!canManage}
                        className={`badge ${m.is_active ? 'badge-active' : 'badge-inactive'}`}
                        style={{
                          cursor: canManage ? 'pointer' : 'default',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          border: 'none',
                          padding: '4px 10px',
                          fontSize: 12,
                          transition: 'all 0.15s ease',
                        }}
                        title={canManage ? 'Holatni o‘zgartirish uchun bosing' : undefined}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: m.is_active ? '#22c55e' : '#94a3b8',
                          }}
                        />
                        {m.is_active ? 'Faol (Selectda ko‘rinadi)' : 'Nofaol (Yashiringan)'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                      {canManage ? (
                        <div className="btn-row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => openEdit(m)}
                            title="Tahrirlash"
                          >
                            <IconEdit size={14} /> Tahrirlash
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => setDeleteTarget(m)}
                            title="O‘chirish"
                            style={{ color: '#ef4444' }}
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconSmartphone size={18} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: 16, margin: 0 }}>
                  {editingModel ? 'Modelni tahrirlash' : 'Yangi model qo‘shish'}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="card-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!editingModel && (
                  <Field label="Platforma *">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        className={`btn ${formData.platform === 'ios' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFormData({ ...formData, platform: 'ios' })}
                        style={{ justifyContent: 'center' }}
                      >
                        <IconApple size={16} /> iOS
                      </button>
                      <button
                        type="button"
                        className={`btn ${formData.platform === 'android' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFormData({ ...formData, platform: 'android' })}
                        style={{ justifyContent: 'center' }}
                      >
                        <IconAndroid size={16} /> Android
                      </button>
                      <button
                        type="button"
                        className={`btn ${formData.platform === 'macos' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFormData({ ...formData, platform: 'macos' })}
                        style={{ justifyContent: 'center' }}
                      >
                        <IconMac size={16} /> Mac
                      </button>
                    </div>
                  </Field>
                )}

                <Field label="Model nomi *">
                  <input
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masalan: iPhone 16 Pro Max 256GB"
                    required
                    autoFocus
                  />
                </Field>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <div>
                    <div className="cell-strong" style={{ fontSize: 13.5 }}>Holati (Faol)</div>
                    <div className="cell-faint" style={{ fontSize: 11.5 }}>
                      Yoqilsa, yangi qurilma yaratishda selectda ko‘rinadi
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createModel.isPending || updateModel.isPending || !formData.name.trim()}
                  >
                    {(createModel.isPending || updateModel.isPending) && <span className="spinner" />}
                    {editingModel ? 'Saqlash' : 'Qo‘shish'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Modelni o‘chirish"
          message={`"${deleteTarget.name}" modeli o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.`}
          confirmLabel="O‘chirish"
          danger
          isLoading={deleteModel.isPending}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
