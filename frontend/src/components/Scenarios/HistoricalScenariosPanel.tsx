import React, { useState } from 'react';
import { X, BookOpen, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import { historicalScenarios } from '../../data/historicalScenarios';
import type { HistoricalScenario } from '../../data/historicalScenarios';

type CategoryFilter = 'all' | 'historical' | 'cold-war' | 'modern' | 'hypothetical';

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'historical', label: 'HISTORICAL' },
  { id: 'cold-war', label: 'COLD WAR' },
  { id: 'modern', label: 'MODERN' },
  { id: 'hypothetical', label: 'HYPOTHETICAL' },
];

function categoryBadgeStyle(category: HistoricalScenario['category']): React.CSSProperties {
  const colors: Record<HistoricalScenario['category'], string> = {
    historical: '#ffbb00',
    'cold-war': '#4da6ff',
    modern: '#ff8800',
    hypothetical: '#ff4444',
  };
  const color = colors[category];
  return {
    color,
    borderColor: color + '50',
    backgroundColor: color + '15',
  };
}

function categoryLabel(category: HistoricalScenario['category']): string {
  const labels: Record<HistoricalScenario['category'], string> = {
    historical: 'HISTORICAL',
    'cold-war': 'COLD WAR',
    modern: 'MODERN',
    hypothetical: 'HYPOTHETICAL',
  };
  return labels[category];
}

interface ScenarioCardProps {
  scenario: HistoricalScenario;
  onLoad: (scenario: HistoricalScenario) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onLoad }) => {
  const [contextOpen, setContextOpen] = useState(false);

  return (
    <div
      className="rounded border p-3 space-y-2"
      style={{ borderColor: '#1e2a38', background: '#0a0a0f' }}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              className="font-mono font-bold text-xs"
              style={{ color: '#00ff88' }}
            >
              {scenario.name}
            </span>
            <span
              className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide flex-shrink-0"
              style={categoryBadgeStyle(scenario.category)}
            >
              {categoryLabel(scenario.category)}
            </span>
          </div>
          <p className="font-mono text-[10px]" style={{ color: '#8b949e' }}>
            {scenario.subtitle}
          </p>
        </div>
        <span
          className="font-mono text-xs font-bold flex-shrink-0"
          style={{ color: '#8b949e' }}
        >
          {scenario.year}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 font-mono text-[10px]" style={{ color: '#8b949e' }}>
        <span>
          <span style={{ color: '#e6edf3' }}>{scenario.totalWarheads}</span>
          {' '}strike{scenario.totalWarheads !== 1 ? 's' : ''}
        </span>
        <span style={{ color: '#1e2a38' }}>·</span>
        <span>
          Est. <span style={{ color: '#ff8800' }}>{scenario.estimatedCasualties}</span> casualties
        </span>
      </div>

      {/* Description */}
      <p
        className="font-mono text-[10px] leading-relaxed line-clamp-3"
        style={{ color: '#8b949e' }}
      >
        {scenario.description}
      </p>

      {/* Context toggle */}
      <button
        onClick={() => setContextOpen((o) => !o)}
        className="flex items-center gap-1 font-mono text-[10px] transition-colors"
        style={{ color: contextOpen ? '#00ff88' : '#8b949e' }}
      >
        {contextOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        Context
      </button>

      {contextOpen && (
        <div
          className="rounded border p-2"
          style={{ borderColor: '#1e2a38', background: '#0d1117' }}
        >
          <p className="font-mono text-[10px] leading-relaxed" style={{ color: '#8b949e' }}>
            {scenario.historicalContext}
          </p>
        </div>
      )}

      {/* Load button */}
      <button
        onClick={() => onLoad(scenario)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border font-mono font-bold text-xs uppercase tracking-wider transition-colors"
        style={{
          color: '#00ff88',
          borderColor: '#00ff88' + '40',
          background: '#00ff88' + '08',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#00ff88' + '18';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#00ff88' + '08';
        }}
      >
        <Play size={11} />
        Load Scenario
      </button>
    </div>
  );
};

export const HistoricalScenariosPanel: React.FC = () => {
  const { showScenariosPanel, toggleScenariosPanel, loadHistoricalScenario } =
    useSimulationStore();
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');

  if (!showScenariosPanel) return null;

  const filtered =
    activeFilter === 'all'
      ? historicalScenarios
      : historicalScenarios.filter((s) => s.category === activeFilter);

  return (
    <div
      className="fixed inset-0 z-[1100] pointer-events-none"
    >
      {/* Backdrop — only the panel area is pointer-events-auto */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={toggleScenariosPanel}
      />

      {/* Panel */}
      <div
        className="absolute top-14 right-0 w-[480px] flex flex-col pointer-events-auto"
        style={{
          height: 'calc(100vh - 3.5rem)',
          background: '#0d1117',
          borderLeft: '1px solid #1e2a38',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: '#1e2a38' }}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={15} style={{ color: '#00ff88' }} />
            <h2
              className="font-mono font-bold uppercase tracking-widest text-sm"
              style={{ color: '#00ff88' }}
            >
              Historical Scenarios
            </h2>
          </div>
          <button
            onClick={toggleScenariosPanel}
            className="p-1 rounded transition-colors"
            style={{ color: '#8b949e' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#e6edf3';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#8b949e';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Category filter tabs */}
        <div
          className="flex border-b flex-shrink-0 overflow-x-auto"
          style={{ borderColor: '#1e2a38' }}
        >
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className="flex-shrink-0 px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2"
              style={{
                color: activeFilter === f.id ? '#00ff88' : '#8b949e',
                borderColor: activeFilter === f.id ? '#00ff88' : 'transparent',
                background: 'transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Scenario count */}
        <div
          className="px-5 py-2 flex-shrink-0 border-b"
          style={{ borderColor: '#1e2a38' }}
        >
          <p className="font-mono text-[10px]" style={{ color: '#8b949e' }}>
            <span style={{ color: '#00ff88' }}>{filtered.length}</span>
            {' '}scenario{filtered.length !== 1 ? 's' : ''}
            {activeFilter !== 'all' ? ` · ${CATEGORY_FILTERS.find((f) => f.id === activeFilter)?.label}` : ''}
          </p>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onLoad={loadHistoricalScenario}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          className="border-t px-5 py-2 flex-shrink-0 flex items-center justify-between"
          style={{ borderColor: '#1e2a38' }}
        >
          <p className="font-mono text-[9px]" style={{ color: '#8b949e' }}>
            {historicalScenarios.length} scenarios · Educational use only
          </p>
          <p className="font-mono text-[9px]" style={{ color: '#8b949e' }}>
            Sources: NTI, BAS, SIPRI
          </p>
        </div>
      </div>
    </div>
  );
};
