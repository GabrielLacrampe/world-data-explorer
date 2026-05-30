import useStore from '../../store/useStore'

const COLOR_SCALE = [
  { color: '#e0f2fe', label: 'Low' },
  { color: '#7dd3fc', label: '' },
  { color: '#38bdf8', label: '' },
  { color: '#0284c7', label: '' },
  { color: '#0369a1', label: '' },
  { color: '#1d4ed8', label: '' },
  { color: '#7c3aed', label: '' },
  { color: '#9f1239', label: 'High' },
]

function Legend({ layers }) {
  const activeLayer = useStore((state) => state.activeLayer)
  const layer = layers[activeLayer]

  if (!layer || !layer.property) return null

  return (
    <div className="absolute bottom-8 left-4 z-20
                    bg-gray-950 bg-opacity-80 backdrop-blur-sm
                    border border-gray-800 rounded p-3">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
        {layer.label}
      </p>
      <div className="flex items-center gap-0.5">
        {COLOR_SCALE.map((step, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className="w-5 h-3 rounded-sm"
              style={{ backgroundColor: step.color }}
            />
            {step.label && (
              <span className="text-gray-500 text-xs mt-1">{step.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Legend