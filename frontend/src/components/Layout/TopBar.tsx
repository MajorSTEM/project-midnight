import React, { useState, useEffect } from 'react';
import { Menu, X, Radiation, Trash2, Globe, Crosshair, FolderOpen, Download, BookOpen, Bell, Brain, Camera, Settings } from 'lucide-react';
import { DoomsdayClock } from './DoomsdayClock';
import { useSimulationStore } from '../../stores/simulationStore';
import { ApiKeysPanel } from '../Settings/ApiKeysPanel';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export const TopBar: React.FC = () => {
  const {
    leftPanelOpen,
    rightPanelOpen,
    result,
    showGeopoliticsPanel,
    showScenariosPanel,
    showPredictionPanel,
    showNotificationCenter,
    showARMode,
    setLeftPanelOpen,
    setRightPanelOpen,
    clearSimulation,
    toggleGeopoliticsPanel,
    toggleScenariosPanel,
    togglePredictionPanel,
    toggleNotificationCenter,
    toggleARMode,
    multiStrikeMode,
    toggleMultiStrikeMode,
    simulationMode,
    setSimulationMode,
    showScenarioLibrary,
    toggleScenarioLibrary,
    aggregateResult,
  } = useSimulationStore();

  const hasResults = result !== null || aggregateResult !== null;

  const [showSettings, setShowSettings] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function switchMode(mode: typeof simulationMode) {
    setSimulationMode(mode);
    if (mode !== 'nuclear') {
      setRightPanelOpen(false);
    }
  }

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-[1000] h-14 bg-panel border-b border-panel-border flex items-center justify-between px-4 gap-2">
      {/* Left — toggle + logo */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="p-1.5 rounded text-text-muted hover:text-terminal hover:bg-panel-light transition-colors flex-shrink-0"
          title="Toggle Panel"
        >
          {leftPanelOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Radiation size={20} className="text-terminal flex-shrink-0" />
          <div className="min-w-0 hidden sm:block">
            <h1 className="font-mono font-bold text-terminal text-sm leading-none tracking-widest truncate">
              PROJECT MIDNIGHT
            </h1>
            <p className="text-text-muted text-[10px] leading-none tracking-wider uppercase">
              Global Catastrophe Simulation Platform v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Center — mode switcher + Doomsday Clock */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Simulation mode buttons */}
        <button
          onClick={() => switchMode('nuclear')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            simulationMode === 'nuclear'
              ? 'bg-blast/15 border-blast/60 text-blast'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-blast hover:border-blast/40'
          }`}
          title="Nuclear Strike Simulator"
        >
          ☢ <span className="hidden md:inline">NUKE</span>
        </button>

        <button
          onClick={() => switchMode('zombie')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            simulationMode === 'zombie'
              ? 'bg-green-900/30 border-green-500/50 text-green-400'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-green-400 hover:border-green-500/40'
          }`}
          title="Zombie Outbreak Simulator"
        >
          🧟 <span className="hidden md:inline">ZOMBIE</span>
        </button>

        <button
          onClick={() => switchMode('asteroid')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            simulationMode === 'asteroid'
              ? 'bg-orange-900/30 border-orange-500/50 text-orange-400'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-orange-400 hover:border-orange-500/40'
          }`}
          title="Asteroid Impact Simulator"
        >
          ☄ <span className="hidden md:inline">ASTEROID</span>
        </button>

        <button
          onClick={() => switchMode('emp')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            simulationMode === 'emp'
              ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-yellow-400 hover:border-yellow-500/40'
          }`}
          title="EMP / HEMP Simulator"
        >
          ⚡ <span className="hidden md:inline">EMP</span>
        </button>

        <button
          onClick={() => switchMode('pandemic')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            simulationMode === 'pandemic'
              ? 'bg-purple-900/30 border-purple-500/50 text-purple-400'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-purple-400 hover:border-purple-500/40'
          }`}
          title="Pandemic / Bioweapon Simulator"
        >
          🦠 <span className="hidden md:inline">PANDEMIC</span>
        </button>

        <div className="hidden lg:flex items-center ml-2">
          <DoomsdayClock />
        </div>
      </div>

      {/* Right — action buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* INTEL button */}
        <button
          onClick={toggleGeopoliticsPanel}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            showGeopoliticsPanel
              ? 'bg-orange-900/30 border-orange-500/50 text-orange-400'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-orange-400 hover:border-orange-500/40'
          }`}
          title="Geopolitical Intelligence"
        >
          <Globe size={13} />
          <span className="hidden lg:inline">INTEL</span>
        </button>

        {/* AI PREDICTION button */}
        <button
          onClick={togglePredictionPanel}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            showPredictionPanel
              ? 'bg-purple-900/30 border-purple-500/50 text-purple-400'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-purple-400 hover:border-purple-500/40'
          }`}
          title="AI Geopolitical Prediction Engine"
        >
          <Brain size={13} />
          <span className="hidden lg:inline">PREDICT</span>
        </button>

        {/* SCENARIOS button */}
        <button
          onClick={toggleScenariosPanel}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            showScenariosPanel
              ? 'bg-terminal/10 border-terminal/50 text-terminal'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-terminal hover:border-terminal/40'
          }`}
          title="Historical Scenarios"
        >
          <BookOpen size={13} />
          <span className="hidden lg:inline">SCENARIOS</span>
        </button>

        {/* MULTI toggle (nuclear only) */}
        {simulationMode === 'nuclear' && (
          <button
            onClick={toggleMultiStrikeMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
              multiStrikeMode
                ? 'bg-terminal/10 border-terminal text-terminal shadow-[0_0_8px_rgba(0,255,136,0.2)]'
                : 'bg-panel-light border-panel-border text-text-muted hover:text-terminal hover:border-terminal/40'
            }`}
            title="Toggle Multi-Strike Mode"
          >
            <Crosshair size={13} />
            <span className="hidden lg:inline">MULTI</span>
          </button>
        )}

        {/* SAVES button */}
        <button
          onClick={toggleScenarioLibrary}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            showScenarioLibrary
              ? 'bg-blue-900/30 border-blue-500/50 text-blue-400'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-blue-400 hover:border-blue-500/40'
          }`}
          title="Scenario Library"
        >
          <FolderOpen size={13} />
          <span className="hidden lg:inline">SAVES</span>
        </button>

        {/* AR button */}
        <button
          onClick={toggleARMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            showARMode
              ? 'bg-terminal/10 border-terminal/50 text-terminal'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-terminal hover:border-terminal/40'
          }`}
          title="AR Mode — View in Augmented Reality"
        >
          <Camera size={13} />
          <span className="hidden lg:inline">AR</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono bg-panel-light border border-panel-border text-text-muted hover:text-terminal hover:border-terminal/40 rounded transition-colors"
          title="API Keys & Settings"
        >
          <Settings size={13} />
          <span className="hidden lg:inline">SETTINGS</span>
        </button>

        {/* Notification bell */}
        <button
          onClick={toggleNotificationCenter}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            showNotificationCenter
              ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400'
              : 'bg-panel-light border-panel-border text-text-muted hover:text-yellow-400 hover:border-yellow-500/40'
          }`}
          title="Notifications"
        >
          <Bell size={13} />
        </button>

        {/* Results/Clear — nuclear mode only */}
        {simulationMode === 'nuclear' && hasResults && (
          <>
            <button
              onClick={clearSimulation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono bg-panel-light border border-panel-border text-text-muted hover:text-blast hover:border-blast/50 rounded transition-colors"
              title="Clear simulation"
            >
              <Trash2 size={13} />
              <span className="hidden lg:inline">Clear</span>
            </button>
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono bg-panel-light border border-terminal/30 text-terminal hover:bg-terminal/10 rounded transition-colors"
              title="Toggle Results Panel"
            >
              {rightPanelOpen ? <X size={13} /> : <Menu size={13} />}
              <span className="hidden lg:inline">Results</span>
            </button>
          </>
        )}

        {installPrompt && (
          <button
            onClick={() => (installPrompt as BeforeInstallPromptEvent).prompt()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors bg-panel-light border-panel-border text-text-muted hover:text-terminal hover:border-terminal/40"
            title="Install as PWA"
          >
            <Download size={13} />
            <span className="hidden lg:inline">INSTALL</span>
          </button>
        )}

        <div className="hidden xl:flex items-center gap-1 px-2 py-1 bg-blast/10 border border-blast/30 rounded text-[10px] font-mono text-blast">
          <span className="w-1.5 h-1.5 rounded-full bg-blast animate-pulse inline-block" />
          SIM ACTIVE
        </div>
      </div>
    </header>

    {showSettings && <ApiKeysPanel onClose={() => setShowSettings(false)} />}
  </>
  );
};
