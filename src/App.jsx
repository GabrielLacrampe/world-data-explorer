import { useEffect, useMemo, useState } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Legend from './components/Legend'
import LoadingOverlay from './components/LoadingOverlay'
import useStore from './store/useStore'
import { buildMatchExpression, valueToColor } from './utils/colorScale'

const LAYERS = {
  none: { label: 'None', property: null, unit: '' },
  population: { label: 'Population', property: 'population', unit: 'people' },
  area: { label: 'Area', property: 'area', unit: 'km²' },
}

export { LAYERS }

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [countryDataKey, setCountryDataKey] = useState(null)
  const [countryErrorKey, setCountryErrorKey] = useState(null)
  const [activeLayer, setActiveLayer] = useState('none')
  const selectedCountryKey = selectedCountry
    ? `${selectedCountry.code ?? ''}:${selectedCountry.name ?? ''}`
    : null
  const loading = Boolean(
    selectedCountryKey &&
      countryDataKey !== selectedCountryKey &&
      countryErrorKey !== selectedCountryKey
  )
  const sidebarCountryData = countryDataKey === selectedCountryKey ? countryData : null
  const {
    countryData,
    setCountryData,
    setLoading,
    allCountriesData,
    setAllCountriesData,
    setFillExpression,
  } = useStore()

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=cca2,population,area')
      .then((res) => res.json())
      .then((data) => {
        const indexd = {}
        data.forEach((c) => {
          indexd[c.cca2] = c
        })
        setAllCountriesData(indexd)
      })
  }, [setAllCountriesData])

  const fillExpression = useMemo(() => {
    if (!allCountriesData || activeLayer === 'none') {
      return '#3b5998'
    }
    if (!allCountriesData || !LAYERS[activeLayer].property) {
      return '#3b5998'
    }

    const property = LAYERS[activeLayer].property
    const values = Object.values(allCountriesData)
      .map((c) => c[property])
      .filter((v) => v && v > 0)

    const countryColors = {}
    Object.entries(allCountriesData).forEach(([code, country]) => {
      const value = country[property]
      countryColors[code] = valueToColor(value, values)
    })

    return buildMatchExpression(countryColors)
  }, [activeLayer, allCountriesData])

  useEffect(() => {
    if (!selectedCountry) return

    setLoading('country', true)
    setCountryData(null)

    const urlPath =
      selectedCountry.code && selectedCountry.code !== '-99'
        ? `https://restcountries.com/v3.1/alpha/${selectedCountry.code}`
        : `https://restcountries.com/v3.1/name/${selectedCountry.name}`

    fetch(urlPath)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setCountryData(data[0] ?? null)
        setLoading('country', false)
      })
      .catch((error) => {
        console.error('Error fetching country data:', error)
        setCountryData(null)
        setLoading('country', false)
      })
  }, [selectedCountry, setCountryData, setLoading])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      <Map 
        onCountryClick={setSelectedCountry}
        selectedCountry={selectedCountry}
        activeLayer={activeLayer}
        layerConfig={LAYERS[activeLayer]}
        allCountriesData={allCountriesData}
        fillExpression={fillExpression}
      />
      <TopBar layers={LAYERS} />
      <Sidebar />
      <Legend layers={LAYERS}/>
      <LoadingOverlay />
    </div>
  )
}

export default App

