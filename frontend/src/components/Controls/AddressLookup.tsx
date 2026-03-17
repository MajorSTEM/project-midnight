import React, { useState } from 'react';
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

interface AddressLookupProps {
  onLocationFound?: (lat: number, lng: number, name: string) => void;
  placeholder?: string;
  label?: string;
}

export const AddressLookup: React.FC<AddressLookupProps> = ({
  onLocationFound,
  placeholder = 'City, address, or landmark...',
  label = 'GEOCODE TARGET',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const setStrikeLocation = useSimulationStore((s) => s.setStrikeLocation);

  const search = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setShowResults(false);

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en-US,en',
          'User-Agent': 'GCSP-Educational-Simulator/0.1',
        },
      });

      if (!res.ok) throw new Error('Geocoding service unavailable');

      const data: NominatimResult[] = await res.json();

      if (data.length === 0) {
        setError('No results found. Try a different search.');
      } else if (data.length === 1) {
        // Auto-select single result
        handleSelect(data[0]);
        return;
      } else {
        setResults(data);
        setShowResults(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geocoding failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setShowResults(false);
    setQuery(result.display_name.split(',').slice(0, 2).join(', '));

    if (onLocationFound) {
      onLocationFound(lat, lng, result.display_name);
    } else {
      setStrikeLocation({ lat, lng });
    }
  };

  return (
    <div className="relative">
      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
        {label}
      </label>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <MapPin size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder={placeholder}
            className="w-full bg-midnight border border-panel-border rounded pl-7 pr-2 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-terminal/50 transition-colors"
          />
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="px-3 py-2 bg-panel-light border border-panel-border rounded hover:border-terminal/50 hover:text-terminal text-text-muted transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-1 flex items-center gap-1.5 text-blast text-[11px] font-mono">
          <AlertCircle size={11} />
          {error}
        </div>
      )}

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-panel border border-panel-border rounded overflow-hidden shadow-xl">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-xs font-mono text-text-primary hover:bg-panel-light hover:text-terminal border-b border-panel-border last:border-0 transition-colors"
            >
              <div className="truncate">{r.display_name}</div>
              <div className="text-text-muted text-[10px] mt-0.5">{r.type}</div>
            </button>
          ))}
          <button
            onClick={() => setShowResults(false)}
            className="w-full text-center px-3 py-1.5 text-[10px] text-text-muted hover:text-text-primary transition-colors bg-midnight"
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
};
