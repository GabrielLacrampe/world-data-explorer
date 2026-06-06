import { LAYERS } from '../App'
import useStore from '../store/useStore'

const ALLIANCE_LEGEND = [
  { type: 'Defense Pact', color: '#ef4444' },
  { type: 'Non-Aggression Treaty', color: '#f59e0b' },
  { type: 'Neutrality Pact', color: '#a78bfa' },
  { type: 'Entente', color: '#22c55e' },
]

const COLOR_SCALE = [
  '#0f172a', '#164e63', '#0369a1', '#0284c7',
  '#059669', '#65a30d', '#ca8a04', '#ea580c',
  '#dc2626', '#9f1239',
]

function Legend() {
  const activeLayer = useStore((state) => state.activeLayer)
  const selectedCountry = useStore((state) => state.selectedCountry)
  const staticData = useStore((state) => state.staticData)
  const layer = LAYERS[activeLayer]

  if (selectedCountry && staticData?.alliances) {
    const allies = staticData.alliances[selectedCountry.code]
    if (allies?.length) {
      const presentTypes = new Set(allies.map((a) => a.type))
      return (
        <div className="absolute bottom-6 right-4 z-20
                        bg-[#0d1117]/90 backdrop-blur-md
                        border border-[#1e2736] rounded-md p-3 min-w-44">
          <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280] mb-2.5">
            Alliance Relations
          </p>
          <div className="flex flex-col gap-1.5">
            {ALLIANCE_LEGEND.filter((e) => presentTypes.has(e.type)).map(({ type, color }) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[#94a3b8] text-xs">{type}</span>
              </div>
            ))}
          </div>
          <p className="text-[#374151] text-xs mt-2.5">Source: COW Project</p>
        </div>
      )
    }
  }

  if (!layer || activeLayer === 'none') return null
  if (!layer.property && !layer.indicator && !layer.staticKey) return null

  const unit = layer.unit ?? ''

  return (
    <div className="absolute bottom-6 right-4 z-20
                    bg-[#0d1117]/90 backdrop-blur-md
                    border border-[#1e2736] rounded-md p-3 min-w-44">
      <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6b7280] mb-2.5">
        {layer.label}
        {unit && <span className="normal-case tracking-normal"> · {unit}</span>}
      </p>
      <div className="flex items-center gap-px">
        {COLOR_SCALE.map((color, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 first:rounded-l last:rounded-r"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[#4b5563] text-xs">Low</span>
        <span className="text-[#4b5563] text-xs">High</span>
      </div>
      {layer.attribution && (
        <p className="text-[#374151] text-xs mt-2">Source: {layer.attribution}</p>
      )}
    </div>
  )
}

export default Legend