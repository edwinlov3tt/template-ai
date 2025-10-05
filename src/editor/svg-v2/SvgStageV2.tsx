// src/editor/svg-v2/SvgStageV2.tsx
import React from 'react'
import { CoordinateSystem } from '../core/CoordinateSystem'

export const SvgStageV2: React.FC = () => {
  const ref = React.useRef<SVGSVGElement|null>(null)
  const cs = React.useRef(new CoordinateSystem())
  React.useEffect(()=>{ if (ref.current) cs.current.setSvg(ref.current) },[])
  return (
    <svg ref={ref} viewBox="0 0 1080 1080" style={{width:'100%',height:'100%'}}>
      <defs />
      {/* TODO: render slots */}
    </svg>
  )
}
