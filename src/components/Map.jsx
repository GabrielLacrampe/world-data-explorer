import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function Map({ onCountryClick }) {
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
    </MapContainer>
  )
}

export default Map