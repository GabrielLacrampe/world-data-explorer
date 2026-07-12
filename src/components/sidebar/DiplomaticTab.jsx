import useStore from '../../store/useStore'
import { useRelationships } from '../../hooks/useRelationships'
import { FREEDOM_STATUS } from '../../utils/staticData'
import { Section, NoData, Source, EmptyTab } from './SidebarShared'

const RELATIONSHIP_COLORS = {
  war:      '#ef4444',
  conflict: '#f97316',
  rivalry:  '#f59e0b',
  tension:  '#a78bfa',
  alliance: '#22c55e',
}

const INTENSITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' }

export default function DiplomaticTab({ countryCode, staticData, subtab }) {
  const setSelectedCountry = useStore((s) => s.setSelectedCountry)
  const { data: relationships, iso3: countryIso3, loading: relLoading } = useRelationships(countryCode)

  if (!staticData) return <p className="text-gray-500 text-sm">Loading...</p>
  if (!countryCode || countryCode === '-99')
    return <EmptyTab label="No data available for this territory." />

  const democracyScore = staticData.vdem?.[countryCode]
  const fh             = staticData.freedomhouse?.[countryCode]
  const cpi            = staticData.cpi?.[countryCode]
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
      <Section title="Active Relationships">
        {relLoading && <p className="text-[#4b5563] text-sm">Loading...</p>}
        {!relLoading && relationships?.length > 0 ? (
          <div className="flex flex-col gap-4">
            {relationships.map((rel) => {
              const partners = [...(rel.side_a ?? []), ...(rel.side_b ?? [])].filter((c) => c !== countryIso3)
              return (
                <div key={rel.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: RELATIONSHIP_COLORS[rel.type] ?? '#6b7280' }} />
                    <span className="text-[#94a3b8] text-sm capitalize">{rel.name ?? rel.type}</span>
                    {rel.intensity && (
                      <span className="text-[#4b5563] text-xs ml-auto">{INTENSITY_LABEL[rel.intensity]}</span>
                    )}
                  </div>
                  {partners.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-4">
                      {partners.map((iso3) => (
                        <span
                          key={iso3}
                          className="text-[#94a3b8] text-xs bg-[#1e2736] px-1.5 py-0.5 rounded cursor-pointer hover:text-white"
                          onClick={() => setSelectedCountry({ code: iso3, name: iso3 })}
                        >
                          {iso3}
                        </span>
                      ))}
                    </div>
                  )}
                  {rel.notes && <p className="text-[#4b5563] text-xs pl-4 mt-1">{rel.notes}</p>}
                </div>
              )
            })}
          </div>
        ) : !relLoading && <NoData label="No active relationships recorded" />}
      </Section>
      <Source>Manual research · June 2026</Source>
    </div>
  )

  return null
}

const DEMOCRACY_HIGH = 0.6
const DEMOCRACY_LOW  = 0.3
