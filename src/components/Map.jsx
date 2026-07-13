import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactMapGL, { Source, Layer, AttributionControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_STYLE } from '../utils/mapStyles'
import useStore from '../store/useStore'
import { buildLabelPoints } from '../utils/geoUtils'
import { LAYERS } from '../layers'
import useWorldGeoJSON from '../hooks/useWorldGeoJSON'
import useAllianceFill from '../hooks/useAllianceFill'
import MapHoverTooltip from './MapHoverTooltip'
import CountryLabelsLayer from './map/CountryLabelsLayer'
import TradeRoutesLayer from './map/TradeRoutesLayer'

const GEO_NAME = 'name'
const GEO_ISO2 = 'ISO3166-1-Alpha-2'

function Map() {
  const mapRef = useRef(null)
  const hoveredFeatureId = useRef(null)
  const selectedFeatureId = useRef(null)

  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.8,
  })

  // Country + screen position currently under the cursor, for the hover
  // tooltip. Kept as local state (not the store) — it's ephemeral and
  // updates on every mousemove, with no consumers outside this component.
  const [hoveredCountry, setHoveredCountry] = useState(null)

  const worldData          = useStore((s) => s.worldData)
  const fillExpression     = useStore((s) => s.fillExpression)
  const selectedCountry    = useStore((s) => s.selectedCountry)
  const setSelectedCountry = useStore((s) => s.setSelectedCountry)
  const activeLayer        = useStore((s) => s.activeLayer)
  const combineMode        = useStore((s) => s.combineMode)
  const setMapZoom         = useStore((s) => s.setMapZoom)

  useWorldGeoJSON()
  const allianceFill = useAllianceFill()

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

  // Keep the 'selected' feature-state in sync with the store selection
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

  // In trade mode all countries get the same dim base color — routes carry
  // the information. Alliance fill (when active) wins over the layer fill.
  const resolvedFill = fillExpression || '#3b5998'
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
        attributionControl={false}
      >
        {/* Moved to top-right so the compact "ⓘ" doesn't overlap the
            bottom-right layer dropdown + legend stack. */}
        <AttributionControl position="top-right" compact />
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
                  ['==', ['get', GEO_ISO2], '-99'], 0,
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
        <CountryLabelsLayer labelPoints={labelPoints} />
        {activeLayer === 'trade' && <TradeRoutesLayer />}
      </ReactMapGL>
      {hoveredCountry && (combineMode || LAYERS[activeLayer]?.indicator || LAYERS[activeLayer]?.staticKey) && (
        <MapHoverTooltip hoveredCountry={hoveredCountry} />
      )}
    </div>
  )
}

export default Map
