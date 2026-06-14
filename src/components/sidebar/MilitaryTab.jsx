import { formatIndicatorValue } from '../../utils/worldBank'
import { formatMilSpending } from '../../utils/staticData'
import { Section, DataRow, Source, EmptyTab } from './SidebarShared'

export default function MilitaryTab({ countryCode, staticData, worldBankData, subtab }) {
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
