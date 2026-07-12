import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactMapGL, { Source, Layer } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_STYLE } from '../utils/mapStyles'
import useStore from '../store/useStore'
import { patchGeoJSON, buildLabelPoints } from '../utils/geoUtils'
import { buildTradeGeoJSON } from '../utils/tradeRoutes'
import { useRelationships } from '../hooks/useRelationships'
import { LAYERS } from '../layers'
import MapHoverTooltip from './MapHoverTooltip'
import {
  LABEL_REF_ZOOM,
  LABEL_LARGE_SHOW,
  LABEL_DEFAULT_SHOW,
  LABEL_FADE_IN,
  LABEL_FADE_START,
  LABEL_FADE_END,
} from '../config/labelConfig'


const GEOJSON_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

const GEO_NAME = 'name'
const GEO_ISO2 = 'ISO3166-1-Alpha-2'

const REL_COLORS = {
  war:      '#ef4444',
  conflict: '#f97316',
  rivalry:  '#f59e0b',
  tension:  '#a78bfa',
  alliance: '#22c55e',
}

// Known ISO2 fixes for features the geo-countries dataset ships with code -99.
const NAME_TO_ISO2_FIXES = {
  'France':          'FR',
  'Norway':          'NO',
  'Northern Cyprus': 'CY',
  'Somaliland':      'SO',
  'Kosovo':          'XK',
}

