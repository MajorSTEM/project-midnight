import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

const GNEWS_TOKEN = process.env.GNEWS_API_KEY || '';

interface GNewsArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string; url: string };
  publishedAt: string;
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

type EscalationLevel = 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

function calculateEscalationScore(articles: GNewsArticle[]): number {
  const highRisk = ['nuclear', 'warhead', 'missile launch', 'icbm'];
  const medRisk = ['military escalation', 'war', 'invasion', 'strike'];
  const lowRisk = ['sanctions', 'nato', 'tensions', 'threat'];
  const diplomatic = ['diplomat', 'talks', 'treaty'];

  let score = 0;

  for (const article of articles) {
    const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();

    for (const kw of highRisk) {
      if (text.includes(kw)) score += 10;
    }
    for (const kw of medRisk) {
      if (text.includes(kw)) score += 8;
    }
    for (const kw of lowRisk) {
      if (text.includes(kw)) score += 5;
    }
    for (const kw of diplomatic) {
      if (text.includes(kw)) score += 3;
    }
  }

  return Math.min(100, score);
}

function scoreToLevel(score: number): EscalationLevel {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'ELEVATED';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

/**
 * GET /news/nuclear
 * Returns nuclear weapons / missile threat news + escalation score
 */
router.get('/nuclear', async (_req: Request, res: Response) => {
  try {
    const url = `https://gnews.io/api/v4/search?q=nuclear+weapons+missile+threat&token=${GNEWS_TOKEN}&lang=en&max=10&in=title,description`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'GCSP-Educational-Simulator/1.0' },
    });

    if (!response.ok) {
      throw new Error(`GNews API returned ${response.status}`);
    }

    const data = await response.json() as GNewsResponse;
    const articles: GNewsArticle[] = data.articles || [];
    const score = calculateEscalationScore(articles);
    const level = scoreToLevel(score);

    return res.json({
      score,
      level,
      articles: articles.slice(0, 10),
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[news/nuclear] Error:', err);
    return res.json({
      score: 0,
      level: 'LOW' as EscalationLevel,
      articles: [],
      lastUpdated: new Date().toISOString(),
      error: 'News service unavailable',
    });
  }
});

/**
 * GET /news/geopolitical
 * Returns geopolitical / military escalation news + escalation score
 */
router.get('/geopolitical', async (_req: Request, res: Response) => {
  try {
    const url = `https://gnews.io/api/v4/search?q=NATO+Russia+China+military+escalation&token=${GNEWS_TOKEN}&lang=en&max=10&in=title,description`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'GCSP-Educational-Simulator/1.0' },
    });

    if (!response.ok) {
      throw new Error(`GNews API returned ${response.status}`);
    }

    const data = await response.json() as GNewsResponse;
    const articles: GNewsArticle[] = data.articles || [];
    const score = calculateEscalationScore(articles);
    const level = scoreToLevel(score);

    return res.json({
      score,
      level,
      articles: articles.slice(0, 10),
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[news/geopolitical] Error:', err);
    return res.json({
      score: 0,
      level: 'LOW' as EscalationLevel,
      articles: [],
      lastUpdated: new Date().toISOString(),
      error: 'News service unavailable',
    });
  }
});

export default router;
