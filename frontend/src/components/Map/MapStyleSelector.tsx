import React from 'react';

export type MapStyle = 'dark' | 'light' | 'satellite' | 'street' | 'topo' | 'flir' | 'auto';

interface MapStyleSelectorProps {
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;
}

const STYLES: { id: MapStyle; label: string; icon: string }[] = [
  { id: 'dark',      label: 'DARK',   icon: '🌑' },
  { id: 'light',     label: 'LIGHT',  icon: '☀️' },
  { id: 'satellite', label: 'SAT',    icon: '🛰' },
  { id: 'street',    label: 'STREET', icon: '🗺' },
  { id: 'topo',      label: 'TOPO',   icon: '🏔' },
  { id: 'flir',      label: 'FLIR',   icon: '🟢' },
  { id: 'auto',      label: 'AUTO',   icon: '⚡' },
];

export const MapStyleSelector: React.FC<MapStyleSelectorProps> = ({ mapStyle, setMapStyle }) => {
  return (
    <div
      className="flex flex-col gap-1"
      style={{ pointerEvents: 'all' }}
    >
      {STYLES.map((style) => (
        <button
          key={style.id}
          onClick={() => setMapStyle(style.id)}
          title={`${style.label} map`}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded border font-mono text-[10px] font-bold uppercase tracking-wide transition-all backdrop-blur-sm"
          style={{
            background: mapStyle === style.id ? '#00ff88' + '20' : '#0d1117' + 'cc',
            borderColor: mapStyle === style.id ? '#00ff88' + '80' : '#1e2a38',
            color: mapStyle === style.id ? '#00ff88' : '#8b949e',
            boxShadow: mapStyle === style.id ? '0 0 8px rgba(0,255,136,0.15)' : 'none',
            minWidth: '72px',
          }}
        >
          <span style={{ fontSize: '12px' }}>{style.icon}</span>
          <span>{style.label}</span>
        </button>
      ))}
    </div>
  );
};
