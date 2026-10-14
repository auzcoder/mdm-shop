import React from 'react'
import { formatPhone } from '../lib/mask'

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (maskedValue: string) => void
}

export function PhoneInput({ value, onChange, className = 'input mono', ...props }: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const masked = formatPhone(raw)
    onChange(masked)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!value || value.trim() === '') {
      onChange('+998 ')
    }
    props.onFocus?.(e)
  }

  return (
    <input
      type="tel"
      className={className}
      value={value || '+998 '}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder="+998 90 123 45 67"
      maxLength={17}
      autoComplete="tel"
      {...props}
    />
  )
}