function Map() {
  const mapRef = useRef(null)
  const hoveredFeatureId = useRef(null)
  const selectedFeatureId = useRef(null)
  const animRef = useRef(null)
  const animStep = useRef(0)

  // Subtle dasharray sequence — short dash, long gap, slow step
  const FLOW_DASH = [
    [0, 6, 2], [0.5, 6, 1.5], [1, 6, 1], [1.5, 6, 0.5],
    [2, 6, 0], [0, 0.5, 2, 5.5], [0, 1, 2, 5], [0, 1.5, 2, 4.5],
    [0, 2, 2, 4], [0, 2.5, 2, 3.5], [0, 3, 2, 3], [0, 3.5, 2, 2.5],
    [0, 4, 2, 2], [0, 4.5, 2, 1.5], [0, 5, 2, 1], [0, 5.5, 2, 0.5],
  ]

  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.8,
  })

  // Country + screen position currently under the cursor, for the hover
  // tooltip. Kept as local state (not the store) — it's ephemeral and
  // updates on every mousemove, with no consumers outside this component.
  const [hoveredCountry, setHoveredCountry] = useState(null)

  const {
    worldData,
    setWorldData,
    fillExpression,
    selectedCountry,
    setSelectedCountry,
    setLoading,
    staticData,
    activeLayer,
    combineMode,
    setMapZoom,
    tradeGeoJSON,
    setTradeGeoJSON,
    allCountriesData,
    setLastError,
  } = useStore()

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => {
        // fetch only rejects on network failure — HTTP errors resolve fine
        if (!res.ok) throw new Error(`HTTP ${res.status} loading world GeoJSON`)
        return res.json()
      })
      .then((data) => {
        setWorldData(patchGeoJSON(data, NAME_TO_ISO2_FIXES))
      })
      .catch((err) => {
        console.error('World GeoJSON load failed:', err)
        setLastError('Could not load the world map. Check your connection and reload the page.')
      })
      .finally(() => setLoading('map', false))
  }, [setWorldData, setLoading, setLastError])

  const { data: relationships, iso3: selectedIso3 } = useRelationships(selectedCountry?.code)

  const labelPoints = useMemo(() => worldData ? buildLabelPoints(worldData) : null, [worldData])

  const iso2ToFeatureId = useMemo(() => {
    if (!worldData) return {}
    const lookup = {}
    worldData.features.forEach((f, i) => {
      const iso2 = f.properties[GEO_ISO2]
      if (iso2) lookup[iso2] = i
    })
    return lookup
  }, [worldData])

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current.getMap()

    if (selectedFeatureId.current !== null) {
      map.setFeatureState(
        { source: 'countries', id: selectedFeatureId.current },
        { selected: false }
      )
      selectedFeatureId.current = null
    }

    if (selectedCountry) {
      const fid = iso2ToFeatureId[selectedCountry.code]
      if (fid !== undefined) {
        map.setFeatureState({ source: 'countries', id: fid }, { selected: true })
        selectedFeatureId.current = fid
      }
    }
  }, [selectedCountry, iso2ToFeatureId])

  const handleMouseMove = useCallback((e) => {
    if (!mapRef.current || !e.features?.length) return
    const map = mapRef.current.getMap()

    if (hoveredFeatureId.current !== null) {
      map.setFeatureState(
        { source: 'countries', id: hoveredFeatureId.current },
        { hover: false }
      )
    }
    hoveredFeatureId.current = e.features[0].id
    map.setFeatureState(
      { source: 'countries', id: hoveredFeatureId.current },
      { hover: true }
    )

    const iso2 = e.features[0].properties[GEO_ISO2]
    if (!iso2 || iso2 === '-99') {
      setHoveredCountry(null)
      return
    }
    setHoveredCountry({ iso2, name: e.features[0].properties[GEO_NAME], point: e.point })
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!mapRef.current || hoveredFeatureId.current === null) return
    const map = mapRef.current.getMap()
    map.setFeatureState(
      { source: 'countries', id: hoveredFeatureId.current },
      { hover: false }
    )
    hoveredFeatureId.current = null
    setHoveredCountry(null)
  }, [])

  const handleClick = useCallback((e) => {
    if (!e.features?.length) {
      setSelectedCountry(null)
      return
    }
    const feature = e.features[0]
    setSelectedCountry({
      code: feature.properties[GEO_ISO2],
      name: feature.properties[GEO_NAME],
    })
  }, [setSelectedCountry])

  // Build trade GeoJSON once when factbook + allCountriesData are available
  useEffect(() => {
    if (!staticData?.factbook || !allCountriesData || tradeGeoJSON) return
    const geojson = buildTradeGeoJSON(staticData.factbook, allCountriesData)
    if (geojson) setTradeGeoJSON(geojson)
  }, [staticData, allCountriesData, tradeGeoJSON, setTradeGeoJSON])


  const resolvedFill = fillExpression || '#3b5998'

  const iso3ToIso2 = useMemo(() => {
    if (!allCountriesData) return {}
    const out = {}
    for (const [iso2, c] of Object.entries(allCountriesData)) {
      if (c.cca3) out[c.cca3] = iso2
    }
    return out
  }, [allCountriesData])

  const allianceFill = useMemo(() => {
    if (activeLayer !== 'alliances') return null
    if (!selectedCountry || !relationships?.length) return null
    // Priority order: war > conflict > rivalry > tension > alliance
    const PRIORITY = { war: 0, conflict: 1, rivalry: 2, tension: 3, alliance: 4 }
    const best = {} // iso2 → { color, priority }
    for (const rel of relationships) {
      const partners = [...(rel.side_a ?? []), ...(rel.side_b ?? [])].filter((c) => c !== selectedIso3)
      const color = REL_COLORS[rel.type] ?? '#6b7280'
      const priority = PRIORITY[rel.type] ?? 5
      for (const partnerIso3 of partners) {
        const iso2 = iso3ToIso2[partnerIso3]
        if (!iso2) continue
        if (!best[iso2] || priority < best[iso2].priority) best[iso2] = { color, priority }
      }
    }
    const entries = Object.entries(best)
    if (!entries.length) return null
    const args = []
    for (const [iso2, { color }] of entries) args.push(iso2, color)
    return ['match', ['get', GEO_ISO2], ...args, '#1a2535']
  }, [activeLayer, selectedCountry, relationships, selectedIso3, iso3ToIso2])

  // Animated flow on selected trade route lines
  useEffect(() => {
    if (activeLayer !== 'trade') {
      if (animRef.current) clearTimeout(animRef.current)
      return
    }
    const animate = () => {
      const map = mapRef.current?.getMap()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer, selectedCountry])

  // In trade mode all countries get the same dim base color — routes carry the information
  const tradeFill = activeLayer === 'trade' ? '#3b5998' : null

  const activeFill = allianceFill ?? tradeFill ?? resolvedFill

  return (
    <div className="absolute inset-0">
      <ReactMapGL
        ref={mapRef}
        {...viewState}
        onMove={(e) => { setViewState(e.viewState); setMapZoom(e.viewState.zoom) }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        minZoom={1.4}
        interactiveLayerIds={worldData ? ['countries-fill'] : []}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        cursor="pointer"
      >
        {worldData && (
          <Source id="countries" type="geojson" data={worldData} generateId={true}>
            <Layer
              id="countries-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  '#60a5fa',
                  activeFill,
                ],
                'fill-opacity': activeLayer === 'geographic' ? 0 : [
                  'case',
                  ['==', ['get', 'ISO3166-1-Alpha-2'], '-99'], 0,
                  ['boolean', ['feature-state', 'selected'], false], 0.50,
                  ['boolean', ['feature-state', 'hover'], false], 0.42,
                  0.30,
                ],
              }}
            />
            <Layer
              id="countries-border"
              type="line"
              paint={{
                'line-color': '#c8d6e8',
                'line-width': 0.6,
                'line-opacity': 0.35,
              }}
            />
          </Source>
        )}
        {labelPoints && (
          <Source id="country-label-points" type="geojson" data={labelPoints}>
            <Layer
              id="country-labels-large"
              type="symbol"
              filter={['==', ['get', 'isLarge'], true]}
              layout={{
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Bold'],
                'text-transform': 'uppercase',
                'text-size': [
                  'interpolate', ['exponential', 2], ['zoom'],
                  LABEL_REF_ZOOM - 2, ['*', ['get', 'labelSize'], 0.25],
                  LABEL_REF_ZOOM,     ['get', 'labelSize'],
                  LABEL_REF_ZOOM + 4, ['*', ['get', 'labelSize'], 16],
                ],
                'text-rotate': ['get', 'labelRotate'],
                'text-max-width': 6,
                'text-letter-spacing': 0.1,
              }}
              paint={{
                'text-color': '#e8dcc8',
                'text-halo-color': 'rgba(0,0,0,0.75)',
                'text-halo-width': 1.5,
                'text-opacity': [
                  'interpolate', ['linear'], ['zoom'],
                  LABEL_LARGE_SHOW,                  0,
                  LABEL_LARGE_SHOW + LABEL_FADE_IN,  1,
                  LABEL_FADE_START,                  1,
                  LABEL_FADE_END,                    0,
                ],
              }}
            />
            <Layer
              id="country-labels-default"
              type="symbol"
              filter={['==', ['get', 'isLarge'], false]}
              layout={{
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Bold'],
                'text-transform': 'uppercase',
                'text-size': [
                  'interpolate', ['exponential', 2], ['zoom'],
                  LABEL_REF_ZOOM - 2, ['*', ['get', 'labelSize'], 0.25],
                  LABEL_REF_ZOOM,     ['get', 'labelSize'],
                  LABEL_REF_ZOOM + 4, ['*', ['get', 'labelSize'], 16],
                ],
                'text-rotate': ['get', 'labelRotate'],
                'text-max-width': 6,
                'text-letter-spacing': 0.1,
              }}
              paint={{
                'text-color': '#e8dcc8',
                'text-halo-color': 'rgba(0,0,0,0.75)',
                'text-halo-width': 1.5,
                'text-opacity': [
                  'interpolate', ['linear'], ['zoom'],
                  LABEL_DEFAULT_SHOW,                  0,
                  LABEL_DEFAULT_SHOW + LABEL_FADE_IN,  1,
                  LABEL_FADE_START,                    1,
                  LABEL_FADE_END,                      0,
                ],
              }}
            />
          </Source>
        )}
        {activeLayer === 'trade' && tradeGeoJSON && (
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
              filter={selectedCountry
                ? ['all', ['==', ['get', 'from'], selectedCountry.code], ['==', ['get', 'type'], 'export']]
                : ['==', '1', '0']}
              paint={{ 'line-color': '#22d3ee', 'line-width': 1.2, 'line-opacity': 0.25 }}
            />
            {/* Animated flow overlay — dasharray set imperatively by rAF loop */}
            <Layer
              id="trade-export-flow"
              type="line"
              filter={selectedCountry
                ? ['all', ['==', ['get', 'from'], selectedCountry.code], ['==', ['get', 'type'], 'export']]
                : ['==', '1', '0']}
              paint={{ 'line-color': '#67e8f9', 'line-width': 1.6, 'line-opacity': 0.85 }}
            />
            {/* Chevron direction markers */}
            <Layer
              id="trade-export-arrows"
              type="symbol"
              filter={selectedCountry
                ? ['all', ['==', ['get', 'from'], selectedCountry.code], ['==', ['get', 'type'], 'export']]
                : ['==', '1', '0']}
              layout={{
                'symbol-placement': 'line',
                'symbol-spacing': 180,
                'text-field': '›',
                'text-size': 11,
                'text-font': ['Noto Sans Bold'],
                'text-keep-upright': false,
                'text-rotation-alignment': 'map',
                'text-pitch-alignment': 'map',
              }}
              paint={{ 'text-color': '#a5f3fc', 'text-opacity': 0.6 }}
            />

            {/* ── Imports to selected country ── */}
            <Layer
              id="trade-import-line"
              type="line"
              filter={selectedCountry
                ? ['all', ['==', ['get', 'to'], selectedCountry.code], ['==', ['get', 'type'], 'import']]
                : ['==', '1', '0']}
              paint={{ 'line-color': '#fb923c', 'line-width': 1.2, 'line-opacity': 0.25 }}
            />
            <Layer
              id="trade-import-flow"
              type="line"
              filter={selectedCountry
                ? ['all', ['==', ['get', 'to'], selectedCountry.code], ['==', ['get', 'type'], 'import']]
                : ['==', '1', '0']}
              paint={{ 'line-color': '#fdba74', 'line-width': 1.6, 'line-opacity': 0.85 }}
            />
            <Layer
              id="trade-import-arrows"
              type="symbol"
              filter={selectedCountry
                ? ['all', ['==', ['get', 'to'], selectedCountry.code], ['==', ['get', 'type'], 'import']]
                : ['==', '1', '0']}
              layout={{
                'symbol-placement': 'line',
                'symbol-spacing': 180,
                'text-field': '›',
                'text-size': 11,
                'text-font': ['Noto Sans Bold'],
                'text-keep-upright': false,
                'text-rotation-alignment': 'map',
                'text-pitch-alignment': 'map',
              }}
              paint={{ 'text-color': '#fed7aa', 'text-opacity': 0.6 }}
            />
          </Source>
        )}
      </ReactMapGL>
      {hoveredCountry && (combineMode || LAYERS[activeLayer]?.indicator || LAYERS[activeLayer]?.staticKey) && (
        <MapHoverTooltip hoveredCountry={hoveredCountry} />
      )}
    </div>
  )
}

export default Map
