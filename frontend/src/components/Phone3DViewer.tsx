import { useState } from 'react'

import { useTilt } from '../hooks/useTilt'
import type { DeviceDetail } from '../lib/types'
import {
  IconAndroid,
  IconApple,
  IconLock,
  IconShieldCheck,
  IconUnlock,
} from './Icons'
import { QRCodeDisplay } from './QRCodeSVG'
import { getAndroidProvisioningPayload, getEnrollmentOtaUrl } from '../lib/enrollment'

export function Phone3DViewer({
  detail,
  onUnlockClick,
  onLockClick,
}: {
  detail: DeviceDetail
  onUnlockClick?: () => void
  onLockClick?: () => void
}) {
  const { device, customer } = detail
  const { ref, style, glareStyle, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>({
    max: 14,
    perspective: 1200,
    scale: 1.02,
  })

  const [simCalling, setSimCalling] = useState(false)
  const isLocked = device.status === 'locked'
  const isPending = device.status === 'pending'
  const isActive = device.status === 'active'
  const isReleased = device.status === 'released'
  const isIOS = device.platform === 'ios'

  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('uz-UZ', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="phone-3d-wrap">
      <div
        ref={ref}
        style={style}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className={`phone-3d-chassis ${isIOS ? 'chassis-ios' : 'chassis-android'} ${
          isLocked ? 'chassis-locked' : ''
        }`}
      >
        <div className="phone-glare" style={glareStyle} />

        {/* Outer Frame */}
        <div className="phone-outer-frame">
          {/* Hardware Buttons */}
          {isIOS ? (
            <>
              {/* Apple layout: Left side Action & Volume, Right side Power */}
              <div className="phone-btn-vol-up" style={{ top: 90, height: 26 }} title="Action Button" />
              <div className="phone-btn-vol-up" style={{ top: 130 }} />
              <div className="phone-btn-vol-down" style={{ top: 180 }} />
              <div className="phone-btn-power" style={{ top: 140, height: 65 }} />
            </>
          ) : (
            <>
              {/* Android layout: Right side Volume Rocker & Power */}
              <div
                className="phone-btn-power"
                style={{ top: 110, height: 70 }}
                title="Volume Rocker"
              />
              <div
                className="phone-btn-power"
                style={{ top: 195, height: 40 }}
                title="Power Button"
              />
            </>
          )}

          {/* Inner Screen */}
          <div
            className={`phone-screen ${
              isLocked
                ? 'screen-locked'
                : isActive
                  ? 'screen-active'
                  : 'screen-pending'
            }`}
          >
            {/* Top Cutout: Dynamic Island for Apple vs Punch-hole for Android */}
            {isIOS ? (
              <div className="phone-dynamic-island">
                <div className="camera-lens" />
                <div className="sensor-dot" />
              </div>
            ) : (
              <div className="android-punch-hole" />
            )}

            {/* Status Bar */}
            <div className="phone-status-bar" style={{ marginTop: isIOS ? 2 : 6 }}>
              <span className="phone-time">{timeStr}</span>
              <div className="phone-status-icons">
                <span className="wifi-icon">{isIOS ? '5G' : 'LTE+'}</span>
                <span className="battery-icon">
                  <span className="battery-level" />
                </span>
              </div>
            </div>

            {/* Main Screen Content */}
            <div className="phone-screen-body">
              {isLocked ? (
                <div className="screen-locked-content">
                  <div className="lock-icon-pulse">
                    <IconLock size={32} />
                  </div>
                  <div className="lock-title">
                    {isIOS ? 'iPhone bloklandi' : 'Android bloklandi'}
                  </div>
                  <div
                    className="lock-subtitle"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      justifyContent: 'center',
                    }}
                  >
                    {isIOS ? <IconApple size={14} /> : <IconAndroid size={14} />}
                    {isIOS ? 'Apple MDM (Lost Mode)' : 'Google Device Policy'}
                  </div>

                  <div className="lock-message-card">
                    <div className="msg-label">Bloklash sababi:</div>
                    <div className="msg-text">
                      {device.lock_message ||
                        'To‘lov muddati o‘tgan. Iltimos, to‘lovni amalga oshiring yoki do‘konga murojaat qiling.'}
                    </div>
                  </div>

                  <div className="phone-contact-pill">
                    <span>Do‘kon:</span>
                    <strong>{device.customer_phone || '+998 00 000 00 00'}</strong>
                  </div>

                  {simCalling ? (
                    <div className="emergency-calling-alert">
                      <span>Favqulodda xizmatga ulanmoqda (112)…</span>
                    </div>
                  ) : (
                    <button
                      className="phone-emergency-btn"
                      onClick={() => {
                        setSimCalling(true)
                        setTimeout(() => setSimCalling(false), 4000)
                      }}
                    >
                      Favqulodda qo‘ng‘iroq (112)
                    </button>
                  )}

                  {onUnlockClick && (
                    <button className="phone-quick-unlock-btn" onClick={onUnlockClick}>
                      <IconUnlock size={14} /> Ochish buyrug‘i
                    </button>
                  )}
                </div>
              ) : isPending ? (
                <div className="screen-pending-content">
                  <div style={{ margin: '2px 0' }}>
                    <QRCodeDisplay
                      value={
                        isIOS
                          ? getEnrollmentOtaUrl(device.enrollment_id || 'sample-token')
                          : getAndroidProvisioningPayload(device.enrollment_id || 'sample-token', device.id)
                      }
                      size={115}
                    />
                  </div>
                  <div
                    className="pending-title"
                    style={{
                      fontSize: 14,
                      marginTop: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      justifyContent: 'center',
                    }}
                  >
                    {isIOS ? <IconApple size={16} /> : <IconAndroid size={16} />}
                    {isIOS ? 'Apple MDM ulanish' : 'Android DPC ulanish'}
                  </div>
                  <div className="pending-step-badge" style={{ fontSize: 10, padding: '2px 8px' }}>
                    {isIOS ? 'Kamerada skanerlang' : '6 marta bosing'}
                  </div>
                </div>
              ) : isReleased ? (
                <div className="screen-released-content">
                  <div className="released-icon">
                    <IconShieldCheck size={44} />
                  </div>
                  <div className="released-title">Boshqaruvdan chiqarilgan</div>
                  <div className="released-desc">
                    Ushbu telefon nasiyasi to‘liq yopilgan va MDM profili olib tashlangan
                  </div>
                </div>
              ) : (
                <div className="screen-active-content">
                  <div className="active-wallpaper-clock">
                    <div className="active-clock-time">{timeStr}</div>
                    <div className="active-clock-date">{dateStr}</div>
                  </div>

                  <div className="active-shield-badge">
                    {isIOS ? <IconApple size={14} /> : <IconAndroid size={14} />}
                    <span>{isIOS ? 'Apple MDM faol' : 'Android Knox/DPC faol'}</span>
                  </div>

                  <div className="active-device-info-glass">
                    <div className="info-row">
                      <span>Model:</span>
                      <strong>{device.model || 'Noma’lum'}</strong>
                    </div>
                    <div className="info-row">
                      <span>Mijoz:</span>
                      <strong>{customer?.full_name || 'Biriktirilmagan'}</strong>
                    </div>
                    <div className="info-row">
                      <span>Platforma:</span>
                      <strong>{isIOS ? 'Apple iOS' : 'Android OS'}</strong>
                    </div>
                  </div>

                  {onLockClick && (
                    <button className="phone-quick-lock-btn" onClick={onLockClick}>
                      <IconLock size={14} /> Bloklash ekranini sinash
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Navigation Indicator: iOS Home Bar vs Android Navigation Pill */}
            {isIOS ? (
              <div className="phone-home-indicator" />
            ) : (
              <div className="android-nav-bar" />
            )}
          </div>
        </div>
      </div>

      <div className="phone-3d-hint">
        {isIOS ? <IconApple size={15} /> : <IconAndroid size={15} />}
        <span>
          3D interaktiv {isIOS ? 'Apple iPhone' : 'Android'} ko‘rinish (sichqoncha bilan buring)
        </span>
      </div>
    </div>
  )
}
