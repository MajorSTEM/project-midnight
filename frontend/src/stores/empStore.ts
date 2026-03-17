import { create } from 'zustand';
import type { EMPConfig, EMPEffects, EMPPreset } from '../utils/empPhysics';
import { calculateEMPEffects } from '../utils/empPhysics';

interface EMPStore {
  config: EMPConfig;
  result: EMPEffects | null;
  selectedPresetId: string | null;

  setConfig: (config: Partial<EMPConfig>) => void;
  setPreset: (preset: EMPPreset) => void;
  setBurstLocation: (lat: number, lng: number) => void;
  runSimulation: () => void;
  clearSimulation: () => void;
}

const defaultConfig: EMPConfig = {
  yieldKt: 1000,
  altitudeKm: 400,
  targetLat: 39.5,
  targetLng: -98.0,
  nation: 'Russia',
  burstType: 'hemp',
};

export const useEMPStore = create<EMPStore>((set, get) => ({
  config: defaultConfig,
  result: null,
  selectedPresetId: null,

  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  setPreset: (preset: EMPPreset) =>
    set((state) => ({
      selectedPresetId: preset.id,
      config: {
        ...state.config,
        yieldKt: preset.yieldKt,
        altitudeKm: preset.altitudeKm,
        targetLat: preset.targetLat,
        targetLng: preset.targetLng,
      },
    })),

  setBurstLocation: (lat: number, lng: number) =>
    set((state) => ({
      config: { ...state.config, targetLat: lat, targetLng: lng },
    })),

  runSimulation: () => {
    const { config } = get();
    const result = calculateEMPEffects(config);
    set({ result });
  },

  clearSimulation: () => set({ result: null, selectedPresetId: null }),
}));
