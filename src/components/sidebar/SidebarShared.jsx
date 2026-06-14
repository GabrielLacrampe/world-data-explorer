export function EmptyTab({ label = 'Coming soon.' }) {
  return <p className="text-[#374151] text-sm">{label}</p>
}

export function NoData({ label = 'No data available' }) {
  return <p className="text-[#374151] text-sm">{label}</p>
}

export function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-[9px] uppercase tracking-[0.15em] text-[#4b5563]
                    border-b border-[#1e2736] pb-1.5">
        {title}
      </p>
      {children}
    </div>
  )
}

export function DataRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <p className="text-[#4b5563] text-xs shrink-0">{label}</p>
      <p className="text-[#e2e8f0] text-xs text-right">{value}</p>
    </div>
  )
}

export function Source({ children }) {
  return (
    <div className="pt-2 border-t border-[#1e2736]">
      <p className="text-[#374151] text-[10px]">Source: {children}</p>
    </div>
  )
}
