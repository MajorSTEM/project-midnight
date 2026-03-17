import type { BlastEffects, BurstType } from '../types';

/**
 * Calculate blast radii using Glasstone-Dolan scaling laws.
 * All radii in kilometers.
 */
export function calculateEffects(
  _lat: number,
  _lng: number,
  yieldKt: number,
  burstType: BurstType
): BlastEffects {
  const W = yieldKt;

  // Airburst formulae (Glasstone-Dolan)
  const fireballRadius = 0.034 * Math.pow(W, 0.4);
  const heavyBlastRadius = 0.78 * Math.pow(W, 1 / 3);   // 20 psi
  const moderateBlastRadius = 1.58 * Math.pow(W, 1 / 3); // 5 psi
  const lightBlastRadius = 4.12 * Math.pow(W, 1 / 3);    // 1 psi
  const radiationRadius = 0.023 * Math.pow(W, 0.19);     // 500 rem lethal
  const thermalRadius = 0.95 * Math.pow(W, 0.41);        // 3rd degree burns

  // Surface burst multiplier (reduced blast, but fallout added)
  const mult = burstType === 'surface' ? 0.75 : 1.0;

  const fb = fireballRadius * mult;
  const hb = heavyBlastRadius * mult;
  const mb = moderateBlastRadius * mult;
  const lb = lightBlastRadius * mult;
  const rad = radiationRadius * mult;
  const th = thermalRadius * mult;

  // Area calculations (km²)
  const circleArea = (r: number) => Math.PI * r * r;

  return {
    yieldKt: W,
    burstType,
    fireballRadius: fb,
    heavyBlastRadius: hb,
    moderateBlastRadius: mb,
    lightBlastRadius: lb,
    radiationRadius: rad,
    thermalRadius: th,
    fireballAreaKm2: circleArea(fb),
    heavyBlastAreaKm2: circleArea(hb) - circleArea(fb),
    moderateBlastAreaKm2: circleArea(mb) - circleArea(hb),
    lightBlastAreaKm2: circleArea(lb) - circleArea(mb),
    thermalAreaKm2: circleArea(th),
  };
}

/**
 * Format a distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }
  return `${km.toFixed(2)} km`;
}

/**
 * Format area for display
 */
export function formatArea(km2: number): string {
  if (km2 < 1) {
    return `${(km2 * 1e6).toFixed(0)} m²`;
  }
  return `${km2.toFixed(1)} km²`;
}

/**
 * Yield to descriptive label
 */
export function yieldToLabel(kt: number): string {
  if (kt < 1) return `${(kt * 1000).toFixed(0)} tons`;
  if (kt < 1000) return `${kt} kt`;
  return `${(kt / 1000).toFixed(2)} Mt`;
}

/**
 * Calculate haversine distance between two lat/lng points in km
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Weapon presets
 */
export const WEAPON_PRESETS = [
  { name: 'W76 (Trident SLBM)', yield: 100, nation: 'USA' as const },
  { name: 'W88 (Trident II)', yield: 475, nation: 'USA' as const },
  { name: 'B61-12 (NATO tactical)', yield: 50, nation: 'USA/NATO' as const },
  { name: 'W87 (Minuteman III)', yield: 300, nation: 'USA' as const },
  { name: 'RS-28 Sarmat warhead', yield: 750, nation: 'Russia' as const },
  { name: 'R-36M2 (Satan II)', yield: 8000, nation: 'Russia' as const },
  { name: 'Tsar Bomba (historical)', yield: 50000, nation: 'Russia' as const },
  { name: 'Hiroshima (Little Boy)', yield: 15, nation: 'Historical' as const },
  { name: 'Nagasaki (Fat Man)', yield: 21, nation: 'Historical' as const },
  { name: 'Castle Bravo (1954)', yield: 15000, nation: 'Historical' as const },
  { name: 'DF-41 warhead', yield: 150, nation: 'China' as const },
  { name: 'Agni-V warhead (est.)', yield: 250, nation: 'India' as const },
  { name: 'Shaheen-III warhead (est.)', yield: 100, nation: 'Pakistan' as const },
  { name: 'Custom', yield: null as unknown as number, nation: null },
] as const;

export type WeaponPresetEntry = typeof WEAPON_PRESETS[number];
