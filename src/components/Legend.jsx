import { useState } from 'react'
import { LAYERS, isCombinableLayer } from '../layers'
import useStore from '../store/useStore'
import { COLOR_SCALE } from '../utils/colorScale'
import { useRelationships } from '../hooks/useRelationships'
import Tooltip from './Tooltip'

const REL_LEGEND = [
  { type: 'war',      label: 'War',      color: '#ef4444' },
  { type: 'conflict', label: 'Conflict', color: '#f97316' },
  { type: 'rivalry',  label: 'Rivalry',  color: '#f59e0b' },
  { type: 'tension',  label: 'Tension',  color: '#a78bfa' },
  { type: 'alliance', label: 'Alliance', color: '#22c55e' },
]

const LAYER_GROUPS = [
  { label: 'Map Style',    keys: ['geographic', 'political'] },
  { label: 'Demographics', keys: ['population', 'area', 'birth_rate', 'death_rate', 'net_migration'] },
  { label: 'Economy',      keys: ['gdp_per_capita', 'gdp_growth', 'unemployment', 'inflation', 'cost_of_living', 'public_debt', 'fiscal_balance', 'exports', 'imports'] },
  { label: 'Social',       keys: ['life_expectancy', 'electricity_access', 'literacy_rate', 'internet_users', 'renewable_energy', 'health_spending', 'education_spending', 'water_access', 'co2_total'] },
  { label: 'Governance',   keys: ['democracy_index', 'military_spending', 'gini_index'] },
  { label: 'Diplomacy',    keys: ['alliances', 'trade'] },
]

function groupForLayer(layerKey) {
  return LAYER_GROUPS.find((g) => g.keys.includes(layerKey))?.label ?? 'Demographics'
}

// Layer pill with a hover tooltip showing unit/source/description — helps
// decide which layer to pick before clicking. Aligned to the right edge
// ('end') since the Legend panel itself sits flush against the window's
// right edge, so tooltips need to open leftward to stay on-screen.
function LayerButton({ layerKey, isActive, disabled, onClick }) {
  const [hovered, setHovered] = useState(false)
  const layer = LAYERS[layerKey]

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {disabled ? (
        <span className="block px-2 py-0.5 text-[10px] rounded text-[#374151] border border-[#1e2736] opacity-50 cursor-not-allowed">
          {layer.label}
        </span>
      ) : (
        <button
          onClick={onClick}
          className={`px-2 py-0.5 text-[10px] rounded transition-all duration-150 ${
            isActive
              ? 'bg-blue-600/90 text-white'
              : 'text-[#6b7280] hover:text-[#e2e8f0] hover:bg-[#1e2736] border border-[#1e2736]'
          }`}
        >
          {layer.label}
        </button>
      )}
      {hovered && (
        <Tooltip side="top" align="end">
          <p className="text-[#e2e8f0] text-xs mb-1">{layer.label}</p>
          {layer.description && (
            <p className="text-[#94a3b8] text-[10px] leading-snug mb-1">{layer.description}</p>
          )}
          {(layer.unit || layer.attribution) && (
            <p className="text-[#4b5563] text-[10px]">
              {[layer.unit, layer.attribution].filter(Boolean).join(' · ')}
            </p>
          )}
        </Tooltip>
      )}
    </div>
  )
}

