import React, { useState, useRef, useCallback } from 'react';
import { streamPrediction } from '../../utils/directApi';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { PaywallModal } from '../Settings/PaywallModal';

type Timeframe = '30d' | '90d' | '180d';
type Focus = 'nuclear' | 'conflict' | 'combined';

const TIMEFRAME_OPTIONS: { id: Timeframe; label: string }[] = [
  { id: '30d', label: '30 DAYS' },
  { id: '90d', label: '90 DAYS' },
  { id: '180d', label: '180 DAYS' },
];

const FOCUS_OPTIONS: { id: Focus; label: string }[] = [
  { id: 'nuclear', label: 'NUCLEAR' },
  { id: 'conflict', label: 'CONFLICT' },
  { id: 'combined', label: 'ALL' },
];

const RISK_LEVEL_MAP: Record<string, { label: string; color: string }> = {
  LOW: { label: 'LOW', color: '#00ff88' },
  ELEVATED: { label: 'ELEVATED', color: '#ffbb00' },
  HIGH: { label: 'HIGH', color: '#ff6600' },
  CRITICAL: { label: 'CRITICAL', color: '#ff2244' },
};

function parseRiskScore(text: string): number | null {
  // Try to match patterns like "(72/100)" or "72/100"
  const match = text.match(/\((\d{1,3})\/100\)/);
  if (match) return Math.min(100, Math.max(0, parseInt(match[1], 10)));
  return null;
}

function parseRiskLevel(text: string): string | null {
  const match = text.match(/NUCLEAR RISK:\s*(LOW|ELEVATED|HIGH|CRITICAL)/i);
  if (match) return match[1].toUpperCase();
  // Also try conflict risk
  const match2 = text.match(/CONFLICT RISK:\s*(LOW|ELEVATED|HIGH|CRITICAL)/i);
  if (match2) return match2[1].toUpperCase();
  return null;
}

