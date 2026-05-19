import { useEffect, useState } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [countryData, setCountryData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedCountry)  return

    setLoading(true)
    setCountryData(null)

    fetch('https://restcountries.com/v3.1/alpha/${selectedCountry.code}')
      .then(res => res.json())
      .then(data => {
        setCountryData(data[0])
        setLoading(false)
      })
  }, [selectedCountry])

  return (
    <div className="flex h-screen w-screen">
      <Sidebar 
        country={selectedCountry}
        countryData={countryData}
        loading={loading}
      />
      <div className="flex-1">
        <Map onCountryClick={setSelectedCountry} />
      </div>
    </div>
  )
}

export default App