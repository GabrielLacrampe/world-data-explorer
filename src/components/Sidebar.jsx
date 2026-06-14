import React, { useState } from 'react'
import useStore from '../store/useStore'
import { formatIndicatorValue } from '../utils/worldBank'
import { FREEDOM_STATUS, formatMilSpending } from '../utils/staticData'

const ALLIANCE_COLORS = {
  'Defense Pact':          '#ef4444',
  'Non-Aggression Treaty': '#f59e0b',
  'Neutrality Pact':       '#a78bfa',
  'Entente':               '#22c55e',
}
const ALLIANCE_TYPE_ORDER = ['Defense Pact', 'Non-Aggression Treaty', 'Neutrality Pact', 'Entente']
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

const TABS = [
  {
    id: 'gobierno', icon: '🏛', title: 'Government',
    subtabs: [
      { id: 'leaders', label: 'Leaders' },
      { id: 'cabinet', label: 'Cabinet' },
      { id: 'parties', label: 'Parties' },
    ],
  },
  {
    id: 'culturas', icon: '🌍', title: 'Culture',
    subtabs: [
      { id: 'ethnicity', label: 'Ethnicity' },
      { id: 'languages', label: 'Languages' },
    ],
  },
  {
    id: 'diplomatica', icon: '🤝', title: 'Diplomatic',
    subtabs: [
      { id: 'freedom',   label: 'Freedom' },
      { id: 'alliances', label: 'Alliances' },
    ],
  },
  {
    id: 'economia', icon: '📊', title: 'Economy',
    subtabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'trade',    label: 'Trade' },
      { id: 'environ',  label: 'Environ.' },
    ],
  },
  {
    id: 'comercio', icon: '🚢', title: 'Trade Routes',
    subtabs: [],
  },
  {
    id: 'historia', icon: '📜', title: 'History',
    subtabs: [],
  },
  {
    id: 'politicas', icon: '📋', title: 'Policies',
    subtabs: [],
  },
  {
    id: 'religion', icon: '🕊️', title: 'Religion',
    subtabs: [],
  },
  {
    id: 'fuerzas', icon: '⚔️', title: 'Military',
    subtabs: [
      { id: 'budget', label: 'Budget' },
      { id: 'forces', label: 'Forces' },
    ],
  },
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

  const [activeSubTabs, setActiveSubTabs] = useState({})

  const currentTabDef  = TABS.find((t) => t.id === activeTab)
  const currentSubtabs = currentTabDef?.subtabs ?? []
  const currentSubTab  = activeSubTabs[activeTab] ?? currentSubtabs[0]?.id

  const setSubTab = (tabId, subId) =>
    setActiveSubTabs((prev) => ({ ...prev, [tabId]: subId }))

  return (
    <div
      className={`absolute top-10 left-0 bottom-0 z-10 w-80
                  bg-[#0d1117]/95 backdrop-blur-md
                  border-r border-[#1e2736]
                  transform transition-transform duration-300 ease-in-out
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="h-full flex flex-col">

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
            <div className="px-4 py-3 border-b border-[#1e2736] shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={countryData.flags.svg}
                  alt={`Flag of ${countryData.name.common}`}
                  className="w-12 h-8 object-cover rounded shadow-sm shadow-black/40 shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="font-display text-sm font-medium tracking-wide text-[#e2e8f0] leading-tight truncate">
                    {countryData.name.common}
                  </h2>
                  <p className="text-[#4b5563] text-[10px] mt-0.5 leading-snug truncate">
                    {countryData.name.official}
                  </p>
                </div>
              </div>
            </div>

            {/* Icon tab row */}
            <div className="flex border-b border-[#1e2736] shrink-0">
              {TABS.map(({ id, icon, title }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={title}
                  className={`flex-1 h-9 flex items-center justify-center text-base transition-colors
                    ${activeTab === id
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-[#374151] hover:text-[#6b7280]'}`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Sub-tab row */}
            {currentSubtabs.length > 0 && (
              <div className="flex border-b border-[#1e2736] bg-[#080d12]/60 shrink-0">
                {currentSubtabs.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setSubTab(activeTab, id)}
                    className={`flex-1 py-1.5 text-[9px] uppercase tracking-wider transition-colors
                      ${currentSubTab === id
                        ? 'text-[#e2e8f0] border-b border-blue-500'
                        : 'text-[#4b5563] hover:text-[#6b7280]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Tab content — only this area scrolls */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'gobierno' && (
                <GovernmentTab countryCode={selectedCountry?.code} staticData={staticData} subtab={currentSubTab} />
              )}
              {activeTab === 'culturas' && (
                <CulturesTab countryCode={selectedCountry?.code} staticData={staticData} countryData={countryData} subtab={currentSubTab} />
              )}
              {activeTab === 'diplomatica' && (
                <DiplomaticTab countryCode={selectedCountry?.code} staticData={staticData} subtab={currentSubTab} />
              )}
              {activeTab === 'economia' && (
                <EconomyTab data={countryData} worldBankData={worldBankCountryData} staticData={staticData} countryCode={selectedCountry?.code} subtab={currentSubTab} />
              )}
              {activeTab === 'comercio'  && <EmptyTab label="Import/export data coming soon." />}
              {activeTab === 'historia'  && <HistoryTab countryName={countryData?.name?.common} />}
              {activeTab === 'politicas' && <EmptyTab label="Policy positions coming soon." />}
              {activeTab === 'religion'  && <ReligionTab countryCode={selectedCountry?.code} staticData={staticData} />}
              {activeTab === 'fuerzas'   && (
                <MilitaryTab countryCode={selectedCountry?.code} staticData={staticData} worldBankData={worldBankCountryData} subtab={currentSubTab} />
              )}
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
  const match = uploadUrl.match(/\/commons\/(?:thumb\/)?[a-f0-9]\/[a-f0-9]{2}\/(.+?)(?:\/\d+px-.+)?$/)
  if (!match) return uploadUrl
  const filename = decodeURIComponent(match[1])
  return `https://commons.wikimedia.org/w/index.php?action=raw&title=Special:FilePath/${encodeURIComponent(filename)}&width=200`
}

function PersonCard({ person, role }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1e2736] border border-[#2d3748] shrink-0">
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
        <p className="text-[#4b5563] text-[9px] uppercase tracking-wider">{role}</p>
        <p className="text-[#e2e8f0] text-sm font-medium leading-tight truncate">{person.name}</p>
        <p className="text-[#6b7280] text-xs mt-0.5">
          {[person.party, person.age != null && `Age ${person.age}`].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
    </div>
  )
}

function GovernmentTab({ countryCode, staticData, subtab }) {
  if (!countryCode || countryCode === '-99')
    return <EmptyTab label="No data available for this territory." />

  const gov = staticData?.governments?.[countryCode]

  if (subtab === 'leaders') return (
    <div className="flex flex-col gap-5">
      <Section title="Head of State">
        {gov?.headOfState ? <PersonCard person={gov.headOfState} role="Head of State" /> : <NoData />}
      </Section>
      {gov?.headOfGov && (
        <Section title="Head of Government">
          <PersonCard person={gov.headOfGov} role="Head of Government" />
        </Section>
      )}
      <Source>Wikidata</Source>
    </div>
  )

  if (subtab === 'cabinet') return (
    <div className="flex flex-col gap-5">
      <Section title="Key Ministers">
        {[
          { key: 'economy', label: 'Economy' },
          { key: 'defense', label: 'Defense' },
          { key: 'foreign', label: 'Foreign Affairs' },
        ].map(({ key, label }) => {
          const m = gov?.ministers?.[key]
          return (
            <div key={key}>
              <p className="text-[#4b5563] text-[9px] uppercase tracking-wider">{label}</p>
              {m ? (
                <p className="text-[#e2e8f0] text-sm mt-0.5">
                  {m.name}
                  {m.party && <span className="text-[#6b7280] text-xs"> · {m.party}</span>}
                </p>
              ) : <p className="text-[#374151] text-sm mt-0.5">No data</p>}
            </div>
          )
        })}
      </Section>
      <Source>Wikidata</Source>
    </div>
  )

  if (subtab === 'parties') return (
    <div className="flex flex-col gap-5">
      <Section title="Governing Parties">
        {gov?.governingParties?.length ? (
          <div className="flex flex-col gap-1.5">
            {gov.governingParties.map((p) => (
              <div key={p} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <p className="text-[#e2e8f0] text-sm">{p}</p>
              </div>
            ))}
          </div>
        ) : <NoData label="No coalition data" />}
      </Section>
      <Source>Wikidata</Source>
    </div>
  )

  return null
}

// ─── Cultures ─────────────────────────────────────────────────────────────────

function DemographicList({ groups }) {
  if (!groups?.length) return <NoData />
  const hasPercents = groups.some((g) => g.pct != null)
  return (
    <div className="flex flex-col gap-2">
      {groups.map((g, i) => (
        <div key={g.name ?? i}>
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
                className="h-full rounded-full"
                style={{ width: `${g.pct}%`, backgroundColor: i === 0 ? '#3b82f6' : '#374151' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CulturesTab({ countryCode, staticData, countryData, subtab }) {
  const ethnicGroups = staticData?.ethnicGroups?.[countryCode]
  const fb           = staticData?.factbook?.[countryCode]
  const languages    = fb?.languages ?? (
    countryData?.languages
      ? Object.values(countryData.languages).map((name) => ({ name, pct: null }))
      : null
  )

  if (subtab === 'ethnicity') return (
    <div className="flex flex-col gap-5">
      <Section title="Ethnic Groups"><DemographicList groups={ethnicGroups} /></Section>
      <Source>CIA World Factbook</Source>
    </div>
  )

  if (subtab === 'languages') return (
    <div className="flex flex-col gap-5">
      <Section title="Languages"><DemographicList groups={languages} /></Section>
      <Source>CIA World Factbook · world-countries</Source>
    </div>
  )

  return null
}

// ─── Religion ─────────────────────────────────────────────────────────────────

function ReligionTab({ countryCode, staticData }) {
  const groups = staticData?.religions?.[countryCode]
  return (
    <div className="flex flex-col gap-5">
      <Section title="Religions"><DemographicList groups={groups} /></Section>
      <Source>Pew Research 2020 projections</Source>
    </div>
  )
}

// ─── Diplomatic ───────────────────────────────────────────────────────────────

function DiplomaticTab({ countryCode, staticData, subtab }) {
  const setSelectedCountry = useStore((s) => s.setSelectedCountry)

  if (!staticData) return <p className="text-gray-500 text-sm">Loading...</p>
  if (!countryCode || countryCode === '-99')
    return <EmptyTab label="No data available for this territory." />

  const democracyScore = staticData.vdem?.[countryCode]
  const fh             = staticData.freedomhouse?.[countryCode]
  const cpi            = staticData.cpi?.[countryCode]
  const alliances      = staticData.alliances?.[countryCode] ?? []
  const freedomConfig  = FREEDOM_STATUS[fh?.status]

  if (subtab === 'freedom') return (
    <div className="flex flex-col gap-5">
      <Section title="Political Freedom">
        {fh ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: freedomConfig?.color ?? '#6b7280' }} />
              <div>
                <p className="text-[#e2e8f0] text-sm">{fh.status}</p>
                <p className="text-[#4b5563] text-xs">Freedom House 2026</p>
              </div>
            </div>
            <div className="flex gap-5">
              <div>
                <p className="text-[#4b5563] text-[9px] uppercase tracking-wider">Political Rights</p>
                <p className="text-[#e2e8f0] text-sm mt-0.5">{fh.pr} <span className="text-[#4b5563] text-xs">/ 7</span></p>
              </div>
              <div>
                <p className="text-[#4b5563] text-[9px] uppercase tracking-wider">Civil Liberties</p>
                <p className="text-[#e2e8f0] text-sm mt-0.5">{fh.cl} <span className="text-[#4b5563] text-xs">/ 7</span></p>
              </div>
            </div>
          </div>
        ) : <NoData label="No Freedom House data" />}
      </Section>

      {cpi && (
        <Section title="Corruption Index">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[#1e2736] rounded-full overflow-hidden">
              <div className="h-full rounded-full"
                style={{
                  width: `${cpi.score}%`,
                  backgroundColor: cpi.score >= 60 ? '#22c55e' : cpi.score >= 40 ? '#eab308' : '#ef4444',
                }} />
            </div>
            <span className="text-[#e2e8f0] text-sm w-8 text-right">{cpi.score}</span>
          </div>
          <p className="text-[#374151] text-xs">TI score 0–100 · {cpi.year}</p>
        </Section>
      )}

      <Section title="Democracy Index">
        {democracyScore !== undefined ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-[#1e2736] rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{
                    width: `${democracyScore * 100}%`,
                    backgroundColor: democracyScore > 0.6 ? '#22c55e' : democracyScore > 0.3 ? '#eab308' : '#ef4444',
                  }} />
              </div>
              <span className="text-[#e2e8f0] text-sm w-12 text-right">{democracyScore.toFixed(3)}</span>
            </div>
            <p className="text-[#374151] text-xs">V-Dem score (0–1)</p>
          </>
        ) : <NoData />}
      </Section>

      <Source>Freedom House 2026 · V-Dem · TI 2015</Source>
    </div>
  )

  if (subtab === 'alliances') return (
    <div className="flex flex-col gap-5">
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
                    <span className="text-[#94a3b8] text-sm">{type}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pl-4">
                    {partners.map((iso2) => (
                      <img
                        key={iso2}
                        src={`https://flagcdn.com/w20/${iso2.toLowerCase()}.png`}
                        alt={iso2}
                        title={countryNames.of(iso2) ?? iso2}
                        className="h-3 w-auto rounded-sm opacity-80 hover:opacity-100 cursor-pointer"
                        onClick={() => setSelectedCountry({ code: iso2, name: countryNames.of(iso2) ?? iso2 })}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : <NoData label="No formal alliances recorded" />}
        <p className="text-[#374151] text-xs mt-1">COW dataset · up to ~2012</p>
      </Section>
      <Source>Correlates of War Project</Source>
    </div>
  )

  return null
}

// ─── Economy ──────────────────────────────────────────────────────────────────

function EconomyTab({ data, worldBankData, staticData, countryCode, subtab }) {
  const fb = staticData?.factbook?.[countryCode]
  const wb = worldBankData

  if (subtab === 'overview') return (
    <div className="flex flex-col gap-5">
      <Section title="Geography">
        <DataRow label="Capital"      value={data.capital?.[0] ?? 'N/A'} />
        <DataRow label="Region"       value={[data.subregion, data.region].filter(Boolean).join(', ')} />
        <DataRow label="Area"         value={data.area ? `${data.area.toLocaleString('en-US')} km²` : 'N/A'} />
        {fb?.independence && <DataRow label="Independence" value={fb.independence} />}
        {fb?.govType      && <DataRow label="Gov. Type"    value={fb.govType} />}
      </Section>
      <Section title="People">
        <DataRow label="Population"      value={wb?.['SP.POP.TOTL'] ? Math.round(wb['SP.POP.TOTL']).toLocaleString('en-US') : 'N/A'} />
        <DataRow label="Life Expectancy" value={formatIndicatorValue(wb?.['SP.DYN.LE00.IN'], 'decimal', 'years')} />
        <DataRow label="Literacy Rate"   value={formatIndicatorValue(wb?.['SE.ADT.LITR.ZS'], 'percent', '%')} />
        <DataRow label="Internet Users"  value={formatIndicatorValue(wb?.['IT.NET.USER.ZS'],  'percent', '%')} />
      </Section>
      <Section title="Economy">
        <DataRow label="Currency"
          value={Object.values(data.currencies ?? {}).map((c) => `${c.name} (${c.symbol})`).join(', ') || 'N/A'} />
        <DataRow label="GDP per Capita" value={formatIndicatorValue(wb?.['NY.GDP.PCAP.CD'],    'currency', 'USD')} />
        <DataRow label="GDP Growth"     value={formatIndicatorValue(wb?.['NY.GDP.MKTP.KD.ZG'], 'percent',  '%')} />
        <DataRow label="Unemployment"   value={formatIndicatorValue(wb?.['SL.UEM.TOTL.ZS'],    'percent',  '%')} />
        <DataRow label="Inflation"      value={formatIndicatorValue(wb?.['FP.CPI.TOTC.ZG'],    'percent',  '%')} />
        <DataRow label="Gini Index"     value={formatIndicatorValue(wb?.['SI.POV.GINI'],       'decimal',  '')} />
      </Section>
      <Source>World Bank · CIA World Factbook</Source>
    </div>
  )

  if (subtab === 'trade') return (
    <div className="flex flex-col gap-5">
      {fb?.gdpSectors && (
        <Section title="GDP by Sector">
          <div className="flex gap-4">
            {[['Agriculture', fb.gdpSectors.agriculture], ['Industry', fb.gdpSectors.industry], ['Services', fb.gdpSectors.services]]
              .filter(([, v]) => v != null)
              .map(([label, pct]) => (
                <div key={label} className="text-center">
                  <p className="text-[#e2e8f0] text-sm font-medium">{pct}%</p>
                  <p className="text-[#4b5563] text-xs">{label}</p>
                </div>
              ))}
          </div>
        </Section>
      )}
      {fb?.exportPartners?.length > 0 && (
        <Section title="Export Partners">
          {fb.exportPartners.map((p) => (
            <div key={p.name} className="flex items-center justify-between">
              <span className="text-[#94a3b8] text-sm">{p.name}</span>
              <span className="text-[#6b7280] text-xs tabular-nums">{p.pct}%</span>
            </div>
          ))}
        </Section>
      )}
      {fb?.exportCommodities?.length > 0 && (
        <Section title="Main Exports">
          <p className="text-[#94a3b8] text-sm leading-relaxed">{fb.exportCommodities.join(', ')}</p>
        </Section>
      )}
      {!fb?.gdpSectors && !fb?.exportPartners?.length && !fb?.exportCommodities?.length && (
        <NoData label="No trade data available" />
      )}
      <Source>CIA World Factbook</Source>
    </div>
  )

  if (subtab === 'environ') return (
    <div className="flex flex-col gap-5">
      <Section title="Environment">
        <DataRow label="CO₂ per Capita"     value={formatIndicatorValue(wb?.['EN.ATM.CO2E.PC'], 'decimal', 'tonnes')} />
        <DataRow label="Electricity Access" value={formatIndicatorValue(wb?.['EG.ELC.ACCS.ZS'], 'percent', '%')} />
        <DataRow label="Renewable Energy"   value={formatIndicatorValue(wb?.['EG.FEC.RNEW.ZS'], 'percent', '%')} />
        {fb?.naturalResources?.length > 0 && (
          <div>
            <p className="text-[#4b5563] text-[9px] uppercase tracking-wider">Natural Resources</p>
            <p className="text-[#94a3b8] text-sm mt-0.5">{fb.naturalResources.join(', ')}</p>
          </div>
        )}
      </Section>
      <Source>World Bank</Source>
    </div>
  )

  return null
}

// ─── Military ─────────────────────────────────────────────────────────────────

function MilitaryTab({ countryCode, staticData, worldBankData, subtab }) {
  if (!countryCode || countryCode === '-99')
    return <EmptyTab label="No data available for this territory." />

  const milSpending  = staticData?.sipri?.[countryCode]
  const milPersonnel = staticData?.militaryPersonnel?.[countryCode]

  if (subtab === 'budget') return (
    <div className="flex flex-col gap-5">
      <Section title="Military Spending">
        <DataRow label="Estimated Spending" value={formatMilSpending(milSpending)} />
        <p className="text-[#374151] text-xs -mt-1">SIPRI estimate (current USD)</p>
        {worldBankData && (
          <DataRow label="% of GDP"
            value={formatIndicatorValue(worldBankData['MS.MIL.XPND.GD.ZS'], 'percent', '% of GDP')} />
        )}
      </Section>
      <Source>SIPRI · World Bank</Source>
    </div>
  )

  if (subtab === 'forces') return (
    <div className="flex flex-col gap-5">
      <Section title="Personnel">
        <DataRow label="Active"  value={milPersonnel?.active  != null ? milPersonnel.active.toLocaleString('en-US')  : 'No data'} />
        <DataRow label="Reserve" value={milPersonnel?.reserve != null ? milPersonnel.reserve.toLocaleString('en-US') : 'No data'} />
      </Section>
      <Section title="Equipment">
        {[
          { label: 'Combat Aircraft', icon: '✈' },
          { label: 'Warships',        icon: '⚓' },
          { label: 'Tanks',           icon: '🛡' },
        ].map(({ label, icon }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-base leading-none">{icon}</span>
            <div>
              <p className="text-[#4b5563] text-[9px] uppercase tracking-wider">{label}</p>
              <p className="text-[#374151] text-sm">No data</p>
            </div>
          </div>
        ))}
        <p className="text-[#374151] text-xs">Source pending: IISS Military Balance</p>
      </Section>
      <Source>IISS Military Balance · Wikidata</Source>
    </div>
  )

  return null
}

// ─── History ──────────────────────────────────────────────────────────────────

function HistoryTab({ countryName }) {
  const [summary, setSummary]   = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!countryName) return
    setIsLoading(true)
    setSummary(null)
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(countryName)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setSummary(d?.extract ?? null); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [countryName])

  return (
    <div className="flex flex-col gap-5">
      <Section title="Country Overview">
        {isLoading && <p className="text-[#6b7280] text-sm">Loading...</p>}
        {!isLoading && summary && <p className="text-[#94a3b8] text-sm leading-relaxed">{summary}</p>}
        {!isLoading && !summary && <NoData />}
      </Section>
      <Source>Wikipedia</Source>
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function EmptyTab({ label = 'Coming soon.' }) {
  return <p className="text-[#374151] text-sm">{label}</p>
}

function NoData({ label = 'No data available' }) {
  return <p className="text-[#374151] text-sm">{label}</p>
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-[9px] uppercase tracking-[0.15em] text-[#4b5563]
                    border-b border-[#1e2736] pb-1.5">
        {title}
      </p>
      {children}
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <p className="text-[#4b5563] text-xs shrink-0">{label}</p>
      <p className="text-[#e2e8f0] text-xs text-right">{value}</p>
    </div>
  )
}

function Source({ children }) {
  return (
    <div className="pt-2 border-t border-[#1e2736]">
      <p className="text-[#374151] text-[10px]">Source: {children}</p>
    </div>
  )
}

export default Sidebar
