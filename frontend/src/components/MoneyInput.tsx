import React from 'react'
import { formatMoney, parseMoney } from '../lib/mask'

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string
  onChange: (numValue: number, formatted: string) => void
  suffix?: string
}

export function MoneyInput({
  value,
  onChange,
  className = 'input num',
  suffix = 'so‘m',
  ...props
}: MoneyInputProps) {
  const formatted = formatMoney(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const parsed = parseMoney(raw)
    const newFormatted = formatMoney(parsed)
    onChange(parsed, newFormatted)
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      <input
        type="text"
        inputMode="numeric"
        className={className}
        value={formatted}
        onChange={handleChange}
        style={{ paddingRight: suffix ? 55 : undefined }}
        {...props}
      />
      {suffix && (
        <span
          className="cell-faint"
          style={{
            position: 'absolute',
            right: 12,
            pointerEvents: 'none',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  )
}
