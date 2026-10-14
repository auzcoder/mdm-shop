import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  IconActivity,
  IconCreditCard,
  IconHistory,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSmartphone,
  IconUsers,
} from './Icons'

interface CommandItem {
  id: string
  title: string
  desc: string
  icon: React.ReactNode
  action: () => void
  category: string
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpen,
}: {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const items: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Boshqaruv paneli',
      desc: 'Umumiy holat va ko‘rsatkichlar',
      icon: <IconActivity size={16} />,
      action: () => navigate('/'),
      category: 'Sahifalar',
    },
    {
      id: 'devices',
      title: 'Qurilmalar ro‘yxati',
      desc: 'Barcha faol va bloklangan telefonlar',
      icon: <IconSmartphone size={16} />,
      action: () => navigate('/devices'),
      category: 'Sahifalar',
    },
    {
      id: 'customers',
      title: 'Mijozlar bazasi',
      desc: 'Mijozlar va ularning telefonlari',
      icon: <IconUsers size={16} />,
      action: () => navigate('/customers'),
      category: 'Sahifalar',
    },
    {
      id: 'payments',
      title: 'To‘lovlar va kechikishlar',
      desc: 'Kechikkan va navbatdagi to‘lovlar',
      icon: <IconCreditCard size={16} />,
      action: () => navigate('/payments'),
      category: 'Sahifalar',
    },
    {
      id: 'audit',
      title: 'Audit jurnali',
      desc: 'Tizim xavfsizlik va harakatlar tarixi',
      icon: <IconHistory size={16} />,
      action: () => navigate('/audit'),
      category: 'Sahifalar',
    },
    {
      id: 'settings',
      title: 'Tizim sozlamalari',
      desc: 'Do‘kon ma’lumotlari va SMS shablonlari',
      icon: <IconSettings size={16} />,
      action: () => navigate('/settings'),
      category: 'Sahifalar',
    },
    {
      id: 'new_device',
      title: 'Yangi qurilma qo‘shish',
      desc: 'Android yoki iOS qurilmasini ro‘yxatga olish',
      icon: <IconPlus size={16} />,
      action: () => navigate('/devices/new'),
      category: 'Tezkor amallar',
    },
    {
      id: 'new_customer',
      title: 'Yangi mijoz qo‘shish',
      desc: 'Nasiya shartnomasi uchun mijoz kiritish',
      icon: <IconPlus size={16} />,
      action: () => navigate('/customers/new'),
      category: 'Tezkor amallar',
    },
  ]

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.desc.toLowerCase().includes(query.toLowerCase()) ||
      i.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          setQuery('')
          onOpen()
        }
      }
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action()
          onClose()
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, filtered, selectedIndex, onClose, onOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="palette-card" onClick={(e) => e.stopPropagation()}>
        <div className="palette-search-row">
          <IconSearch size={18} className="palette-search-icon" />
          <input
            className="palette-input"
            autoFocus
            placeholder="Qidirish yoki buyruq tanlash (masalan: Qurilmalar, Mijoz)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="palette-badge">ESC</span>
        </div>

        <div className="palette-list">
          {!filtered.length ? (
            <div className="palette-empty">Natijalar topilmadi</div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                className={`palette-item ${selectedIndex === idx ? 'palette-item-selected' : ''}`}
                onClick={() => {
                  item.action()
                  onClose()
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="palette-item-icon">{item.icon}</div>
                <div className="palette-item-text">
                  <div className="palette-item-title">{item.title}</div>
                  <div className="palette-item-desc">{item.desc}</div>
                </div>
                <span className="palette-item-cat">{item.category}</span>
              </div>
            ))
          )}
        </div>

        <div className="palette-foot">
          <span>
            Tanlash uchun <kbd>↑</kbd> <kbd>↓</kbd> · O‘tish uchun <kbd>↵</kbd>
          </span>
          <span>Qora daftar tezkor boshqaruv markazi</span>
        </div>
      </div>
    </div>
  )
}
