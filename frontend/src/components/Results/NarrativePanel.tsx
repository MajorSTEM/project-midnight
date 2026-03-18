import React, { useState, useRef, useCallback } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { streamNarrative } from '../../utils/directApi';
import { useSettingsStore } from '../../stores/settingsStore';
import { usePurchaseStore } from '../../stores/purchaseStore';
import { PaywallModal } from '../Settings/PaywallModal';

type NarrativeType = 'aftermath' | 'journal' | 'geopolitical';

const NARRATIVE_TABS: { id: NarrativeType; label: string }[] = [
  { id: 'aftermath', label: 'AFTERMATH' },
  { id: 'journal', label: 'JOURNAL' },
  { id: 'geopolitical', label: 'GEOPOLITICS' },
];

export const NarrativePanel: React.FC = () => {
  const { result, config, simulationMode } = useSimulationStore();
  const { aiUnlocked } = usePurchaseStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [narrativeType, setNarrativeType] = useState<NarrativeType>('aftermath');
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textRef = useRef('');
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const locationName = result?.strikeLocation
    ? `${result.strikeLocation.lat.toFixed(3)}°, ${result.strikeLocation.lng.toFixed(3)}°`
    : undefined;

  const handleGenerate = useCallback(async () => {
    if (streaming) {
      abortRef.current?.abort();
      return;
    }

    setText('');
    textRef.current = '';
    setDone(false);
    setProgress(0);
    setStreaming(true);

    let fakeProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 2, 92);
      setProgress(fakeProgress);
    }, 150);

    abortRef.current = new AbortController();

    await streamNarrative(
      {
        type: simulationMode,
        narrativeType,
        locationName,
        config: result?.effects ? { yieldKt: result.effects.yieldKt, burstType: result.effects.burstType } : {},
      },
      (chunk) => { textRef.current += chunk; setText(textRef.current); },
      () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setProgress(100);
        setStreaming(false);
        setDone(true);
      },
      abortRef.current.signal,
    );
  }, [streaming, simulationMode, narrativeType, locationName, result]);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // fallback
    }
  }, [text]);

  const handleTabChange = (tab: NarrativeType) => {
    if (streaming) {
      abortRef.current?.abort();
      setStreaming(false);
    }
    setNarrativeType(tab);
    setText('');
    setDone(false);
    setProgress(0);
  };

  return (
    <>
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div
        className="rounded border p-3 flex items-center justify-between"
        style={{ borderColor: '#00ff88' + '30', background: '#00ff88' + '06' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <div>
            <p className="font-mono font-bold text-xs uppercase tracking-widest" style={{ color: '#00ff88' }}>
              AI Narrative Engine
            </p>
            <p className="font-mono text-[10px]" style={{ color: '#8b949e' }}>
              Immersive post-apocalypse scenarios
            </p>
          </div>
        </div>
        <div
          className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest border"
          style={{
            color: '#00ff88',
            borderColor: '#00ff88' + '40',
            background: '#00ff88' + '10',
            animation: 'pulse 2s infinite',
          }}
        >
          POWERED BY CLAUDE
        </div>
      </div>

      {/* No API key info banner */}
      {!useSettingsStore.getState().hasAiKey() && (
        <div
          className="rounded border px-3 py-2 flex items-center gap-2"
          style={{ borderColor: '#ffbb00' + '30', background: '#ffbb00' + '06' }}
        >
          <span className="text-xs">ℹ️</span>
          <p className="font-mono text-[10px]" style={{ color: '#8b949e' }}>
            Add a <span style={{ color: '#ffbb00' }}>Claude or OpenAI API key</span> in{' '}
            <span style={{ color: '#e6edf3' }}>Settings ⚙</span> for live AI narratives.
            Without it, high-quality pre-written content is served.
          </p>
        </div>
      )}

      {/* Narrative type tabs */}
      <div
        className="flex rounded overflow-hidden border"
        style={{ borderColor: '#1e2a38' }}
      >
        {NARRATIVE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
            style={{
              color: narrativeType === tab.id ? '#0a0a0f' : '#8b949e',
              background: narrativeType === tab.id ? '#00ff88' : 'transparent',
              borderRight: '1px solid #1e2a38',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate button */}
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
        {streaming ? '⏹ STOP STREAMING' : '▶ GENERATE NARRATIVE'}
      </button>

      {/* Progress bar */}
      {(streaming || (done && progress === 100)) && (
        <div
          className="rounded overflow-hidden"
          style={{ background: '#1e2a38', height: '3px' }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: '#00ff88',
              boxShadow: '0 0 8px #00ff88',
            }}
          />
        </div>
      )}

      {/* Text output */}
      {(text || streaming) && (
        <div
          className="rounded border p-4 relative"
          style={{ borderColor: '#1e2a38', background: '#0a0a0f', minHeight: '120px' }}
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
            📋 {copySuccess ? 'COPIED!' : 'COPY'}
          </button>
          <button
            onClick={() => {
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `gcsp-narrative-${narrativeType}-${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-xs transition-colors"
            style={{
              borderColor: '#1e2a38',
              color: '#8b949e',
              background: 'transparent',
            }}
          >
            📄 EXPORT
          </button>
        </div>
      )}

      {/* Powered by badge (bottom right within panel) */}
      {done && (
        <div className="flex justify-end">
          <span
            className="font-mono text-[9px] uppercase tracking-widest"
            style={{ color: '#8b949e' + '80' }}
          >
            Powered by Claude · Anthropic
          </span>
        </div>
      )}
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
