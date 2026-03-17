# PROJECT MIDNIGHT — Global Catastrophe Simulation Platform

> An interactive, physics-based global catastrophe simulator. Click anywhere on Earth and model five world-ending scenarios in real time — with animated playback, 3D globe rendering, live geopolitical intelligence, and AI-generated aftermath narratives.

---

## Live Demo

_Coming soon — deployment in progress_

---

## What It Does

PROJECT MIDNIGHT lets you simulate five distinct catastrophic scenarios on an interactive world map:

| Scenario | Physics Engine | What It Calculates |
|----------|---------------|-------------------|
| ☢ **Nuclear Strike** | Glasstone-Dolan scaling laws | Fireball, blast zones (20/5/1 psi), thermal radius, fallout plume |
| ☄ **Asteroid Impact** | Collins et al. (2005) — Purdue/Imperial College | Energy (megatons), crater, seismic magnitude, tsunami height, casualties |
| ⚡ **EMP Attack** | EMP Commission Reports (2004/2008) | E1/E2/E3 components, coverage radius, infrastructure kill zones, recovery timeline |
| 🦠 **Pandemic** | SEIR epidemiological model | Day-by-day curves, peak infection, mortality, vaccine deployment |
| 🧟 **Zombie Outbreak** | Modified SEIR + outbreak mechanics | 50+ zombie types from film/TV/games/literature, each with unique R0/speed/intelligence |

---

## Features

### Simulation & Physics
- Real-world physics formulas — not approximations
- Weapon presets: W76, W88, Tsar Bomba, Little Boy, RS-28 Sarmat, DF-41, and more
- Asteroid types: Chelyabinsk-class bolide → extinction-level 10km impactor
- Pandemic pathogens: COVID-19, Ebola, H5N1, smallpox, bubonic plague, custom bioweapons
- Zombie database: 50+ types (Classic Romero, 28 Days Later, Cordyceps/TLOU, T-Virus, Solanum, and more)

### Timeline Playback
Press **Play** and watch the simulation animate forward in time:
- Nuclear: fireball expands → blast rings grow → fallout plume drifts
- Zombie/Pandemic: outbreak radius spreads day by day
- Speed controls: 1× / 5× / 10× / 50×

### Dual Map System
**2D mode (Leaflet)** with 7 map styles:
- Dark, Light, Auto, Street, Satellite, Topo
- **FLIR thermal mode** — authentic green-hot thermal imaging palette

**3D Globe mode (CesiumJS)**:
- Real-time sun position based on actual current time
- NASA Black Marble night lights (city glow in shadow)
- OpenStreetMap 3D buildings — zoom into any city like Google Earth
- Geolocation sync — fly to your GPS position with accurate local sun/shadow

### AI Intelligence
- **AI Narrative Engine** (Claude API) — streams hour-by-hour aftermath, 7-day survival journal, and geopolitical analysis
- **Geopolitical Prediction Engine** — 30/90/180-day risk assessments with historical precedent matching
- Falls back to pre-written expert content when no API key is configured

### Live Data
- NOAA NWS real-time wind data (for fallout modeling)
- FEMA disaster declarations and IPAWS archived alerts
- GNews live geopolitical headlines with escalation scoring
- OpenCage geocoding (address → coordinates)

---

## Tech Stack

```
Frontend                    Backend
─────────────────────────   ──────────────────────────
React 18 + TypeScript       Node.js + Express + TypeScript
Vite (code-split bundles)   REST + Server-Sent Events (SSE)
Tailwind CSS                NOAA / GNews / FEMA / OpenCage proxies
Zustand (state)             Anthropic Claude API (AI narratives)
Leaflet + React-Leaflet
CesiumJS (3D globe)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A free [Cesium ion account](https://ion.cesium.com) (for 3D buildings + night lights)
- Optional: [GNews API key](https://gnews.io) (free tier available)
- Optional: [Anthropic API key](https://console.anthropic.com) (for live AI narratives)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/project-midnight.git
cd project-midnight
npm install        # installs root + workspace dependencies
```

### Configuration

```bash
cd backend
cp .env.example .env
# Edit .env and add your API keys
```

### Running

```bash
# From the project root — starts both frontend (port 5173) and backend (port 7001)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **Note:** 3D mode requires a Cesium ion access token. Click the 3D button and enter your token when prompted — it's saved to localStorage.

---

## Project Structure

```
gcsp/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Map/          # SimulationMap, CesiumView, BlastRings, FalloutPlume
│       │   ├── Controls/     # StrikeConfigPanel, YieldSelector, AddressLookup
│       │   ├── Zombie/       # ZombiePanel, ZombieStats, ZombieMapLayer
│       │   ├── Asteroid/     # AsteroidPanel, AsteroidResultsPanel
│       │   ├── EMP/          # EMPPanel, EMPResultsPanel
│       │   ├── Pandemic/     # PandemicPanel, PandemicStats
│       │   ├── Timeline/     # TimelineBar (playback system)
│       │   ├── Geopolitics/  # GeopoliticsPanel, PredictionPanel
│       │   └── Layout/       # TopBar, DoomsdayClock
│       ├── stores/           # Zustand: simulation, zombie, asteroid, EMP, pandemic, timeline
│       └── utils/            # Physics engines: nuclear, asteroid, EMP, pandemic, zombie
└── backend/
    └── src/
        └── routes/           # geocode, weather, news, fema, narrative, prediction
```

---

## Screenshots

_Coming soon_

---

## Roadmap

- [x] Nuclear simulation (Glasstone-Dolan physics)
- [x] Zombie outbreak (50+ types, SEIR model)
- [x] Asteroid impact (Collins 2005 model)
- [x] EMP attack (HEMP E1/E2/E3 components)
- [x] Pandemic modeling (SEIR + real pathogens)
- [x] 3D globe mode (CesiumJS + OSM buildings + night lights)
- [x] Timeline playback system
- [x] AI narrative engine (Claude API)
- [x] Geopolitical prediction engine
- [ ] Full zombie library (200+ types)
- [ ] Mobile PWA (offline support)
- [ ] FEMA shelter locator
- [ ] Historical scenarios (Cuban Missile Crisis, Cold War targets)
- [ ] AR mode (mobile overlay)

---

## Disclaimer

PROJECT MIDNIGHT is an **educational simulation tool** built for emergency preparedness awareness, academic research, and public understanding of catastrophic risk. All physics models are simplified approximations for educational purposes. No classified or export-controlled data is used.

---

## Author

Built by Isaiah Smith — [Portfolio](#) · [GitHub](#)

---

## License

MIT
