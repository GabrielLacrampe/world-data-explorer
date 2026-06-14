import useStore from '../store/useStore'
import { formatMilSpending } from '../utils/staticData'
import { fmtGdpCap, fmtPop } from '../utils/format'

const DEMOCRACY_HIGH = 0.6
const DEMOCRACY_LOW  = 0.3

function Stat({ label, value, valueClass = 'text-[#e2e8f0]' }) {
  return (
    <div className="flex flex-col justify-center leading-none">
      <span className="text-[8px] uppercase tracking-[0.12em] text-[#4b5563] font-display">
        {label}
      </span>
      <span className={`text-[10px] font-medium mt-0.5 ${valueClass}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-[#1e2736] shrink-0" />
}

export default function TopBar() {
  const {
    countryData,
    worldBankCountryData,
    staticData,
    selectedCountry,
    sidebarOpen,
    setSidebarOpen,
    mapZoom,
  } = useStore()

  const gdpCap     = worldBankCountryData?.['NY.GDP.PCAP.CD']
  const gdpGrowth  = worldBankCountryData?.['NY.GDP.MKTP.KD.ZG']
  const milSpending = staticData?.sipri?.[selectedCountry?.code]
  const democracy  = staticData?.vdem?.[selectedCountry?.code]
  const pop        = worldBankCountryData?.['SP.POP.TOTL']

  const growthDisplay = gdpGrowth != null
    ? `${gdpGrowth >= 0 ? '+' : ''}${gdpGrowth.toFixed(1)}%`
    : null
  const growthClass = gdpGrowth == null
    ? 'text-[#e2e8f0]'
    : gdpGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'

  const democracyClass = democracy == null      ? 'text-[#e2e8f0]'
    : democracy > DEMOCRACY_HIGH                ? 'text-emerald-400'
    : democracy > DEMOCRACY_LOW                 ? 'text-amber-400'
    : 'text-red-400'

  return (
    <div className="absolute top-0 left-0 z-20 h-10
                    bg-[#0d1117]/90 backdrop-blur-md
                    border-b border-r border-[#1e2736] rounded-br
                    flex items-center px-3 gap-3">

      {countryData ? (
        <>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 shrink-0 group"
          >
            <img
              src={countryData.flags.svg}
              alt=""
              className="h-6 w-auto rounded-sm shadow-sm shadow-black/40 group-hover:opacity-90 transition-opacity"
            />
            <span className="font-display text-[10px] tracking-wide text-[#94a3b8] whitespace-nowrap group-hover:text-white transition-colors max-w-[90px] truncate">
              {countryData.name.common}
            </span>
          </button>

          <Divider />

          <Stat label="GDP / Cap"    value={fmtGdpCap(gdpCap)} />
          <Stat label="GDP Growth"   value={growthDisplay} valueClass={growthClass} />
          <Stat label="Population"   value={fmtPop(pop)} />
          <Stat label="Mil. Spending" value={formatMilSpending(milSpending)} />
          <Stat label="Democracy"    value={democracy != null ? democracy.toFixed(3) : null} valueClass={democracyClass} />
        </>
      ) : (
        <span className="text-[#4b5563] text-[10px] tracking-wider font-display uppercase">
          World Data Explorer
        </span>
      )}
      <Divider />
      <Stat label="Zoom" value={mapZoom != null ? mapZoom.toFixed(2) : '—'} />
    </div>
  )
}
