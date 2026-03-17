import type { BlastEffects, CasualtyEstimate } from '../types';

const DEFAULT_POPULATION_DENSITY = 2500; // people/km²

/**
 * Estimate casualties based on blast effects and population density.
 * Uses simplified area-based model.
 *
 * Immediate deaths:
 *   - 100% within fireball
 *   - 90% within 20 psi ring
 *   - 50% within 5 psi ring
 *   - 10% within 1 psi ring
 *
 * Injured: roughly 1.5x the deaths in each outer ring
 * Long-term radiation deaths: 15% of those in the radiation zone who survive
 */
export function estimateCasualties(
  effects: BlastEffects,
  populationDensity: number = DEFAULT_POPULATION_DENSITY
): CasualtyEstimate {
  const { fireballAreaKm2, heavyBlastAreaKm2, moderateBlastAreaKm2, lightBlastAreaKm2 } = effects;

  // Population in each zone
  const fireballPop = fireballAreaKm2 * populationDensity;
  const heavyBlastPop = heavyBlastAreaKm2 * populationDensity;
  const moderateBlastPop = moderateBlastAreaKm2 * populationDensity;
  const lightBlastPop = lightBlastAreaKm2 * populationDensity;

  // Deaths per zone
  const fireballDeaths = Math.round(fireballPop * 1.0);
  const heavyBlastDeaths = Math.round(heavyBlastPop * 0.9);
  const moderateBlastDeaths = Math.round(moderateBlastPop * 0.5);
  const lightBlastDeaths = Math.round(lightBlastPop * 0.1);

  const immediateDeaths = fireballDeaths + heavyBlastDeaths + moderateBlastDeaths + lightBlastDeaths;

  // Injuries (surviving but incapacitated)
  const injured = Math.round(
    (heavyBlastPop - heavyBlastDeaths) * 0.9 +
    (moderateBlastPop - moderateBlastDeaths) * 0.7 +
    (lightBlastPop - lightBlastDeaths) * 0.3
  );

  // Long-term radiation deaths (ARS, cancer, etc.)
  // More significant for surface bursts, but simplified here
  const radiationAreaKm2 = Math.PI * effects.radiationRadius * effects.radiationRadius;
  const radiationPop = radiationAreaKm2 * populationDensity;
  const survivingInRadZone = Math.max(0, radiationPop - immediateDeaths * 0.3);
  const longTermRadiationDeaths = Math.round(survivingInRadZone * 0.15);

  const total = immediateDeaths + Math.round(injured * 0.1) + longTermRadiationDeaths;

  return {
    immediateDeaths,
    injured,
    longTermRadiationDeaths,
    total,
    breakdown: {
      fireballDeaths,
      heavyBlastDeaths,
      moderateBlastDeaths,
      lightBlastDeaths,
    },
  };
}

/**
 * Format a large number for display (e.g., 1,234,567)
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format a number with compact notation (e.g., 1.2M, 345K)
 */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
