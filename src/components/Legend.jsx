import { useState } from 'react'
import { LAYERS } from '../layers'
import useStore from '../store/useStore'
import { COLOR_SCALE } from '../utils/colorScale'

const ALLIANCE_LEGEND = [
  { type: 'Defense Pact', color: '#ef4444' },
  { type: 'Non-Aggression Treaty', color: '#f59e0b' },
  { type: 'Neutrality Pact', color: '#a78bfa' },
  { type: 'Entente', color: '#22c55e' },
]

const LAYER_GROUPS = [
  { label: 'Map Style',    keys: ['geographic', 'political'] },
  { label: 'Demographics', keys: ['population', 'area'] },
  { label: 'Economy',      keys: ['gdp_per_capita', 'gdp_growth', 'unemployment'] },
  { label: 'Social',       keys: ['life_expectancy', 'electricity_access', 'literacy_rate', 'internet_users', 'renewable_energy'] },
  { label: 'Governance',   keys: ['democracy_index', 'military_spending', 'gini_index'] },
  { label: 'Diplomacy',    keys: ['alliances', 'trade'] },
]

function groupForLayer(layerKey) {
  return LAYER_GROUPS.find((g) => g.keys.includes(layerKey))?.label ?? 'Demographics'
}

function DataPanel() {
  const activeLayer    = useStore((s) => s.activeLayer)
  const setActiveLayer = useStore((s) => s.setActiveLayer)
  const selectedCountry = useStore((s) => s.selectedCountry)
  const staticData     = useStore((s) => s.staticData)
  const layer          = LAYERS[activeLayer]

  // Track the last manually-opened group; when null, follow the active layer
  const [manualGroup, setManualGroup] = useState(null)
  const [lastLayer, setLastLayer]     = useState(activeLayer)

  if (activeLayer !== lastLayer) {
    setLastLayer(activeLayer)
    setManualGroup(null)
  }

  const openGroup    = manualGroup ?? groupForLayer(activeLayer)
  const setOpenGroup = (g) => setManualGroup(g)

  const hasAllianceLegend = activeLayer === 'alliances' &&
    selectedCountry &&
    staticData?.alliances?.[selectedCountry.code]?.length > 0

  const presentAllianceTypes = hasAllianceLegend
    ? new Set(staticData.alliances[selectedCountry.code].map((a) => a.type))
    : null

  return (
    // bottom-8 clears the MapLibre attribution bar (~32px)
    <div className="absolute bottom-8 right-4 z-20 flex flex-col gap-2 items-end">

      {/* ── Layer selector ───────────────────────────────────────────── */}
      <div className="bg-[#0d1117]/90 backdrop-blur-md border border-[#1e2736] rounded-md w-52 overflow-hidden">
        <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280] px-3 pt-3 pb-2">
          Map Layer
        </p>

        {LAYER_GROUPS.map(({ label, keys }) => {
          const isOpen = openGroup === label
          const groupHasActive = keys.includes(activeLayer)
          return (
            <div key={label} className="border-t border-[#1e2736]">
              {/* Group header — clickable toggle */}
              <button
                onClick={() => setOpenGroup(isOpen ? null : label)}
                className="w-full flex items-center justify-between px-3 py-1.5
                           hover:bg-[#1e2736]/60 transition-colors group"
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
                  {keys.map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveLayer(key)}
                      className={`px-2 py-0.5 text-[10px] rounded transition-all duration-150 ${
                        activeLayer === key
                          ? 'bg-blue-600/90 text-white'
                          : 'text-[#6b7280] hover:text-[#e2e8f0] hover:bg-[#1e2736] border border-[#1e2736]'
                      }`}
                    >
                      {LAYERS[key].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      {hasAllianceLegend ? (
        <div className="bg-[#0d1117]/90 backdrop-blur-md border border-[#1e2736] rounded-md p-3 w-52">
          <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280] mb-2.5">
            Alliance Relations
          </p>
          <div className="flex flex-col gap-1.5">
            {ALLIANCE_LEGEND.filter((e) => presentAllianceTypes.has(e.type)).map(({ type, color }) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[#94a3b8] text-xs">{type}</span>
              </div>
            ))}
          </div>
          <p className="text-[#374151] text-xs mt-2">Source: COW Project</p>
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
