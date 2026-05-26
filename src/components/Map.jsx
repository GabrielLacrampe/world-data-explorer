import { useState, useEffect, useRef } from 'react'
import ReactMapGL, { Source, Layer } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

const GEOJSON_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

// A neutral dark map style with no external tile server required
const MAP_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap © CARTO',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0d1117' },
    },
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      paint: { 'raster-opacity': 0.4 },
    },
  ],
}

function Map({ onCountryClick }) {
  const [worldData, setWorldData] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.8,
  })

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        setWorldData(data)
        setGeoLoading(false)
      })
  }, [])

  const handleClick = (e) => {
    const features = e.features
    if (!features || features.length === 0) return
    const feature = features[0]
    onCountryClick({
      code: feature.properties.ISO_A2,
      name: feature.properties.ADMIN,
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
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={worldData ? ['countries-fill'] : []}
        onClick={handleClick}
      >
        {worldData && (
          <Source id="countries" type="geojson" data={worldData}>
            <Layer
              id="countries-fill"
              type="fill"
              paint={{
                'fill-color': '#3b5998',
                'fill-opacity': 0.6,
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
          </Source>
        )}
      </ReactMapGL>
    </div>
  )
}

export default Map