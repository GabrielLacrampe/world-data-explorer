import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMapGL, { Source, Layer } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_STYLE } from '../utils/mapStyles'

const GEOJSON_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

// Property names from datasets/geo-countries (not Natural Earth ADMIN/ISO_A2)
const GEO_NAME = 'name'
const GEO_ISO2 = 'ISO3166-1-Alpha-2'



function Map({ onCountryClick, fillExpression, selectedCountry }) {
  const mapRef = useRef(null)
  const resolvedFill = fillExpression || '#3b5998'
  const hoveredFeatureId = useRef(null)
  const [worldData, setWorldData] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.8,
  })
  const selectedFeatureId = useRef(null)
  
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        setWorldData(data)
        setGeoLoading(false)
      })
  }, [])

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
    if (!mapRef.current) return
    const map = mapRef.current.getMap()

    if (e.features && e.features.length > 0) {
      // Clear previous hover
      if (hoveredFeatureId.current !== null) {
        map.setFeatureState(
          { source: 'countries', id: hoveredFeatureId.current },
          { hover: false }
        )
      }
      // Set new hover
      hoveredFeatureId.current = e.features[0].id
      map.setFeatureState(
        { source: 'countries', id: hoveredFeatureId.current },
        { hover: true }
      )
    }
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

  const handleClick = (e) => {
    const features = e.features
    if (!features || features.length === 0) return
    const feature = features[0]

    if (!mapRef.current) return
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

    onCountryClick({
      code: feature.properties[GEO_ISO2],
      name: feature.properties[GEO_NAME],
    })
  }

  

  return (
    <div className="relative h-full w-full">
      {geoLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading world data...</p>
          </div>
        </div>
      )}

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
                  '#60a5fa',       // selected: brighter blue
                  resolvedFill,    // default: data-driven color
                ],
                'fill-opacity': [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  0.95,   // selected
                  ['boolean', ['feature-state', 'hover'], false],
                  0.85,   // hovered
                  0.6,    // default
                ],
              }}
            />
            <Layer
              id="countries-border"
              type="line"
              paint={{
                'line-color': '#d03030',
                'line-width': 0.5,
                'line-opacity': 0.4,
              }}
            />
          </Source>
        )}
      </ReactMapGL>
    </div>
  )
}

export default Map