export const MAP_STYLE = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'stadia-tiles': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: '© Esri, US National Park Service',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#b8d4e8' },
    },
    {
      id: 'stadia-tiles',
      type: 'raster',
      source: 'stadia-tiles',
      paint: {
        'raster-opacity': 1.0,
        'raster-saturation': 0.4,
        'raster-brightness-max': 0.38,  // 1.0 = original, bajar oscurece
        'raster-contrast': 0.45,        // sube contraste para que los colores sigan vivos
      },
    },
  ],
}