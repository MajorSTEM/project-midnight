import { create } from 'zustand';
import type {
  StrikeConfig,
  SimulationResult,
  LatLng,
  BurstType,
  NuclearNation,
  ResultTab,
  UserLocation,
  EscalationData,
  FEMADisaster,
  IPAWSAlert,
  AggregateResult,
  SimulationMode,
} from '../types';
import { calculateEffects } from '../utils/nuclearPhysics';
import { estimateCasualties } from '../utils/casualties';
import { generateFalloutPlume } from '../utils/falloutModel';
import type { HistoricalScenario } from '../data/historicalScenarios';

interface SimulationStore {
  // Strike configuration
  config: StrikeConfig;

  // Current simulation result (null until a strike is placed)
  result: SimulationResult | null;

  // Multi-strike state
  strikes: StrikeConfig[];
  activeStrikeId: string | null;
  multiStrikeMode: boolean;
  aggregateResult: AggregateResult | null;

  // App mode
  simulationMode: SimulationMode;
  showScenarioLibrary: boolean;

  // UI state
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  activeResultTab: ResultTab;
  warningAccepted: boolean;
  userLocation: UserLocation | null;

  // Live wind data
  liveWind: { speedKmh: number; directionDeg: number; source: 'noaa' | 'default' } | null;

  // Historical Scenarios panel
  showScenariosPanel: boolean;

  // Geopolitics / GNews
  escalationData: EscalationData | null;
  showGeopoliticsPanel: boolean;

  // AI Prediction panel
  showPredictionPanel: boolean;

  // Notification center
  showNotificationCenter: boolean;

  // AR mode
  showARMode: boolean;

  // FEMA
  femaDisasters: FEMADisaster[] | null;
  showFEMALayer: boolean;

  // IPAWS alerts
  ipawsAlerts: IPAWSAlert[] | null;

  // Actions
  setStrikeLocation: (location: LatLng) => void;
  setYield: (yieldKt: number) => void;
  setBurstType: (burstType: BurstType) => void;
  setNation: (nation: NuclearNation) => void;
  setWindDirection: (degrees: number) => void;
  setWindSpeed: (kmh: number) => void;
  setPopulationDensity: (density: number) => void;
  setPresetName: (name: string | null) => void;
  runSimulation: () => void;
  clearSimulation: () => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setActiveResultTab: (tab: ResultTab) => void;
  acceptWarning: () => void;
  setUserLocation: (location: UserLocation | null) => void;

  // Multi-strike actions
  addStrike: (location: LatLng) => void;
  removeStrike: (id: string) => void;
  duplicateStrike: (id: string) => void;
  updateStrikeField: (id: string, field: keyof StrikeConfig, value: unknown) => void;
  setActiveStrike: (id: string) => void;
  toggleMultiStrikeMode: () => void;
  runAllStrikes: () => void;

  // App mode actions
  setSimulationMode: (mode: SimulationMode) => void;
  toggleScenarioLibrary: () => void;

  // New async actions
  fetchLiveWind: (lat: number, lng: number) => Promise<void>;
  fetchEscalation: () => Promise<void>;
  loadFEMADisasters: () => Promise<void>;
  fetchIPAWSAlerts: (state: string) => Promise<void>;
  toggleFEMALayer: () => void;
  toggleGeopoliticsPanel: () => void;
  toggleScenariosPanel: () => void;
  togglePredictionPanel: () => void;
  toggleNotificationCenter: () => void;
  toggleARMode: () => void;
  loadHistoricalScenario: (scenario: HistoricalScenario) => void;
}

const defaultConfig: StrikeConfig = {
  id: crypto.randomUUID(),
  location: null,
  yieldKt: 100,
  burstType: 'airburst',
  nation: 'USA',
  windDirection: 270, // westerly wind
  windSpeed: 30,
  populationDensity: 2500,
  presetName: 'W76 (Trident SLBM)',
};

function createDefaultStrike(location: LatLng): StrikeConfig {
  return {
    id: crypto.randomUUID(),
    location,
    yieldKt: 100,
    burstType: 'airburst',
    nation: 'USA',
    windDirection: 270,
    windSpeed: 30,
    populationDensity: 2500,
    presetName: 'W76 (Trident SLBM)',
  };
}

