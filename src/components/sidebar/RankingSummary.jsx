import useCountryRanking from '../../hooks/useCountryRanking'
import { Section, DataRow } from './SidebarShared'

function ordinal(n) {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'
  return `${n}${suffix}`
}

/**
 * Exact world rank / percentile / regional comparison for the selected
 * country on whichever layer is currently coloring the map. Distinct from
 * the hover tooltip's "≈ Top X% globally" badge, which is relative to the
 * color scale's log/outlier-clipped normalization — this is the literal
 * statistic, so the two numbers can differ slightly by design.
 */
export default function RankingSummary() {
  const ranking = useCountryRanking()
  if (!ranking) return null

  const { layer, rank, total, percentile, regionLabel, deltaPct } = ranking
  const favorable = deltaPct === null ? null : layer.invert ? deltaPct < 0 : deltaPct > 0

  return (
    <div className="px-4 pt-3 shrink-0">
      <Section title={`${layer.label} — Global Standing`}>
        <DataRow label="World Rank" value={`#${rank} of ${total}`} />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-[#1e2736] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${percentile}%` }} />
          </div>
          <span className="text-[#e2e8f0] text-xs shrink-0">{ordinal(percentile)} pct.</span>
        </div>

        {deltaPct !== null && (
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[#4b5563] text-xs shrink-0">vs {regionLabel} avg</p>
            <p className={`text-xs ${favorable ? 'text-green-400' : 'text-red-400'}`}>
              {deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(0)}%
            </p>
          </div>
        )}
      </Section>
    </div>
  )
}
