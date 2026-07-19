import { useState } from 'react'
import useStore from '../store/useStore'
import { EmptyTab } from './sidebar/SidebarShared'
import GovernmentTab from './sidebar/GovernmentTab'
import CulturesTab   from './sidebar/CulturesTab'
import DiplomaticTab from './sidebar/DiplomaticTab'
import EconomyTab    from './sidebar/EconomyTab'
import ReligionTab   from './sidebar/ReligionTab'
import MilitaryTab   from './sidebar/MilitaryTab'
import HistoryTab    from './sidebar/HistoryTab'
import RankingSummary from './sidebar/RankingSummary'

const TABS = [
  { id: 'gobierno',    icon: '🏛',  title: 'Government',   subtabs: [{ id: 'leaders', label: 'Leaders' }, { id: 'cabinet', label: 'Cabinet' }, { id: 'parties', label: 'Parties' }] },
  { id: 'culturas',   icon: '🌍',  title: 'Culture',       subtabs: [{ id: 'ethnicity', label: 'Ethnicity' }, { id: 'languages', label: 'Languages' }] },
  { id: 'diplomatica',icon: '🤝',  title: 'Diplomatic',    subtabs: [{ id: 'freedom', label: 'Freedom' }, { id: 'alliances', label: 'Alliances' }] },
  { id: 'economia',   icon: '📊',  title: 'Economy',       subtabs: [{ id: 'overview', label: 'Overview' }, { id: 'trade', label: 'Trade' }, { id: 'environ', label: 'Environ.' }] },
  { id: 'comercio',   icon: '🚢',  title: 'Trade Routes',  subtabs: [] },
  { id: 'historia',   icon: '📜',  title: 'History',       subtabs: [] },
  { id: 'politicas',  icon: '📋',  title: 'Policies',      subtabs: [] },
  { id: 'religion',   icon: '🕊️', title: 'Religion',      subtabs: [] },
  { id: 'fuerzas',    icon: '⚔️', title: 'Military',      subtabs: [{ id: 'budget', label: 'Budget' }, { id: 'forces', label: 'Forces' }] },
]

export default function Sidebar() {
  const sidebarOpen             = useStore((s) => s.sidebarOpen)
  const selectedCountry         = useStore((s) => s.selectedCountry)
  const countryData             = useStore((s) => s.countryData)
  const activeTab               = useStore((s) => s.activeTab)
  const setActiveTab            = useStore((s) => s.setActiveTab)
  const loading                 = useStore((s) => s.loading)
  const worldBankCountryData    = useStore((s) => s.worldBankCountryData)
  const worldBankCountryLoading = useStore((s) => s.worldBankCountryLoading)
  const staticData              = useStore((s) => s.staticData)
  const countryLoadError        = useStore((s) => s.countryLoadError)

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

            <RankingSummary />

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
              {activeTab === 'gobierno'    && <GovernmentTab countryCode={selectedCountry?.code} subtab={currentSubTab} />}
              {activeTab === 'culturas'    && <CulturesTab   countryCode={selectedCountry?.code} staticData={staticData} countryData={countryData} subtab={currentSubTab} />}
              {activeTab === 'diplomatica' && <DiplomaticTab countryCode={selectedCountry?.code} staticData={staticData} subtab={currentSubTab} />}
              {activeTab === 'economia'    && <EconomyTab    data={countryData} worldBankData={worldBankCountryData} worldBankLoading={worldBankCountryLoading} staticData={staticData} countryCode={selectedCountry?.code} subtab={currentSubTab} />}
              {activeTab === 'comercio'    && <EmptyTab label="Import/export data coming soon." />}
              {activeTab === 'historia'    && <HistoryTab    countryName={countryData?.name?.common} />}
              {activeTab === 'politicas'   && <EmptyTab label="Policy positions coming soon." />}
              {activeTab === 'religion'    && <ReligionTab   countryCode={selectedCountry?.code} staticData={staticData} />}
              {activeTab === 'fuerzas'     && <MilitaryTab   countryCode={selectedCountry?.code} staticData={staticData} worldBankData={worldBankCountryData} subtab={currentSubTab} />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
