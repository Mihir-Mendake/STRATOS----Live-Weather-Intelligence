# 🌐 STRATOS WEATHER — Atmospheric & Climate Intelligence Suite

[![Stratos Suite](https://img.shields.io/badge/STRATOS-Climate%20Intelligence%20Suite-0284c7?style=for-the-badge&logo=satellite&logoColor=white)](https://github.com/Mihir-Mendake/STRATOS----Live-Weather-Intelligence)
[![WebGL 3D Earth](https://img.shields.io/badge/WebGL-Three.js%20%2F%20Globe.gl-059669?style=for-the-badge&logo=webgl&logoColor=white)](https://globe.gl/)
[![Chart.js 4.4](https://img.shields.io/badge/Telemetry-Chart.js%20v4.4-f59e0b?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Node.js Express](https://img.shields.io/badge/Backend-Express.js%20%2B%20Open--Meteo-6366f1?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

**Stratos Weather** is a full-stack, 3-page **Atmospheric & Climate Intelligence Suite** designed for meteorologists, geography students, data scientists, and daily users. It combines real-time numerical weather prediction, interactive 3D WebGL Earth modeling with geophysical layers (Rossby waves, ocean gyres, tectonic fault lines), deep multi-axis telemetry graphs, and scientific CSV/JSON data export pipelines.

---

## 🏛️ Multi-Page Suite Architecture

```
STRATOS----Live-Weather-Intelligence/
├── index.html        # Page 1: Live Synoptic Weather Dashboard
├── globe.html        # Page 2: 3D Earth Geophysical Climate Sphere
├── analytics.html    # Page 3: Synoptic Climate Analytics & Telemetry Engine
├── style.css         # Unified Aerospace Glassmorphic Design System & Vector Icons
├── script.js         # Dashboard Logic, Weather Canvas Particle Engine & Caching
├── globe.js          # WebGL 3D Globe Controller, Rossby Waves & Ocean Conveyor
├── analytics.js      # Chart.js 4.4 Engine, Scientific CSV/JSON Export & Snapshots
├── server/           # Express.js Backend Proxy, Caching & Favorites Storage
│   ├── server.js     # Express server & static asset host
│   └── routes/       # Weather, search & favorites proxy routes
└── ROADMAP.md        # Feature Spec & Architecture Document
```

---

## 🌟 The 3-Page Suite

### 🌤️ Page 1: Live Weather Dashboard (`index.html`)
- **Real-Time Atmospheric Observation**: Ambient & apparent ("feels like") temperature, relative humidity, wind velocity with cardinal bearing, barometric surface pressure, UV index, and visibility.
- **24-Hour Horizontal Hourly Micro-Forecast**: Responsive scrollable strip with interactive left/right navigation controls and hourly condition icons.
- **7-Day Extended Forecast**: Synoptic thermal outlook with daily maximums and minimums.
- **Atmospheric Canvas Particle Simulator**: Live HTML5 Canvas rendering dynamic weather particles (falling raindrops, snowflakes, storm lightning, sunny dust motes, and foggy clouds).
- **Persistent Bookmarks & Search History**: Save and manage global stations stored across sessions.

---

### 🌐 Page 2: 3D Earth Climate Sphere (`globe.html`)
Powered by **Three.js** and **Globe.gl** with real physical geography:
- **Continuous Rossby Planetary Waves (Jet Streams)**: Realistic mathematical harmonic wave superposition simulating upper-troposphere meandering winds (~10–12 km altitude) with Coriolis deflection.
- **Closed-Loop Oceanic Gyres & Global Conveyor Belt**: Continuous circulating ocean currents including the Gulf Stream, North Atlantic Drift, Kuroshio, California Current, and the Great Global Ocean Conveyor.
- **Tectonic Plates & Ring of Fire**: Real global fault line boundaries (Pacific Ring of Fire, Mid-Atlantic Ridge) for educational geography exploration.
- **Pole-to-Pole Geographic Graticule**: Continuous meridians ($-90^\circ$ to $+90^\circ$) converging at the poles, alongside equator and tropic rings ($360^\circ$ closed parallels).
- **Global Thermal Heatmap**: Real-time color-ramped temperature distribution across latitude bands.
- **Student Station Inspector**: Inspect any global pin to examine coordinates, elevation, live conditions, local solar time, and automated **Köppen-Geiger climate classification** (e.g. *Cfa — Humid Subtropical*, *Cfb — Oceanic*, *Aw — Tropical Savanna*).
- **Smooth Fly-To Orbiting**: 21 pre-pinned global hubs with cinematic camera transitions.

---

### 📊 Page 3: Climate Analytics & Telemetry (`analytics.html`)
A scientific visualization engine powered by **Chart.js 4.4**:
1. **24-Hour Diurnal Temperature Spline**: Dual-series curve comparing ambient temperature vs. thermal perception (feels-like) with shaded boundary layer fill.
2. **7-Day Thermal Amplitude**: Grouped high/low bars illustrating weekly warming and cooling trends.
3. **Atmospheric Front Correlation (Tri-Axis)**: Correlates **Relative Humidity (%)**, **Wind Speed (km/h or mph)**, and **Barometric Pressure (hPa or inHg)** to track storm fronts.
4. **Diurnal Solar UV Radiation Trajectory**: Solar insolation bell-curve showing peak UV intensity, sunrise/sunset daylight thresholds, and WHO risk tiers.
5. **Aerosol Chemistry & AQI Polar Radar**: Radar analysis of $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{O}_3$, and $\text{CO}$.
6. **Precipitation Probability & Accumulation**: Dual-axis bar and spline combo chart tracking rain probability ($0–100\%$) against expected volume ($\text{mm}$ or $\text{in}$).

#### 📥 Scientific Export & Snapshot Engine:
- **`📊 Export CSV Data`**: One-click download of clean, structured numerical tabular data for data analysis in Python, R, or Excel.
- **`📑 Export Raw JSON`**: Raw numerical model package, station metadata, and atmospheric chemistry payloads.
- **`📷 HD Chart Snapshots`**: Off-screen canvas generator rendering high-resolution PNG charts with dark slate branding, station coordinates, timestamps, and an embedded **`INDICATORS:` visual dataset legend bar** (distinguishing solid ambient vs. dashed feels-like lines).

---

## 🧭 Cross-Suite Synchronization

- **Persistent City State**: Selecting or searching any city on the Dashboard orbits to that location on 3D Earth, and opens that city's graphs on Analytics via `localStorage` and URL parameters (`?city=Tokyo`).
- **Global Unit Toggle (`°C / °F`)**: Instant switching across temperature, wind velocity ($\text{km/h}$ vs. $\text{mph}$), barometric pressure ($\text{hPa}$ vs. $\text{inHg}$), and visibility ($\text{km}$ vs. $\text{mi}$) without reloading the page.
- **Aesthetic Instrument Standards**: Vector SVG icon system, **JetBrains Mono** tabular telemetry typography, and live ECMWF NWP stream indicators.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Mihir-Mendake/STRATOS----Live-Weather-Intelligence.git
cd STRATOS----Live-Weather-Intelligence
npm install
```

### 2. Run the Application
```bash
npm start
```
For live development with auto-reload:
```bash
npm run dev
```

### 3. Open in Browser
Visit **`http://localhost:5000`**:
- [**Dashboard**](http://localhost:5000/index.html): `http://localhost:5000/index.html`
- [**3D Earth Sphere**](http://localhost:5000/globe.html): `http://localhost:5000/globe.html`
- [**Climate Analytics**](http://localhost:5000/analytics.html): `http://localhost:5000/analytics.html`

---

## 📡 REST API Proxy Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/weather` | `GET` | Aggregated weather forecast payload (`?city=Name` or `?lat=..&lon=..`) |
| `/api/search` | `GET` | Autocomplete geocoding service (`?q=Query`) |
| `/api/favorites` | `GET` / `POST` / `DELETE` | Persistent station bookmarks |
| `/api/history` | `GET` / `POST` | Recent query telemetry history |
| `/api/health` | `GET` | Server uptime and health verification |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Core** | HTML5, CSS3 Glassmorphism, Modern JavaScript (ES6+ Modules) |
| **3D Sphere & Physics** | [Three.js](https://threejs.org/), [Globe.gl](https://globe.gl/), WebGL 2.0 |
| **Data Visualization** | [Chart.js 4.4](https://www.chartjs.org/) |
| **Typography** | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) |
| **Backend & Proxy** | Node.js, Express.js, In-Memory Caching Proxy |
| **Numerical Models** | [Open-Meteo](https://open-meteo.com/) (ECMWF, GFS, DWD ICON, Copernicus) |

---

## 📄 License
MIT License. Built for hackathon innovation, scientific education, and open-source weather intelligence.
