import { useEffect, Fragment, useState } from 'react'
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, ZoomControl, Circle, useMap, useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import { DEFAULT_CENTER, DEFAULT_ZOOM, ROUTE_SAFE_COLOR, ROUTE_UNSAFE_COLOR } from '../data/mockData'

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

const userIcon = L.divIcon({
  html: '<div class="user-marker"></div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const navIconSafe = L.divIcon({
  html: '<div class="nav-marker"></div>',
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const navIconUnsafe = L.divIcon({
  html: '<div class="nav-marker-unsafe"></div>',
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const destIcon = L.divIcon({
  html: `<div style="
    width:36px;height:36px;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    border:3px solid white;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:16px;
    box-shadow:0 0 0 8px rgba(34,197,94,0.25),0 4px 12px rgba(0,0,0,0.4);
  ">📍</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

const incidentIcon = (severity) => {
  const isHigh = severity === 'high'
  const cls = isHigh ? 'incident-high' : 'incident-medium'
  const border = isHigh ? '#EF4444' : '#F87171'
  const bg = isHigh ? 'rgba(239,68,68,0.35)' : 'rgba(248,113,113,0.25)'
  return L.divIcon({
    html: `<div class="${cls}" style="
      width:34px;height:34px;border-radius:50%;
      background:${bg};
      border:2px solid ${border};
      display:flex;align-items:center;justify-content:center;
      font-size:15px;cursor:pointer;
    ">${isHigh ? '🚨' : '⚠️'}</div>`,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

const safeSpaceIcon = (icon) => L.divIcon({
  html: `<div class="safe-space-marker">${icon}</div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

const customWarningIcon = L.divIcon({
  html: `<div class="incident-high" style="
    width:32px;height:32px;border-radius:50%;
    background:rgba(239,68,68,0.3);
    border:2px solid #EF4444;
    display:flex;align-items:center;justify-content:center;
    font-size:15px;
  ">⚠️</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const originIcon = L.divIcon({
  html: `<div style="
    width:32px;height:32px;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    border:3px solid white;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:14px;
    box-shadow:0 0 0 6px rgba(34,197,94,0.2),0 4px 12px rgba(0,0,0,0.4);
  ">🚶</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const ZONE_CONFIG = {
  high:   { color: '#EF4444', radius: 150, fillOpacity: 0.12, opacity: 0.4 },
  medium: { color: '#F87171', radius: 110, fillOpacity: 0.09, opacity: 0.32 },
  low:    { color: '#FCA5A5', radius: 80,  fillOpacity: 0.06, opacity: 0.24 },
}

function PulsingDangerZone({ center, severity }) {
  const zone = ZONE_CONFIG[severity] ?? ZONE_CONFIG.medium
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setPulse(p => (p + 1) % 100), 80)
    return () => clearInterval(id)
  }, [])

  const scale = 1 + Math.sin((pulse / 100) * Math.PI * 2) * 0.12
  const fillOpacity = zone.fillOpacity + Math.sin((pulse / 100) * Math.PI * 2) * 0.04

  return (
    <Circle
      center={center}
      radius={zone.radius * scale}
      pathOptions={{
        color: zone.color,
        fillColor: zone.color,
        fillOpacity,
        opacity: zone.opacity,
        weight: 2,
        className: 'danger-zone-pulse',
      }}
    />
  )
}

function MapController({ userLocation, origin, destination, routes, isNavigating, navPosition }) {
  const map = useMap()

  useEffect(() => {
    if (isNavigating && navPosition) {
      map.flyTo([navPosition.lat, navPosition.lng], 17, { duration: 0.8 })
      return
    }
    if (!userLocation || destination) return
    map.flyTo([userLocation.lat, userLocation.lng], DEFAULT_ZOOM, { duration: 1.5 })
  }, [isNavigating, navPosition?.lat, navPosition?.lng]) // eslint-disable-line

  useEffect(() => {
    if (isNavigating) return
    if (!routes.length) return
    const routeCoords = routes
      .flatMap(r => r.geometry?.coordinates ?? [])
      .map(([lng, lat]) => [lat, lng])
    const extra = []
    const start = origin ?? userLocation
    if (start)       extra.push([start.lat, start.lng])
    if (destination) extra.push([destination.lat, destination.lng])
    const all = [...routeCoords, ...extra]
    if (!all.length) return
    map.fitBounds(all, { padding: [80, 60], maxZoom: 16 })
  }, [routes, origin, destination, isNavigating]) // eslint-disable-line

  return null
}

function MapClickHandler({ onMapClick, isNavigating }) {
  useMapEvents({
    click(e) {
      if (isNavigating) return
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function IncidentPopup({ inc }) {
  const color = inc.severity === 'high' ? '#EF4444' : '#F87171'
  return (
    <div>
      <div style={{ fontWeight: 700, color, marginBottom: 4 }}>{inc.type}</div>
      {inc.description && (
        <div style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 2 }}>{inc.description}</div>
      )}
      <div style={{ color: '#6B7280', fontSize: 10 }}>
        {inc.time} · {inc.reportCount ?? 1} report{(inc.reportCount ?? 1) === 1 ? '' : 's'}
      </div>
      <div style={{ color: '#EF4444', fontSize: 10, marginTop: 6, fontWeight: 600 }} className="warning-blink">
        ● Active alert
      </div>
    </div>
  )
}

function SafeSpacePopup({ space }) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{space.icon} {space.name}</div>
      <div style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 4 }}>{space.type} · {space.distance}</div>
      {space.open
        ? <span style={{ color: '#22C55E', fontSize: 11, fontWeight: 600 }}>Open until {space.openUntil}</span>
        : <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>Closed</span>}
      {space.womenVerified && (
        <span style={{ color: '#F472B6', fontSize: 10, marginLeft: 8 }}>✓ Women-verified</span>
      )}
    </div>
  )
}

function RoutePolylines({ routes, safetyScores, selectedRouteIndex, isNavigating, navProgress, onRouteClick }) {
  return routes.map((route, i) => {
    const safety = safetyScores?.[i]
    const isSafe = safety?.isRecommended ?? safety?.safetyClass === 'safe'
    const color = isSafe ? ROUTE_SAFE_COLOR : ROUTE_UNSAFE_COLOR
    const isSelected = i === selectedRouteIndex
    const positions = (route.geometry?.coordinates ?? []).map(([lng, lat]) => [lat, lng])
    if (!positions.length) return null

    const glowClass = isSafe ? 'leaflet-route-glow-safe' : 'leaflet-route-glow-unsafe'
    const opacity = isNavigating ? (isSelected ? 1 : 0.12) : (isSelected ? 1 : 0.45)

    const progressIdx = Math.floor((navProgress ?? 0) * Math.max(positions.length - 1, 1))
    const traveled = isNavigating && isSelected ? positions.slice(0, progressIdx + 1) : []
    const remaining = isNavigating && isSelected ? positions.slice(progressIdx) : positions

    return (
      <Fragment key={`route-group-${i}`}>
        <Polyline
          positions={positions}
          pathOptions={{
            color,
            weight: isSelected ? 22 : 14,
            opacity: isSelected ? 0.14 : 0.08,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false,
            className: glowClass,
          }}
        />
        <Polyline
          positions={positions}
          pathOptions={{
            color,
            weight: isSelected ? 14 : 8,
            opacity: isSelected ? 0.22 : 0.12,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false,
          }}
        />
        {traveled.length > 1 && (
          <Polyline
            positions={traveled}
            pathOptions={{
              color: '#4B5563',
              weight: 6,
              opacity: 0.5,
              lineCap: 'round',
              lineJoin: 'round',
              interactive: false,
            }}
          />
        )}
        <Polyline
          positions={isNavigating && isSelected && remaining.length ? remaining : positions}
          pathOptions={{
            color,
            weight: isSelected ? 8 : 5,
            opacity,
            lineCap: 'round',
            lineJoin: 'round',
            className: glowClass,
          }}
          eventHandlers={{ click: () => !isNavigating && onRouteClick?.(i) }}
        />
        {isSelected && (
          <Polyline
            positions={isNavigating && remaining.length ? remaining : positions}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              opacity: isNavigating ? 0.35 : 0.15,
              dashArray: '8 14',
              lineCap: 'round',
              interactive: false,
            }}
          />
        )}
      </Fragment>
    )
  })
}

export default function MapView({
  userLocation,
  origin,
  destination,
  routes,
  safetyScores,
  selectedRouteIndex,
  incidents,
  safeSpaces,
  showSafeSpaces,
  customMarkers,
  isNavigating,
  navPosition,
  navProgress,
  isUnsafeRoute,
  onRouteClick,
  onMapClick,
}) {
  const displayLocation = (isNavigating && navPosition) ? navPosition : (!isNavigating && origin ? null : userLocation)

  return (
    <MapContainer
      center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full"
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <ZoomControl position="bottomright" />

      <MapController
        userLocation={userLocation}
        origin={origin}
        destination={destination}
        routes={routes}
        isNavigating={isNavigating}
        navPosition={navPosition}
      />

      <MapClickHandler onMapClick={onMapClick} isNavigating={isNavigating} />

      {incidents.map(inc => (
        <PulsingDangerZone
          key={`zone-${inc.id}`}
          center={[inc.lat, inc.lng]}
          severity={inc.severity}
        />
      ))}

      <RoutePolylines
        routes={routes}
        safetyScores={safetyScores}
        selectedRouteIndex={selectedRouteIndex}
        isNavigating={isNavigating}
        navProgress={navProgress}
        onRouteClick={onRouteClick}
      />

      {isNavigating && navPosition && (
        <Marker
          position={[navPosition.lat, navPosition.lng]}
          icon={isUnsafeRoute ? navIconUnsafe : navIconSafe}
          zIndexOffset={1100}
        />
      )}

      {!isNavigating && userLocation && !origin && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={1000} />
      )}

      {origin && !isNavigating && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon} zIndexOffset={850}>
          <Popup><b>From: {origin.name}</b></Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destIcon} zIndexOffset={900}>
          <Popup><b>{destination.name}</b></Popup>
        </Marker>
      )}

      {incidents.map(inc => (
        <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={incidentIcon(inc.severity)} zIndexOffset={600}>
          <Popup><IncidentPopup inc={inc} /></Popup>
        </Marker>
      ))}

      {(customMarkers ?? []).map(m => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={customWarningIcon} zIndexOffset={500}>
          <Popup>
            <div>
              <div style={{ fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>{m.type ?? 'Warning'}</div>
              {m.description && <div style={{ color: '#9CA3AF', fontSize: 11 }}>{m.description}</div>}
              <div style={{ color: '#6B7280', fontSize: 10, marginTop: 4 }}>Just now · You reported this</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {showSafeSpaces && safeSpaces.map(space => (
        <Marker key={space.id} position={[space.lat, space.lng]} icon={safeSpaceIcon(space.icon)}>
          <Popup><SafeSpacePopup space={space} /></Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
