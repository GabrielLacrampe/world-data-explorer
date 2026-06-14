import { Section, NoData, Source, EmptyTab } from './SidebarShared'

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

export default function GovernmentTab({ countryCode, staticData, subtab }) {
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
