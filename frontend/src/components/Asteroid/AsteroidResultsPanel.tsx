import React from 'react';
import { useAsteroidStore } from '../../stores/asteroidStore';

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatRadius(km: number): string {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
}

function scientificNotation(n: number): string {
  if (n === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mantissa = n / Math.pow(10, exp);
  return `${mantissa.toFixed(2)} × 10^${exp}`;
}

interface ZoneRowProps {
  color: string;
  label: string;
  value: string;
  desc?: string;
}

const ZoneRow: React.FC<ZoneRowProps> = ({ color, label, value, desc }) => (
  <div className="flex items-center gap-2 py-0.5">
    <div
      className="w-3 h-3 rounded-full flex-shrink-0 border"
      style={{ backgroundColor: color + '80', borderColor: color }}
    />
    <div className="flex-1 min-w-0">
      <span className="text-[10px] font-mono text-text-muted">{label}</span>
      {desc && <span className="text-[9px] font-mono text-text-muted/60 ml-1">({desc})</span>}
    </div>
    <span className="text-[10px] font-mono font-bold" style={{ color }}>
      {value}
    </span>
  </div>
);

interface Props {
  onClose?: () => void;
}

export const AsteroidResultsPanel: React.FC<Props> = ({ onClose }) => {
  const { result, config } = useAsteroidStore();

  if (!result) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-4">
        <p className="text-text-muted font-mono text-xs text-center">
          Configure an asteroid in the left panel and click CALCULATE IMPACT.
        </p>
      </div>
    );
  }

  const hiroshimaEquiv = Math.round(result.energyMt / 0.015); // Hiroshima ≈ 15kt = 0.015Mt
  const warheadEquiv = Math.round(result.energyMt / 0.3);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border flex-shrink-0">
        <div>
          <h2
            className="text-xs font-mono font-bold uppercase tracking-widest"
            style={{ color: '#ff8844' }}
          >
            ☄ Asteroid Impact Analysis
          </h2>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">
            {config.targetName} · {config.diameterM >= 1000
              ? `${(config.diameterM / 1000).toFixed(1)} km`
              : `${config.diameterM} m`} impactor
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-5 pb-4">

        {/* Impactor */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Impactor Properties
          </p>
          <div className="bg-midnight border border-panel-border rounded p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">Mass</span>
              <span className="text-[10px] font-mono" style={{ color: '#ff8844' }}>
                {scientificNotation(result.massKg)} kg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">Total Energy</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: '#ff4444' }}>
                {result.energyMt >= 1000
                  ? `${(result.energyMt / 1000).toFixed(0)},${((result.energyMt % 1000)).toFixed(0).padStart(3, '0')} Mt`
                  : `${result.energyMt.toFixed(1)} Mt`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">≈ Hiroshima bombs</span>
              <span className="text-[10px] font-mono text-blast">
                {formatNum(hiroshimaEquiv)}
              </span>
            </div>
            {result.airburstAltitudeKm !== null ? (
              <div className="flex justify-between">
                <span className="text-[10px] font-mono text-text-muted">Airburst Altitude</span>
                <span className="text-[10px] font-mono text-yellow-400">
                  {result.airburstAltitudeKm.toFixed(1)} km
                </span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-[10px] font-mono text-text-muted">Impact Type</span>
                <span className="text-[10px] font-mono text-orange-400">Ground Impact</span>
              </div>
            )}
          </div>
        </section>

        {/* Blast Effects */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Effects Radii
          </p>
          <div className="bg-midnight border border-panel-border rounded p-3 space-y-0.5">
            <ZoneRow
              color="#ff2222"
              label="Severe Blast"
              desc="10 psi — concrete damage"
              value={formatRadius(result.severeBlastRadiusKm)}
            />
            <ZoneRow
              color="#ff6600"
              label="Moderate Blast"
              desc="5 psi — structures destroyed"
              value={formatRadius(result.moderateBlastRadiusKm)}
            />
            <ZoneRow
              color="#ffcc00"
              label="Light Blast"
              desc="1 psi — windows broken"
              value={formatRadius(result.lightBlastRadiusKm)}
            />
            <ZoneRow
              color="#cc44ff"
              label="Thermal Burns"
              desc="3rd degree"
              value={formatRadius(result.thermalRadiusKm)}
            />
            <ZoneRow
              color="#4488ff"
              label="Ignition Radius"
              desc="paper/wood fires"
              value={formatRadius(result.ignitionRadiusKm)}
            />
          </div>
        </section>

        {/* Ground Impact / Airburst */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            {result.airburstAltitudeKm !== null
              ? `Airburst at ${result.airburstAltitudeKm.toFixed(1)} km Altitude`
              : 'Ground Impact'}
          </p>
          <div className="bg-midnight border border-panel-border rounded p-3 space-y-1.5">
            {result.craterDiameterKm !== null && result.craterDepthKm !== null ? (
              <>
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-text-muted">Crater Diameter</span>
                  <span className="text-[10px] font-mono" style={{ color: '#cc8844' }}>
                    {result.craterDiameterKm.toFixed(2)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-text-muted">Crater Depth</span>
                  <span className="text-[10px] font-mono" style={{ color: '#cc8844' }}>
                    {result.craterDepthKm.toFixed(3)} km
                  </span>
                </div>
              </>
            ) : (
              <p className="text-[10px] font-mono text-text-muted italic">
                No surface crater — airburst
              </p>
            )}
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">Seismic Magnitude</span>
              <span className="text-[10px] font-mono" style={{ color: '#ffaa44' }}>
                M {result.richterMagnitude.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-text-muted">Strong Shaking</span>
              <span className="text-[10px] font-mono" style={{ color: '#ffaa44' }}>
                {result.seismicShakingRadiusKm.toFixed(0)} km radius
              </span>
            </div>
          </div>
        </section>

        {/* Tsunami */}
        {result.tsunamiWaveHeightM && (
          <section>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
              Tsunami Wave Heights
            </p>
            <div className="bg-midnight border border-panel-border rounded p-3 space-y-1">
              {Object.entries(result.tsunamiWaveHeightM).map(([dist, height]) => (
                <div key={dist} className="flex justify-between">
                  <span className="text-[10px] font-mono text-text-muted">
                    {Number(dist).toLocaleString()} km
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: '#4488ff' }}>
                    {height.toFixed(1)} m
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Casualties */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Estimated Casualties
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-midnight border border-red-900/60 rounded p-2">
              <p className="text-[9px] font-mono text-text-muted uppercase">Immediate Deaths</p>
              <p className="text-sm font-mono font-bold text-red-400">
                {formatNum(result.immediateDeaths)}
              </p>
            </div>
            <div className="bg-midnight border border-orange-900/60 rounded p-2">
              <p className="text-[9px] font-mono text-text-muted uppercase">Injured</p>
              <p className="text-sm font-mono font-bold text-orange-400">
                {formatNum(result.injuredTotal)}
              </p>
            </div>
            <div className="bg-midnight border border-panel-border rounded p-2 col-span-2">
              <p className="text-[9px] font-mono text-text-muted uppercase">Total Affected Area</p>
              <p className="text-sm font-mono font-bold" style={{ color: '#ff8844' }}>
                {result.totalAffectedKm2.toFixed(0)} km²
              </p>
            </div>
          </div>
        </section>

        {/* Nuclear Comparison */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Comparison to Nuclear
          </p>
          <div className="bg-midnight border border-panel-border rounded p-3">
            <p className="text-[10px] font-mono text-text-muted">
              Equivalent to approximately:
            </p>
            <p className="text-sm font-mono font-bold text-blast mt-1">
              {formatNum(warheadEquiv)} nuclear warheads
            </p>
            <p className="text-[9px] font-mono text-text-muted mt-1">
              (Based on avg. 300kt warhead yield)
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
