import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import ReportModal from './components/ReportModal'
import EmergencyOverlay from './components/EmergencyOverlay'
import SafetySettings from './components/SafetySettings'
import AuthModal from './components/AuthModal'
import NavigationPanel from './components/NavigationPanel'
import NavigationHUD from './components/NavigationHUD'
import MobileRoutePanel from './components/MobileRoutePanel'
import UnsafeRouteConfirm from './components/UnsafeRouteConfirm'
import UnsafeRouteDetailPanel from './components/UnsafeRouteDetailPanel'
import { useGeolocation } from './hooks/useGeolocation'
import { useNavigation } from './hooks/useNavigation'
import { useLiveActivity } from './hooks/useLiveActivity'
import { useBreakpoint } from './hooks/useBreakpoint'
import { useBodyScrollLock } from './hooks/useBodyScrollLock'
import { calculateRoutes, validateLocations } from './services/routingService'
import {
  getOrCreateTopic, loadContactName,
  sendEmergencyAlert, sendLocationUpdate,
} from './services/notificationService'
import { MOCK_INCIDENTS, MOCK_SAFE_SPACES } from './data/mockData'
import { analyzeRoutes } from './services/safetyEngine'
import { onAuthStateChange, subscribeToIncidents } from './lib/supabase'

function getNearestSafeSpace(lat, lng, spaces) {
  if (!spaces.length) return null
  return spaces.reduce((nearest, space) => {
    const d = Math.hypot(space.lat - lat, space.lng - lng)
    const nd = Math.hypot(nearest.lat - lat, nearest.lng - lng)
    return d < nd ? space : nearest
  })
}

