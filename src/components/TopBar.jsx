import useStore from '../store/useStore'
import { formatMilSpending } from '../utils/staticData'

function fmtGdpCap(v) {
  if (v == null) return null
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${Math.round(v)}`
}

function fmtPop(v) {
  if (v == null) return null
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return `${v}`
}

function Stat({ label, value, valueClass = 'text-[#e2e8f0]' }) {
  return (
    <div className="flex flex-col justify-center leading-none">
      <span className="text-[9px] uppercase tracking-[0.12em] text-[#4b5563] font-display">
        {label}
      </span>
      <span className={`text-[11px] font-medium mt-0.5 ${valueClass}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-[#1e2736] shrink-0" />
}

function TopBar() {
  const {
    countryData,
    worldBankCountryData,
    staticData,
    selectedCountry,
    sidebarOpen,
    setSidebarOpen,
    mapZoom,
  } = useStore()

  const gdpCap = worldBankCountryData?.['NY.GDP.PCAP.CD']
  const gdpGrowth = worldBankCountryData?.['NY.GDP.MKTP.KD.ZG']
  const milSpending = staticData?.sipri?.[selectedCountry?.code]
  const democracy = staticData?.vdem?.[selectedCountry?.code]
  const pop = countryData?.population

  const growthDisplay = gdpGrowth != null
    ? `${gdpGrowth >= 0 ? '+' : ''}${gdpGrowth.toFixed(1)}%`
    : null
  const growthClass = gdpGrowth == null
    ? 'text-[#e2e8f0]'
    : gdpGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-12
                    bg-[#0d1117]/90 backdrop-blur-md
                    border-b border-[#1e2736]
                    flex items-center px-4 gap-4">

      {countryData ? (
        <>
          {/* Flag + name — clicking opens/closes the sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 shrink-0 group"
          >
            <img
              src={countryData.flags.svg}
              alt=""
              className="h-4 w-auto rounded-sm shadow-sm shadow-black/40 group-hover:opacity-90 transition-opacity"
            />
            <span className="font-display text-xs tracking-wide text-[#e2e8f0] whitespace-nowrap group-hover:text-white transition-colors">
              {countryData.name.common}
            </span>
          </button>

          <Divider />

          <Stat label="GDP / Cap" value={fmtGdpCap(gdpCap)} />
          <Stat label="GDP Growth" value={growthDisplay} valueClass={growthClass} />
          <Stat label="Population" value={fmtPop(pop)} />
          <Stat label="Mil. Spending" value={formatMilSpending(milSpending)} />
          <Stat
            label="Democracy"
            value={democracy != null ? democracy.toFixed(3) : null}
            valueClass={
              democracy == null ? 'text-[#e2e8f0]'
              : democracy > 0.6 ? 'text-emerald-400'
              : democracy > 0.3 ? 'text-amber-400'
              : 'text-red-400'
            }
          />
        </>
      ) : (
        <span className="text-[#4b5563] text-xs tracking-wider font-display uppercase">
          World Data Explorer
        </span>
      )}
      {/* Zoom indicator — always visible, pinned to the right */}
      <div className="ml-auto flex flex-col justify-center leading-none text-right shrink-0">
        <span className="text-[9px] uppercase tracking-[0.12em] text-[#4b5563] font-display">Zoom</span>
        <span className="text-[11px] font-medium text-[#e2e8f0] mt-0.5 tabular-nums">
          {mapZoom != null ? mapZoom.toFixed(2) : '—'}
        </span>
      </div>
    </div>
  )
}

export default TopBar
