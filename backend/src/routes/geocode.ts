import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

/**
 * Proxy Nominatim geocoding requests to avoid CORS issues
 * GET /geocode?q=New+York+City
 */
router.get('/', async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query parameter "q" is required and must be at least 2 characters' });
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '0');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'GCSP-Educational-Simulator/0.1 (https://github.com/gcsp)',
        'Accept-Language': 'en-US,en',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned ${response.status}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('[geocode] Error:', err);
    return res.status(500).json({ error: 'Geocoding service unavailable' });
  }
});

export default router;
