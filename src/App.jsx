import { useState } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  return (
    <div className="flex h-screen w-screen">
      <Sidebar country={selectedCountry} />
      <div className="flex-1">
        <Map onCountryClick={setSelectedCountry} />
      </div>
    </div>
  )
}

export default App