import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMapGL, { Source, Layer } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_STYLE } from '../utils/mapStyles'
import useStore from '../store/useStore'
import OverlayLayer from './OverlayLayer'
import ConflictPopup from './ConflictPopup'

const GEOJSON_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

// Property names from datasets/geo-countries (not Natural Earth ADMIN/ISO_A2)
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

  const {
    worldData,
    setWorldData,
    fillExpression,
    selectedCountry,
    setSelectedCountry,
    setLoading, 
    setActivePopup, 
    closePopup 
  } = useStore()

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        setWorldData(data)
        setLoading('map', false)
      })
  }, [setWorldData, setLoading])

  useEffect(() => {
    if (!mapRef.current || selectedCountry) return
    const map = mapRef.current.getMap()

    if (selectedFeatureId.current !== null) {
      map.setFeatureState(
        { source: 'countries', id: selectedFeatureId.current },
        { selected: false }
      )
      selectedFeatureId.current = null
    }
  }, [selectedCountry])

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
    if (!e.features?.length || !mapRef.current) return
    const feature = e.features[0]
    const map = mapRef.current.getMap()

    if (selectedFeatureId.current !== null) {
      map.setFeatureState(
        { source: 'countries', id: selectedFeatureId.current },
        { selected: false }
      )
    }

    selectedFeatureId.current = feature.id
    map.setFeatureState(
      { source: 'countries', id: feature.id },
      { selected: true }
    )

    setSelectedCountry({
      code: feature.properties[GEO_ISO2],
      name: feature.properties[GEO_NAME],
    })
  }, [setSelectedCountry])

  const handlePointClick = useCallback((e) => {
    if (!e.features?.length || !mapRef.current) return

    const feature = e.features[0]

    // Point click (conflict event)
    if (feature.layer.id === 'conflicts-points') {
      closePopup() // close any existing popup first
      setActivePopup({
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        properties: feature.properties,
      })
      return // don't propagate to country selection
    }

    // Country click (existing behavior)
    const map = mapRef.current.getMap()

    if (selectedFeatureId.current !== null) {
      map.setFeatureState(
        { source: 'countries', id: selectedFeatureId.current },
        { selected: false }
      )
    }

    selectedFeatureId.current = feature.id
    map.setFeatureState(
      { source: 'countries', id: feature.id },
      { selected: true }
    )

    setSelectedCountry({
      code: feature.properties[GEO_ISO2],
      name: feature.properties[GEO_NAME],
    })
  }, [setSelectedCountry, setActivePopup, closePopup])

  const resolvedFill = fillExpression || '#3b5998'

  return (
    <div className="absolute inset-0">
      <ReactMapGL
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={worldData ? ['countries-fill'] : [], 'conflicts-points'}
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
                  resolvedFill,
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
                'line-color': '#ffffff',
                'line-width': 0.5,
                'line-opacity': 0.4,
              }}
            />
            <OverlayLayer onPointClick={handlePointClick} />
          </Source>
        )}<ConflictPopup />
      </ReactMapGL>
    </div>
  )
}

export default Map
