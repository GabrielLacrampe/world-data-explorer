import { useMemo } from 'react'
import useStore from '../store/useStore'
import { LAYERS } from '../layers'
import useTooltipAuxData from '../hooks/useTooltipAuxData'
import { TOOLTIP_PANEL_CLASS } from './Tooltip'
import {
  getLayerValueForCountry,
  formatTooltipValue,
  getPercentileBadge,
  getNoDataMessage,
  getBreakdown,
  getCombineModeBreakdown,
} from '../utils/tooltipContent'

const EDGE_MARGIN_X = 280
const EDGE_MARGIN_Y = 220

export default function MapHoverTooltip({ hoveredCountry }) {
  const {
    activeLayer,
    combineMode,
    combinedLayers,
    worldBankLayerCache,
    imfLayerCache,
    staticData,
    allCountriesData,
    historicalData,
    activeYear,
    layerLoading,
    historicalLoading,
  } = useStore()

  useTooltipAuxData(hoveredCountry.iso2)

  const content = useMemo(() => {
    const { iso2 } = hoveredCountry
    const storeSlices = { worldBankLayerCache, imfLayerCache, staticData, allCountriesData, historicalData, activeYear }

    if (combineMode) {
      return { mode: 'combine', rows: getCombineModeBreakdown(combinedLayers, iso2, storeSlices) }
    }

    const layer = LAYERS[activeLayer]
    if (!layer || !(layer.indicator || layer.staticKey)) return null
    if (layer.historical ? historicalLoading : layerLoading) return { mode: 'loading' }

    const { value } = getLayerValueForCountry(activeLayer, iso2, storeSlices)

    return {
      mode: 'single',
      label: layer.label,
      formatted: value !== null ? formatTooltipValue(value, layer.format, layer.unit) : null,
      noDataMessage: getNoDataMessage(activeLayer, iso2, storeSlices),
      percentile: getPercentileBadge(activeLayer, iso2, storeSlices),
      breakdown: getBreakdown(activeLayer, iso2, storeSlices),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hoveredCountry.iso2, activeLayer, combineMode, combinedLayers,
    worldBankLayerCache, imfLayerCache, staticData, historicalData, activeYear,
    layerLoading, historicalLoading,
  ])

  if (!content) return null

  const { point } = hoveredCountry
  const flipX = point.x > window.innerWidth - EDGE_MARGIN_X
  const flipY = point.y > window.innerHeight - EDGE_MARGIN_Y
  const style = {
    left: point.x,
    top: point.y,
    transform: `translate(${flipX ? 'calc(-100% - 14px)' : '14px'}, ${flipY ? 'calc(-100% - 14px)' : '14px'})`,
  }

  return (
    <div className={`absolute z-50 pointer-events-none w-64 ${TOOLTIP_PANEL_CLASS}`} style={style}>
      <p className="font-display text-xs text-[#e2e8f0] font-medium mb-1">{hoveredCountry.name}</p>

      {content.mode === 'loading' && <p className="text-[#6b7280] text-xs">Loading…</p>}

      {content.mode === 'single' && (
        <div className="flex flex-col gap-1">
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#6b7280]">{content.label}</p>

          {content.formatted && <p className="text-[#e2e8f0] text-sm">{content.formatted}</p>}
          {content.noDataMessage && <p className="text-[#4b5563] text-xs">{content.noDataMessage}</p>}
          {content.percentile && (
            <p className="text-emerald-400 text-[10px]">{content.percentile.label}</p>
          )}

          {content.breakdown?.status === 'ready' && (
            <div className="mt-1 pt-1 border-t border-[#1e2736] flex flex-col gap-0.5">
              {content.breakdown.lines.map((line, i) => (
                <p key={i} className="text-[#94a3b8] text-[10px]">{line}</p>
              ))}
            </div>
          )}
          {content.breakdown?.status === 'loading' && (
            <p className="text-[#374151] text-[10px] mt-1">Calculating breakdown…</p>
          )}
        </div>
      )}

      {content.mode === 'combine' && (
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#6b7280] mb-0.5">Combined layers</p>
          {content.rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-2">
              <span className="text-[#94a3b8] text-[10px]">{row.label}</span>
              <span className={`text-[10px] ${row.hasData ? 'text-[#e2e8f0]' : 'text-[#4b5563]'}`}>
                {row.formatted}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
