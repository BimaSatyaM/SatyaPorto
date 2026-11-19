import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityRepoCommit {
    name: string;
    url: string;
    commitsText: string;
    percentage: number;
}

export interface CreatedRepoDetails {
    name: string;
    url: string;
    language?: string;
    languageColor?: string;
    date?: string;
}

export interface ActivityItem {
    id: string;
    type: 'commits' | 'repo_created' | 'pull_request' | 'private' | 'generic';
    title: string;
    date?: string;
    repos?: ActivityRepoCommit[];
    createdRepo?: CreatedRepoDetails;
}

export interface ActivityMonthGroup {
    month: string;
    items: ActivityItem[];
    hasMore: boolean;
    nextFrom?: string;
    nextTo?: string;
}

export interface ContributionsResponse {
    total: { lastYear: number };
    contributions: ContributionDay[];
    activity?: ActivityMonthGroup;
}

const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Validates GitHub's username format to prevent SSRF and path injection.
export function isValidGitHubUsername(username: string): boolean {
    return GITHUB_USERNAME_RE.test(username);
}

function stripTagsAndEntities(raw: string): string {
    return raw
        .replace(/<svg[\s\S]*?<\/svg>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&ndash;|&#8211;/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
}

// Parses GitHub's public contribution calendar HTML fragment into sorted calendar days.
export function parseGitHubContributionsHtml(html: string): Pick<ContributionsResponse, 'total' | 'contributions'> {
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

// Parses GitHub's contribution activity timeline section and pagination cursor.
export function parseGitHubActivityHtml(html: string): ActivityMonthGroup | undefined {
    const actIdx = html.lastIndexOf('contribution-activity-listing');
    const source = actIdx !== -1 ? html.slice(actIdx) : html;

    const monthMatch = source.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (!monthMatch) return undefined;
    const month = stripTagsAndEntities(monthMatch[1]) || 'Recent Activity';

    const formMatch = source.match(/class="[^"]*ajax-pagination-form[^"]*"[\s\S]*?action="([^"]+)"/i);
    const nextAction = formMatch ? formMatch[1].replace(/&amp;/g, '&') : null;
    let nextFrom: string | undefined;
    let nextTo: string | undefined;
    if (nextAction) {
        const fromVal = nextAction.match(/[?&]from=([^&]+)/)?.[1];
        const toVal = nextAction.match(/[?&]to=([^&]+)/)?.[1];
        if (fromVal && ISO_DATE_RE.test(fromVal) && toVal && ISO_DATE_RE.test(toVal)) {
            nextFrom = fromVal;
            nextTo = toVal;
        }
    }

    // Stop slicing before the pagination form so "Show more activity" text never bleeds into the last item.
    const formIdx = source.indexOf('<form');
    const itemsRegion = formIdx !== -1 ? source.slice(0, formIdx) : source;
    const rawItems = itemsRegion.split(/<div[^>]*class="(?:\S+\s+)*TimelineItem(?:\s+[^"]*)?"[^>]*>/i).slice(1);
    const items: ActivityItem[] = [];

    for (let i = 0; i < rawItems.length; i++) {
        const raw = rawItems[i];
        let type: ActivityItem['type'] = 'generic';
        if (raw.includes('octicon-repo-push')) type = 'commits';
        else if (raw.includes('octicon-git-pull-request')) type = 'pull_request';
        else if (raw.includes('octicon-lock')) type = 'private';
        else if (raw.includes('octicon-repo')) type = 'repo_created';

        const floatDateMatch = raw.match(/<span[^>]*class="[^"]*float-right[^"]*pt-1[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const timeMatch = raw.match(/<time[^>]*>([\s\S]*?)<\/time>/i);
        const dateText = stripTagsAndEntities(timeMatch?.[1] || floatDateMatch?.[1] || '');

        const summaryMatch = raw.match(/<summary[\s\S]*?>([\s\S]*?)<\/summary>/i);
        let title = '';
        if (summaryMatch) {
            title = stripTagsAndEntities(summaryMatch[1]);
        } else {
            const bodyMatch = raw.match(/<div[^>]*class="[^"]*TimelineItem-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            const rawTitleHtml = (bodyMatch ? bodyMatch[1] : raw)
                .replace(/<span[^>]*class="[^"]*float-right[^"]*pt-1[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
                .replace(/<time[^>]*>[\s\S]*?<\/time>/gi, '');
            title = stripTagsAndEntities(rawTitleHtml);
        }

        const repos: ActivityRepoCommit[] = [];
        if (type === 'commits') {
            for (const li of raw.matchAll(/<li[^>]*class="[^"]*d-flex[^"]*"[^>]*>([\s\S]*?)<\/li>/g)) {
                const liHtml = li[1];
                const aRepo = liHtml.match(/href="(\/[^"]+)"[^>]*>([^<]+)<\/a>/i);
                const aCommits = liHtml.match(/>(\d[\d,]*\s+commits?)<\/a>/i);
                const prog = liHtml.match(/style="[^"]*width:\s*([\d.]+)%/i);
                if (aRepo) {
                    repos.push({
                        name: aRepo[2].trim(),
                        url: `https://github.com${aRepo[1]}`,
                        commitsText: aCommits ? aCommits[1].trim() : '',
                        percentage: prog ? Math.min(100, Math.max(0, Number(prog[1]))) : 0,
                    });
                }
            }
        }

        let createdRepo: CreatedRepoDetails | undefined;
        if (type === 'repo_created') {
            const aRepo = raw.match(/href="(\/[^"]+)"[^>]*>([^<]+)<\/a>/i);
            const langMatch = raw.match(/itemprop="programmingLanguage">([^<]+)<\/span>/i);
            const langColorMatch = raw.match(/class="repo-language-color"\s+style="background-color:\s*([^;"]+)/i);
            if (aRepo) {
                createdRepo = {
                    name: aRepo[2].trim(),
                    url: `https://github.com${aRepo[1]}`,
                    language: langMatch ? langMatch[1].trim() : undefined,
                    languageColor: langColorMatch ? langColorMatch[1].trim() : undefined,
                    date: dateText || undefined,
                };
            }
        }

        if (title) {
            items.push({
                id: `${month.replace(/\s+/g, '-').toLowerCase()}-${i}`,
                type,
                title,
                date: dateText || undefined,
                repos: repos.length > 0 ? repos : undefined,
                createdRepo,
            });
        }
    }

    return {
        month,
        items,
        hasMore: Boolean(nextFrom && nextTo),
        nextFrom,
        nextTo,
    };
}

