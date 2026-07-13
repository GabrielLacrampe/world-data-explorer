import { useEffect, useRef } from 'react'
import { Source, Layer, useMap } from 'react-map-gl/maplibre'
import useStore from '../../store/useStore'
import { buildTradeGeoJSON } from '../../utils/tradeRoutes'

// Subtle dasharray sequence — short dash, long gap, slow step
const FLOW_DASH = [
  [0, 6, 2], [0.5, 6, 1.5], [1, 6, 1], [1.5, 6, 0.5],
  [2, 6, 0], [0, 0.5, 2, 5.5], [0, 1, 2, 5], [0, 1.5, 2, 4.5],
  [0, 2, 2, 4], [0, 2.5, 2, 3.5], [0, 3, 2, 3], [0, 3.5, 2, 2.5],
  [0, 4, 2, 2], [0, 4.5, 2, 1.5], [0, 5, 2, 1], [0, 5.5, 2, 0.5],
]

const NO_MATCH = ['==', '1', '0']

// Routes for the selected country only; nothing highlighted when deselected.
function routeFilter(selectedCountry, endpointProp, type) {
  return selectedCountry
    ? ['all', ['==', ['get', endpointProp], selectedCountry.code], ['==', ['get', 'type'], type]]
    : NO_MATCH
}

const ARROW_LAYOUT = {
  'symbol-placement': 'line',
  'symbol-spacing': 180,
  'text-field': '›',
  'text-size': 11,
  'text-font': ['Noto Sans Bold'],
  'text-keep-upright': false,
  'text-rotation-alignment': 'map',
  'text-pitch-alignment': 'map',
}

/**
 * Export/import great-circle arcs from the CIA Factbook data. Only mounted
 * while the Trade layer is active — unmounting stops the flow animation.
 */
export default function TradeRoutesLayer() {
  const { current: mapRef } = useMap()
  const selectedCountry  = useStore((s) => s.selectedCountry)
  const staticData       = useStore((s) => s.staticData)
  const allCountriesData = useStore((s) => s.allCountriesData)
  const tradeGeoJSON     = useStore((s) => s.tradeGeoJSON)
  const setTradeGeoJSON  = useStore((s) => s.setTradeGeoJSON)

  const animRef = useRef(null)
  const animStep = useRef(0)

  // Build the trade GeoJSON once, when factbook + country data are available
  useEffect(() => {
    if (!staticData?.factbook || !allCountriesData || tradeGeoJSON) return
    const geojson = buildTradeGeoJSON(staticData.factbook, allCountriesData)
    if (geojson) setTradeGeoJSON(geojson)
  }, [staticData, allCountriesData, tradeGeoJSON, setTradeGeoJSON])

  // Animated flow on the selected country's routes — dasharray stepped
  // imperatively so the animation doesn't re-render React.
  useEffect(() => {
    const animate = () => {
      const map = mapRef?.getMap()
      if (map) {
        const dash = FLOW_DASH[animStep.current % FLOW_DASH.length]
        if (map.getLayer('trade-export-flow')) map.setPaintProperty('trade-export-flow', 'line-dasharray', dash)
        if (map.getLayer('trade-import-flow')) map.setPaintProperty('trade-import-flow', 'line-dasharray', dash)
        animStep.current++
      }
      animRef.current = setTimeout(() => requestAnimationFrame(animate), 90)
    }
    const t = setTimeout(() => requestAnimationFrame(animate), 300)
    return () => { clearTimeout(t); if (animRef.current) clearTimeout(animRef.current) }
  }, [mapRef, selectedCountry])

  if (!tradeGeoJSON) return null

  return (
    <Source id="trade-routes" type="geojson" data={tradeGeoJSON}>
      {/* All global routes — very dim, static */}
      <Layer
        id="trade-bg"
        type="line"
        paint={{
          'line-color': '#1e3a5f',
          'line-width': 0.5,
          'line-opacity': 0.28,
          'line-dasharray': [4, 8],
        }}
      />

      {/* ── Exports from selected country ── */}
      <Layer
        id="trade-export-line"
        type="line"
        filter={routeFilter(selectedCountry, 'from', 'export')}
        paint={{ 'line-color': '#22d3ee', 'line-width': 1.2, 'line-opacity': 0.25 }}
      />
      {/* Animated flow overlay — dasharray set imperatively by rAF loop */}
      <Layer
        id="trade-export-flow"
        type="line"
        filter={routeFilter(selectedCountry, 'from', 'export')}
        paint={{ 'line-color': '#67e8f9', 'line-width': 1.6, 'line-opacity': 0.85 }}
      />
      {/* Chevron direction markers */}
      <Layer
        id="trade-export-arrows"
        type="symbol"
        filter={routeFilter(selectedCountry, 'from', 'export')}
        layout={ARROW_LAYOUT}
        paint={{ 'text-color': '#a5f3fc', 'text-opacity': 0.6 }}
      />

      {/* ── Imports to selected country ── */}
      <Layer
        id="trade-import-line"
        type="line"
        filter={routeFilter(selectedCountry, 'to', 'import')}
        paint={{ 'line-color': '#fb923c', 'line-width': 1.2, 'line-opacity': 0.25 }}
      />
      <Layer
        id="trade-import-flow"
        type="line"
        filter={routeFilter(selectedCountry, 'to', 'import')}
        paint={{ 'line-color': '#fdba74', 'line-width': 1.6, 'line-opacity': 0.85 }}
      />
      <Layer
        id="trade-import-arrows"
        type="symbol"
        filter={routeFilter(selectedCountry, 'to', 'import')}
        layout={ARROW_LAYOUT}
        paint={{ 'text-color': '#fed7aa', 'text-opacity': 0.6 }}
      />
    </Source>
  )
}
