import { useState, useEffect } from 'react'
import { Section, NoData, Source } from './SidebarShared'

export default function HistoryTab({ countryName }) {
  const [summary, setSummary]     = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
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
