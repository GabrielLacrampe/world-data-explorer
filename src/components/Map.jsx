import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { valueToColor, calculateQuantiles } from '../utils/colorScale'

const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

function Map({ onCountryClick, activeLayer, allCountriesData, layerConfig }) {
  const [worldData, setWorldData] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const [minMax, setMinMax] = useState({ min: 0, max: 1 })
  const [quantiles, setQuantiles] = useState(null)

  useEffect(() => {
      fetch(GEOJSON_URL)
          .then(res => res.json())
          .then(data => {
              setWorldData(data)
              setGeoLoading(false)
          })
  }, [])

  const onEachCountry = (feature, layer) => {
      layer.on({
          mouseover: (e) => {
              e.target.setStyle({
                  fillOpacity: 0.85,
              })
          },
          mouseout: (e) => {
              e.target.setStyle({
                  fillOpacity: 0.6
              })
          },
          click: () => {
              const countryCode = feature.properties['ISO3166-1-Alpha-2']
              const countryName = feature.properties.name
              onCountryClick({ code: countryCode, name: countryName })
          },
      })
  }

  const getCountryStyle = (feature) => {
    const code = feature.properties['ISO3166-1-Alpha-2']
    const property = layerConfig?.property

    if (!property || !allCountriesData || !allCountriesData[code]) {
      return { fillColor: '#3b5998', fillOpacity: 0.6, color: '#ffffff', weight: 0.5 }
    }

    const value = allCountriesData[code][property]
    const color = valueToColor(value, minMax.min, minMax.max, quantiles)

    return {
      fillColor: color,
      fillOpacity: 0.75,
      color: '#ffffff',
      weight: 0.5,
    }
  }

  // Updates country colors when layer or data changes
  useEffect(() => {
    if (!allCountriesData || !layerConfig.property) return

    const values = Object.values(allCountriesData)
      .map(c => c[layerConfig.property])
      .filter(v => v && v > 0)

    const newQuantiles = calculateQuantiles(values)
    setQuantiles(newQuantiles)
    setMinMax({
      min: Math.min(...values),
      max: Math.max(...values),
    })
  }, [activeLayer, allCountriesData, layerConfig])

  return (

    <div className="{`${activeLayer}-${minMax.min}-${minMax.max}`}
                data={worldData}
                style={getColute inset-0 flex z-10 items-center justify-center bg-gray-950"> 
          <div className="flex flex-col items-center gap-3"> 
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin">
              <p className="text-gray-400 text-sm">Loading world data...</p>
            </div>
          </div>
        </div>
      )}

      <MapContainer
            center={[20, 0]}
            zoom={2}
            className="h-full w-full"
            style={{ background: '#1a1a2e' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />

            {worldData && (
              <GeoJSON
                key="default"
                data={worldData}
                style={getcountryStyle}
                onEachFeature={onEachCountry}
              />
            )}
        </MapContainer>
    </div>
  )
}

export default Map