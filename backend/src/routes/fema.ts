import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

// Simple in-memory cache — FEMA rate-limits rapid repeated requests
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function cachedFetch(url: string, headers: Record<string, string>): Promise<unknown> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`FEMA API returned ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, ts: Date.now() });
  return data;
}

/**
 * GET /fema/disasters/recent?top=20
 * Most recent FEMA disaster declarations across all states
 * NOTE: must be registered BEFORE /disasters to avoid route conflict
 */
router.get('/disasters/recent', async (req: Request, res: Response) => {
  const top = parseInt((req.query.top as string) || '20', 10) || 20;

  try {
    const url = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$orderby=declarationDate%20desc&$top=${top}`;
    const data = await cachedFetch(url, { 'Accept': 'application/json', 'User-Agent': 'GCSP-Educational-Simulator/1.0' }) as { DisasterDeclarationsSummaries: unknown[] };
    return res.json({
      disasters: data.DisasterDeclarationsSummaries || [],
      total: (data.DisasterDeclarationsSummaries || []).length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[fema/disasters/recent] Error:', err);
    return res.json({
      disasters: [],
      total: 0,
      lastUpdated: new Date().toISOString(),
      error: 'FEMA API unavailable',
    });
  }
});

/**
 * GET /fema/disasters?state=XX&top=50
 * Proxies FEMA DisasterDeclarationsSummaries — filtered by state
 */
router.get('/disasters', async (req: Request, res: Response) => {
  const state = (req.query.state as string | undefined)?.toUpperCase();
  const top = parseInt((req.query.top as string) || '50', 10) || 50;

  try {
    let url: string;

    if (state) {
      url = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$orderby=declarationDate%20desc&$top=${top}&$filter=state%20eq%20'${encodeURIComponent(state)}'`;
    } else {
      url = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$orderby=declarationDate%20desc&$top=${top}`;
    }

    const data = await cachedFetch(url, { 'Accept': 'application/json', 'User-Agent': 'GCSP-Educational-Simulator/1.0' }) as { DisasterDeclarationsSummaries: unknown[] };
    return res.json({
      disasters: data.DisasterDeclarationsSummaries || [],
      total: (data.DisasterDeclarationsSummaries || []).length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[fema/disasters] Error:', err);
    return res.json({
      disasters: [],
      total: 0,
      lastUpdated: new Date().toISOString(),
      error: 'FEMA API unavailable',
    });
  }
});

/**
 * GET /fema/alerts?state=XX&top=10
 * Proxies FEMA IPAWS archived alerts filtered by state area description
 */
router.get('/alerts', async (req: Request, res: Response) => {
  const state = (req.query.state as string | undefined)?.toUpperCase();
  const top = parseInt((req.query.top as string) || '10', 10) || 10;

  try {
    let url: string;

    if (state) {
      url = `https://www.fema.gov/api/open/v1/IpawsArchivedAlerts?$top=${top}&$orderby=sent%20desc&$filter=contains(areaDesc,'${encodeURIComponent(state)}')`;
    } else {
      url = `https://www.fema.gov/api/open/v1/IpawsArchivedAlerts?$top=${top}&$orderby=sent%20desc`;
    }

    const data = await cachedFetch(url, { 'Accept': 'application/json', 'User-Agent': 'GCSP-Educational-Simulator/1.0' }) as { IpawsArchivedAlerts: unknown[] };
    return res.json({
      alerts: data.IpawsArchivedAlerts || [],
      total: (data.IpawsArchivedAlerts || []).length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[fema/alerts] Error:', err);
    return res.json({
      alerts: [],
      total: 0,
      lastUpdated: new Date().toISOString(),
      error: 'FEMA IPAWS API unavailable',
    });
  }
});

export default router;
