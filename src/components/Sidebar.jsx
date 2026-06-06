import useStore from '../store/useStore'
import { formatIndicatorValue } from '../utils/worldBank'
import { FREEDOM_STATUS, formatMilSpending } from '../utils/staticData'

function Sidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    selectedCountry,
    countryData,
    activeTab,
    setActiveTab,
    loading,
    worldBankCountryData,
    staticData,
  } = useStore()

  return (
    <div
      className={`absolute top-12 left-0 bottom-0 z-10 w-80
                  bg-gray-950 bg-opacity-90 backdrop-blur-sm
                  border-r border-gray-800
                  transform transition-transform duration-300 ease-in-out
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Close button */}
      <button
        onClick={() => setSidebarOpen(false)}
        className="absolute -right-8 top-4 w-8 h-8
                   bg-gray-950 bg-opacity-80 border border-gray-800
                   border-l-0 rounded-r
                   text-gray-400 hover:text-white
                   flex items-center justify-center text-sm"
      >
        ✕
      </button>

      {/* Content */}
      <div className="h-full overflow-y-auto flex flex-col">
        {loading.country && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent
                            rounded-full animate-spin" />
          </div>
        )}

        {countryData && !loading.country && (
          <>
            {/* Country header */}
            <div className="p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <img
                  src={countryData.flags.svg}
                  alt={`Flag of ${countryData.name.common}`}
                  className="w-10 h-7 object-cover rounded"
                />
                <div>
                  <h2 className="text-white font-semibold text-lg leading-tight">
                    {countryData.name.common}
                  </h2>
                  <p className="text-gray-500 text-xs">{countryData.name.official}</p>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-gray-800">
              {['economy', 'geopolitics', 'conflicts'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-wider
                              transition-colors
                              ${activeTab === tab
                                ? 'text-white border-b-2 border-blue-500'
                                : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 p-5">
              {activeTab === 'economy' && (
                <EconomyTab
                  data={countryData}
                  worldBankData={worldBankCountryData}
                />
              )}              
              {activeTab === 'geopolitics' && (
                <GeopoliticsTab
                  countryCode={selectedCountry?.code}
                  staticData={staticData}
                />
              )}
              {activeTab === 'conflicts' && (
                <p className="text-gray-500 text-sm">Coming in Phase 4</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function GeopoliticsTab({ countryCode, staticData }) {
  if (!staticData) {
    return <p className="text-gray-500 text-sm">Loading...</p>
  }

  if (!countryCode || countryCode === '-99') {
    return <p className="text-gray-500 text-sm">No data available for this territory.</p>
  }

  const milSpending = staticData.sipri?.[countryCode]
  const democracyScore = staticData.vdem?.[countryCode]
  const freedomStatus = staticData.freedomhouse?.[countryCode]
  const alliances = staticData.alliances?.[countryCode] ?? []
  const freedomConfig = FREEDOM_STATUS[freedomStatus]

  return (
    <div className="flex flex-col gap-6">

      {/* ── Political system ──────────────────────────────────── */}
      <Section title="Political System">
        {freedomStatus ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: freedomConfig?.color ?? '#6b7280' }} />
            <div>
              <p className="text-white text-sm">{freedomStatus}</p>
              <p className="text-gray-500 text-xs">Freedom House rating</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-xs">Freedom House data pending</p>
        )}

        {democracyScore !== undefined ? (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">
              Liberal Democracy Index
            </p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${democracyScore * 100}%`,
                    backgroundColor: democracyScore > 0.6
                      ? '#22c55e'
                      : democracyScore > 0.3
                      ? '#eab308'
                      : '#ef4444',
                  }}
                />
              </div>
              <span className="text-white text-sm w-12 text-right">
                {democracyScore.toFixed(3)}
              </span>
            </div>
            <p className="text-gray-600 text-xs mt-1">V-Dem score (0–1)</p>
          </div>
        ) : (
          <DataRow label="Liberal Democracy Index" value="No data" />
        )}
      </Section>

      {/* ── Military ─────────────────────────────────────────── */}
      <Section title="Military">
        <DataRow label="Military Spending" value={formatMilSpending(milSpending)} />
        <p className="text-gray-600 text-xs -mt-2">SIPRI estimate (current USD)</p>
      </Section>

      {/* ── Alliances ────────────────────────────────────────── */}
      <Section title="Alliances & Treaties">
        {alliances.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {alliances.map((alliance) => (
              <div key={alliance} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-white">{alliance}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No formal alliances recorded</p>
        )}
        <p className="text-gray-600 text-xs">COW dataset · alliances up to ~2012</p>
      </Section>

      {/* ── Sources ──────────────────────────────────────────── */}
      <div className="pt-2 border-t border-gray-800">
        <p className="text-gray-700 text-xs">
          Sources: SIPRI Military Expenditure Database · V-Dem Institute ·
          Correlates of War Project
        </p>
      </div>

    </div>
  )
}

