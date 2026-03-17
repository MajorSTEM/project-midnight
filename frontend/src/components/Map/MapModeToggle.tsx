import React from 'react';

interface Props {
  mode: '2d' | '3d';
  onModeChange: (mode: '2d' | '3d') => void;
}

export const MapModeToggle: React.FC<Props> = ({ mode, onModeChange }) => {
  return (
    <div className="flex rounded border border-panel-border overflow-hidden bg-panel/90 backdrop-blur-sm">
      <button
        onClick={() => onModeChange('2d')}
        className={`px-3 py-1.5 text-xs font-mono transition-colors ${
          mode === '2d'
            ? 'bg-terminal/10 text-terminal border-r border-panel-border'
            : 'text-text-muted hover:text-text-primary border-r border-panel-border'
        }`}
      >
        2D
      </button>
      <button
        onClick={() => onModeChange('3d')}
        className={`px-3 py-1.5 text-xs font-mono transition-colors ${
          mode === '3d'
            ? 'bg-terminal/10 text-terminal'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        3D
      </button>
    </div>
  );
};
