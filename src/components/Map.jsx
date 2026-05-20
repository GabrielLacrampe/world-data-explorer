import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

function Map({ onCountryClick }) {
  const [worldData, setWorldData] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)

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

  const getcountryStyle = (feature) => {
      return {
          fillColor: '#3b5998',
          fillOpacity: 0.6,
          color: '#ffffff',
          weight: 0.5
      }
  }

  return (

    <div className="relative h-full w-full">
      {geoLoading && (
        <div className="absolute inset-0 flex z-10 items-center justify-center bg-gray-950"> 
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