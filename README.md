# World Data Explorer

Interactive world map showing real-time economic, demographic, 
and migration data by country.
Built as a portfolio project while studying Multimedia Application Development.

## Live Demo
https://grand-world-data-explorer.vercel.app/

## Tech Stack
- **React** + Vite
- **MapLibre GL JS** + react-map-gl — interactive WebGL map
- **Tailwind CSS** — styling
- **REST Countries API** — country data
- **Vercel** — deployment

## Features
- [x] Full-screen interactive map (MapLibre GL JS / WebGL)
- [x] Country selection with animated sidebar
- [x] Economy tab: geography, demographics, GDP, unemployment, CO₂, military spending
- [x] 8 color layers: population, area, GDP per capita, GDP growth, unemployment, life expectancy, CO₂, military spending
- [x] Layer selector in top bar
- [x] Color scale legend with unit labels
- [x] World Bank API integration with per-layer caching
- [x] Active conflicts layer — ACLED (Phase 4, via `/api/conflicts` proxy)
- [ ] Geopolitics tab: alliances, democracy index (Phase 5)
- [ ] Country relations layer (Phase 6)

## Conflicts layer (ACLED)

Credentials stay on the server via [`api/conflicts.js`](api/conflicts.js). Copy [`.env.example`](.env.example) to `.env` and set `ACLED_EMAIL` / `ACLED_PASSWORD` (myACLED account). Add the same variables in the Vercel project settings for production.

Local dev with the API route: `npx vercel dev` (not `npm run dev` alone).

## About
Built as a portfolio project while studying Multimedia Application Development.
Actively in development — see commit history for progress.