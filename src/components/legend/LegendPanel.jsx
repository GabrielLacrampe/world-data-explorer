import { LAYERS } from '../../layers'
import useStore from '../../store/useStore'
import { COLOR_SCALE } from '../../utils/colorScale'
import { useRelationships } from '../../hooks/useRelationships'

const REL_LEGEND = [
  { type: 'war',      label: 'War',      color: '#ef4444' },
  { type: 'conflict', label: 'Conflict', color: '#f97316' },
  { type: 'rivalry',  label: 'Rivalry',  color: '#f59e0b' },
  { type: 'tension',  label: 'Tension',  color: '#a78bfa' },
  { type: 'alliance', label: 'Alliance', color: '#22c55e' },
]

/** The red→green gradient bar with Low/High markers. */
function ColorRamp() {
  return (
    <>
      <div className="flex items-center gap-px">
        {COLOR_SCALE.map((color, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 first:rounded-l last:rounded-r"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[#4b5563] text-xs">Low</span>
        <span className="text-[#4b5563] text-xs">High</span>
      </div>
    </>
  )
}

function PanelShell({ title, children }) {
  return (
    <div className="bg-[#0d1117]/90 backdrop-blur-md border border-[#1e2736] rounded-md p-3 w-52">
      <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280] mb-2.5">
        {title}
      </p>
      {children}
    </div>
  )
}

/**
 * The legend below the layer picker. Picks the right variant for the
 * current mode: combined score, alliance relations, trade routes, or the
 * standard color ramp for a data layer.
 */
export default function LegendPanel() {
  const activeLayer     = useStore((s) => s.activeLayer)
  const selectedCountry = useStore((s) => s.selectedCountry)
  const combineMode     = useStore((s) => s.combineMode)
  const combinedLayers  = useStore((s) => s.combinedLayers)
  const layer           = LAYERS[activeLayer]

  const { data: relationships } = useRelationships(
    activeLayer === 'alliances' ? selectedCountry?.code : null
  )

  const presentRelTypes = relationships?.length
    ? new Set(relationships.map((r) => r.type))
    : null

  if (combineMode && combinedLayers.length > 0) {
    return (
      <PanelShell title={combinedLayers.length > 1 ? 'Combined Score' : 'Layer Score'}>
        <ColorRamp />
        <div className="mt-2 flex flex-col gap-0.5">
          {combinedLayers.map((key) => (
            <p key={key} className="text-[#6b7280] text-xs">
              {LAYERS[key].label}
              {LAYERS[key].unit && ` · ${LAYERS[key].unit}`}
            </p>
          ))}
        </div>
      </PanelShell>
    )
  }

  if (activeLayer === 'alliances' && selectedCountry && presentRelTypes) {
    return (
      <PanelShell title="Relations">
        <div className="flex flex-col gap-1.5">
          {REL_LEGEND.filter((e) => presentRelTypes.has(e.type)).map(({ type, label, color }) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[#94a3b8] text-xs">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[#374151] text-xs mt-2">Manual research · June 2026</p>
      </PanelShell>
    )
  }

  if (activeLayer === 'trade') {
    return (
      <PanelShell title="Trade Routes">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 rounded bg-cyan-400" />
            <span className="text-[#94a3b8] text-xs">Exports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 rounded bg-orange-400" />
            <span className="text-[#94a3b8] text-xs">Imports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 rounded bg-[#334155]" />
            <span className="text-[#94a3b8] text-xs">Global routes</span>
          </div>
        </div>
        <p className="text-[#374151] text-xs mt-2">Source: CIA World Factbook</p>
      </PanelShell>
    )
  }

  const isDataLayer = layer && activeLayer !== 'political' && activeLayer !== 'geographic' &&
    (layer.property || layer.indicator || layer.staticKey)

  if (!isDataLayer) return null

  return (
    <PanelShell
      title={
        <>
          {layer.label}
          {layer.unit && <span className="normal-case tracking-normal"> · {layer.unit}</span>}
        </>
      }
    >
      <ColorRamp />
      {layer.attribution && (
        <p className="text-[#374151] text-xs mt-2">Source: {layer.attribution}</p>
      )}
    </PanelShell>
  )
}
