import React from 'react';
import { X, BarChart2, Shield, BookOpen, ChevronLeft, FileText, Crosshair } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import { CasualtyReport } from './CasualtyReport';
import { SurvivabilityReport } from './SurvivabilityReport';
import { PreparednesGuide } from './PreparednesGuide';
import { NarrativePanel } from './NarrativePanel';
import { ZombieStats } from '../Zombie/ZombieStats';
import { ExportPanel } from './ExportPanel';
import { yieldToLabel } from '../../utils/nuclearPhysics';
import { formatNumber } from '../../utils/casualties';
import type { ResultTab } from '../../types';

const TABS: { id: ResultTab; label: string; icon: React.ReactNode }[] = [
  { id: 'impact', label: 'Impact', icon: <BarChart2 size={13} /> },
  { id: 'survivability', label: 'Survive', icon: <Shield size={13} /> },
  { id: 'preparedness', label: 'Prepare', icon: <BookOpen size={13} /> },
  { id: 'narrative', label: 'Narrative', icon: <FileText size={13} /> },
];

const AggregateReport: React.FC = () => {
  const { aggregateResult, strikes } = useSimulationStore();
  if (!aggregateResult) return null;

  return (
    <div className="space-y-4">
      {/* Header block */}
      <div className="border border-blast/40 rounded p-3 bg-blast/5 text-center">
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
          Multi-Strike Aggregate Report
        </p>
        <p className="text-xs font-mono text-blast mt-0.5">
          {aggregateResult.citiesAffected} simultaneous detonation{aggregateResult.citiesAffected !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Big numbers */}
      <div className="space-y-2">
        {[
          { label: 'TOTAL IMMEDIATE DEATHS', val: aggregateResult.totalImmediateDeaths, color: '#ff4444' },
          { label: 'TOTAL INJURED', val: aggregateResult.totalInjured, color: '#ff8800' },
          { label: 'LONG-TERM DEATHS', val: aggregateResult.totalLongTermDeaths, color: '#ffcc00' },
          { label: 'COMBINED AFFECTED AREA', val: null, unit: `${aggregateResult.totalAffectedAreaKm2.toFixed(0)} km²`, color: '#00ff88' },
        ].map(({ label, val, unit, color }) => (
          <div key={label} className="flex justify-between items-center border-b border-panel-border pb-1">
            <span className="text-[10px] font-mono text-text-muted">{label}</span>
            <span className="text-xs font-mono font-bold" style={{ color }}>
              {unit ?? formatNumber(val ?? 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Per-strike breakdown */}
      <div>
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
          Per-Strike Breakdown
        </p>
        <div className="space-y-2">
          {aggregateResult.strikes.map((strikeResult, idx) => {
            const strike = strikes[idx];
            return (
              <div key={idx} className="bg-midnight border border-panel-border rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-text-primary">
                    Strike #{idx + 1} · {yieldToLabel(strikeResult.effects.yieldKt)}
                  </span>
                  <span className="text-[9px] font-mono text-text-muted">
                    {strike?.nation}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Deaths</span>
                    <span className="text-blast">{formatNumber(strikeResult.casualties.immediateDeaths)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Injured</span>
                    <span className="text-orange-400">{formatNumber(strikeResult.casualties.injured)}</span>
                  </div>
                  {strikeResult.strikeLocation && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-text-muted">Location</span>
                      <span className="text-terminal">
                        {strikeResult.strikeLocation.lat.toFixed(3)}, {strikeResult.strikeLocation.lng.toFixed(3)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ResultsPanel: React.FC = () => {
  const {
    result,
    rightPanelOpen,
    activeResultTab,
    setRightPanelOpen,
    setActiveResultTab,
    config,
    multiStrikeMode,
    aggregateResult,
    simulationMode,
  } = useSimulationStore();

  // In zombie mode, always show zombie stats panel when open
  if (simulationMode === 'zombie') {
    return (
      <>
        <div
          className={`
            fixed right-0 top-14 bottom-0 z-[900]
            w-[360px] bg-panel border-l border-panel-border
            flex flex-col
            transition-transform duration-300 ease-in-out
            ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <ZombieStats onClose={() => setRightPanelOpen(false)} />
        </div>
        {!rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-[900] bg-panel border border-r-0 border-panel-border rounded-l-lg px-1.5 py-4 hover:bg-panel-light transition-colors"
            title="Show Zombie Stats"
            style={{ color: '#44ff44' }}
          >
            <div className="flex flex-col items-center gap-1">
              <ChevronLeft size={14} />
              <span className="text-base">🧟</span>
              <span className="text-[9px] font-mono uppercase tracking-wider" style={{ writingMode: 'vertical-rl' }}>
                Stats
              </span>
            </div>
          </button>
        )}
      </>
    );
  }

  // Nuclear mode — need either a result or aggregate result to show
  if (!result && !aggregateResult) return null;

  return (
    <>
      {/* Panel */}
      <div
        className={`
          fixed right-0 top-14 bottom-0 z-[900]
          w-[360px] bg-panel border-l border-panel-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border flex-shrink-0">
          <div>
            <h2 className="text-xs font-mono font-bold text-blast uppercase tracking-widest">
              {multiStrikeMode ? 'Multi-Strike Results' : 'Simulation Results'}
            </h2>
            {multiStrikeMode && aggregateResult ? (
              <p className="text-[10px] font-mono text-text-muted mt-0.5">
                {aggregateResult.citiesAffected} strikes · {formatNumber(aggregateResult.totalImmediateDeaths)} total deaths
              </p>
            ) : result ? (
              <p className="text-[10px] font-mono text-text-muted mt-0.5">
                {yieldToLabel(result.effects.yieldKt)} {result.effects.burstType} · {config.nation}
              </p>
            ) : null}
          </div>
          <button onClick={() => setRightPanelOpen(false)} className="text-text-muted hover:text-text-primary p-1">
            <X size={16} />
          </button>
        </div>

        {/* Tabs — show aggregate tab first in multi-strike mode */}
        {multiStrikeMode ? (
          <div className="flex border-b border-panel-border flex-shrink-0">
            <button
              onClick={() => setActiveResultTab('impact')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono transition-colors border-b-2 ${
                activeResultTab === 'impact'
                  ? 'text-blast border-blast'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              <Crosshair size={13} />
              Aggregate
            </button>
            {TABS.slice(1).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveResultTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono transition-colors border-b-2 ${
                  activeResultTab === tab.id
                    ? 'text-terminal border-terminal'
                    : 'text-text-muted border-transparent hover:text-text-primary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex border-b border-panel-border flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveResultTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono transition-colors border-b-2
                  ${activeResultTab === tab.id
                    ? 'text-terminal border-terminal'
                    : 'text-text-muted border-transparent hover:text-text-primary'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4">
          {multiStrikeMode ? (
            <>
              {activeResultTab === 'impact' && <AggregateReport />}
              {activeResultTab === 'survivability' && result && <SurvivabilityReport />}
              {activeResultTab === 'preparedness' && <PreparednesGuide />}
              {activeResultTab === 'narrative' && <NarrativePanel />}
            </>
          ) : (
            <>
              {activeResultTab === 'impact' && result && <CasualtyReport result={result} />}
              {activeResultTab === 'survivability' && <SurvivabilityReport />}
              {activeResultTab === 'preparedness' && <PreparednesGuide />}
              {activeResultTab === 'narrative' && <NarrativePanel />}
            </>
          )}
        </div>

        {/* Export panel — only when single-strike result exists */}
        {result && <ExportPanel />}

        {/* Footer */}
        <div className="border-t border-panel-border px-4 py-2 flex-shrink-0">
          <p className="text-[9px] font-mono text-text-muted/50 text-center">
            Glasstone-Dolan scaling laws · LandScan population model approximation
          </p>
        </div>
      </div>

      {/* Collapsed tab */}
      {!rightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[900] bg-panel border border-r-0 border-panel-border rounded-l-lg px-1.5 py-4 text-blast hover:bg-panel-light transition-colors"
          title="Show Results"
        >
          <div className="flex flex-col items-center gap-1">
            <ChevronLeft size={14} />
            <BarChart2 size={14} />
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ writingMode: 'vertical-rl' }}>
              Results
            </span>
          </div>
        </button>
      )}
    </>
  );
};
