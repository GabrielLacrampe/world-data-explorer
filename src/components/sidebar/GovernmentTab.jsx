import { useGovernmentData } from '../../hooks/useGovernmentData'
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

export default function GovernmentTab({ countryCode, subtab }) {
  const { data, loading } = useGovernmentData(countryCode)

  if (!countryCode || countryCode === '-99')
    return <EmptyTab label="No data available for this territory." />
  if (loading)
    return <p className="text-[#4b5563] text-sm">Loading...</p>

  const gov = data?.government
  const ministers = data?.ministers ?? []

  if (subtab === 'leaders') return (
    <div className="flex flex-col gap-5">
      <Section title="Head of State">
        {gov?.head_of_state_name
          ? <PersonCard person={{ name: gov.head_of_state_name, party: gov.head_of_state_party, photo: gov.head_of_state_photo }} role={gov.head_of_state_title ?? 'Head of State'} />
          : <NoData />}
      </Section>
      {gov?.head_of_government_name && (
        <Section title="Head of Government">
          <PersonCard person={{ name: gov.head_of_government_name, party: gov.head_of_government_party, photo: gov.head_of_government_photo }} role={gov.head_of_government_title ?? 'Head of Government'} />
        </Section>
      )}
      <Source>Manual research · June 2026</Source>
    </div>
  )

  if (subtab === 'cabinet') return (
    <div className="flex flex-col gap-5">
      <Section title="Key Ministers">
        {ministers.length > 0 ? (
          ministers.map((m) => (
            <div key={m.role}>
              <p className="text-[#4b5563] text-[9px] uppercase tracking-wider">{m.role}</p>
              <p className="text-[#e2e8f0] text-sm mt-0.5">
                {m.name}
                {m.party && <span className="text-[#6b7280] text-xs"> · {m.party}</span>}
              </p>
            </div>
          ))
        ) : <NoData />}
      </Section>
      <Source>Manual research · June 2026</Source>
    </div>
  )

  if (subtab === 'parties') return (
    <div className="flex flex-col gap-5">
      <Section title="Governing Parties">
        {gov?.governing_parties?.length ? (
          <div className="flex flex-col gap-1.5">
            {gov.governing_parties.map((p) => (
              <div key={p} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <p className="text-[#e2e8f0] text-sm">{p}</p>
              </div>
            ))}
          </div>
        ) : <NoData label="No coalition data" />}
      </Section>
      <Source>Manual research · June 2026</Source>
    </div>
  )

  return null
}
