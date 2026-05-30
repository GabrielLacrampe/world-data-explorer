export const MAP_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap © CARTO',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0d1117' },
    },
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      paint: { 'raster-opacity': 0.4 },
    },
  ],
}