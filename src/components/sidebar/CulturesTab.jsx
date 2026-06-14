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

export default function CulturesTab({ countryCode, staticData, countryData, subtab }) {
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
