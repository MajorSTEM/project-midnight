import React, { useState } from 'react';
import { usePurchaseStore } from '../../stores/purchaseStore';

interface PaywallModalProps {
  onClose: () => void;
  onUnlocked: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onClose, onUnlocked }) => {
  const { purchaseAiUnlock, restorePurchases, loading, error } = usePurchaseStore();
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async () => {
    const success = await purchaseAiUnlock();
    if (success) onUnlocked();
  };

  const handleRestore = async () => {
    setRestoring(true);
    await restorePurchases();
    setRestoring(false);
    const { aiUnlocked } = usePurchaseStore.getState();
    if (aiUnlocked) onUnlocked();
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col rounded-lg border overflow-hidden"
        style={{
          background: '#0a0a0f',
          borderColor: '#00ff88' + '40',
          width: '90vw',
          maxWidth: '420px',
          boxShadow: '0 0 60px rgba(0,255,136,0.15)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b text-center"
          style={{ borderColor: '#00ff88' + '20', background: '#00ff88' + '06' }}
        >
          <div className="text-3xl mb-2">🤖</div>
          <p className="font-mono font-bold text-sm uppercase tracking-widest" style={{ color: '#00ff88' }}>
            Unlock AI Features
          </p>
          <p className="font-mono text-[10px] mt-1" style={{ color: '#8b949e' }}>
            One-time purchase · No subscription
          </p>
        </div>

        {/* Features list */}
        <div className="px-5 py-4 space-y-3">
          {[
            { icon: '📖', title: 'AI Narrative Engine', desc: 'Aftermath stories, survivor journals, geopolitical fallout — streamed live by Claude' },
            { icon: '🔮', title: 'AI Prediction Engine', desc: 'Real-time geopolitical risk forecasting with nuclear & conflict probability scores' },
            { icon: '♾️', title: 'Unlimited Generations', desc: 'Generate as many scenarios as you want using your own API key or built-in access' },
          ].map((f) => (
            <div key={f.title} className="flex gap-3 items-start">
              <span className="text-lg flex-shrink-0">{f.icon}</span>
              <div>
                <p className="font-mono text-xs font-bold" style={{ color: '#e6edf3' }}>{f.title}</p>
                <p className="font-mono text-[10px] leading-relaxed" style={{ color: '#8b949e' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#1e2a38' }} />

        {/* Price + CTA */}
        <div className="px-5 py-4 space-y-3">
          {error && (
            <p className="font-mono text-[10px] text-center" style={{ color: '#ff4444' }}>{error}</p>
          )}

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full py-3 rounded border font-mono font-bold text-sm uppercase tracking-wider transition-all"
            style={{
              borderColor: '#00ff88',
              color: '#0a0a0f',
              background: loading ? '#00ff88' + '40' : '#00ff88',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Processing...' : 'Unlock for $2.99'}
          </button>

          <button
            onClick={handleRestore}
            disabled={restoring || loading}
            className="w-full py-2 rounded font-mono text-[10px] uppercase tracking-wider transition-colors"
            style={{ color: '#8b949e', background: 'transparent' }}
          >
            {restoring ? 'Restoring...' : 'Restore Previous Purchase'}
          </button>

          <p
            className="font-mono text-[9px] text-center leading-relaxed"
            style={{ color: '#8b949e' + '80' }}
          >
            Payment charged to your Apple ID account at confirmation.
            No recurring charges.
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 font-mono text-xs"
          style={{ color: '#8b949e' }}
          aria-label="Close"
        >
          [X]
        </button>
      </div>
    </div>
  );
};
