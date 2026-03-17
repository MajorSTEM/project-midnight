import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Upload, Trash2, FolderOpen } from 'lucide-react';
import { useScenarioStore } from '../../stores/scenarioStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useZombieStore } from '../../stores/zombieStore';
import type { SavedScenario } from '../../types';

type FilterTab = 'all' | 'nuclear' | 'zombie';

interface Props {
  onClose: () => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function ScenarioCard({
  scenario,
  onLoad,
  onExport,
  onDelete,
}: {
  scenario: SavedScenario;
  onLoad: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const icon = scenario.type === 'nuclear' ? '☢' : '🧟';
  const subtitle =
    scenario.type === 'nuclear' && scenario.nuclear
      ? `${Array.isArray(scenario.nuclear.config) ? scenario.nuclear.config.length : 1} strike(s) · ${scenario.nuclear.isMultiStrike ? 'Multi-strike' : 'Single'}`
      : scenario.type === 'zombie' && scenario.zombie
      ? `${scenario.zombie.daysSurvived ?? 365}d sim · ${scenario.zombie.zombieTypeId}`
      : '';

  return (
    <div className="bg-midnight border border-panel-border rounded p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-xs font-mono font-bold text-text-primary truncate">{scenario.name}</p>
            {subtitle && (
              <p className="text-[10px] font-mono text-text-muted mt-0.5">{subtitle}</p>
            )}
            <p className="text-[9px] font-mono text-text-muted/60 mt-0.5">
              Saved {formatDate(scenario.savedAt)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={onLoad}
          className="flex-1 py-1 text-[10px] font-mono rounded border border-terminal/40 text-terminal hover:bg-terminal/10 transition-colors"
        >
          Load
        </button>
        <button
          onClick={onExport}
          className="p-1 rounded border border-panel-border text-text-muted hover:text-text-primary transition-colors"
          title="Export JSON"
        >
          <Download size={12} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded border border-panel-border text-text-muted hover:text-blast transition-colors"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export const ScenarioLibrary: React.FC<Props> = ({ onClose }) => {
  const { scenarios, loadScenarios, saveScenario, deleteScenario, exportScenario, importScenario } =
    useScenarioStore();
  const simStore = useSimulationStore();
  const zombieStore = useZombieStore();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const filtered = scenarios.filter((s) => filter === 'all' || s.type === filter);

  function handleLoad(scenario: SavedScenario) {
    if (scenario.type === 'nuclear' && scenario.nuclear) {
      if (scenario.nuclear.isMultiStrike && Array.isArray(scenario.nuclear.config)) {
        simStore.setSimulationMode('nuclear');
        // Load multi-strike scenario
        const configs = scenario.nuclear.config;
        if (configs.length > 0) {
          // Set multi-strike mode and load strikes
          simStore.toggleMultiStrikeMode();
          configs.forEach((c) => {
            if (c.location) simStore.addStrike(c.location);
          });
        }
      } else if (!Array.isArray(scenario.nuclear.config)) {
        const cfg = scenario.nuclear.config;
        simStore.setSimulationMode('nuclear');
        if (cfg.location) simStore.setStrikeLocation(cfg.location);
      }
    } else if (scenario.type === 'zombie' && scenario.zombie) {
      simStore.setSimulationMode('zombie');
      zombieStore.setConfig({ zombieTypeId: scenario.zombie.zombieTypeId });
    }
    onClose();
  }

  function handleSaveCurrent() {
    if (!saveName.trim()) return;
    const mode = simStore.simulationMode;
    if (mode === 'nuclear') {
      saveScenario(saveName, {
        type: 'nuclear',
        nuclear: {
          config: simStore.multiStrikeMode ? simStore.strikes : simStore.config,
          isMultiStrike: simStore.multiStrikeMode,
        },
      });
    } else {
      saveScenario(saveName, {
        type: 'zombie',
        zombie: {
          config: zombieStore.config,
          zombieTypeId: zombieStore.config.zombieTypeId,
          peakInfected: 0,
          daysSurvived: zombieStore.config.simulationDays,
        },
      });
    }
    setSaveName('');
    setShowSaveInput(false);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        importScenario(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[440px] max-h-[80vh] bg-panel border border-panel-border rounded-lg flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen size={14} className="text-terminal" />
            <h2 className="text-xs font-mono font-bold text-terminal uppercase tracking-widest">
              Scenario Library
            </h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X size={16} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-panel-border flex-shrink-0">
          {(['all', 'nuclear', 'zombie'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wide transition-colors border-b-2 ${
                filter === tab
                  ? 'text-terminal border-terminal'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              {tab === 'nuclear' ? '☢ Nuclear' : tab === 'zombie' ? '🧟 Zombie' : 'All'}
            </button>
          ))}
        </div>

        {/* Scenario list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-text-muted font-mono text-xs py-8">
              No saved scenarios. Save your current simulation below.
            </p>
          ) : (
            filtered.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                onLoad={() => handleLoad(s)}
                onExport={() => exportScenario(s.id)}
                onDelete={() => deleteScenario(s.id)}
              />
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-panel-border p-4 flex-shrink-0 space-y-2">
          {showSaveInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Scenario name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCurrent();
                  if (e.key === 'Escape') setShowSaveInput(false);
                }}
                className="flex-1 bg-midnight border border-panel-border rounded px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50"
              />
              <button
                onClick={handleSaveCurrent}
                className="px-3 py-1.5 text-xs font-mono rounded border border-terminal/40 text-terminal hover:bg-terminal/10 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveInput(false)}
                className="p-1.5 rounded border border-panel-border text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveInput(true)}
              className="w-full py-2 text-xs font-mono rounded border border-terminal/30 text-terminal hover:bg-terminal/5 transition-colors"
            >
              + Save Current Scenario
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 text-xs font-mono rounded border border-panel-border text-text-muted hover:text-text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={12} />
            Import from File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
