import useStore from '../store/useStore'
import { formatIndicatorValue } from '../utils/worldBank'
import { FREEDOM_STATUS, formatMilSpending } from '../utils/staticData'

const ALLIANCE_COLORS = {
  'Defense Pact': '#ef4444',
  'Non-Aggression Treaty': '#f59e0b',
  'Neutrality Pact': '#a78bfa',
  'Entente': '#22c55e',
}
const ALLIANCE_TYPE_ORDER = ['Defense Pact', 'Non-Aggression Treaty', 'Neutrality Pact', 'Entente']
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

const TABS = [
  { id: 'gobierno',    label: 'Government' },
  { id: 'culturas',    label: 'Cultures' },
  { id: 'diplomatica', label: 'Diplomatic' },
  { id: 'economia',    label: 'Economy' },
  { id: 'comercio',    label: 'Trade' },
  { id: 'historia',    label: 'History' },
  { id: 'politicas',   label: 'Policies' },
  { id: 'religion',    label: 'Religion' },
  { id: 'fuerzas',     label: 'Military' },
]

function Sidebar() {
  const {
    sidebarOpen,
    selectedCountry,
    countryData,
    activeTab,
    setActiveTab,
    loading,
    worldBankCountryData,
    staticData,
    countryLoadError,
  } = useStore()

  return (
    <div
      className={`absolute top-12 left-0 bottom-0 z-10 w-80
                  bg-[#0d1117]/95 backdrop-blur-md
                  border-r border-[#1e2736]
                  transform transition-transform duration-300 ease-in-out
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="h-full overflow-y-auto flex flex-col">
        {(loading.country || (selectedCountry && !countryData && !countryLoadError)) && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {countryLoadError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-5 text-center">
            <p className="text-[#6b7280] text-sm">Failed to load country data.</p>
            <p className="text-[#4b5563] text-xs">Check your internet connection.</p>
          </div>
        )}

        {countryData && !loading.country && (
          <>
            {/* Country header */}
            <div className="p-5 border-b border-[#1e2736]">
              <div className="flex items-center gap-3">
                <img
                  src={countryData.flags.svg}
                  alt={`Flag of ${countryData.name.common}`}
                  className="w-11 h-8 object-cover rounded shadow-sm shadow-black/40"
                />
                <div>
                  <h2 className="font-display text-base font-medium tracking-wide text-[#e2e8f0] leading-tight">
                    {countryData.name.common}
                  </h2>
                  <p className="text-[#6b7280] text-xs mt-0.5 leading-snug">{countryData.name.official}</p>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex flex-wrap border-b border-[#1e2736]">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`py-2 px-2.5 text-[10px] uppercase tracking-widest whitespace-nowrap
                              transition-colors font-display
                              ${activeTab === id
                                ? 'text-[#e2e8f0] border-b-2 border-blue-500'
                                : 'text-[#6b7280] hover:text-[#94a3b8]'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 p-5">
              {activeTab === 'gobierno'    && <GovernmentTab countryCode={selectedCountry?.code} staticData={staticData} />}
              {activeTab === 'culturas'    && <CulturesTab   countryCode={selectedCountry?.code} staticData={staticData} />}
              {activeTab === 'diplomatica' && <DiplomaticTab countryCode={selectedCountry?.code} staticData={staticData} />}
              {activeTab === 'economia'    && <EconomyTab    data={countryData} worldBankData={worldBankCountryData} />}
              {activeTab === 'comercio'    && <EmptyTab label="Import/export data coming soon." />}
              {activeTab === 'historia'    && <EmptyTab label="Historical events coming soon." />}
              {activeTab === 'politicas'   && <EmptyTab label="Policy positions coming soon." />}
              {activeTab === 'religion'    && <ReligionTab   countryCode={selectedCountry?.code} staticData={staticData} />}
              {activeTab === 'fuerzas'     && <MilitaryTab   countryCode={selectedCountry?.code} staticData={staticData} worldBankData={worldBankCountryData} />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Government ───────────────────────────────────────────────────────────────

function wikiPhotoUrl(uploadUrl) {
  if (!uploadUrl) return null
  // Extract filename from Wikimedia upload URL and use Special:FilePath which allows CORS
  const match = uploadUrl.match(/\/commons\/(?:thumb\/)?[a-f0-9]\/[a-f0-9]{2}\/(.+?)(?:\/\d+px-.+)?$/)
  if (!match) return uploadUrl
  const filename = decodeURIComponent(match[1])
  return `https://commons.wikimedia.org/w/index.php?action=raw&title=Special:FilePath/${encodeURIComponent(filename)}&width=200`
}

function PersonCard({ person, role }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1e2736] border border-[#2d3748] shrink-0">
        {person.photo ? (
          <img
            src={wikiPhotoUrl(person.photo)}
            alt={person.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#4b5563] text-lg">?</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[#6b7280] text-[10px] uppercase tracking-wider">{role}</p>
        <p className="text-[#e2e8f0] text-sm font-medium leading-tight truncate">{person.name}</p>
        <p className="text-[#6b7280] text-xs mt-0.5">
          {[person.party, person.age != null && `Age ${person.age}`].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
    </div>
  )
}

function GovernmentTab({ countryCode, staticData }) {
  if (!countryCode || countryCode === '-99') {
    return <EmptyTab label="No data available for this territory." />
  }

  const gov = staticData?.governments?.[countryCode]

  return (
    <div className="flex flex-col gap-6">
      <Section title="Head of State">
        {gov?.headOfState ? (
          <PersonCard person={gov.headOfState} role="Head of State" />
        ) : (
          <p className="text-[#4b5563] text-sm">No data</p>
        )}
      </Section>

      {gov?.headOfGov && (
        <Section title="Head of Government">
          <PersonCard person={gov.headOfGov} role="Head of Government" />
        </Section>
      )}

      <Section title="Key Ministers">
        {[
          { key: 'economy', label: 'Economy' },
          { key: 'defense', label: 'Defense' },
          { key: 'foreign', label: 'Foreign Affairs' },
        ].map(({ key, label }) => {
          const m = gov?.ministers?.[key]
          return (
            <div key={key}>
              <p className="text-[#6b7280] text-xs uppercase tracking-wider">{label}</p>
              {m ? (
                <p className="text-[#e2e8f0] text-sm mt-0.5">
                  {m.name}
                  {m.party && <span className="text-[#6b7280] text-xs"> · {m.party}</span>}
                </p>
              ) : (
                <p className="text-[#4b5563] text-sm mt-0.5">No data</p>
              )}
            </div>
          )
        })}
      </Section>

      <Section title="Governing Parties">
        {gov?.governingParties?.length ? (
          <div className="flex flex-col gap-1">
            {gov.governingParties.map((p) => (
              <div key={p} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <p className="text-[#e2e8f0] text-sm">{p}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#4b5563] text-sm">No coalition data available</p>
        )}
      </Section>

      <div className="pt-2 border-t border-gray-800">
        <p className="text-gray-700 text-xs">Source: Wikidata</p>
      </div>
    </div>
  )
}

// ─── Cultures ─────────────────────────────────────────────────────────────────

function DemographicList({ groups }) {
  if (!groups?.length) return <p className="text-[#4b5563] text-sm">No data available</p>

  const hasPercents = groups.some(g => g.pct != null)

  return (
    <div className="flex flex-col gap-2">
      {groups.map((g, i) => (
        <div key={g.name}>
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-sm ${i === 0 ? 'text-[#e2e8f0] font-medium' : 'text-[#94a3b8]'}`}>
              {g.name}
            </span>
            {g.pct != null && (
              <span className={`text-xs tabular-nums ${i === 0 ? 'text-[#e2e8f0]' : 'text-[#6b7280]'}`}>
                {g.pct}%
              </span>
            )}
          </div>
          {hasPercents && g.pct != null && (
            <div className="h-1 bg-[#1e2736] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${g.pct}%`,
                  backgroundColor: i === 0 ? '#3b82f6' : '#374151',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CulturesTab({ countryCode, staticData }) {
  const groups = staticData?.ethnicGroups?.[countryCode]

  return (
    <div className="flex flex-col gap-6">
      <Section title="Ethnic Groups">
        <DemographicList groups={groups} />
        {!groups?.length && (
          <p className="text-[#4b5563] text-xs">Source pending: UN Demographic Statistics</p>
        )}
      </Section>
      <div className="pt-2 border-t border-gray-800">
        <p className="text-gray-700 text-xs">Source: Wikidata</p>
      </div>
    </div>
  )
}

// ─── Religion ─────────────────────────────────────────────────────────────────

function ReligionTab({ countryCode, staticData }) {
  const groups = staticData?.religions?.[countryCode]

  return (
    <div className="flex flex-col gap-6">
      <Section title="Religions">
        <DemographicList groups={groups} />
        {!groups?.length && (
          <p className="text-[#4b5563] text-xs">Source pending: Pew Research / Wikidata</p>
        )}
      </Section>
      <div className="pt-2 border-t border-gray-800">
        <p className="text-gray-700 text-xs">Source: Wikidata</p>
      </div>
    </div>
  )
}

// ─── Diplomatic ───────────────────────────────────────────────────────────────

function DiplomaticTab({ countryCode, staticData }) {
  const setSelectedCountry = useStore((s) => s.setSelectedCountry)

  if (!staticData) return <p className="text-gray-500 text-sm">Loading...</p>
  if (!countryCode || countryCode === '-99') {
    return <p className="text-gray-500 text-sm">No data available for this territory.</p>
  }

  const democracyScore = staticData.vdem?.[countryCode]
  const fh             = staticData.freedomhouse?.[countryCode]
  const alliances      = staticData.alliances?.[countryCode] ?? []
  const freedomConfig  = FREEDOM_STATUS[fh?.status]

  return (
    <div className="flex flex-col gap-6">

      <Section title="Political System">
        {fh ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: freedomConfig?.color ?? '#6b7280' }} />
              <div>
                <p className="text-[#e2e8f0] text-sm">{fh.status}</p>
                <p className="text-gray-500 text-xs">Freedom House 2026</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Political Rights</p>
                <p className="text-[#e2e8f0] text-sm mt-0.5">{fh.pr} <span className="text-gray-500 text-xs">/ 7</span></p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Civil Liberties</p>
                <p className="text-[#e2e8f0] text-sm mt-0.5">{fh.cl} <span className="text-gray-500 text-xs">/ 7</span></p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-xs">No Freedom House data</p>
        )}

        {democracyScore !== undefined ? (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Liberal Democracy Index</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${democracyScore * 100}%`,
                    backgroundColor: democracyScore > 0.6 ? '#22c55e' : democracyScore > 0.3 ? '#eab308' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-white text-sm w-12 text-right">{democracyScore.toFixed(3)}</span>
            </div>
            <p className="text-gray-600 text-xs mt-1">V-Dem score (0–1)</p>
          </div>
        ) : (
          <DataRow label="Liberal Democracy Index" value="No data" />
        )}
      </Section>

      <Section title="Alliances & Treaties">
        {alliances.length > 0 ? (
          <div className="flex flex-col gap-3">
            {ALLIANCE_TYPE_ORDER.map((type) => {
              const partners = alliances.filter((a) => a.type === type).map((a) => a.partner)
              if (!partners.length) return null
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ALLIANCE_COLORS[type] }} />
                    <span className="text-white text-sm">{type}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pl-4">
                    {partners.map((iso2) => (
                      <img
                        key={iso2}
                        src={`https://flagcdn.com/w20/${iso2.toLowerCase()}.png`}
                        alt={iso2}
                        title={countryNames.of(iso2) ?? iso2}
                        className="h-3 w-auto rounded-sm opacity-90 hover:opacity-100 cursor-pointer"
                        onClick={() => setSelectedCountry({ code: iso2, name: countryNames.of(iso2) ?? iso2 })}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No formal alliances recorded</p>
        )}
        <p className="text-gray-600 text-xs">COW dataset · alliances up to ~2012</p>
      </Section>

      <div className="pt-2 border-t border-gray-800">
        <p className="text-gray-700 text-xs">
          Sources: SIPRI · V-Dem Institute · Correlates of War Project
        </p>
      </div>
    </div>
  )
}

// ─── Economy ──────────────────────────────────────────────────────────────────

function EconomyTab({ data, worldBankData }) {
  return (
    <div className="flex flex-col gap-6">

      <Section title="Geography">
        <DataRow label="Capital" value={data.capital?.[0] ?? 'N/A'} />
        <DataRow label="Region"  value={`${data.subregion ?? ''}, ${data.region ?? ''}`} />
        <DataRow label="Area"    value={data.area ? `${data.area.toLocaleString('en-US')} km²` : 'N/A'} />
      </Section>

      <Section title="People">
        <DataRow
          label="Population"
          value={worldBankData?.['SP.POP.TOTL']
            ? Math.round(worldBankData['SP.POP.TOTL']).toLocaleString('en-US')
            : 'N/A'}
        />
        <DataRow label="Languages" value={Object.values(data.languages ?? {}).join(', ') || 'N/A'} />
        {worldBankData && (
          <DataRow
            label="Life Expectancy"
            value={formatIndicatorValue(worldBankData['SP.DYN.LE00.IN'], 'decimal', 'years')}
          />
        )}
      </Section>

      <Section title="Economy">
        <DataRow
          label="Currency"
          value={Object.values(data.currencies ?? {}).map((c) => `${c.name} (${c.symbol})`).join(', ') || 'N/A'}
        />
        {worldBankData ? (
          <>
            <DataRow label="GDP per Capita" value={formatIndicatorValue(worldBankData['NY.GDP.PCAP.CD'], 'currency', 'USD')} />
            <DataRow label="GDP Growth"     value={formatIndicatorValue(worldBankData['NY.GDP.MKTP.KD.ZG'], 'percent', '%')} />
            <DataRow label="Unemployment"   value={formatIndicatorValue(worldBankData['SL.UEM.TOTL.ZS'], 'percent', '%')} />
          </>
        ) : (
          <p className="text-gray-600 text-xs">Loading economic data...</p>
        )}
      </Section>

      {worldBankData && (
        <Section title="Environment">
          <DataRow label="CO₂ per Capita" value={formatIndicatorValue(worldBankData['EN.ATM.CO2E.PC'], 'decimal', 'tonnes')} />
        </Section>
      )}
    </div>
  )
}

// ─── Military ─────────────────────────────────────────────────────────────────

function MilitaryTab({ countryCode, staticData, worldBankData }) {
  if (!countryCode || countryCode === '-99') {
    return <EmptyTab label="No data available for this territory." />
  }

  const milSpending  = staticData?.sipri?.[countryCode]
  const milPersonnel = staticData?.militaryPersonnel?.[countryCode]

  return (
    <div className="flex flex-col gap-6">

      <Section title="Military Spending">
        <DataRow label="Estimated Spending" value={formatMilSpending(milSpending)} />
        <p className="text-gray-600 text-xs -mt-2">SIPRI estimate (current USD)</p>
        {worldBankData && (
          <DataRow
            label="% of GDP"
            value={formatIndicatorValue(worldBankData['MS.MIL.XPND.GD.ZS'], 'percent', '% of GDP')}
          />
        )}
      </Section>

      <Section title="Personnel">
        <DataRow
          label="Active Personnel"
          value={milPersonnel?.active != null ? milPersonnel.active.toLocaleString('en-US') : 'No data'}
        />
        <DataRow
          label="Reserve Personnel"
          value={milPersonnel?.reserve != null ? milPersonnel.reserve.toLocaleString('en-US') : 'No data'}
        />
        {!milPersonnel && (
          <p className="text-[#4b5563] text-xs">Source pending: IISS Military Balance</p>
        )}
      </Section>

      <Section title="Equipment">
        {[
          { label: 'Combat Aircraft', icon: '✈️' },
          { label: 'Warships',        icon: '⚓' },
          { label: 'Tanks',           icon: '🛡' },
        ].map(({ label, icon }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-base leading-none">{icon}</span>
            <div>
              <p className="text-[#6b7280] text-xs uppercase tracking-wider">{label}</p>
              <p className="text-[#4b5563] text-sm">No data</p>
            </div>
          </div>
        ))}
        <p className="text-[#4b5563] text-xs">Source pending: IISS Military Balance</p>
      </Section>

      <Section title="Senior Command">
        {['Army', 'Air Force', 'Navy'].map((branch) => (
          <div key={branch} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#374151] shrink-0" />
            <div>
              <p className="text-[#6b7280] text-xs uppercase tracking-wider">{branch}</p>
              <p className="text-[#4b5563] text-sm">No data</p>
            </div>
          </div>
        ))}
      </Section>

      <div className="pt-2 border-t border-gray-800">
        <p className="text-gray-700 text-xs">Sources: SIPRI Military Expenditure Database · World Bank · Wikidata</p>
      </div>
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function EmptyTab({ label }) {
  return <p className="text-[#4b5563] text-sm">{label}</p>
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280]
                    border-b border-[#1e2736] pb-1.5">
        {title}
      </p>
      {children}
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div>
      <p className="text-[#6b7280] text-xs uppercase tracking-wider">{label}</p>
      <p className="text-[#e2e8f0] text-sm mt-0.5">{value}</p>
    </div>
  )
}

export default Sidebar
