import { useState, useEffect, useRef } from 'react'
import { LAYERS } from '../../layers'
import useStore from '../../store/useStore'
import LayerPicker from './LayerPicker'
import LegendPanel from './LegendPanel'

/**
 * Bottom-right layer control: a compact trigger (active layer + docked
 * legend) that drops the full LayerPicker panel *upward* when clicked.
 * The legend is coupled to the trigger in the same rounded box. Closes on
 * outside click or Escape.
 */
export default function LayerMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const activeLayer    = useStore((s) => s.activeLayer)
  const combineMode    = useStore((s) => s.combineMode)
  const combinedLayers = useStore((s) => s.combinedLayers)
  const layerLoading   = useStore((s) => s.layerLoading)

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = combineMode
    ? combinedLayers.length > 0
      ? `${combinedLayers.length} layer${combinedLayers.length > 1 ? 's' : ''}`
      : 'Combine mode'
    : LAYERS[activeLayer]?.label ?? 'Select layer'

  return (
    // Anchored flush into the bottom-right corner (mirrors the TopBar in the
    // top-left): borders only on the interior edges, only the interior corner
    // rounded. items-end keeps the drop-up panel flush against the right edge.
    <div ref={ref} className="absolute bottom-0 right-0 z-30 flex flex-col items-end">
      {open && (
        <div className="mb-1.5">
          <LayerPicker />
        </div>
      )}

      <div className="w-52 bg-[#0d1117]/90 backdrop-blur-md border-t border-l border-[#1e2736] rounded-tl-md">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 h-8 px-3 rounded-tl-md hover:bg-[#1e2736]/60 transition-colors"
        >
          <span className="font-display text-[9px] uppercase tracking-[0.15em] text-[#6b7280] shrink-0">
            Layer
          </span>
          <span className="flex-1 text-left text-[11px] font-medium text-[#e2e8f0] truncate">
            {label}
          </span>
          {layerLoading && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping shrink-0" />
          )}
          <span className={`text-[#4b5563] text-[10px] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            ▴
          </span>
        </button>

        <LegendPanel />
      </div>
    </div>
  )
}