function EconomyTab({ data, worldBankData }) {
  return (
    <div className="flex flex-col gap-6">

      {/* ── Geography ─────────────────────────────────────────────── */}
      <Section title="Geography">
        <DataRow label="Capital" value={data.capital?.[0] ?? 'N/A'} />
        <DataRow label="Region" value={`${data.subregion ?? ''}, ${data.region ?? ''}`} />
        <DataRow
          label="Area"
          value={data.area ? `${data.area.toLocaleString('en-US')} km²` : 'N/A'}
        />
      </Section>

      {/* ── People ────────────────────────────────────────────────── */}
      <Section title="People">
        <DataRow
          label="Population"
          value={data.population?.toLocaleString('en-US') ?? 'N/A'}
        />
        <DataRow
          label="Languages"
          value={Object.values(data.languages ?? {}).join(', ') || 'N/A'}
        />
        {worldBankData && (
          <DataRow
            label="Life Expectancy"
            value={formatIndicatorValue(
              worldBankData['SP.DYN.LE00.IN'],
              'decimal',
              'years'
            )}
          />
        )}
      </Section>

      {/* ── Economy ───────────────────────────────────────────────── */}
      <Section title="Economy">
        <DataRow
          label="Currency"
          value={
            Object.values(data.currencies ?? {})
              .map((c) => `${c.name} (${c.symbol})`)
              .join(', ') || 'N/A'
          }
        />
        {worldBankData ? (
          <>
            <DataRow
              label="GDP per Capita"
              value={formatIndicatorValue(
                worldBankData['NY.GDP.PCAP.CD'],
                'currency',
                'USD'
              )}
            />
            <DataRow
              label="GDP Growth"
              value={formatIndicatorValue(
                worldBankData['NY.GDP.MKTP.KD.ZG'],
                'percent',
                '%'
              )}
            />
            <DataRow
              label="Unemployment"
              value={formatIndicatorValue(
                worldBankData['SL.UEM.TOTL.ZS'],
                'percent',
                '%'
              )}
            />
          </>
        ) : (
          <p className="text-gray-600 text-xs">Loading economic data...</p>
        )}
      </Section>

      {/* ── Environment ───────────────────────────────────────────── */}
      {worldBankData && (
        <Section title="Environment">
          <DataRow
            label="CO₂ per Capita"
            value={formatIndicatorValue(
              worldBankData['EN.ATM.CO2E.PC'],
              'decimal',
              'tonnes'
            )}
          />
        </Section>
      )}

      {/* ── Security ──────────────────────────────────────────────── */}
      {worldBankData && (
        <Section title="Security">
          <DataRow
            label="Military Spending"
            value={formatIndicatorValue(
              worldBankData['MS.MIL.XPND.GD.ZS'],
              'percent',
              '% of GDP'
            )}
          />
        </Section>
      )}

    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-gray-600 text-xs uppercase tracking-widest border-b
                    border-gray-800 pb-1">
        {title}
      </p>
      {children}
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-white text-sm mt-0.5">{value}</p>
    </div>
  )
}
export default Sidebar