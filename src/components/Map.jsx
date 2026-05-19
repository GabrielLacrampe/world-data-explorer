import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

function Map({ onCountryClick }) {
    const [worldData, setWorldData] = useState(null)

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then(res => res.json())
            .then(data => setWorldData(data))
    }, [])

  return (
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
          data={worldData}
          style={{
            fillColor: '#3b5998',
            fillOpacity: 0.4,
            color: '#ffffff',
            weight: 0.5
          }}
        />
      )}
    </MapContainer>
  )
}

export default Map