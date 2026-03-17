import React from 'react';
import { useEMPStore } from '../../stores/empStore';
import type { EMPCity } from '../../utils/empPhysics';

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const INTENSITY_COLOR: Record<EMPCity['e1Intensity'], string> = {
  full: '#ff2222',
  partial: '#ff8800',
  edge: '#ffcc00',
};

const INTENSITY_LABEL: Record<EMPCity['e1Intensity'], string> = {
  full: 'FULL',
  partial: 'PARTIAL',
  edge: 'EDGE',
};

interface Props {
  onClose?: () => void;
}

export const EMPResultsPanel: React.FC<Props> = ({ onClose }) => {
  const { result, config } = useEMPStore();

  if (!result) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-4">
        <p className="text-text-muted font-mono text-xs text-center">
          Configure an EMP strike in the left panel and click CALCULATE EMP.
        </p>
      </div>
    );
  }

  const coverageAreaKm2 = Math.PI * Math.pow(result.e1RadiusKm, 2);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border flex-shrink-0">
        <div>
          <h2
            className="text-xs font-mono font-bold uppercase tracking-widest"
            style={{ color: '#ffcc00' }}
          >
            ⚡ EMP Strike Analysis
          </h2>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">
            {config.nation} · {config.yieldKt >= 1000
              ? `${(config.yieldKt / 1000).toFixed(1)} Mt`
              : `${config.yieldKt} kt`} @ {config.altitudeKm} km
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-5 pb-4">

        {/* EMP Coverage */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            EMP Coverage
          </p>
          <div className="bg-midnight border border-panel-border rounded p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">E1 Radius (electronics)</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: '#ff4444' }}>
                {result.e1RadiusKm.toFixed(0)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">E2 Radius (lightning)</span>
              <span className="text-[10px] font-mono" style={{ color: '#ff8800' }}>
                {result.e2RadiusKm.toFixed(0)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">E3 Radius (power grid)</span>
              <span className="text-[10px] font-mono" style={{ color: '#ffcc00' }}>
                {result.e3RadiusKm.toFixed(0)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">Coverage Area</span>
              <span className="text-[10px] font-mono text-text-primary">
                {coverageAreaKm2 >= 1_000_000
                  ? `${(coverageAreaKm2 / 1_000_000).toFixed(2)}M km²`
                  : `${coverageAreaKm2.toFixed(0)} km²`}
              </span>
            </div>
            <div className="border-t border-panel-border pt-1.5 space-y-1">
              <div className="flex justify-between">
                <span className="text-[9px] font-mono text-text-muted">E1 Peak Field</span>
                <span className="text-[9px] font-mono text-text-muted">
                  {(result.e1PeakVm / 1000).toFixed(0)} kV/m
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Affected Infrastructure */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Affected Infrastructure
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-midnight border border-red-900/60 rounded p-2">
              <p className="text-[9px] font-mono text-text-muted uppercase">Population</p>
              <p className="text-sm font-mono font-bold text-red-400">
                {result.populationAffected >= 1_000_000
                  ? `${(result.populationAffected / 1_000_000).toFixed(0)}M`
                  : `${(result.populationAffected / 1000).toFixed(0)}K`}
              </p>
            </div>
            <div className="bg-midnight border border-orange-900/60 rounded p-2">
              <p className="text-[9px] font-mono text-text-muted uppercase">Grid Regions</p>
              <p className="text-sm font-mono font-bold text-orange-400">
                {result.powerGridsAffected}
              </p>
            </div>
            <div className="bg-midnight border border-panel-border rounded p-2 col-span-2">
              <p className="text-[9px] font-mono text-text-muted uppercase">
                Transformers at Risk
              </p>
              <p className="text-sm font-mono font-bold" style={{ color: '#ffcc00' }}>
                {result.transformersAtRisk.toLocaleString()}
              </p>
              <p className="text-[9px] font-mono text-text-muted mt-0.5">
                Replacement lead time: 1–2 years
              </p>
            </div>
          </div>
        </section>

        {/* Affected Cities */}
        {result.affectedCities.length > 0 && (
          <section>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
              Cities Within E1 Range ({result.affectedCities.length})
            </p>
            <div className="bg-midnight border border-panel-border rounded overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 border-b border-panel-border bg-panel-light">
                <span className="text-[9px] font-mono text-text-muted uppercase">City</span>
                <span className="text-[9px] font-mono text-text-muted uppercase">Dist</span>
                <span className="text-[9px] font-mono text-text-muted uppercase">Pop</span>
                <span className="text-[9px] font-mono text-text-muted uppercase">E1</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {result.affectedCities.map((city) => (
                  <div
                    key={city.name}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 border-b border-panel-border/50 last:border-0"
                  >
                    <span className="text-[10px] font-mono text-text-primary truncate">
                      {city.name}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {city.distanceKm} km
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {city.population >= 1_000_000
                        ? `${(city.population / 1_000_000).toFixed(0)}M`
                        : `${(city.population / 1000).toFixed(0)}K`}
                    </span>
                    <span
                      className="text-[9px] font-mono font-bold"
                      style={{ color: INTENSITY_COLOR[city.e1Intensity] }}
                    >
                      {INTENSITY_LABEL[city.e1Intensity]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recovery Timeline */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Recovery Timeline
          </p>
          <div className="space-y-2">
            {[
              { label: 'Week 1', text: result.recoveryTimeline.week1, color: '#ff4444' },
              { label: 'Month 1', text: result.recoveryTimeline.month1, color: '#ff8800' },
              { label: 'Year 1', text: result.recoveryTimeline.year1, color: '#ffcc00' },
              { label: 'Long-term', text: result.recoveryTimeline.longTerm, color: '#88ff88' },
            ].map(({ label, text, color }) => (
              <div key={label} className="bg-midnight border border-panel-border rounded p-2">
                <p className="text-[9px] font-mono font-bold mb-1" style={{ color }}>
                  {label}
                </p>
                <p className="text-[9px] font-mono text-text-muted leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Casualties */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Casualties
          </p>
          <div className="bg-midnight border border-panel-border rounded p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">Direct Deaths (blast)</span>
              <span className="text-[10px] font-mono text-blast">
                {result.directDeaths === 0
                  ? 'Near zero (HEMP)'
                  : formatNum(result.directDeaths)}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                Indirect Deaths (1yr)
              </span>
              <span className="text-[10px] font-mono text-red-400 text-right">
                {result.indirectDeaths}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