function DataPanel() {
  const activeLayer    = useStore((s) => s.activeLayer)
  const setActiveLayer = useStore((s) => s.setActiveLayer)
  const selectedCountry = useStore((s) => s.selectedCountry)
  const layerLoading   = useStore((s) => s.layerLoading)
  const layer          = LAYERS[activeLayer]

  const combineMode         = useStore((s) => s.combineMode)
  const setCombineMode      = useStore((s) => s.setCombineMode)
  const combinedLayers      = useStore((s) => s.combinedLayers)
  const toggleCombinedLayer = useStore((s) => s.toggleCombinedLayer)
  const removeCombinedLayer = useStore((s) => s.removeCombinedLayer)

  // Track the last manually-opened group; when null, follow the active layer
  const [manualGroup, setManualGroup] = useState(null)
  const [lastLayer, setLastLayer]     = useState(activeLayer)

  if (activeLayer !== lastLayer) {
    setLastLayer(activeLayer)
    setManualGroup(null)
  }

  const openGroup    = manualGroup ?? groupForLayer(activeLayer)
  const setOpenGroup = (g) => setManualGroup(g)

  const { data: relationships } = useRelationships(
    activeLayer === 'alliances' ? selectedCountry?.code : null
  )

  const presentRelTypes = relationships?.length
    ? new Set(relationships.map((r) => r.type))
    : null

  const hasAllianceLegend = activeLayer === 'alliances' && selectedCountry && !!presentRelTypes

  return (
    // bottom-8 clears the MapLibre attribution bar (~32px)
    <div className="absolute bottom-8 right-4 z-20 flex flex-col gap-2 items-end">

      {/* ── Layer selector ───────────────────────────────────────────── */}
      {/* No overflow-hidden here: the layer tooltips are absolutely
          positioned inside this panel and must be able to spill past its
          edges. Corner rounding is handled per-element instead. */}
      <div className="bg-[#0d1117]/90 backdrop-blur-md border border-[#1e2736] rounded-md w-52">
        {layerLoading && (
          <div className="h-0.5 w-full bg-[#1e2736] overflow-hidden rounded-t-md">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
          </div>
        )}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280]">
            Map Layer
          </p>
          {layerLoading && (
            <span className="flex items-center gap-1.5 text-[9px] text-blue-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              Loading
            </span>
          )}
        </div>

        <label className="flex items-center gap-1.5 px-3 pb-2 text-[9px] uppercase tracking-wider text-[#6b7280] cursor-pointer">
          <input
            type="checkbox"
            checked={combineMode}
            onChange={(e) => setCombineMode(e.target.checked)}
            className="accent-blue-600"
          />
          Combine mode
        </label>

        {combineMode && combinedLayers.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3 pb-2">
            {combinedLayers.map((key) => (
              <span
                key={key}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1e2736] text-[10px] text-[#e2e8f0]"
              >
                {LAYERS[key].label}
                <button onClick={() => removeCombinedLayer(key)} className="text-[#6b7280] hover:text-white">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {LAYER_GROUPS.map(({ label, keys }, i) => {
          const isOpen = openGroup === label
          const groupHasActive = keys.includes(activeLayer)
          // When the last group is collapsed its header touches the panel's
          // rounded bottom corners; round its hover bg to match.
          const isLastCollapsed = i === LAYER_GROUPS.length - 1 && !isOpen
          return (
            <div key={label} className="border-t border-[#1e2736]">
              {/* Group header — clickable toggle */}
              <button
                onClick={() => setOpenGroup(isOpen ? null : label)}
                className={`w-full flex items-center justify-between px-3 py-1.5
                           hover:bg-[#1e2736]/60 transition-colors group
                           ${isLastCollapsed ? 'rounded-b-md' : ''}`}
              >
                <span className={`text-[9px] uppercase tracking-wider transition-colors
                  ${groupHasActive ? 'text-blue-400' : 'text-[#4b5563] group-hover:text-[#6b7280]'}`}>
                  {label}
                </span>
                <span className={`text-[#4b5563] text-[10px] transition-transform duration-200
                  ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
                  ▾
                </span>
              </button>

              {/* Layer buttons — shown when expanded */}
              {isOpen && (
                <div className="flex flex-wrap gap-1 px-3 pb-2.5">
                  {keys.map((key) => {
                    if (combineMode && !isCombinableLayer(key)) {
                      return <LayerButton key={key} layerKey={key} disabled />
                    }
                    const isActive = combineMode ? combinedLayers.includes(key) : activeLayer === key
                    return (
                      <LayerButton
                        key={key}
                        layerKey={key}
                        isActive={isActive}
                        onClick={() => (combineMode ? toggleCombinedLayer(key) : setActiveLayer(key))}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      {combineMode && combinedLayers.length > 0 ? (
        <div className="bg-[#0d1117]/90 backdrop-blur-md border border-[#1e2736] rounded-md p-3 w-52">
          <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280] mb-2.5">
            {combinedLayers.length > 1 ? 'Combined Score' : 'Layer Score'}
          </p>
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
          <div className="mt-2 flex flex-col gap-0.5">
            {combinedLayers.map((key) => (
              <p key={key} className="text-[#6b7280] text-xs">
                {LAYERS[key].label}
                {LAYERS[key].unit && ` · ${LAYERS[key].unit}`}
              </p>
            ))}
          </div>
        </div>
      ) : hasAllianceLegend ? (
        <div className="bg-[#0d1117]/90 backdrop-blur-md border border-[#1e2736] rounded-md p-3 w-52">
          <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280] mb-2.5">
            Relations
          </p>
          <div className="flex flex-col gap-1.5">
            {REL_LEGEND.filter((e) => presentRelTypes.has(e.type)).map(({ type, label, color }) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[#94a3b8] text-xs">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[#374151] text-xs mt-2">Manual research · June 2026</p>
        </div>
      ) : activeLayer === 'trade' ? (
        <div className="bg-[#0d1117]/90 backdrop-blur-md border border-[#1e2736] rounded-md p-3 w-52">
          <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280] mb-2.5">
            Trade Routes
          </p>
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
        </div>
      ) : layer && activeLayer !== 'political' && activeLayer !== 'geographic' && (layer.property || layer.indicator || layer.staticKey) ? (
        <div className="bg-[#0d1117]/90 backdrop-blur-md border border-[#1e2736] rounded-md p-3 w-52">
          <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280] mb-2.5">
            {layer.label}
            {layer.unit && <span className="normal-case tracking-normal"> · {layer.unit}</span>}
          </p>
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
          {layer.attribution && (
            <p className="text-[#374151] text-xs mt-2">Source: {layer.attribution}</p>
          )}
        </div>
      ) : null}

    </div>
  )
}

export default DataPanel