export default function App() {
  // ── Location ────────────────────────────────────────────────────────────
  const { location: userLocation } = useGeolocation()

  // ── Route state ─────────────────────────────────────────────────────────
  const [origin, setOrigin] = useState(null)          // null = use live userLocation
  const [destination, setDestination] = useState(null)
  const [routes, setRoutes] = useState([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [safetyScores, setSafetyScores] = useState([])
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false)

  // ── Safety state ─────────────────────────────────────────────────────────
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS)
  const [safeSpaces] = useState(MOCK_SAFE_SPACES)
  const [showSafeSpaces, setShowSafeSpaces] = useState(false)

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isNavigating, setIsNavigating] = useState(false)
  const [showUnsafeConfirm, setShowUnsafeConfirm] = useState(false)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [activeAlert, setActiveAlert] = useState(null)
  const [routeError, setRouteError] = useState(null)
  /** @type {'peek' | 'routes' | 'plan' | 'full'} */
  const [mobilePanelSnap, setMobilePanelSnap] = useState('peek')
  const [unsafeDetailIndex, setUnsafeDetailIndex] = useState(null)
  const [showRouteOverview, setShowRouteOverview] = useState(false)

  // ── Community / live activity state ──────────────────────────────────────
  const [communityToast, setCommunityToast] = useState(null)
  const [customMarkers, setCustomMarkers] = useState([])
  const [reportLocation, setReportLocation] = useState(null)
  const { activity: liveActivity, dismiss: dismissLiveActivity } = useLiveActivity()

  // ── Auth ─────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null)

  // ── ntfy notification state ───────────────────────────────────────────────
  // alertStatus tracks the live send state shown in EmergencyOverlay
  const [alertStatus, setAlertStatus] = useState('idle') // 'idle'|'sending'|'sent'|'failed'
  const [contactName, setContactName] = useState(() => loadContactName())

  // Refresh contact name whenever settings closes
  const handleSettingsClose = () => {
    setShowSettings(false)
    setContactName(loadContactName())
  }

  // ── Emergency triple-click ────────────────────────────────────────────────
  const emergencyClickCount = useRef(0)
  const emergencyTimer = useRef(null)

  // ── Supabase ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChange(setUser)
    return unsub
  }, [])

  useEffect(() => {
    const unsub = subscribeToIncidents((inc) => {
      setIncidents(prev => [{
        id: inc.id, type: inc.type, description: inc.description,
        lat: inc.lat, lng: inc.lng, severity: inc.severity,
        time: 'Just now', reportCount: 1,
      }, ...prev])
    })
    return () => unsub?.()
  }, [])

  // ── Live safety re-analysis when incidents change ────────────────────────
  // Runs safetyEngine again whenever a new incident is reported so the route
  // cards update in real time without recalculating the actual paths.
  useEffect(() => {
    if (!routes.length) return
    setSafetyScores(analyzeRoutes(routes, { incidents, safeSpaces }))
  }, [incidents]) // eslint-disable-line

  // ── Route calculation ─────────────────────────────────────────────────────
  const calcRoutes = async (from, to) => {
    // Validate both endpoints are within Oxford before hitting OSRM
    const { valid, error } = validateLocations(from, to)
    if (!valid) {
      setRouteError(error)
      setRoutes([])
      setSafetyScores([])
      setIsLoadingRoutes(false)
      return
    }

    setRouteError(null)
    setIsLoadingRoutes(true)
    setRoutes([])
    setSafetyScores([])
    setUnsafeDetailIndex(null)
    const result = await calculateRoutes(from, to, { incidents, safeSpaces })
    setRoutes(result)
    const scores = analyzeRoutes(result, { incidents, safeSpaces })
    setSafetyScores(scores)
    const recIdx = scores.findIndex(s => s?.isRecommended)
    setSelectedRouteIndex(recIdx >= 0 ? recIdx : 0)
    setIsLoadingRoutes(false)
  }

  const handleDestinationSelect = useCallback(async (place) => {
    setDestination(place)
    setIsNavigating(false)
    setMobilePanelSnap('plan')
    const from = origin ?? userLocation
    if (!from) return
    await calcRoutes(from, place)
  }, [userLocation, origin]) // eslint-disable-line

  const handleGenerateRoutes = useCallback(async () => {
    const from = origin ?? userLocation
    if (!destination) return
    if (!from) {
      setRouteError('Waiting for your location — enable GPS or set a start point.')
      return
    }
    setMobilePanelSnap('plan')
    await calcRoutes(from, destination)
  }, [destination, origin, userLocation]) // eslint-disable-line

  const handleDestinationClear = () => {
    setDestination(null)
    setRoutes([])
    setSafetyScores([])
    setSelectedRouteIndex(0)
    setIsNavigating(false)
    setShowUnsafeConfirm(false)
    setUnsafeDetailIndex(null)
    setActiveAlert(null)
    setRouteError(null)
  }

  const handleRouteSelect = useCallback((index) => {
    setSelectedRouteIndex(index)
    setMobilePanelSnap('routes')
    const safety = safetyScores[index]
    if (safety?.safetyClass === 'unsafe' && !safety?.isRecommended) {
      setUnsafeDetailIndex(index)
    } else {
      setUnsafeDetailIndex(null)
    }
  }, [safetyScores])

  const handleOriginSelect = async (place) => {
    setOrigin(place)
    if (!destination) return
    await calcRoutes(place, destination)
  }

  const handleOriginClear = async () => {
    setOrigin(null)
    if (!destination || !userLocation) return
    await calcRoutes(userLocation, destination)
  }

  const handleSwap = async () => {
    const newOrigin = destination
    const newDest = origin ?? (userLocation
      ? { name: 'My Location', fullName: 'My Current Location', lat: userLocation.lat, lng: userLocation.lng }
      : null)
    setOrigin(newOrigin)
    setDestination(newDest)
    if (newOrigin && newDest) {
      setIsNavigating(false)
      await calcRoutes(newDest, newOrigin)
    }
  }

  const selectedSafety = safetyScores[selectedRouteIndex]
  const isUnsafeRoute = selectedSafety?.safetyClass === 'unsafe' && !selectedSafety?.isRecommended
  const selectedRoute = routes[selectedRouteIndex]

  const handleViewUnsafeDetail = useCallback(() => {
    if (isUnsafeRoute) setUnsafeDetailIndex(selectedRouteIndex)
  }, [isUnsafeRoute, selectedRouteIndex])

  const navigation = useNavigation({
    route: selectedRoute,
    active: isNavigating,
    isUnsafeRoute,
    userLocation,
    incidents,
  })

  const recommendedRouteIndex = safetyScores.findIndex(s => s?.isRecommended)

  const beginNavigation = () => {
    setShowRouteOverview(false)
    setUnsafeDetailIndex(null)
    setMobilePanelSnap('peek')   // hide sheet during navigation
    setShowUnsafeConfirm(false)
    setIsNavigating(true)
  }

  const handleStartRoute = () => {
    if (!routes.length || !selectedRoute) return
    if (isUnsafeRoute) {
      setShowUnsafeConfirm(true)
      return
    }
    beginNavigation()
  }

  const handleStartJourney = handleStartRoute

  const handleUnsafeConfirm = () => {
    setShowUnsafeConfirm(false)
    beginNavigation()
  }

  const handleUseSafeRoute = () => {
    setShowUnsafeConfirm(false)
    setUnsafeDetailIndex(null)
    if (recommendedRouteIndex >= 0) {
      setSelectedRouteIndex(recommendedRouteIndex)
    }
  }

  useEffect(() => {
    if (isNavigating) navigation.requestRecenter()
  }, [isNavigating]) // eslint-disable-line

  const handleEndNavigation = () => {
    setIsNavigating(false)
    setShowRouteOverview(false)
    setActiveAlert(null)
    setMobilePanelSnap('routes')
  }

  const handleRerouteToSafe = () => {
    navigation.dismissSafetyUpdate()
    if (recommendedRouteIndex < 0) return
    setSelectedRouteIndex(recommendedRouteIndex)
    if (isNavigating) {
      navigation.requestRecenter()
    }
    setActiveAlert('Rerouting to HerWay recommended safe route')
    setTimeout(() => setActiveAlert(null), 4000)
  }

  // ── Emergency: triple-click + real ntfy.sh alert ──────────────────────────
  const handleEmergencyClick = () => {
    emergencyClickCount.current += 1
    if (emergencyTimer.current) clearTimeout(emergencyTimer.current)
    emergencyTimer.current = setTimeout(() => { emergencyClickCount.current = 0 }, 2000)
    if (emergencyClickCount.current >= 3) {
      emergencyClickCount.current = 0
      activateEmergency()
    }
  }

  const activateEmergency = async () => {
    setEmergencyMode(true)
    await doSendAlert()
  }

  const doSendAlert = async () => {
    const topic = getOrCreateTopic()
    setAlertStatus('sending')
    const result = await sendEmergencyAlert({ topic, location: userLocation, contactName })
    setAlertStatus(result.ok ? 'sent' : 'failed')
  }

  // Periodic location updates while emergency mode is active
  useEffect(() => {
    if (!emergencyMode || alertStatus !== 'sent') return
    const interval = setInterval(async () => {
      const topic = getOrCreateTopic()
      await sendLocationUpdate({ topic, location: userLocation })
    }, 60_000) // every 60 seconds
    return () => clearInterval(interval)
  }, [emergencyMode, alertStatus, userLocation])

  // Reset alert status when emergency closes
  const handleEmergencyClose = () => {
    setEmergencyMode(false)
    setAlertStatus('idle')
  }

  // ── Map click — place warning marker at clicked location ─────────────────
  const handleMapClick = useCallback(({ lat, lng }) => {
    setReportLocation({ lat, lng })
    setShowReportModal(true)
  }, [])

  // ── Incident report ───────────────────────────────────────────────────────
  const handleIncidentSubmit = (report) => {
    const lat = report.reportLocation?.lat ?? userLocation?.lat ?? MOCK_INCIDENTS[0].lat
    const lng = report.reportLocation?.lng ?? userLocation?.lng ?? MOCK_INCIDENTS[0].lng
    const newIncident = { ...report, lat, lng }

    setIncidents(prev => [newIncident, ...prev])

    // Add a custom pin at the exact clicked location (distinct from the incident feed marker)
    if (report.reportLocation) {
      setCustomMarkers(prev => [...prev, {
        id: `custom-${report.id}`,
        lat, lng,
        type: report.label,
        description: report.description,
      }])
    }

    // Community notification toast
    if (report.notifyNearby) {
      setCommunityToast('2 nearby users notified of your report')
      setTimeout(() => setCommunityToast(null), 4500)
    }

    // Reset map report location
    setReportLocation(null)
  }

  // ── Navigate to safe space ────────────────────────────────────────────────
  const handleNavigateToSafeSpace = (space) => {
    handleDestinationSelect({ name: space.name, fullName: space.name, lat: space.lat, lng: space.lng })
  }

  const nearestSafeSpace = userLocation
    ? getNearestSafeSpace(userLocation.lat, userLocation.lng, safeSpaces)
    : null

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setShowReportModal(false)
        setShowAuthModal(false)
        setShowSettings(false)
        if (emergencyMode) handleEmergencyClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [emergencyMode])

  // ── Responsive (matchMedia — updates on resize & orientation) ─────────────
  const { isMobile, isDesktop, isCompact } = useBreakpoint()
  useBodyScrollLock(isCompact && mobilePanelSnap === 'full')

  const floatingControlsClass = isCompact
    ? 'absolute right-3 top-4 flex flex-col gap-2 z-[1020]'
    : 'absolute top-4 right-4 flex flex-col gap-2 z-[1020]'

  // ── Floating controls component ───────────────────────────────────────────
  const FloatingControls = () => (
    <div className={floatingControlsClass}>
      {/* Shield / emergency — triple-click */}
      <button
        onClick={handleEmergencyClick}
        title="Triple-click to activate emergency mode"
        className={`${isCompact ? 'w-12 h-12' : 'w-11 h-11'} rounded-2xl glass border border-safe/30 flex items-center justify-center text-xl hover:border-safe/60 hover:bg-safe/10 transition-all active:scale-95 touch-manipulation`}
      >
        ✦
      </button>

      {/* Settings / alert setup */}
      <button
        onClick={() => setShowSettings(true)}
        title="Emergency alert settings"
        className={`${isCompact ? 'w-12 h-12' : 'w-11 h-11'} rounded-2xl glass border border-white/10 flex items-center justify-center text-lg hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95 touch-manipulation`}
      >
        🔔
      </button>

      {/* Auth */}
      <button
        onClick={() => !user && setShowAuthModal(true)}
        className={`${isCompact ? 'w-12 h-12' : 'w-11 h-11'} rounded-2xl glass border border-white/10 flex items-center justify-center text-lg hover:border-white/20 transition-all active:scale-95 touch-manipulation`}
        title={user ? `Signed in as ${user.email}` : 'Sign in'}
      >
        {user ? '✓' : '👤'}
      </button>

      {/* Safe spaces */}
      <button
        onClick={() => setShowSafeSpaces(v => !v)}
        title={showSafeSpaces ? 'Hide safe spaces' : 'Show safe spaces'}
        className={`${isCompact ? 'w-12 h-12' : 'w-11 h-11'} rounded-2xl border flex items-center justify-center text-xl transition-all active:scale-95 touch-manipulation ${
          showSafeSpaces
            ? 'border-safe/50 bg-safe/15 hover:bg-safe/25'
            : 'glass border-white/10 hover:border-white/20'
        }`}
      >
        🏠
      </button>

      {/* Report */}
      <button
        onClick={() => setShowReportModal(true)}
        title="Report an incident"
        className={`${isCompact ? 'w-12 h-12' : 'w-11 h-11'} rounded-2xl glass border border-white/10 flex items-center justify-center text-xl hover:border-warning/40 hover:bg-warning/10 transition-all active:scale-95 touch-manipulation`}
      >
        ⚠️
      </button>
    </div>
  )

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-bg flex flex-col">

      {/* ── Reroute alert banner ──────────────────────────────────────────── */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            className="absolute top-0 left-0 right-0 z-[1300] flex items-center gap-3 px-5 py-3.5 bg-danger"
            initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
          >
            <span className="text-lg">⚠️</span>
            <span className="text-white font-semibold text-sm flex-1 leading-snug">{activeAlert}</span>
            <button onClick={() => setActiveAlert(null)} className="text-white/60 hover:text-white text-xl">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation banner (desktop / tablet landscape) ───────────────── */}
      <AnimatePresence>
        {isNavigating && !activeAlert && !isMobile && (
          <motion.div
            className="absolute top-0 left-0 right-0 z-[1150] flex items-center gap-3 px-5 py-3"
            initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            style={{
              background: isUnsafeRoute
                ? 'linear-gradient(135deg, #7f1d1d 0%, #111827 100%)'
                : 'linear-gradient(135deg, #14532d 0%, #111827 100%)',
              paddingTop: 'max(env(safe-area-inset-top), 12px)',
            }}
          >
            <span className="text-xl">{isUnsafeRoute ? '⚠️' : '✦'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">
                HerWay · {isUnsafeRoute ? 'Unsafe route' : 'Safe navigation'}
              </p>
              <p className="text-white/60 text-xs truncate">
                {navigation.currentStep?.instruction ?? 'Following route'} · {destination?.name}
              </p>
            </div>
            <button
              onClick={handleEndNavigation}
              className="bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/25 transition-colors flex-shrink-0"
            >
              End
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Desktop sidebar */}
        {isDesktop && !isNavigating && (
          <div className="app-sidebar flex-shrink-0 glass border-r border-white/5 z-10 overflow-hidden flex flex-col">
            <Sidebar
              userLocation={userLocation}
              origin={origin}
              destination={destination}
              routes={routes}
              safetyScores={safetyScores}
              selectedRouteIndex={selectedRouteIndex}
              isLoadingRoutes={isLoadingRoutes}
              routeError={routeError}
              incidents={incidents}
              safeSpaces={safeSpaces}
              showSafeSpaces={showSafeSpaces}
              onOriginSelect={handleOriginSelect}
              onOriginClear={handleOriginClear}
              onDestinationSelect={handleDestinationSelect}
              onDestinationClear={handleDestinationClear}
              onSwap={handleSwap}
              onRouteSelect={handleRouteSelect}
              onUnsafeDetail={handleRouteSelect}
              onStartJourney={handleStartJourney}
              onReport={() => setShowReportModal(true)}
              onToggleSafeSpaces={() => setShowSafeSpaces(v => !v)}
            />
          </div>
        )}

        {/* Map — isolation:isolate keeps Leaflet's internal z-indices from competing with fixed UI overlays */}
        <div className={`flex-1 relative min-w-0 min-h-0 isolate ${isNavigating ? 'nav-map-fullscreen' : ''}`}>
          <MapView
            userLocation={userLocation}
            origin={origin}
            destination={destination}
            routes={routes}
            safetyScores={safetyScores}
            selectedRouteIndex={selectedRouteIndex}
            incidents={incidents}
            safeSpaces={safeSpaces}
            showSafeSpaces={showSafeSpaces}
            customMarkers={customMarkers}
            isNavigating={isNavigating}
            navPosition={navigation.position}
            navProgress={navigation.progress}
            navBearing={navigation.bearing}
            recenterRequest={navigation.recenterRequest}
            showRouteOverview={showRouteOverview}
            isUnsafeRoute={isUnsafeRoute}
            onRouteClick={handleRouteSelect}
            onUnsafeRouteClick={handleRouteSelect}
            onMapClick={handleMapClick}
            isMobile={isCompact}
          />

          <AnimatePresence>
            {isNavigating && (
              <>
                <NavigationHUD
                  isUnsafeRoute={isUnsafeRoute}
                  progress={navigation.progress}
                  etaSeconds={navigation.etaSeconds}
                  distanceRemaining={navigation.distanceRemaining}
                  destination={destination}
                  currentStep={navigation.currentStep}
                  showOverview={showRouteOverview}
                  onToggleOverview={() => setShowRouteOverview(v => !v)}
                  onRecenter={navigation.requestRecenter}
                  onEnd={handleEndNavigation}
                />
                <NavigationPanel
                  destination={destination}
                  route={selectedRoute}
                  isUnsafeRoute={isUnsafeRoute}
                  currentStep={navigation.currentStep}
                  nextStep={navigation.nextStep}
                  stepIndex={navigation.stepIndex}
                  steps={navigation.steps}
                  progress={navigation.progress}
                  distanceRemaining={navigation.distanceRemaining}
                  etaSeconds={navigation.etaSeconds}
                  safetyUpdate={navigation.safetyUpdate}
                  isComplete={navigation.isComplete}
                  phase={navigation.phase}
                  onDismissSafetyUpdate={navigation.dismissSafetyUpdate}
                  onEnd={handleEndNavigation}
                  onReroute={handleRerouteToSafe}
                />
              </>
            )}
          </AnimatePresence>

          {!isNavigating && <FloatingControls />}

          {/* Route comparison legend */}
          {routes.length > 0 && !isNavigating && isDesktop && (
            <div className="absolute top-20 left-4 z-20 glass max-w-[200px] border border-white/10 rounded-2xl px-3 py-2.5 space-y-1.5 shadow-lg">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Route safety</p>
              <div className="flex items-center gap-2">
                <span className="w-6 h-1 rounded-full" style={{ background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                <span className="text-[11px] text-gray-300">Safest · recommended</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-1 rounded-full" style={{ background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
                <span className="text-[11px] text-gray-300">Active alerts · higher risk</span>
              </div>
            </div>
          )}

          {/* Live activity ticker */}
          <AnimatePresence>
            {liveActivity && !routes.length && (
              <motion.div
                key={liveActivity.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="absolute bottom-8 left-4 z-20 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-sm shadow-lg max-w-[260px] cursor-pointer select-none"
                style={{
                  backgroundColor: liveActivity.color + '18',
                  borderColor: liveActivity.color + '40',
                }}
                onClick={dismissLiveActivity}
              >
                <span className="text-base flex-shrink-0">{liveActivity.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-snug" style={{ color: liveActivity.color }}>
                    {liveActivity.text}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Live · Just now</p>
                </div>
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                  style={{ background: liveActivity.color }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Community notification toast */}
          <AnimatePresence>
            {communityToast && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className={`absolute left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-primary/20 border border-primary/40 backdrop-blur-sm shadow-xl max-w-[90vw] ${
                  isCompact && routes.length ? 'bottom-[calc(var(--herway-journey-height)+var(--herway-safe-bottom)+1rem)]' : 'bottom-8'
                }`}
              >
                <span className="text-lg">🔔</span>
                <div>
                  <p className="text-white font-semibold text-sm">2 nearby users notified</p>
                  <p className="text-gray-400 text-xs">Anonymous safety alert sent</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isNavigating && isDesktop && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <p className="text-gray-700 text-[10px] text-center">
                Tap map to report · Green = safest · Red = active alerts
              </p>
            </div>
          )}
        </div>
      </div>

      {isCompact && !isNavigating && (
        <MobileRoutePanel
          snap={mobilePanelSnap}
          onSnapChange={setMobilePanelSnap}
          userLocation={userLocation}
          origin={origin}
          destination={destination}
          routes={routes}
          safetyScores={safetyScores}
          selectedRouteIndex={selectedRouteIndex}
          isLoadingRoutes={isLoadingRoutes}
          routeError={routeError}
          onOriginSelect={handleOriginSelect}
          onOriginClear={handleOriginClear}
          onDestinationSelect={handleDestinationSelect}
          onDestinationClear={handleDestinationClear}
          onSwap={handleSwap}
          onGenerateRoutes={handleGenerateRoutes}
          onRouteSelect={handleRouteSelect}
          onUnsafeDetail={handleRouteSelect}
          onStartJourney={handleStartJourney}
          onViewUnsafeDetail={handleViewUnsafeDetail}
        />
      )}


      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <ReportModal
        visible={showReportModal}
        onClose={() => { setShowReportModal(false); setReportLocation(null) }}
        onSubmit={handleIncidentSubmit}
        reportLocation={reportLocation}
      />

      <EmergencyOverlay
        visible={emergencyMode}
        nearestSafeSpace={nearestSafeSpace}
        alertStatus={alertStatus}
        contactName={contactName}
        onClose={handleEmergencyClose}
        onNavigateToSafeSpace={handleNavigateToSafeSpace}
        onResendAlert={doSendAlert}
      />

      <SafetySettings
        visible={showSettings}
        onClose={handleSettingsClose}
      />

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={setUser}
      />

      <UnsafeRouteConfirm
        visible={showUnsafeConfirm}
        alertCount={selectedSafety?.factorDetails?.incidents?.nearbyCount ?? 0}
        onConfirm={handleUnsafeConfirm}
        onCancel={handleUseSafeRoute}
      />

      <UnsafeRouteDetailPanel
        visible={unsafeDetailIndex !== null && !isNavigating}
        route={unsafeDetailIndex != null ? routes[unsafeDetailIndex] : null}
        safety={unsafeDetailIndex != null ? safetyScores[unsafeDetailIndex] : null}
        onClose={() => setUnsafeDetailIndex(null)}
        onUseSafeRoute={handleUseSafeRoute}
        onStartJourney={handleStartJourney}
      />
    </div>
  )
}

