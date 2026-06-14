import { formatIndicatorValue } from '../../utils/worldBank'
import { Section, NoData, DataRow, Source } from './SidebarShared'

export default function EconomyTab({ data, worldBankData, staticData, countryCode, subtab }) {
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
