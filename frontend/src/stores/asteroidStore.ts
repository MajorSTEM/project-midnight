import { create } from 'zustand';
import type { AsteroidConfig, AsteroidEffects, ImpactorPreset } from '../utils/asteroidPhysics';
import { calculateAsteroidEffects } from '../utils/asteroidPhysics';

interface AsteroidStore {
  config: AsteroidConfig;
  result: AsteroidEffects | null;
  selectedPresetId: string | null;

  setConfig: (config: Partial<AsteroidConfig>) => void;
  setPreset: (preset: ImpactorPreset) => void;
  setImpactLocation: (lat: number, lng: number, name?: string) => void;
  runSimulation: () => void;
  clearSimulation: () => void;
}

const defaultConfig: AsteroidConfig = {
  diameterM: 50,
  densityKgM3: 2700,
  velocityKmS: 17,
  angleDeg: 45,
  targetLat: 40.7128,
  targetLng: -74.006,
  targetName: 'New York City',
  surfaceType: 'urban',
  populationDensity: 2500,
};

export const useAsteroidStore = create<AsteroidStore>((set, get) => ({
  config: defaultConfig,
  result: null,
  selectedPresetId: null,

  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  setPreset: (preset: ImpactorPreset) =>
    set((state) => ({
      selectedPresetId: preset.id,
      config: {
        ...state.config,
        diameterM: preset.diameterM,
        densityKgM3: preset.densityKgM3,
        velocityKmS: preset.velocityKmS,
      },
    })),

  setImpactLocation: (lat: number, lng: number, name?: string) =>
    set((state) => ({
      config: {
        ...state.config,
        targetLat: lat,
        targetLng: lng,
        targetName: name ?? state.config.targetName,
      },
    })),

  runSimulation: () => {
    const { config } = get();
    const result = calculateAsteroidEffects(config);
    set({ result });
  },

  clearSimulation: () => set({ result: null, selectedPresetId: null }),
}));
