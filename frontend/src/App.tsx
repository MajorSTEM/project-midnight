import React, { useEffect, lazy, Suspense } from 'react';
import { TopBar } from './components/Layout/TopBar';
import { SimulationMap } from './components/Map/SimulationMap';
import { StrikeConfigPanel } from './components/Controls/StrikeConfigPanel';
import { ResultsPanel } from './components/Results/ResultsPanel';
import { ContentWarningModal } from './components/ContentWarningModal';
import { useSimulationStore } from './stores/simulationStore';
import { decodeURLToSim } from './utils/shareUtils';
import { TimelineBar } from './components/Timeline/TimelineBar';

// Lazy-load heavy panels — deferred until first render, shaves ~4s from initial parse
const GeopoliticsPanel = lazy(() => import('./components/Geopolitics/GeopoliticsPanel').then(m => ({ default: m.GeopoliticsPanel })));
const PredictionPanel = lazy(() => import('./components/Geopolitics/PredictionPanel').then(m => ({ default: m.PredictionPanel })));
const HistoricalScenariosPanel = lazy(() => import('./components/Scenarios/HistoricalScenariosPanel').then(m => ({ default: m.HistoricalScenariosPanel })));
const ZombiePanel = lazy(() => import('./components/Zombie/ZombiePanel').then(m => ({ default: m.ZombiePanel })));
const ZombieStats = lazy(() => import('./components/Zombie/ZombieStats').then(m => ({ default: m.ZombieStats })));
const AsteroidPanel = lazy(() => import('./components/Asteroid/AsteroidPanel').then(m => ({ default: m.AsteroidPanel })));
const AsteroidResultsPanel = lazy(() => import('./components/Asteroid/AsteroidResultsPanel').then(m => ({ default: m.AsteroidResultsPanel })));
const EMPPanel = lazy(() => import('./components/EMP/EMPPanel').then(m => ({ default: m.EMPPanel })));
const EMPResultsPanel = lazy(() => import('./components/EMP/EMPResultsPanel').then(m => ({ default: m.EMPResultsPanel })));
const PandemicPanel = lazy(() => import('./components/Pandemic/PandemicPanel').then(m => ({ default: m.PandemicPanel })));
const PandemicStats = lazy(() => import('./components/Pandemic/PandemicStats').then(m => ({ default: m.PandemicStats })));
const ScenarioLibrary = lazy(() => import('./components/Accounts/ScenarioLibrary').then(m => ({ default: m.ScenarioLibrary })));
const NotificationCenter = lazy(() => import('./components/Notifications/NotificationCenter').then(m => ({ default: m.NotificationCenter })));
const ARMode = lazy(() => import('./components/AR/ARMode').then(m => ({ default: m.ARMode })));

const App: React.FC = () => {
  const {
    warningAccepted,
    simulationMode,
    showScenarioLibrary,
    toggleScenarioLibrary,
    showPredictionPanel,
    togglePredictionPanel,
    showNotificationCenter,
    toggleNotificationCenter,
    showARMode,
    toggleARMode,
    result,
    setStrikeLocation,
    setYield,
    setBurstType,
    setNation,
    setWindDirection,
    setWindSpeed,
    setPopulationDensity,
  } = useSimulationStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const simParam = params.get('sim');
    if (simParam) {
      const decoded = decodeURLToSim(simParam);
      if (decoded?.location) {
        setStrikeLocation(decoded.location);
        if (decoded.yieldKt !== undefined) setYield(decoded.yieldKt);
        if (decoded.burstType !== undefined) setBurstType(decoded.burstType);
        if (decoded.nation !== undefined) setNation(decoded.nation);
        if (decoded.windDirection !== undefined) setWindDirection(decoded.windDirection);
        if (decoded.windSpeed !== undefined) setWindSpeed(decoded.windSpeed);
        if (decoded.populationDensity !== undefined) setPopulationDensity(decoded.populationDensity);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: '#0a0a0f', color: '#e6edf3' }}
    >
      {/* Content Warning Modal */}
      {!warningAccepted && <ContentWarningModal />}

      {/* Top navigation bar */}
      <TopBar />

      {/* Full-screen map (always shown) */}
      <SimulationMap />

      {/* Left sidebar — mode-dependent */}
      {simulationMode === 'nuclear' && <StrikeConfigPanel />}
      <Suspense fallback={null}>
        {simulationMode === 'zombie' && <ZombiePanel />}
        {simulationMode === 'asteroid' && <AsteroidPanel />}
        {simulationMode === 'emp' && <EMPPanel />}
        {simulationMode === 'pandemic' && <PandemicPanel />}
      </Suspense>

      {/* Right panel — mode-dependent */}
      {simulationMode === 'nuclear' && <ResultsPanel />}
      <Suspense fallback={null}>
        {simulationMode === 'zombie' && <ZombieStats />}
        {simulationMode === 'asteroid' && <AsteroidResultsPanel />}
        {simulationMode === 'emp' && <EMPResultsPanel />}
        {simulationMode === 'pandemic' && <PandemicStats />}
      </Suspense>

      {/* Geopolitics + Scenarios panels */}
      <Suspense fallback={null}>
        <GeopoliticsPanel />
        <HistoricalScenariosPanel />
      </Suspense>

      {/* AI Prediction panel */}
      <Suspense fallback={null}>
        <PredictionPanel isOpen={showPredictionPanel} onClose={togglePredictionPanel} />
      </Suspense>

      {/* Notification center dropdown */}
      <Suspense fallback={null}>
        <NotificationCenter isOpen={showNotificationCenter} onClose={toggleNotificationCenter} />
      </Suspense>

      {/* AR overlay — only render when open */}
      {showARMode && (
        <Suspense fallback={null}>
          <ARMode
            onClose={toggleARMode}
            strikeLat={result?.strikeLocation?.lat}
            strikeLng={result?.strikeLocation?.lng}
          />
        </Suspense>
      )}

      {/* Scenario Library modal */}
      {showScenarioLibrary && (
        <Suspense fallback={null}>
          <ScenarioLibrary onClose={toggleScenarioLibrary} />
        </Suspense>
      )}

      <TimelineBar />
    </div>
  );
};

export default App;
