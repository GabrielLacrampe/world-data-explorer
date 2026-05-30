import { useEffect } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar/Sidebar'
import TopBar from './components/TopBar/TopBar'
import Legend from './components/Map/Legend'
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
  const {
    selectedCountry,
    setCountryData,
    setLoading,
    activeLayer,
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

  useEffect(() => {
    if (!allCountriesData || !LAYERS[activeLayer].property) {
      setFillExpression('#3b5998')
      return
    }

    const property = LAYERS[activeLayer].property
    const values = Object.values(allCountriesData)
      .map((c) => c[property])
      .filter((v) => v && v > 0)

    const min = Math.min(...values)
    const max = Math.max(...values)

    const countryColors = {}
    Object.entries(allCountriesData).forEach(([code, country]) => {
      countryColors[code] = valueToColor(country[property], min, max)
    })

    setFillExpression(buildMatchExpression(countryColors))
  }, [activeLayer, allCountriesData, setFillExpression])

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
      <Map />
      <TopBar />
      <Sidebar />
      <Legend />
      <LoadingOverlay />
    </div>
  )
}

function TopBar() {
  return null
}

function Sidebar() {
  return null
}

function Legend() {
  return null
}

function LoadingOverlay() {
  return null
}

export default App
