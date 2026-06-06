export const MAP_STYLE = {
  version: 8,
  sources: {
    'stadia-tiles': {
      type: 'raster',
      tiles: ['https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'],
      tileSize: 256,
      attribution: '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0a0e1a' },
    },
    {
      id: 'stadia-tiles',
      type: 'raster',
      source: 'stadia-tiles',
      paint: { 'raster-opacity': 0.7 },
    },
  ],
}