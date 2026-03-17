import { create } from 'zustand';

interface TimelineStore {
  isPlaying: boolean;
  speed: 1 | 5 | 10 | 50;
  progress: number; // 0–1
  play: () => void;
  pause: () => void;
  reset: () => void;
  setProgress: (p: number) => void;
  setSpeed: (s: 1 | 5 | 10 | 50) => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  isPlaying: false,
  speed: 1,
  progress: 0,
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  reset: () => set({ isPlaying: false, progress: 0 }),
  setProgress: (progress) => set({ progress: Math.max(0, Math.min(1, progress)) }),
  setSpeed: (speed) => set({ speed }),
}));
