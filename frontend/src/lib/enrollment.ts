const DEFAULT_PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL as string | undefined) || 'https://mdm.tayyor.app'

export function getPublicBaseUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_PUBLIC_URL
  const origin = window.location.origin
  // If running locally, return public URL so mobile devices can access over internet/LAN
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return DEFAULT_PUBLIC_URL
  }
  return origin
}

/**
 * Builds the OTA enrollment link.
 *
 * The device id is deliberately NOT part of the URL: the backend resolves the
 * device from the enrollment token alone. Accepting a device id from the query
 * string previously let anyone fetch a profile for an arbitrary device.
 */
export function getEnrollmentOtaUrl(token: string): string {
  return `${getPublicBaseUrl()}/api/v1/enroll/ios?token=${encodeURIComponent(token)}`
}

/**
 * Builds the download link for the Apple Configurator variant of the profile.
 *
 * This copy carries `PayloadRemovalDisallowed`, which iOS only accepts when the
 * profile is installed through Apple Configurator or ADE on a supervised
 * device. Installing it over the air would be rejected outright, so the OTA
 * link above must stay without that flag.
 */
export function getEnrollmentConfiguratorUrl(token: string): string {
  return `${getPublicBaseUrl()}/api/v1/enroll/ios?download=1&configurator=1&token=${encodeURIComponent(token)}`
}

export function getAndroidProvisioningPayload(token: string, deviceId: number | string): string {
  const base = getPublicBaseUrl()
  return JSON.stringify({
    'android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME':
      'com.google.android.apps.work.clouddpc/.receivers.CloudDeviceAdminReceiver',
    'android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION':
      'https://play.google.com/managed/download/dpc',
    'android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE': {
      enrollment_token: token,
      device_id: deviceId,
      server_url: base,
    },
  })
}

