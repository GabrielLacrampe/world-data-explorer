import { useEffect } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Legend from './components/Legend'
import LoadingOverlay from './components/LoadingOverlay'
import useStore from './store/useStore'
import { buildMatchExpression, valueToColor, buildPoliticalExpression } from './utils/colorScale'
import { fetchIndicatorAllCountries, fetchIndicatorsForCountry } from './utils/worldBank'
import { loadStaticDatasets } from './utils/staticData'

const LAYERS = {
  // ── Existing layers ──────────────────────────────────────────────────
  geographic: { label: 'Geographic', property: null, unit: '', source: 'none' },
  political:  { label: 'Political',  property: null, unit: '', source: 'static' },
  population: {
    label: 'Population',
    property: 'population',
    unit: 'people',
    source: 'restcountries',
    attribution: 'REST Countries',
  },
  area: {
    label: 'Area',
    property: 'area',
    unit: 'km²',
    source: 'restcountries',
    attribution: 'REST Countries',
  },

  // ── World Bank layers ────────────────────────────────────────────────
  gdp_per_capita: {
    label: 'GDP per Capita',
    indicator: 'NY.GDP.PCAP.CD',
    unit: 'USD',
    source: 'worldbank',
    format: 'currency',
    attribution: 'World Bank',
  },
  gdp_growth: {
    label: 'GDP Growth',
    indicator: 'NY.GDP.MKTP.KD.ZG',
    unit: '%',
    source: 'worldbank',
    format: 'percent',
    attribution: 'World Bank',
  },
  unemployment: {
    label: 'Unemployment',
    indicator: 'SL.UEM.TOTL.ZS',
    unit: '% of labor force',
    source: 'worldbank',
    format: 'percent',
    attribution: 'World Bank',
  },
  life_expectancy: {
    label: 'Life Expectancy',
    indicator: 'SP.DYN.LE00.IN',
    unit: 'years',
    source: 'worldbank',
    format: 'decimal',
    attribution: 'World Bank',
  },
  co2_per_capita: {
    label: 'CO₂ per Capita',
    indicator: 'EN.ATM.CO2E.PC',
    unit: 'tonnes',
    source: 'worldbank',
    format: 'decimal',
    attribution: 'World Bank',
  },
  military_spending: {
    label: 'Military Spending',
    indicator: 'MS.MIL.XPND.GD.ZS',
    unit: '% of GDP',
    source: 'worldbank',
    format: 'percent',
    attribution: 'World Bank',
  },

  // ── Static dataset layers ────────────────────────────────────────────
  democracy_index: {
    label: 'Democracy Index',
    unit: 'V-Dem score',
    source: 'static',
    staticKey: 'vdem',
    format: 'decimal',
    scale: 'linear',
    attribution: 'V-Dem Institute',
  },

  // ── Diplomatic layers ────────────────────────────────────────────────
  alliances: {
    label: 'Alliances',
    source: 'diplomatic',
    attribution: 'COW Project',
  },
}

const SIDEBAR_INDICATORS = [
  { indicator: 'SP.POP.TOTL', label: 'Population', format: 'integer', unit: '' },
  { indicator: 'NY.GDP.PCAP.CD', label: 'GDP per Capita', format: 'currency', unit: 'USD' },
  { indicator: 'NY.GDP.MKTP.KD.ZG', label: 'GDP Growth', format: 'percent', unit: '%' },
  { indicator: 'SL.UEM.TOTL.ZS', label: 'Unemployment', format: 'percent', unit: '%' },
  { indicator: 'SP.DYN.LE00.IN', label: 'Life Expectancy', format: 'decimal', unit: 'years' },
  { indicator: 'EN.ATM.CO2E.PC', label: 'CO₂ per Capita', format: 'decimal', unit: 'tonnes' },
  { indicator: 'MS.MIL.XPND.GD.ZS', label: 'Military Spending', format: 'percent', unit: '% of GDP' },
]

export { LAYERS, SIDEBAR_INDICATORS }

