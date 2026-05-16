# HerWayApp
# HerWay

## Navigation Designed Around Safety, Not Just Speed

HerWay is a real-time community-powered safety navigation platform that helps users choose safer walking routes based on live environmental and community-driven safety data rather than only the fastest path.

The platform combines AI-powered route recommendations, crowd-sourced safety alerts, trusted safe spaces, accessibility-aware navigation, and emergency protection tools into one intelligent mapping experience.

Built for the Oxford x Lumina Hackathon.

---

# Features

## AI-Powered Safe Routing

HerWay dynamically generates multiple route recommendations and visually classifies them based on safety.

### Route Colors

* 🟢 Green Route → safest recommended route
* 🔴 Red Route → unsafe route containing active alerts or higher-risk areas

The route recommendation engine evaluates:

* time of day
* recent incidents
* street lighting
* isolated areas
* accessibility obstacles
* construction zones
* flood warnings
* nearby CCTV coverage
* verified safe locations
* real-time community alerts
* reports from other HerWay users

---

## Community-Powered Safety Alerts

Users can report unsafe situations directly on the map.

### Example Reports

* poor lighting
* harassment
* suspicious activity
* flooding
* construction obstacles
* broken streetlights
* unsafe atmosphere
* accessibility issues

Reports appear as animated live alerts on the map.

Users can also optionally notify nearby HerWay users when submitting a report.

---

## Smart Safety Explanations

Clicking an unsafe red route opens a detailed explanation panel showing why the route is considered dangerous.

### Example Safety Reasons

* Recent harassment reports detected
* Poor lighting after 10PM
* Low pedestrian activity
* Construction blocking sidewalks
* Multiple users reported feeling unsafe
* Broken CCTV coverage nearby

---

## Real-Time Navigation

After selecting a route, HerWay enters live navigation mode similar to Google Maps.

### Navigation Features

* turn-by-turn navigation
* live route tracking
* moving user location indicator
* dynamic rerouting
* estimated walking time
* live safety updates during navigation

---

## Emergency Safety Mode

HerWay includes discreet emergency protection tools.

### Emergency Features

* fake incoming call simulation
* trusted contact alerts
* live location sharing
* emergency warning overlays
* nearby safe-space suggestions

---

## Trusted Safe Spaces

The platform highlights verified safer locations nearby.

### Examples

* cafés
* libraries
* Safe Lodge locations
* university buildings
* stores with CCTV
* late-night safe spaces

Each location may include:

* safety rating
* CCTV badge
* accessibility score
* open/closed status
* lighting quality score

---

# Tech Stack

## Frontend

* React
* Vite
* TailwindCSS
* TypeScript

## Mapping

* OpenStreetMap
* Leaflet
* React-Leaflet

## Backend / Realtime

* Supabase

## Deployment

* Vercel

---

# Mobile Responsive

HerWay is fully responsive and optimized for:

* iPhone
* Android devices
* tablets
* desktop browsers

The interface is designed to feel similar to modern navigation applications such as Apple Maps and Google Maps.

---

# Demo Features

The project includes mocked live activity and simulated realtime interactions for hackathon presentation purposes.

### Simulated Features

* live alerts
* dynamic safety score updates
* route verification activity
* nearby user activity
* community check-ins
* animated safety zones

---

# Installation

## Clone Repository

```bash
git clone https://github.com/padmeamd/HerWayApp.git
```

## Navigate Into Project

```bash
cd HerWayApp
```

## Install Dependencies

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

---

# Future Improvements

* real AI route optimization
* police and Safe Lodge integrations
* live CCTV partnership integration
* verified user authentication
* wearable safety integration
* push notifications
* machine-learning-based risk scoring
* live crowd density analysis

---

# Vision

HerWay reimagines navigation as something that prioritizes human comfort, accessibility, and safety instead of pure efficiency.

The goal is not only to help people arrive faster, but to help them feel safer while moving through cities.

Because sometimes the shortest route is not the safest one.

---

# Team

Built during the Oxford x Lumina Hackathon.

- Daria Konstantinova
- Aya Oulhint
- Naveed Dogar
- Juliana Choi

---


