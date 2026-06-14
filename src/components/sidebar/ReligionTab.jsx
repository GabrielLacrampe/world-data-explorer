import { Section, NoData, Source } from './SidebarShared'

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

export default function ReligionTab({ countryCode, staticData }) {
  const groups = staticData?.religions?.[countryCode]
  return (
    <div className="flex flex-col gap-5">
      <Section title="Religions"><DemographicList groups={groups} /></Section>
      <Source>Pew Research 2020 projections</Source>
    </div>
  )
}
