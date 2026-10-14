import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QRCodeDisplay({
  value,
  size = 200,
  className = '',
}: {
  value: string
  size?: number
  className?: string
}) {
  const [dataUrl, setDataUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setDataUrl('')
      return
    }

    QRCode.toDataURL(value, {
      width: size * 2, // 2x for retina crispness
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setDataUrl(url)
        setError(null)
      })
      .catch((err) => {
        console.error('QR code generation error:', err)
        setError('QR kod yaratilmadi')
      })
  }, [value, size])

  if (error) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'grid',
          placeItems: 'center',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 12,
          color: '#dc2626',
          fontSize: 12,
          textAlign: 'center',
          padding: 8,
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div
      className={`qr-code-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#ffffff',
        padding: 12,
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(0,0,0,0.02)',
        width: 'fit-content',
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="Enrollment QR Code"
          width={size}
          height={size}
          style={{
            display: 'block',
            borderRadius: 8,
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            display: 'grid',
            placeItems: 'center',
            background: '#f8fafc',
            borderRadius: 8,
            color: '#94a3b8',
            fontSize: 12,
          }}
        >
          Yuklanmoqda…
        </div>
      )}
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          fontWeight: 600,
          color: '#475569',
          letterSpacing: '0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#10b981',
            display: 'inline-block',
          }}
        />
        Kamera orqali skanerlang
      </div>
    </div>
  )
}
