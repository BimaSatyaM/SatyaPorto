import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface LanguageStat {
    name: string;
    percent: number;
    text: string;
}

export interface ProjectStat {
    name: string;
    percent: number;
    text: string;
}

export interface CodingStatusPayload {
    isCoding: boolean;
    totalHoursEn: string;
    totalHoursId: string;
    totalDigital: string;
    totalSeconds: number;
    allTimeText: string | null;
    project: string | null;
    language: string | null;
    languages: LanguageStat[];
    projects: ProjectStat[];
    dateText: string;
    aiSessions: number;
    timezone: string;
    lastUpdate: string;
    updatedAt: string;
}

interface WakaTimeStatusBarResponse {
    cached_at?: string;
    data?: {
        grand_total?: {
            hours?: number;
            minutes?: number;
            total_seconds?: number;
            digital?: string;
            text?: string;
            ai_sessions?: number;
        };
        projects?: Array<{ name: string; total_seconds?: number; percent?: number; text?: string }>;
        languages?: Array<{ name: string; total_seconds?: number; percent?: number; text?: string }>;
        range?: { timezone?: string; text?: string; date?: string };
    };
}

function resolveWakaTimeApiKey(): string | null {
    if (process.env.WAKATIME_API_KEY) {
        return process.env.WAKATIME_API_KEY.trim();
    }
    // Local dev fallback to ~/.wakatime.cfg if env var is unset
    try {
        const homeDir = os.homedir();
        const cfgPath = path.join(homeDir, '.wakatime.cfg');
        if (fs.existsSync(cfgPath)) {
            const content = fs.readFileSync(cfgPath, 'utf8');
            const match = content.match(/api_key\s*=\s*([^\r\n]+)/i);
            if (match) return match[1].trim();
        }
    } catch {
        // Ignore file access errors
    }
    return null;
}

function sendJson(res: ServerResponse, status: number, body: unknown, cacheControl = 'no-store', headOnly = false): void {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', cacheControl);
    res.end(headOnly ? undefined : JSON.stringify(body));
}

