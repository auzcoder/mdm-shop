import React from 'react'
import { formatPassport } from '../lib/mask'

interface PassportInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (maskedValue: string) => void
}

export function PassportInput({ value, onChange, className = 'input mono', ...props }: PassportInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const masked = formatPassport(raw)
    onChange(masked)
  }

  return (
    <input
      type="text"
      className={className}
      value={value}
      onChange={handleChange}
      placeholder="AA 1234567"
      maxLength={10}
      autoCapitalize="characters"
      {...props}
    />
  )
}