interface PredictionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({ isOpen, onClose }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('90d');
  const [focus, setFocus] = useState<Focus>('combined');
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { aiUnlocked } = usePurchaseStore();
  const abortRef = useRef<AbortController | null>(null);
  const textRef = useRef('');

  const handleGenerate = useCallback(async () => {
    if (streaming) {
      abortRef.current?.abort();
      return;
    }

    setText('');
    textRef.current = '';
    setDone(false);
    setRiskScore(null);
    setRiskLevel(null);
    setStreaming(true);

    abortRef.current = new AbortController();

    await streamPrediction(
      { timeframe, focus },
      (chunk) => {
        textRef.current += chunk;
        setText(textRef.current);
        const score = parseRiskScore(textRef.current);
        if (score !== null) setRiskScore(score);
        const level = parseRiskLevel(textRef.current);
        if (level !== null) setRiskLevel(level);
      },
      () => { setStreaming(false); setDone(true); },
      abortRef.current.signal,
    );
  }, [streaming, timeframe, focus]);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // fallback — clipboard unavailable
    }
  }, [text]);

  const handleExport = useCallback(() => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcsp-prediction-${focus}-${timeframe}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [text, focus, timeframe]);

  const handleTimeframeChange = (t: Timeframe) => {
    if (streaming) {
      abortRef.current?.abort();
      setStreaming(false);
    }
    setTimeframe(t);
    setText('');
    setDone(false);
    setRiskScore(null);
    setRiskLevel(null);
  };

  const handleFocusChange = (f: Focus) => {
    if (streaming) {
      abortRef.current?.abort();
      setStreaming(false);
    }
    setFocus(f);
    setText('');
    setDone(false);
    setRiskScore(null);
    setRiskLevel(null);
  };

  if (!isOpen) return null;

  const riskInfo = riskLevel ? (RISK_LEVEL_MAP[riskLevel] ?? null) : null;
  const displayScore = riskScore ?? 0;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col rounded-lg border overflow-hidden"
        style={{
          background: '#0a0a0f',
          borderColor: '#00ff88' + '40',
          width: '90vw',
          maxWidth: '680px',
          maxHeight: '90vh',
          boxShadow: '0 0 40px rgba(0,255,136,0.15)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: '#00ff88' + '30', background: '#00ff88' + '06' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <div>
              <p
                className="font-mono font-bold text-xs uppercase tracking-widest"
                style={{ color: '#00ff88' }}
              >
                AI GEOPOLITICAL PREDICTION ENGINE
              </p>
              <p className="font-mono text-[10px]" style={{ color: '#8b949e' }}>
                Powered by Claude
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-sm font-bold transition-colors"
            style={{ color: '#8b949e' }}
            aria-label="Close"
          >
            [X]
          </button>
        </div>

        {/* Controls */}
        <div
          className="px-4 py-3 border-b space-y-2 shrink-0"
          style={{ borderColor: '#1e2a38' }}
        >
          {/* Timeframe */}
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] uppercase tracking-widest w-20 shrink-0"
              style={{ color: '#8b949e' }}
            >
              Timeframe:
            </span>
            <div className="flex gap-1 flex-1">
              {TIMEFRAME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleTimeframeChange(opt.id)}
                  className="flex-1 py-1 rounded border font-mono text-[10px] font-bold uppercase tracking-wider transition-colors"
                  style={{
                    color: timeframe === opt.id ? '#0a0a0f' : '#8b949e',
                    background: timeframe === opt.id ? '#00ff88' : 'transparent',
                    borderColor: timeframe === opt.id ? '#00ff88' : '#1e2a38',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus */}
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] uppercase tracking-widest w-20 shrink-0"
              style={{ color: '#8b949e' }}
            >
              Focus:
            </span>
            <div className="flex gap-1 flex-1">
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleFocusChange(opt.id)}
                  className="flex-1 py-1 rounded border font-mono text-[10px] font-bold uppercase tracking-wider transition-colors"
                  style={{
                    color: focus === opt.id ? '#0a0a0f' : '#8b949e',
                    background: focus === opt.id ? '#00ff88' : 'transparent',
                    borderColor: focus === opt.id ? '#00ff88' : '#1e2a38',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="px-4 py-3 shrink-0">
          <button
            onClick={aiUnlocked ? handleGenerate : () => setShowPaywall(true)}
            className="w-full py-2.5 rounded border font-mono font-bold text-xs uppercase tracking-wider transition-all"
            style={
              streaming
                ? {
                    borderColor: '#ff4444' + '60',
                    color: '#ff4444',
                    background: '#ff4444' + '10',
                  }
                : {
                    borderColor: '#00ff88' + '60',
                    color: '#00ff88',
                    background: '#00ff88' + '10',
                  }
            }
          >
            {streaming ? '⏹ STOP STREAMING' : '🔮 GENERATE FORECAST'}
          </button>
        </div>

        {/* Output area */}
        <div className="flex-1 overflow-y-auto px-4 pb-3 min-h-0 space-y-3">
          {/* Risk level card — appears once data starts streaming */}
          {(riskScore !== null || riskLevel !== null) && (
            <div
              className="rounded border p-3"
              style={{
                borderColor: riskInfo ? riskInfo.color + '40' : '#1e2a38',
                background: riskInfo ? riskInfo.color + '08' : '#0d1117',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: '#8b949e' }}
                >
                  RISK LEVEL
                </span>
                {riskLevel && riskInfo && (
                  <span
                    className="font-mono text-xs font-bold uppercase"
                    style={{ color: riskInfo.color }}
                  >
                    ● {riskInfo.label}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div
                className="rounded overflow-hidden mb-1"
                style={{ background: '#1e2a38', height: '8px' }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${displayScore}%`,
                    background: riskInfo ? riskInfo.color : '#00ff88',
                    boxShadow: riskInfo ? `0 0 8px ${riskInfo.color}` : '0 0 8px #00ff88',
                  }}
                />
              </div>
              <div
                className="font-mono text-[10px] text-right"
                style={{ color: riskInfo ? riskInfo.color : '#8b949e' }}
              >
                {displayScore}/100
              </div>
            </div>
          )}

          {/* Streamed text */}
          {(text || streaming) && (
            <div
              className="rounded border p-4 relative"
              style={{ borderColor: '#1e2a38', background: '#080810', minHeight: '120px' }}
            >
              <pre
                className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
                style={{ color: '#e6edf3' }}
              >
                {text}
                {streaming && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '14px',
                      background: '#00ff88',
                      marginLeft: '2px',
                      verticalAlign: 'text-bottom',
                      animation: 'blink 0.8s step-end infinite',
                    }}
                  />
                )}
              </pre>
              <style>{`
                @keyframes blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
              `}</style>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t shrink-0 space-y-2"
          style={{ borderColor: '#1e2a38' }}
        >
          {/* Action buttons */}
          {done && text && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-xs transition-colors"
                style={{
                  borderColor: '#1e2a38',
                  color: copySuccess ? '#00ff88' : '#8b949e',
                  background: copySuccess ? '#00ff88' + '10' : 'transparent',
                }}
              >
                📋 {copySuccess ? 'COPIED!' : 'Copy'}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-xs transition-colors"
                style={{
                  borderColor: '#1e2a38',
                  color: '#8b949e',
                  background: 'transparent',
                }}
              >
                📄 Export
              </button>
              <div className="flex-1 flex items-center justify-end">
                <span
                  className="font-mono text-[9px] uppercase tracking-widest"
                  style={{ color: '#8b949e' + '60' }}
                >
                  POWERED BY CLAUDE
                </span>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div
            className="flex items-start gap-2 rounded border px-3 py-2"
            style={{ borderColor: '#ffbb00' + '20', background: '#ffbb00' + '04' }}
          >
            <span className="text-[10px] shrink-0">⚠</span>
            <p className="font-mono text-[10px] leading-relaxed" style={{ color: '#8b949e' }}>
              AI-generated analysis for educational purposes. Not predictive intelligence.
              Not for operational use.
            </p>
          </div>
        </div>
      </div>
    </div>

    {showPaywall && (
      <PaywallModal
        onClose={() => setShowPaywall(false)}
        onUnlocked={() => setShowPaywall(false)}
      />
    )}
  </>
  );
};

export default PredictionPanel;
