import { useState } from 'react'
import { LAYERS, LAYER_GROUPS, isCombinableLayer } from '../../layers'
import useStore from '../../store/useStore'
import Tooltip from '../Tooltip'

function groupForLayer(layerKey) {
  return LAYER_GROUPS.find((g) => g.keys.includes(layerKey))?.label ?? 'Demographics'
}

// Layer pill with a hover tooltip showing unit/source/description — helps
// decide which layer to pick before clicking. Aligned to the right edge
// ('end') since the picker sits flush against the window's right edge, and
// opens upward ('top') because it drops up from the bottom-right corner.
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

/** The "Map Layer" panel: combine-mode toggle + collapsible layer groups. */
export default function LayerPicker() {
  const activeLayer    = useStore((s) => s.activeLayer)
  const setActiveLayer = useStore((s) => s.setActiveLayer)
  const layerLoading   = useStore((s) => s.layerLoading)

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

  return (
    // No overflow-hidden here: the layer tooltips are absolutely
    // positioned inside this panel and must be able to spill past its
    // edges. Corner rounding is handled per-element instead.
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
  )
}
