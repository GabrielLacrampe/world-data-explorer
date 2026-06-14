import useStore from '../../store/useStore'
import { FREEDOM_STATUS } from '../../utils/staticData'
import { Section, NoData, Source, EmptyTab } from './SidebarShared'

const ALLIANCE_COLORS = {
  'Defense Pact':          '#ef4444',
  'Non-Aggression Treaty': '#f59e0b',
  'Neutrality Pact':       '#a78bfa',
  'Entente':               '#22c55e',
}
const ALLIANCE_TYPE_ORDER = ['Defense Pact', 'Non-Aggression Treaty', 'Neutrality Pact', 'Entente']
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

export default function DiplomaticTab({ countryCode, staticData, subtab }) {
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
                    backgroundColor: democracyScore > DEMOCRACY_HIGH ? '#22c55e'
                      : democracyScore > DEMOCRACY_LOW ? '#eab308' : '#ef4444',
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

const DEMOCRACY_HIGH = 0.6
const DEMOCRACY_LOW  = 0.3