function computeStrikeResult(strike: StrikeConfig): SimulationResult | null {
  if (!strike.location) return null;
  const effects = calculateEffects(
    strike.location.lat,
    strike.location.lng,
    strike.yieldKt,
    strike.burstType
  );
  const casualties = estimateCasualties(effects, strike.populationDensity);
  const falloutPlume =
    strike.burstType === 'surface'
      ? generateFalloutPlume(strike.location, strike.yieldKt, strike.windDirection, strike.windSpeed)
      : null;
  return {
    effects,
    casualties,
    falloutPlume,
    strikeLocation: strike.location,
    timestamp: new Date(),
  };
}

// Direct API calls — no backend required
import { fetchWeatherDirect, fetchNewsDirect, fetchFemaDirect } from '../utils/directApi';

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  config: defaultConfig,
  result: null,
  strikes: [],
  activeStrikeId: null,
  multiStrikeMode: false,
  aggregateResult: null,
  simulationMode: 'nuclear',
  showScenarioLibrary: false,
  leftPanelOpen: true,
  rightPanelOpen: false,
  activeResultTab: 'impact',
  warningAccepted: false,
  userLocation: null,
  liveWind: null,
  showScenariosPanel: false,
  escalationData: null,
  showGeopoliticsPanel: false,
  showPredictionPanel: false,
  showNotificationCenter: false,
  showARMode: false,
  femaDisasters: null,
  showFEMALayer: false,
  ipawsAlerts: null,

  setStrikeLocation: (location) => {
    set((state) => ({ config: { ...state.config, location } }));
    // Auto-run simulation when location is set
    setTimeout(() => get().runSimulation(), 0);
    // Fetch live wind for US locations
    const isUS = location.lat >= 24 && location.lat <= 50 && location.lng >= -125 && location.lng <= -66;
    if (isUS) {
      get().fetchLiveWind(location.lat, location.lng);
    }
  },

  setYield: (yieldKt) => {
    set((state) => ({ config: { ...state.config, yieldKt } }));
    if (get().config.location) {
      setTimeout(() => get().runSimulation(), 0);
    }
  },

  setBurstType: (burstType) => {
    set((state) => ({ config: { ...state.config, burstType } }));
    if (get().config.location) {
      setTimeout(() => get().runSimulation(), 0);
    }
  },

  setNation: (nation) => {
    set((state) => ({ config: { ...state.config, nation } }));
  },

  setWindDirection: (windDirection) => {
    set((state) => ({ config: { ...state.config, windDirection } }));
    if (get().config.location) {
      setTimeout(() => get().runSimulation(), 0);
    }
  },

  setWindSpeed: (windSpeed) => {
    set((state) => ({ config: { ...state.config, windSpeed } }));
    if (get().config.location) {
      setTimeout(() => get().runSimulation(), 0);
    }
  },

  setPopulationDensity: (populationDensity) => {
    set((state) => ({ config: { ...state.config, populationDensity } }));
    if (get().config.location) {
      setTimeout(() => get().runSimulation(), 0);
    }
  },

  setPresetName: (presetName) => {
    set((state) => ({ config: { ...state.config, presetName } }));
  },

  runSimulation: () => {
    const { config } = get();
    if (!config.location) return;

    const effects = calculateEffects(
      config.location.lat,
      config.location.lng,
      config.yieldKt,
      config.burstType
    );

    const casualties = estimateCasualties(effects, config.populationDensity);

    const falloutPlume =
      config.burstType === 'surface'
        ? generateFalloutPlume(
            config.location,
            config.yieldKt,
            config.windDirection,
            config.windSpeed
          )
        : null;

    const result: SimulationResult = {
      effects,
      casualties,
      falloutPlume,
      strikeLocation: config.location,
      timestamp: new Date(),
    };

    set({ result, rightPanelOpen: true });
  },

  clearSimulation: () => {
    set({
      result: null,
      rightPanelOpen: false,
      userLocation: null,
      liveWind: null,
      strikes: [],
      aggregateResult: null,
      activeStrikeId: null,
    });
    set((state) => ({ config: { ...state.config, location: null } }));
  },

  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setActiveResultTab: (tab) => set({ activeResultTab: tab }),
  acceptWarning: () => set({ warningAccepted: true }),
  setUserLocation: (location) => set({ userLocation: location }),

  // --- Multi-strike actions ---
  addStrike: (location: LatLng) => {
    const newStrike = createDefaultStrike(location);
    set((state) => ({
      strikes: [...state.strikes, newStrike],
      activeStrikeId: newStrike.id,
    }));
    setTimeout(() => get().runAllStrikes(), 0);
  },

  removeStrike: (id: string) => {
    set((state) => {
      const remaining = state.strikes.filter((s) => s.id !== id);
      const newActiveId =
        state.activeStrikeId === id
          ? (remaining.length > 0 ? remaining[remaining.length - 1].id : null)
          : state.activeStrikeId;
      return { strikes: remaining, activeStrikeId: newActiveId };
    });
    setTimeout(() => get().runAllStrikes(), 0);
  },

  duplicateStrike: (id: string) => {
    const { strikes } = get();
    const original = strikes.find((s) => s.id === id);
    if (!original) return;
    const copy: StrikeConfig = {
      ...original,
      id: crypto.randomUUID(),
      location: original.location
        ? { lat: original.location.lat + 0.05, lng: original.location.lng + 0.05 }
        : null,
    };
    set((state) => ({
      strikes: [...state.strikes, copy],
      activeStrikeId: copy.id,
    }));
    setTimeout(() => get().runAllStrikes(), 0);
  },

  updateStrikeField: (id: string, field: keyof StrikeConfig, value: unknown) => {
    set((state) => ({
      strikes: state.strikes.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
    setTimeout(() => get().runAllStrikes(), 0);
  },

  setActiveStrike: (id: string) => set({ activeStrikeId: id }),

  toggleMultiStrikeMode: () => {
    const { multiStrikeMode, config } = get();
    if (!multiStrikeMode) {
      // Entering multi-strike mode — seed with current single strike if exists
      const existing = config.location
        ? [{ ...config, id: config.id || crypto.randomUUID() }]
        : [];
      set({
        multiStrikeMode: true,
        strikes: existing,
        activeStrikeId: existing.length > 0 ? existing[0].id : null,
      });
      if (existing.length > 0) {
        setTimeout(() => get().runAllStrikes(), 0);
      }
    } else {
      set({ multiStrikeMode: false, aggregateResult: null });
    }
  },

  runAllStrikes: () => {
    const { strikes } = get();
    if (strikes.length === 0) {
      set({ aggregateResult: null });
      return;
    }

    const results: SimulationResult[] = [];
    for (const strike of strikes) {
      const r = computeStrikeResult(strike);
      if (r) results.push(r);
    }

    if (results.length === 0) {
      set({ aggregateResult: null });
      return;
    }

    const aggregateResult: AggregateResult = {
      strikes: results,
      totalImmediateDeaths: results.reduce((sum, r) => sum + r.casualties.immediateDeaths, 0),
      totalInjured: results.reduce((sum, r) => sum + r.casualties.injured, 0),
      totalLongTermDeaths: results.reduce((sum, r) => sum + r.casualties.longTermRadiationDeaths, 0),
      totalAffectedAreaKm2: results.reduce((sum, r) => sum + r.effects.lightBlastAreaKm2, 0),
      citiesAffected: results.length,
    };

    set({ aggregateResult, rightPanelOpen: true });
  },

  // --- App mode actions ---
  setSimulationMode: (mode: SimulationMode) => set({ simulationMode: mode }),
  toggleScenarioLibrary: () => set((state) => ({ showScenarioLibrary: !state.showScenarioLibrary })),

  fetchLiveWind: async (lat: number, lng: number) => {
    try {
      const data = await fetchWeatherDirect(lat, lng);
      const source = data.source === 'noaa-nws' ? 'noaa' : 'default';
      const liveWind = {
        speedKmh: data.windSpeedKmh ?? 30,
        directionDeg: data.windDirectionDeg ?? 270,
        source: source as 'noaa' | 'default',
      };
      set((state) => ({
        liveWind,
        config: { ...state.config, windDirection: liveWind.directionDeg, windSpeed: liveWind.speedKmh },
      }));
      setTimeout(() => get().runSimulation(), 0);
    } catch (err) {
      console.error('[fetchLiveWind] Error:', err);
    }
  },

  fetchEscalation: async () => {
    try {
      const [nuc, geo] = await Promise.allSettled([
        fetchNewsDirect('nuclear weapons missile threat'),
        fetchNewsDirect('NATO Russia China military escalation'),
      ]);

      let combinedArticles: EscalationData['articles'] = [];
      let maxScore = 0;

      if (nuc.status === 'fulfilled') {
        combinedArticles = [...combinedArticles, ...(nuc.value.articles || [])];
        if (nuc.value.score > maxScore) maxScore = nuc.value.score;
      }
      if (geo.status === 'fulfilled') {
        combinedArticles = [...combinedArticles, ...(geo.value.articles || [])];
        if (geo.value.score > maxScore) maxScore = geo.value.score;
      }

      const seen = new Set<string>();
      const unique = combinedArticles.filter((a) => { if (seen.has(a.url)) return false; seen.add(a.url); return true; });
      const finalScore = Math.min(100, maxScore);
      let level: EscalationData['level'] = 'LOW';
      if (finalScore > 80) level = 'CRITICAL';
      else if (finalScore > 60) level = 'HIGH';
      else if (finalScore > 30) level = 'ELEVATED';

      set({ escalationData: { score: finalScore, level, articles: unique.slice(0, 8), lastUpdated: new Date().toISOString() } });
    } catch (err) {
      console.error('[fetchEscalation] Error:', err);
    }
  },

  loadFEMADisasters: async () => {
    if (get().femaDisasters !== null) return;
    try {
      const data = await fetchFemaDirect('/v2/DisasterDeclarationsSummaries?$orderby=declarationDate%20desc&$top=20') as { DisasterDeclarationsSummaries: FEMADisaster[] } | null;
      set({ femaDisasters: data?.DisasterDeclarationsSummaries || [] });
    } catch (err) {
      console.error('[loadFEMADisasters] Error:', err);
      set({ femaDisasters: [] });
    }
  },

  fetchIPAWSAlerts: async (state: string) => {
    try {
      const data = await fetchFemaDirect(`/v1/IpawsArchivedAlerts?$top=10&$orderby=sent%20desc&$filter=contains(areaDesc,'${encodeURIComponent(state)}')`) as { IpawsArchivedAlerts: IPAWSAlert[] } | null;
      set({ ipawsAlerts: data?.IpawsArchivedAlerts || [] });
    } catch (err) {
      console.error('[fetchIPAWSAlerts] Error:', err);
      set({ ipawsAlerts: [] });
    }
  },

  toggleFEMALayer: () => set((state) => ({ showFEMALayer: !state.showFEMALayer })),
  toggleGeopoliticsPanel: () => set((state) => ({ showGeopoliticsPanel: !state.showGeopoliticsPanel })),
  toggleScenariosPanel: () => set((state) => ({ showScenariosPanel: !state.showScenariosPanel })),
  togglePredictionPanel: () => set((state) => ({ showPredictionPanel: !state.showPredictionPanel })),
  toggleNotificationCenter: () => set((state) => ({ showNotificationCenter: !state.showNotificationCenter })),
  toggleARMode: () => set((state) => ({ showARMode: !state.showARMode })),

  loadHistoricalScenario: (scenario: HistoricalScenario) => {
    const newStrikes: StrikeConfig[] = scenario.strikes.map((s) => ({
      id: crypto.randomUUID(),
      location: { lat: s.lat, lng: s.lng },
      yieldKt: s.yieldKt,
      burstType: s.burstType,
      nation: s.nation as NuclearNation,
      windDirection: s.windDirection,
      windSpeed: s.windSpeed,
      populationDensity: s.populationDensity,
      presetName: s.name,
    }));

    set({
      multiStrikeMode: true,
      strikes: newStrikes,
      activeStrikeId: newStrikes.length > 0 ? newStrikes[0].id : null,
      showScenariosPanel: false,
      rightPanelOpen: true,
    });

    setTimeout(() => get().runAllStrikes(), 0);
  },
}));
