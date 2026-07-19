import { useEffect, useRef, useState } from 'react'
import { LAYERS } from '../../layers'
import useStore from '../../store/useStore'
import { COLOR_SCALE } from '../../utils/colorScale'
import { useRelationships } from '../../hooks/useRelationships'
import ProvenancePanel from './ProvenancePanel'

const REL_LEGEND = [
  { type: 'war',      label: 'War',      color: '#ef4444' },
  { type: 'conflict', label: 'Conflict', color: '#f97316' },
  { type: 'rivalry',  label: 'Rivalry',  color: '#f59e0b' },
  { type: 'tension',  label: 'Tension',  color: '#a78bfa' },
  { type: 'alliance', label: 'Alliance', color: '#22c55e' },
]

/** Thin red→green gradient bar with tiny Low/High markers. */
function ColorRamp() {
  return (
    <>
      <div className="flex items-center gap-px">
        {COLOR_SCALE.map((color, i) => (
          <div
            key={i}
            className="h-1 flex-1 first:rounded-l last:rounded-r"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[#4b5563] text-[9px]">Low</span>
        <span className="text-[#4b5563] text-[9px]">High</span>
      </div>
    </>
  )
}

/**
 * Compact legend docked to the bottom of the layer dropdown (LayerMenu).
 * Returns a top-divided section, or null when the active layer has no
 * legend (e.g. political/geographic). Picks the right variant for the
 * current mode: combined score, alliance relations, trade routes, or the
 * standard color ramp for a data layer.
 */
export default function LegendPanel() {
  const activeLayer     = useStore((s) => s.activeLayer)
  const selectedCountry = useStore((s) => s.selectedCountry)
  const combineMode     = useStore((s) => s.combineMode)
  const combinedLayers  = useStore((s) => s.combinedLayers)
  const layer           = LAYERS[activeLayer]

  const [provenanceOpen, setProvenanceOpen] = useState(false)
  const provenanceRef = useRef(null)

  // Reset during render, not in an effect — react.dev's "adjusting state
  // when a prop changes" — so switching layers always closes a stale panel.
  const [lastLayer, setLastLayer] = useState(activeLayer)
  if (activeLayer !== lastLayer) {
    setLastLayer(activeLayer)
    setProvenanceOpen(false)
  }

  useEffect(() => {
    if (!provenanceOpen) return
    const onPointer = (e) => {
      if (provenanceRef.current && !provenanceRef.current.contains(e.target)) setProvenanceOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setProvenanceOpen(false)
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [provenanceOpen])

  const { data: relationships } = useRelationships(
    activeLayer === 'alliances' ? selectedCountry?.code : null
  )

  const presentRelTypes = relationships?.length
    ? new Set(relationships.map((r) => r.type))
    : null

  let content = null

  if (combineMode && combinedLayers.length > 0) {
    content = (
      <>
        <ColorRamp />
        <p className="text-[#6b7280] text-[9px] mt-1.5 leading-snug">
          {combinedLayers.map((key) => LAYERS[key].label).join(' + ')}
        </p>
      </>
    )
  } else if (activeLayer === 'alliances' && selectedCountry && presentRelTypes) {
    content = (
      <div className="flex flex-wrap gap-x-2.5 gap-y-1">
        {REL_LEGEND.filter((e) => presentRelTypes.has(e.type)).map(({ type, label, color }) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[#94a3b8] text-[9px]">{label}</span>
          </div>
        ))}
      </div>
    )
  } else if (activeLayer === 'trade') {
    content = (
      <div className="flex flex-wrap gap-x-2.5 gap-y-1">
        {[
          ['bg-cyan-400', 'Exports'],
          ['bg-orange-400', 'Imports'],
          ['bg-[#334155]', 'Global'],
        ].map(([bar, label]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-3 h-0.5 rounded ${bar}`} />
            <span className="text-[#94a3b8] text-[9px]">{label}</span>
          </div>
        ))}
      </div>
    )
  } else {
    const isDataLayer = layer && activeLayer !== 'political' && activeLayer !== 'geographic' &&
      (layer.property || layer.indicator || layer.staticKey)
    if (isDataLayer) {
      content = (
        <>
          <ColorRamp />
          {layer.attribution && (
            <div ref={provenanceRef} className="relative flex items-center gap-1 mt-1">
              <p className="text-[#374151] text-[9px]">Source: {layer.attribution}</p>
              <button
                onClick={() => setProvenanceOpen((o) => !o)}
                title="Data provenance & quality"
                className="w-3 h-3 rounded-full border border-[#374151] text-[#374151] text-[8px]
                           leading-none flex items-center justify-center hover:border-[#6b7280] hover:text-[#6b7280]"
              >
                i
              </button>
              {provenanceOpen && <ProvenancePanel layerKey={activeLayer} layer={layer} />}
            </div>
          )}
        </>
      )
    }
  }

  if (!content) return null

  return <div className="border-t border-[#1e2736] px-3 py-2">{content}</div>
}
