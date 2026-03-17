import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import {
  exportResultsAsText,
  exportResultsAsJSON,
  copyResultsToClipboard,
} from '../../utils/exportUtils';
import { buildShareURL } from '../../utils/shareUtils';

export const ExportPanel: React.FC = () => {
  const { result, config } = useSimulationStore();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!result) return null;

  const handleCopy = async () => {
    try {
      await copyResultsToClipboard(result, config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ExportPanel] Copy failed:', err);
    }
  };

  const handleTXT = () => {
    exportResultsAsText(result, config);
  };

  const handleJSON = () => {
    exportResultsAsJSON(result, config);
  };

  const handleShare = async () => {
    try {
      const url = buildShareURL(config);
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('[ExportPanel] Share link copy failed:', err);
    }
  };

  const btnBase: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'background 0.15s',
    color: '#8b949e',
    borderColor: '#1e2a38',
    background: '#0d1117',
  };

  const btnHoverStyle = (
    e: React.MouseEvent<HTMLButtonElement>,
    enter: boolean,
  ) => {
    const btn = e.currentTarget;
    btn.style.background = enter ? '#1e2a38' : '#0d1117';
    btn.style.color = enter ? '#e6edf3' : '#8b949e';
  };

  return (
    <div
      className="border-t flex-shrink-0 px-4 py-3"
      style={{ borderColor: '#1e2a38' }}
    >
      <div className="flex items-center gap-1 mb-2">
        <Download size={10} style={{ color: '#8b949e' }} />
        <span
          className="font-mono uppercase tracking-widest"
          style={{ fontSize: '10px', color: '#8b949e' }}
        >
          Export Results
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleCopy}
          style={btnBase}
          onMouseEnter={(e) => btnHoverStyle(e, true)}
          onMouseLeave={(e) => btnHoverStyle(e, false)}
          title="Copy results as text"
        >
          📋 Copy
        </button>

        <button
          onClick={handleTXT}
          style={btnBase}
          onMouseEnter={(e) => btnHoverStyle(e, true)}
          onMouseLeave={(e) => btnHoverStyle(e, false)}
          title="Download as .txt"
        >
          📄 .TXT
        </button>

        <button
          onClick={handleJSON}
          style={btnBase}
          onMouseEnter={(e) => btnHoverStyle(e, true)}
          onMouseLeave={(e) => btnHoverStyle(e, false)}
          title="Download as JSON"
        >
          📊 JSON
        </button>

        <button
          onClick={handleShare}
          style={btnBase}
          onMouseEnter={(e) => btnHoverStyle(e, true)}
          onMouseLeave={(e) => btnHoverStyle(e, false)}
          title="Copy share link"
        >
          🔗 Share
        </button>
      </div>

      {(copied || linkCopied) && (
        <span
          className="font-mono mt-1 block"
          style={{ fontSize: '10px', color: '#00ff88' }}
        >
          {copied ? 'Copied to clipboard!' : 'Share link copied!'}
        </span>
      )}
    </div>
  );
};
