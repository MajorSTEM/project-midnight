import type { StrikeConfig } from '../types';

interface MinimalConfig {
  lat: number | undefined;
  lng: number | undefined;
  y: number;
  b: string;
  n: string;
  wd: number;
  ws: number;
  pd: number;
}

export function encodeSimToURL(config: StrikeConfig): string {
  const minimal: MinimalConfig = {
    lat: config.location?.lat,
    lng: config.location?.lng,
    y: config.yieldKt,
    b: config.burstType,
    n: config.nation,
    wd: config.windDirection,
    ws: config.windSpeed,
    pd: config.populationDensity,
  };
  return btoa(JSON.stringify(minimal));
}

export function decodeURLToSim(encoded: string): Partial<StrikeConfig> | null {
  try {
    const data = JSON.parse(atob(encoded)) as MinimalConfig;
    return {
      location:
        data.lat !== undefined && data.lng !== undefined
          ? { lat: data.lat, lng: data.lng }
          : null,
      yieldKt: data.y,
      burstType: data.b as StrikeConfig['burstType'],
      nation: data.n as StrikeConfig['nation'],
      windDirection: data.wd,
      windSpeed: data.ws,
      populationDensity: data.pd,
    };
  } catch {
    return null;
  }
}

export function buildShareURL(config: StrikeConfig): string {
  const encoded = encodeSimToURL(config);
  const url = new URL(window.location.href);
  url.searchParams.set('sim', encoded);
  return url.toString();
}