function formatHours(hours: number, minutes: number, fallbackText?: string): { en: string; id: string } {
    if (hours === 0 && minutes === 0) {
        return { en: '0 hrs 0 mins', id: '0 jam 0 menit' };
    }
    const hEn = hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : '';
    const mEn = minutes > 0 ? `${minutes} min${minutes > 1 ? 's' : ''}` : '';
    const en = [hEn, mEn].filter(Boolean).join(' ') || (fallbackText || '0 hrs 0 mins');

    const hId = hours > 0 ? `${hours} jam` : '';
    const mId = minutes > 0 ? `${minutes} menit` : '';
    const id = [hId, mId].filter(Boolean).join(' ') || (fallbackText || '0 jam 0 menit');

    return { en, id };
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }

    const headOnly = req.method === 'HEAD';
    const apiKey = resolveWakaTimeApiKey();
    const cacheHeader = 'no-cache, no-store, must-revalidate';

    try {
        let wakaData: WakaTimeStatusBarResponse | null = null;
        let allTimeText: string | null = process.env.WAKATIME_ALL_TIME_HOURS || null;

        if (apiKey) {
            const wakaRes = await fetch(
                `https://wakatime.com/api/v1/users/current/status_bar/today?api_key=${encodeURIComponent(apiKey)}`,
                {
                    headers: { Accept: 'application/json' },
                    signal: AbortSignal.timeout(6000),
                }
            ).catch(() => null);

            if (wakaRes?.ok) {
                wakaData = (await wakaRes.json()) as WakaTimeStatusBarResponse;
            }
        }

        // Optional share URL support (e.g. public embed JSON from wakatime.com/share)
        let allTimeBaseSeconds = 0;
        const shareUrl = process.env.WAKATIME_SHARE_URL;
        if (shareUrl && !allTimeText) {
            const shareRes = await fetch(shareUrl, {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(5000),
            }).catch(() => null);
            if (shareRes?.ok) {
                const shareJson = (await shareRes.json()) as {
                    data?: {
                        grand_total?: {
                            text?: string;
                            human_readable_total_including_other_language?: string;
                            human_readable_total?: string;
                            total_seconds_including_other_language?: number;
                            total_seconds?: number;
                        };
                        text?: string;
                    };
                    grand_total?: {
                        text?: string;
                        human_readable_total_including_other_language?: string;
                        human_readable_total?: string;
                        total_seconds_including_other_language?: number;
                        total_seconds?: number;
                    };
                    text?: string;
                };

                const gt = shareJson?.data?.grand_total || shareJson?.grand_total;
                allTimeBaseSeconds =
                    gt?.total_seconds_including_other_language ||
                    gt?.total_seconds ||
                    0;

                allTimeText =
                    gt?.human_readable_total_including_other_language ||
                    gt?.human_readable_total ||
                    gt?.text ||
                    shareJson?.data?.text ||
                    shareJson?.text ||
                    null;
            }
        }

        const grandTotal = wakaData?.data?.grand_total;
        const totalSeconds = typeof grandTotal?.total_seconds === 'number' ? grandTotal.total_seconds : 0;
        const hours = typeof grandTotal?.hours === 'number' ? grandTotal.hours : Math.floor(totalSeconds / 3600);
        const minutes = typeof grandTotal?.minutes === 'number' ? grandTotal.minutes : Math.floor((totalSeconds % 3600) / 60);

        const formatted = formatHours(hours, minutes, grandTotal?.text);
        const totalDigital = grandTotal?.digital || `${hours}:${minutes.toString().padStart(2, '0')}`;

        // Combine all-time baseline with today's live activity so all-time ticks live
        if (allTimeBaseSeconds > 0) {
            const combinedAllTimeSecs = allTimeBaseSeconds + totalSeconds;
            const allHours = Math.floor(combinedAllTimeSecs / 3600);
            const allMins = Math.floor((combinedAllTimeSecs % 3600) / 60);
            const combinedFormatted = formatHours(allHours, allMins, allTimeText || undefined);
            allTimeText = combinedFormatted.en;
        }

        const rawProjects = wakaData?.data?.projects || [];
        const rawLanguages = wakaData?.data?.languages || [];

        const projects: ProjectStat[] = rawProjects.map((p) => ({
            name: p.name,
            percent: typeof p.percent === 'number' ? p.percent : 0,
            text: p.text || '',
        }));

        const languages: LanguageStat[] = rawLanguages.map((l) => ({
            name: l.name,
            percent: typeof l.percent === 'number' ? l.percent : 0,
            text: l.text || '',
        }));

        const topProject = projects[0]?.name || null;
        const topLanguage = languages[0]?.name || null;

        const cachedAtTime = wakaData?.cached_at ? new Date(wakaData.cached_at).getTime() : 0;
        const minutesSinceSync = cachedAtTime > 0 ? Math.max(0, Math.floor((Date.now() - cachedAtTime) / 60000)) : null;
        const isRecentlyActive = Boolean(topProject && minutesSinceSync !== null && minutesSinceSync <= 35);
        const isCoding = totalSeconds > 0 || isRecentlyActive;

        const now = new Date();
        const lastUpdate = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        const dateText = wakaData?.data?.range?.text || now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        const payload: CodingStatusPayload = {
            isCoding,
            totalHoursEn: formatted.en,
            totalHoursId: formatted.id,
            totalDigital,
            totalSeconds,
            allTimeText,
            project: topProject,
            language: topLanguage,
            languages,
            projects,
            dateText,
            aiSessions: typeof grandTotal?.ai_sessions === 'number' ? grandTotal.ai_sessions : 0,
            timezone: wakaData?.data?.range?.timezone || 'Asia/Jakarta',
            lastUpdate,
            updatedAt: now.toISOString(),
        };

        sendJson(res, 200, payload, cacheHeader, headOnly);
    } catch {
        sendJson(res, 502, { error: 'Failed to fetch WakaTime coding status' });
    }
}
