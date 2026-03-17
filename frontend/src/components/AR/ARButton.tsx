import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface ARButtonProps {
  onOpen: () => void;
}

export const ARButton: React.FC<ARButtonProps> = ({ onOpen }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded whitespace-nowrap pointer-events-none"
          style={{
            background: 'rgba(10,10,15,0.95)',
            border: '1px solid #00ff88' + '40',
          }}
        >
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#00ff88' }}>
            View in AR
          </span>
          {/* Arrow */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full"
            style={{
              width: 0,
              height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: `5px solid ${'#00ff88' + '40'}`,
            }}
          />
        </div>
      )}

      <button
        onClick={onOpen}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="flex items-center justify-center rounded-full border transition-all"
        style={{
          width: '44px',
          height: '44px',
          background: 'rgba(10,10,15,0.9)',
          borderColor: '#00ff88' + '50',
          boxShadow: '0 0 12px rgba(0,255,136,0.2)',
          color: '#00ff88',
        }}
        aria-label="View in AR"
        title="View in AR"
      >
        <Camera size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default ARButton;
