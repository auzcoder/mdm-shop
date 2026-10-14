import type { ReactNode } from 'react'

import { useTilt } from '../hooks/useTilt'

export function Card3D({
  children,
  className = '',
  max = 10,
  scale = 1.02,
  glare = true,
  onClick,
  style: customStyle,
}: {
  children: ReactNode
  className?: string
  max?: number
  scale?: number
  glare?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}) {
  const { ref, style, glareStyle, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>({
    max,
    scale,
    glare,
  })

  return (
    <div
      ref={ref}
      style={{ ...style, ...customStyle }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`card-3d ${className}`}
    >
      {glare && <div className="card-3d-glare" style={glareStyle} />}
      <div className="card-3d-inner">{children}</div>
    </div>
  )
}