function sendJson(res: ServerResponse, status: number, body: unknown, cacheControl = 'no-store', headOnly = false): void {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', cacheControl);
    res.end(headOnly ? undefined : JSON.stringify(body));
}

async function fetchGitHubHtml(targetUrl: string): Promise<Response> {
    return fetch(targetUrl, {
        headers: {
            Accept: 'text/html',
            'User-Agent': 'Mozilla/5.0 (compatible; SatyaPorto/1.0)',
            'X-Requested-With': 'XMLHttpRequest',
        },
        signal: AbortSignal.timeout(8000),
    });
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }

    const headOnly = req.method === 'HEAD';
    const url = new URL(req.url ?? '/', 'http://localhost');
    const username = (url.searchParams.get('username') ?? '').trim();
    if (!isValidGitHubUsername(username)) {
        sendJson(res, 400, { error: 'Invalid GitHub username' });
        return;
    }

    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const isActivityPage = from !== null || to !== null;
    if (isActivityPage && (!from || !to || !ISO_DATE_RE.test(from) || !ISO_DATE_RE.test(to))) {
        sendJson(res, 400, { error: 'Invalid date range' });
        return;
    }

    const encodedUser = encodeURIComponent(username);
    const cacheHeader = 'public, s-maxage=300, stale-while-revalidate=600';

    try {
        if (isActivityPage && from && to) {
            const upstream = await fetchGitHubHtml(
                `https://github.com/${encodedUser}?tab=overview&from=${from}&to=${to}&include_header=no`
            );
            if (!upstream.ok) {
                sendJson(res, upstream.status === 404 ? 404 : 502, {
                    error: `GitHub upstream returned HTTP ${upstream.status}`,
                });
                return;
            }
            const html = await upstream.text();
            const activity = parseGitHubActivityHtml(html);
            sendJson(res, 200, { activity }, cacheHeader, headOnly);
            return;
        }

        const profileTabRes = await fetchGitHubHtml(
            `https://github.com/${encodedUser}?action=show&controller=profiles&tab=contributions&user_id=${encodedUser}`
        );
        if (!profileTabRes.ok) {
            sendJson(res, profileTabRes.status === 404 ? 404 : 502, {
                error: `GitHub upstream returned HTTP ${profileTabRes.status}`,
            });
            return;
        }

        const html = await profileTabRes.text();
        let contribPayload = parseGitHubContributionsHtml(html);
        const activity = parseGitHubActivityHtml(html);

        // Fallback to standalone calendar endpoint if overview markup did not include calendar cells
        if (contribPayload.contributions.length === 0) {
            const fallbackRes = await fetchGitHubHtml(`https://github.com/users/${encodedUser}/contributions`);
            if (fallbackRes.ok) {
                contribPayload = parseGitHubContributionsHtml(await fallbackRes.text());
            }
        }

        if (contribPayload.contributions.length === 0) {
            sendJson(res, 502, { error: 'No contribution cells found in GitHub response' });
            return;
        }

        sendJson(res, 200, { ...contribPayload, activity }, cacheHeader, headOnly);
    } catch {
        sendJson(res, 502, { error: 'Failed to reach GitHub contributions feed' });
    }
}
