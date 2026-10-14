import { useEffect, useRef, useState } from 'react'

export interface SelectOption {
  value: string | number
  label: string
  sublabel?: string
  icon?: React.ReactNode
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Tanlang…',
  searchable = false,
  disabled = false,
  className = '',
  placement = 'auto',
}: {
  value: string | number | undefined | null
  onChange: (val: string) => void
  options: SelectOption[]
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  className?: string
  placement?: 'auto' | 'top' | 'bottom'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [openUpward, setOpenUpward] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((o) => String(o.value) === String(value))

  const filteredOptions = searchable && search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
      )
    : options

  const handleToggle = () => {
    if (disabled) return
    if (!isOpen && containerRef.current) {
      if (placement === 'top') {
        setOpenUpward(true)
      } else if (placement === 'bottom') {
        setOpenUpward(false)
      } else {
        const rect = containerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        setOpenUpward(spaceBelow < 280 && spaceAbove > 180)
      }
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={{ zIndex: isOpen ? 1000 : 1 }}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="trigger-content">
          {selectedOption ? (
            <div className="selected-item">
              {selectedOption.icon && <span className="item-icon">{selectedOption.icon}</span>}
              <span className="item-label">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="item-sublabel">{selectedOption.sublabel}</span>
              )}
            </div>
          ) : (
            <span className="select-placeholder">{placeholder}</span>
          )}
        </div>
        <span className="select-chevron">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          className={`custom-select-dropdown ${openUpward ? 'open-upward' : 'open-downward'}`}
          style={
            openUpward
              ? { bottom: 'calc(100% + 6px)', top: 'auto' }
              : { top: 'calc(100% + 6px)', bottom: 'auto' }
          }
        >
          {searchable && (
            <div className="select-search-box" style={{ position: 'relative' }}>
              <input
                ref={searchInputRef}
                type="text"
                className="select-search-input"
                placeholder="Qidirish…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearch('')
                    searchInputRef.current?.focus()
                  }}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-faint)',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div className="select-options-list">
            {filteredOptions.length === 0 ? (
              <div className="select-no-options">Natija topilmadi</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <div
                    key={String(opt.value)}
                    className={`select-option-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      onChange(String(opt.value))
                      setIsOpen(false)
                      setSearch('')
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {opt.icon && <span className="item-icon">{opt.icon}</span>}
                    <div className="item-text-wrap">
                      <span className="item-main-label">{opt.label}</span>
                      {opt.sublabel && <span className="item-sub-desc">{opt.sublabel}</span>}
                    </div>
                    {isSelected && (
                      <span className="select-check-mark">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
