import { LAYERS } from '../App'
import useStore from '../store/useStore'

const COLOR_SCALE = [
  '#0f172a', '#164e63', '#0369a1', '#0284c7',
  '#059669', '#65a30d', '#ca8a04', '#ea580c',
  '#dc2626', '#9f1239',
]

function Legend() {
  const activeLayer = useStore((state) => state.activeLayer)
  const layer = LAYERS[activeLayer]

  if (!layer || activeLayer === 'none') return null
  if (!layer.property && !layer.indicator && !layer.staticKey) return null

  const unit = layer.unit ?? ''

  return (
    <div className="absolute bottom-8 left-4 z-20
                    bg-gray-950 bg-opacity-80 backdrop-blur-sm
                    border border-gray-800 rounded p-3 min-w-40">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
        {layer.label}
        {unit && <span className="text-gray-600 normal-case"> · {unit}</span>}
      </p>
      <div className="flex items-center gap-px">
        {COLOR_SCALE.map((color, i) => (
          <div
            key={i}
            className="h-2 flex-1 first:rounded-l last:rounded-r"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-gray-600 text-xs">Low</span>
        <span className="text-gray-600 text-xs">High</span>
      </div>
      {layer.attribution && (
        <p className="text-gray-700 text-xs mt-2">Source: {layer.attribution}</p>
      )}
    </div>
  )
}

export default Legend