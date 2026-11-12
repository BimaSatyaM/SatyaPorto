import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionsResponse {
    total: { lastYear: number };
    contributions: ContributionDay[];
}

const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

/** Validates GitHub's username format to prevent SSRF and path injection. */
export function isValidGitHubUsername(username: string): boolean {
    return GITHUB_USERNAME_RE.test(username);
}

/** Parses GitHub's public `/users/<name>/contributions` HTML fragment into sorted calendar days. */
export function parseGitHubContributionsHtml(html: string): ContributionsResponse {
    const tipCounts = new Map<string, number>();
    for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)) {
        const forId = match[1].match(/\bfor="([^"]+)"/)?.[1];
        if (!forId) continue;
        const countMatch = match[2].trim().match(/^(\d[\d,]*)\s+contribution/i);
        tipCounts.set(forId, countMatch ? Number(countMatch[1].replace(/,/g, '')) : 0);
    }

    const contributions: ContributionDay[] = [];
    for (const match of html.matchAll(/<td\b([^>]*)>/g)) {
        const attrs = match[1];
        const date = attrs.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
        if (!date) continue;

        const id = attrs.match(/\bid="([^"]+)"/)?.[1];
        const rawLevel = Number(attrs.match(/\bdata-level="([0-4])"/)?.[1] ?? 0);
        const level = (Number.isInteger(rawLevel) && rawLevel >= 0 && rawLevel <= 4 ? rawLevel : 0) as
            | 0
            | 1
            | 2
            | 3
            | 4;
        const count = id ? (tipCounts.get(id) ?? 0) : 0;

        contributions.push({ date, count, level });
    }

    // GitHub renders cells row-by-row (by weekday), while the calendar grid expects chronological order.
    contributions.sort((a, b) => a.date.localeCompare(b.date));

    const headerMatch = html.match(/(\d[\d,]*)\s+contributions?\s+in\s+the\s+last\s+year/i);
    const lastYear = headerMatch
        ? Number(headerMatch[1].replace(/,/g, ''))
        : contributions.reduce((sum, day) => sum + day.count, 0);

    return {
        total: { lastYear },
        contributions,
    };
}

function sendJson(res: ServerResponse, status: number, body: unknown, cacheControl = 'no-store'): void {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', cacheControl);
    res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }

    const url = new URL(req.url ?? '/', 'http://localhost');
    const username = (url.searchParams.get('username') ?? '').trim();
    if (!isValidGitHubUsername(username)) {
        sendJson(res, 400, { error: 'Invalid GitHub username' });
        return;
    }

    try {
        const upstream = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
            headers: {
                Accept: 'text/html',
                'User-Agent': 'SatyaPorto-Contrib-Sync',
            },
            signal: AbortSignal.timeout(8000),
        });

        if (!upstream.ok) {
            sendJson(res, upstream.status === 404 ? 404 : 502, {
                error: `GitHub upstream returned HTTP ${upstream.status}`,
            });
            return;
        }

        const html = await upstream.text();
        const payload = parseGitHubContributionsHtml(html);
        if (payload.contributions.length === 0) {
            sendJson(res, 502, { error: 'No contribution cells found in GitHub response' });
            return;
        }

        if (req.method === 'HEAD') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
            res.end();
            return;
        }

        sendJson(res, 200, payload, 'public, s-maxage=300, stale-while-revalidate=600');
    } catch {
        sendJson(res, 502, { error: 'Failed to reach GitHub contributions feed' });
    }
}
