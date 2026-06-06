import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactMapGL, { Source, Layer } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_STYLE } from '../utils/mapStyles'
import useStore from '../store/useStore'

const GEOJSON_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

// Property names from datasets/geo-countries (not Natural Earth ADMIN/ISO_A2)
const GEO_NAME = 'name'
const GEO_ISO2 = 'ISO3166-1-Alpha-2'

const ALLIANCE_COLORS = {
  'Defense Pact': '#ef4444',
  'Non-Aggression Treaty': '#f59e0b',
  'Neutrality Pact': '#a78bfa',
  'Entente': '#22c55e',
}

function Map() {
  const mapRef = useRef(null)
  const hoveredFeatureId = useRef(null)
  const selectedFeatureId = useRef(null)

  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.8,
  })

  const {
    worldData,
    setWorldData,
    fillExpression,
    selectedCountry,
    setSelectedCountry,
    setLoading,
    staticData,
  } = useStore()

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        setWorldData(data)
        setLoading('map', false)
      })
  }, [setWorldData, setLoading])

  // iso2 → feature ID (generateId assigns IDs by array index)
  const iso2ToFeatureId = useMemo(() => {
    if (!worldData) return {}
    const lookup = {}
    worldData.features.forEach((f, i) => {
      const iso2 = f.properties[GEO_ISO2]
      if (iso2) lookup[iso2] = i
    })
    return lookup
  }, [worldData])

  // Handle feature-state highlight for any selection source (map click or flag click)
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
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!mapRef.current || hoveredFeatureId.current === null) return
    const map = mapRef.current.getMap()
    map.setFeatureState(
      { source: 'countries', id: hoveredFeatureId.current },
      { hover: false }
    )
    hoveredFeatureId.current = null
  }, [])

  const handleClick = useCallback((e) => {
    if (!e.features?.length) return
    const feature = e.features[0]
    setSelectedCountry({
      code: feature.properties[GEO_ISO2],
      name: feature.properties[GEO_NAME],
    })
  }, [setSelectedCountry])

  const resolvedFill = fillExpression || '#3b5998'

  const allianceFill = useMemo(() => {
    if (!selectedCountry || !staticData?.alliances) return null
    const allies = staticData.alliances[selectedCountry.code]
    if (!allies?.length) return null
    const args = []
    for (const { partner, type } of allies) {
      args.push(partner, ALLIANCE_COLORS[type] ?? '#6b7280')
    }
    return ['match', ['get', GEO_ISO2], ...args, resolvedFill]
  }, [selectedCountry, staticData, resolvedFill])

  const activeFill = allianceFill ?? resolvedFill

  return (
    <div className="absolute inset-0">
      <ReactMapGL
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
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
                'fill-opacity': [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  0.95,
                  ['boolean', ['feature-state', 'hover'], false],
                  0.85,
                  0.6,
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
      </ReactMapGL>
    </div>
  )
}

export default Map
