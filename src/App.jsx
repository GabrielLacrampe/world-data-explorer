import { useEffect, useState } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import LayerSelector from './components/LayerSelector'
import { buildMatchExpression, valueToColor } from './utils/colorScale'


const LAYERS = {
  none: { 
    label: 'None',
    property: null,
    unit: '',
  },
  population: {
    label: 'Population',
    property: 'population',
    unit: 'people',
  },
  area: {
    label: 'Area',
    property: 'area',
    unit: 'km²',
  },
}

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [countryData, setCountryData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeLayer, setActiveLayer] = useState('none')
  const [allCountriesData, setAllCountriesData] = useState(null)
  const [fillExpression, setFillExpression] = useState(null)

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=cca2,population,area')
      .then(res => res.json())
      .then(data => {
        const indexd = {}
        data.forEach(c => {
          indexd[c.cca2] = c
        })
        setAllCountriesData(indexd)
      })
  }, [])

  useEffect(() => {
    if (!selectedCountry)  return

    setLoading(true)
    setCountryData(null)

    // Validate code: if invalid (-99), search by name instead
    const urlPath = selectedCountry.code && selectedCountry.code !== '-99'
      ? `https://restcountries.com/v3.1/alpha/${selectedCountry.code}`
      : `https://restcountries.com/v3.1/name/${selectedCountry.name}`

    fetch(urlPath)
      .then(res => res.json())
      .then(data => {
        setCountryData(data[0])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching country data:', error)
        setCountryData(null)
        setLoading(false)
      })
  }, [selectedCountry])

  // Rebuild color expression when layer or country data changes
  useEffect(() => {
    if (!allCountriesData || activeLayer === 'none') {
      setFillExpression('#3b5998')
      return
    }

    const property = LAYERS[activeLayer].property
    const values = Object.values(allCountriesData)
      .map(c => c[property])
      .filter(v => v && v > 0)

    const min = Math.min(...values)
    const max = Math.max(...values)

    const countryColors = {}
    Object.entries(allCountriesData).forEach(([code, country]) => {
      const value = country[property]
      countryColors[code] = valueToColor(value, min, max)
    })

    setFillExpression(buildMatchExpression(countryColors))
  }, [activeLayer, allCountriesData])


  return (
    <div className="flex h-screen w-screen">
      <Sidebar 
        country={selectedCountry}
        countryData={countryData}
        loading={loading}
      />
      <div className="flex-1 relative">
        <LayerSelector 
          layers={LAYERS} 
          activeLayer={activeLayer} 
          onLayerChange={setActiveLayer} 
        />
        <Map 
        onCountryClick={setSelectedCountry} 
        activeLayer={activeLayer}
        layerConfig={LAYERS[activeLayer]}
        allCountriesData={allCountriesData}
        fillExpression={fillExpression}
        />
      </div>
    </div>
  )
}

export default App