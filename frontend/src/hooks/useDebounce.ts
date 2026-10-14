import { useEffect, useState } from 'react'

// useDebounce — qiymat o'zgarishini `delay` ms kechiktiradi. Qidiruv maydonida
// har harfga server so'rovi yuborilmasligi uchun.
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
