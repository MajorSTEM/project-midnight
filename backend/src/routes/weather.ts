import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

interface NWSGridpointResponse {
  properties: {
    windSpeed: { values: Array<{ value: number; validTime: string }> };
    windDirection: { values: Array<{ value: number; validTime: string }> };
  };
}

/**
 * NOAA NWS weather data proxy (optional enhancement)
 * GET /weather?lat=38.9&lng=-77.0
 *
 * Returns current wind speed/direction for fallout modeling.
 * Falls back to defaults if unavailable.
 */
router.get('/', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng query parameters are required' });
  }

  // Only works for US locations
  if (lat < 24 || lat > 50 || lng < -125 || lng > -66) {
    return res.json({
      windSpeedKmh: 30,
      windDirectionDeg: 270,
      source: 'default',
      note: 'NWS weather data only available for US locations',
    });
  }

  try {
    // Step 1: Get NWS grid point
    const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`;
    const pointsRes = await fetch(pointsUrl, {
      headers: { 'User-Agent': 'GCSP-Educational-Simulator/1.0' },
    });

    if (!pointsRes.ok) {
      throw new Error(`NWS points API returned ${pointsRes.status}`);
    }

    const pointsData = await pointsRes.json() as { properties: { forecastGridData: string } };
    const gridDataUrl = pointsData.properties.forecastGridData;

    // Step 2: Get grid forecast data
    const gridRes = await fetch(gridDataUrl, {
      headers: { 'User-Agent': 'GCSP-Educational-Simulator/1.0' },
    });

    if (!gridRes.ok) {
      throw new Error(`NWS grid API returned ${gridRes.status}`);
    }

    const gridData = await gridRes.json() as NWSGridpointResponse;

    // Extract first (current) wind values
    const windSpeedMs = gridData.properties.windSpeed?.values?.[0]?.value ?? 8.3;
    const windDirDeg = gridData.properties.windDirection?.values?.[0]?.value ?? 270;

    return res.json({
      windSpeedKmh: Math.round(windSpeedMs * 3.6),
      windDirectionDeg: Math.round(windDirDeg),
      source: 'noaa-nws',
    });
  } catch (err) {
    console.error('[weather] Error:', err);
    // Return sensible defaults
    return res.json({
      windSpeedKmh: 30,
      windDirectionDeg: 270,
      source: 'default',
      error: 'Weather service unavailable — using defaults',
    });
  }
});

export default router;