function App() {
  const {
    selectedCountry,
    setSelectedCountry,
    countryData,
    setCountryData,
    setLoading,
    activeLayer,
    setActiveLayer,
    allCountriesData,
    setAllCountriesData,
    setFillExpression,
    worldBankLayerCache,
    setWorldBankLayerData,
    worldBankCountryData,
    setWorldBankCountryData,
    staticData,
    setStaticData,
    worldData,
    setCountryLoadError,
  } = useStore()

  useEffect(() => {
    loadStaticDatasets()
      .then(setStaticData)
      .catch((err) => console.error('Static data load failed:', err))
  }, [])

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-countries/countries.json')
      .then((res) => res.json())
      .then((data) => {
        const indexed = {}
        data.forEach((c) => {
          indexed[c.cca2] = {
            ...c,
            flags: { svg: `https://flagcdn.com/${c.cca2.toLowerCase()}.svg` },
          }
        })
        setAllCountriesData(indexed)
      })
      .catch((err) => console.error('Failed to load countries data:', err))
  }, [setAllCountriesData])

  useEffect(() => {
    if (!allCountriesData || !LAYERS[activeLayer].property) return

    const property = LAYERS[activeLayer].property
    const values = Object.values(allCountriesData)
      .map((c) => c[property])
      .filter((v) => v && v > 0)

    if (values.length === 0) {
      setFillExpression('#3b5998')
      return
    }

    const countryColors = {}
    Object.entries(allCountriesData).forEach(([code, country]) => {
      const value = country[property]
      countryColors[code] = valueToColor(value, values)
    })

    setFillExpression(buildMatchExpression(countryColors))
  }, [activeLayer, allCountriesData, setFillExpression])

  useEffect(() => {
    if ((activeLayer !== 'political' && activeLayer !== 'geographic' && activeLayer !== 'alliances') || !worldData) return
    const iso2Codes = worldData.features
      .map((f) => f.properties['ISO3166-1-Alpha-2'])
      .filter(Boolean)
    setFillExpression(buildPoliticalExpression(iso2Codes))
  }, [activeLayer, worldData, setFillExpression])

  useEffect(() => {
    if (!selectedCountry || !allCountriesData) return

    const code = selectedCountry.code
    if (code && code !== '-99' && allCountriesData[code]) {
      setCountryData(allCountriesData[code])
    } else {
      // Fallback: search by name
      const match = Object.values(allCountriesData).find(
        (c) => c.name?.common?.toLowerCase() === selectedCountry.name?.toLowerCase()
      )
      setCountryData(match ?? null)
      if (!match) setCountryLoadError(true)
    }
    setLoading('country', false)
  }, [selectedCountry, allCountriesData, setCountryData, setLoading, setCountryLoadError])

  useEffect(() => {
    const layer = LAYERS[activeLayer]
    if (layer.source !== 'worldbank') return

    const indicator = layer.indicator

    // Use cache if available
    if (worldBankLayerCache[indicator]) {
      buildAndSetWorldBankExpression(worldBankLayerCache[indicator])
      return
    }

    // Fetch and cache
    fetchIndicatorAllCountries(indicator)
      .then((data) => {
        setWorldBankLayerData(indicator, data)
        buildAndSetWorldBankExpression(data)
      })
      .catch((err) => {
        console.error('World Bank layer fetch failed:', err)
        setFillExpression('#3b5998')
      })
  }, [activeLayer])
  
  useEffect(() => {
    const layer = LAYERS[activeLayer]
    if (layer.source !== 'static' || !staticData) return

    const dataset = staticData[layer.staticKey]
    if (!dataset) return

    const values = Object.values(dataset).filter((v) => v !== null && v > 0)
    const countryColors = {}
    const scaleType = layer.scale ?? 'log'
    Object.entries(dataset).forEach(([code, value]) => {
      countryColors[code] = valueToColor(value, values, { scale: scaleType })
    })
    setFillExpression(buildMatchExpression(countryColors))
  }, [activeLayer, staticData, setFillExpression])

  useEffect(() => {
    if (!selectedCountry?.code || selectedCountry.code === '-99') return

    const indicators = SIDEBAR_INDICATORS.map((i) => i.indicator)

    fetchIndicatorsForCountry(selectedCountry.code, indicators)
      .then((data) => {
        setWorldBankCountryData(data)
      })
      .catch((err) => {
        console.error('World Bank country fetch failed:', err)
      })
  }, [selectedCountry])


  function buildAndSetWorldBankExpression(data) {
    const values = Object.values(data).filter((v) => v !== null && v > 0)
    if (values.length === 0) return

    const countryColors = {}
    Object.entries(data).forEach(([code, value]) => {
      countryColors[code] = valueToColor(value, values)
    })

    setFillExpression(buildMatchExpression(countryColors))
  }

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



export default App

