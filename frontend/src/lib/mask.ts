/**
 * Input masking and normalization utilities
 */

/**
 * Formats a phone number as `+998 XX XXX XX XX`
 * Enforces maximum 9 digits after +998.
 */
export function formatPhone(value: string): string {
  if (!value) return '+998 '
  
  // Extract all digits
  let digits = value.replace(/\D/g, '')
  
  // If user pasted or typed starting with 998, remove country code prefix
  if (digits.startsWith('998')) {
    digits = digits.slice(3)
  }
  
  // Limit to maximum 9 local digits (e.g. 90 123 45 67)
  const local = digits.slice(0, 9)
  
  let formatted = '+998'
  if (local.length > 0) {
    formatted += ' ' + local.slice(0, 2)
  }
  if (local.length > 2) {
    formatted += ' ' + local.slice(2, 5)
  }
  if (local.length > 5) {
    formatted += ' ' + local.slice(5, 7)
  }
  if (local.length > 7) {
    formatted += ' ' + local.slice(7, 9)
  }
  
  return formatted
}

/**
 * Normalizes masked phone to E.164-like clean format for backend (+998901234567)
 */
export function normalizePhone(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('998')) {
    return '+' + digits.slice(0, 12)
  }
  if (digits.length > 0) {
    return '+998' + digits.slice(0, 9)
  }
  return ''
}

/**
 * Formats an amount with thousand spaces (e.g. `1 500 000`, `200 000`)
 *
 * Backend qiymatlari kasrli keladi ("1733333.33"). Ilgari bu yerda barcha
 * raqam bo'lmagan belgilar olib tashlanardi — kasr nuqtasi ham. Natijada
 * "1733333.33" "173 333 333" bo'lib ko'rinardi, ya'ni summa 100 barobar
 * katta. To'lov oynasida operator aynan shu raqamni ko'rardi.
 *
 * Panel butun so'mda ishlaydi, shuning uchun kasr qismi tashlab yuboriladi.
 */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  const whole = String(value).split(/[.,]/)[0]
  const digits = whole.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Parses formatted money string to number (e.g. "1 500 000" -> 1500000)
 */
export function parseMoney(value: string): number {
  if (!value) return 0
  const digits = String(value).split(/[.,]/)[0].replace(/\D/g, '')
  return digits ? parseInt(digits, 10) : 0
}

/**
 * Parses formatted money string to raw string for backend API (e.g. "1 500 000" -> "1500000")
 */
export function parseMoneyStr(value: string): string {
  if (!value) return ''
  return String(value).split(/[.,]/)[0].replace(/\D/g, '')
}

/**
 * Formats passport/ID as `AA 1234567` (2 uppercase Latin letters + 7 digits)
 */
export function formatPassport(value: string): string {
  if (!value) return ''
  const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const letters = clean.slice(0, 2).replace(/[^A-Z]/g, '')
  const numbers = clean.slice(letters.length, letters.length + 7).replace(/\D/g, '')
  
  if (letters.length > 0 && numbers.length > 0) {
    return `${letters} ${numbers}`
  }
  return letters
}
