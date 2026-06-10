import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactMapGL, { Source, Layer } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_STYLE } from '../utils/mapStyles'
import useStore from '../store/useStore'
import { patchGeoJSON, buildLabelPoints } from '../utils/geoUtils'
import {
  ALLIANCE_COLORS,
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
    activeLayer,
    setMapZoom,
  } = useStore()

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        setWorldData(patchGeoJSON(data, NAME_TO_ISO2_FIXES))
        setLoading('map', false)
      })
  }, [setWorldData, setLoading])

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

  const resolvedFill = fillExpression || '#3b5998'

  const allianceFill = useMemo(() => {
    if (activeLayer !== 'alliances') return null
    if (!selectedCountry || !staticData?.alliances) return null
    const allies = staticData.alliances[selectedCountry.code]
    if (!allies?.length) return null
    const args = []
    for (const { partner, type } of allies) {
      args.push(partner, ALLIANCE_COLORS[type] ?? '#6b7280')
    }
    return ['match', ['get', GEO_ISO2], ...args, '#3b5998']
  }, [activeLayer, selectedCountry, staticData, resolvedFill])

  const activeFill = allianceFill ?? resolvedFill

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
                  ['boolean', ['feature-state', 'selected'], false], 0.95,
                  ['boolean', ['feature-state', 'hover'], false], 0.85,
                  0.35,
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
      </ReactMapGL>
    </div>
  )
}

export default Map
