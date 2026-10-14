import { useCallback, useRef, useState } from 'react'

export interface TiltOptions {
  max?: number
  perspective?: number
  scale?: number
  speed?: number
  glare?: boolean
}

export function useTilt<T extends HTMLElement = HTMLDivElement>(options: TiltOptions = {}) {
  const { max = 12, perspective = 1000, scale = 1.02, glare = true } = options
  const ref = useRef<T>(null)
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: 'transform 400ms cubic-bezier(0.03, 0.98, 0.52, 0.99)',
  })
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
  })

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const width = rect.width
      const height = rect.height

      const xPercent = (x / width) * 2 - 1
      const yPercent = (y / height) * 2 - 1

      const rotateX = -yPercent * max
      const rotateY = xPercent * max

      setStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
        transition: 'transform 100ms ease-out',
      })

      if (glare) {
        const angle = Math.atan2(y - height / 2, x - width / 2) * (180 / Math.PI) - 90
        setGlareStyle({
          opacity: 0.25,
          background: `linear-gradient(${angle}deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%)`,
          transition: 'opacity 150ms ease-out',
        })
      }
    },
    [max, perspective, scale, glare]
  )

  const onMouseLeave = useCallback(() => {
    setStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 500ms cubic-bezier(0.03, 0.98, 0.52, 0.99)',
    })
    if (glare) {
      setGlareStyle({
        opacity: 0,
        transition: 'opacity 500ms ease-out',
      })
    }
  }, [perspective, glare])

  return { ref, style, glareStyle, onMouseMove, onMouseLeave }
}
