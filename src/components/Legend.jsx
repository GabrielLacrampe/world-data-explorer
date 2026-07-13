import LayerPicker from './legend/LayerPicker'
import LegendPanel from './legend/LegendPanel'

/**
 * The floating panel stack on the map's bottom-right: the layer picker on
 * top, the context-dependent legend below it.
 */
export default function DataPanel() {
  return (
    // bottom-8 clears the MapLibre attribution bar (~32px)
    <div className="absolute bottom-8 right-4 z-20 flex flex-col gap-2 items-end">
      <LayerPicker />
      <LegendPanel />
    </div>
  )
}
