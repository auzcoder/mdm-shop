export interface DeviceModelCatalog {
  ios: string[]
  android: string[]
  macos: string[]
}

export const DEFAULT_DEVICE_MODELS: DeviceModelCatalog = {
  ios: [
    'iPhone 16 Pro Max',
    'iPhone 16 Pro',
    'iPhone 16 Plus',
    'iPhone 16',
    'iPhone 15 Pro Max',
    'iPhone 15 Pro',
    'iPhone 15 Plus',
    'iPhone 15',
    'iPhone 14 Pro Max',
    'iPhone 14 Pro',
    'iPhone 14 Plus',
    'iPhone 14',
    'iPhone 13 Pro Max',
    'iPhone 13 Pro',
    'iPhone 13',
    'iPhone 13 mini',
    'iPhone 12 Pro Max',
    'iPhone 12 Pro',
    'iPhone 12',
    'iPhone 12 mini',
    'iPhone 11 Pro Max',
    'iPhone 11 Pro',
    'iPhone 11',
    'iPhone XS Max',
    'iPhone XS',
    'iPhone XR',
    'iPhone X',
    'iPhone SE (3rd gen)',
    'iPhone SE (2nd gen)',
    'iPad Pro 13" (M4)',
    'iPad Pro 11" (M4)',
    'iPad Air 13" (M2)',
    'iPad Air 11" (M2)',
    'iPad 10th Gen',
    'iPad mini 6',
  ],
  android: [
    'Samsung Galaxy S24 Ultra',
    'Samsung Galaxy S24+',
    'Samsung Galaxy S24',
    'Samsung Galaxy S23 Ultra',
    'Samsung Galaxy S23+',
    'Samsung Galaxy S23',
    'Samsung Galaxy S23 FE',
    'Samsung Galaxy Z Fold6',
    'Samsung Galaxy Z Flip6',
    'Samsung Galaxy Z Fold5',
    'Samsung Galaxy Z Flip5',
    'Samsung Galaxy A55 5G',
    'Samsung Galaxy A35 5G',
    'Samsung Galaxy A25 5G',
    'Samsung Galaxy A15 5G',
    'Samsung Galaxy A05s',
    'Xiaomi 14 Ultra',
    'Xiaomi 14 Pro',
    'Xiaomi 14',
    'Xiaomi 13T Pro',
    'Xiaomi 13T',
    'Redmi Note 13 Pro+ 5G',
    'Redmi Note 13 Pro 5G',
    'Redmi Note 13 4G',
    'Redmi 13C',
    'Redmi 12',
    'Poco X6 Pro 5G',
    'Poco F6 Pro',
    'Poco F6',
    'Poco M6 Pro',
    'Honor Magic6 Pro',
    'Honor 200 Pro',
    'Honor 90',
    'Honor X9b 5G',
    'Vivo X100 Pro',
    'Vivo V30 Pro',
    'Vivo Y200',
    'Tecno Camon 30 Premier',
    'Tecno Spark 20 Pro+',
    'Infinix Note 40 Pro',
  ],
  macos: [
    'MacBook Pro 16" (M3 Max)',
    'MacBook Pro 16" (M3 Pro)',
    'MacBook Pro 14" (M3 Pro)',
    'MacBook Pro 14" (M3)',
    'MacBook Air 15" (M3)',
    'MacBook Air 13" (M3)',
    'MacBook Air 15" (M2)',
    'MacBook Air 13" (M2)',
    'MacBook Air 13" (M1)',
    'iMac 24" (M3)',
    'Mac Studio (M2 Max)',
    'Mac Studio (M2 Ultra)',
    'Mac mini (M2 Pro)',
    'Mac mini (M2)',
  ],
}

const STORAGE_KEY = 'ps_custom_device_models'

export function getDeviceModels(platform: 'ios' | 'android' | 'macos'): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed[platform] && Array.isArray(parsed[platform])) {
        // Merge defaults and user additions, deduplicating
        const set = new Set([...parsed[platform], ...DEFAULT_DEVICE_MODELS[platform]])
        return Array.from(set)
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_DEVICE_MODELS[platform] || []
}

export function addCustomDeviceModel(platform: 'ios' | 'android' | 'macos', modelName: string) {
  try {
    const trimmed = modelName.trim()
    if (!trimmed) return
    const raw = localStorage.getItem(STORAGE_KEY)
    const current = raw ? JSON.parse(raw) : { ios: [], android: [], macos: [] }
    if (!current[platform]) current[platform] = []
    if (!current[platform].includes(trimmed)) {
      current[platform].unshift(trimmed)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    }
  } catch {
    // ignore
  }
}
