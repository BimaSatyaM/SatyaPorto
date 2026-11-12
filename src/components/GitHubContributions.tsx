import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

interface ContributionPayload {
    total: number;
    days: ContributionDay[];
}

interface MonthMarker {
    label: string;
    weekIndex: number;
}

export interface GitHubContributionsProps {
    username: string;
}

const CACHE_KEY_PREFIX = 'satya_github_contrib_v1_';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function readCachedContributions(username: string): ContributionPayload | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(`${CACHE_KEY_PREFIX}${username}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ContributionPayload;
        if (typeof parsed?.total === 'number' && Array.isArray(parsed?.days) && parsed.days.length > 0) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

function buildCalendarWeeks(days: ContributionDay[]): {
    weeks: Array<Array<ContributionDay | null>>;
    months: MonthMarker[];
} {
    if (days.length === 0) return { weeks: [], months: [] };

    const weeks: Array<Array<ContributionDay | null>> = [];
    let currentWeek: Array<ContributionDay | null> = Array(7).fill(null);

    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
        if (i > 0 && weekday === 0) {
            weeks.push(currentWeek);
            currentWeek = Array(7).fill(null);
        }
        currentWeek[weekday] = day;
    }
    weeks.push(currentWeek);

    const months: MonthMarker[] = [];
    let lastMonth = -1;
    let lastMarkerWeek = -4;

    weeks.forEach((week, weekIndex) => {
        const firstDay = week.find((d): d is ContributionDay => d !== null);
        if (!firstDay) return;
        const month = new Date(`${firstDay.date}T00:00:00Z`).getUTCMonth();
        if (month !== lastMonth) {
            // Skip tightly packed boundary labels at column 0/end so month text never collides
            if (weekIndex - lastMarkerWeek >= 3) {
                months.push({ label: MONTH_NAMES[month], weekIndex });
                lastMarkerWeek = weekIndex;
            }
            lastMonth = month;
        }
    });

    return { weeks, months };
}

function formatContributionDate(isoDate: string, lang: 'EN' | 'ID'): string {
    const date = new Date(`${isoDate}T00:00:00Z`);
    return date.toLocaleDateString(lang === 'ID' ? 'id-ID' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

export const GitHubContributions: React.FC<GitHubContributionsProps> = ({ username }) => {
    const { lang } = useLanguage();
    const [data, setData] = useState<ContributionPayload | null>(() => readCachedContributions(username));
    const [loading, setLoading] = useState<boolean>(() => readCachedContributions(username) === null);
    const [error, setError] = useState<string | null>(null);
    const [activeDay, setActiveDay] = useState<ContributionDay | null>(null);
    const [reloadTick, setReloadTick] = useState(0);

    const loadContributions = useCallback(async (signal?: AbortSignal) => {
        setError(null);
        try {
            const res = await fetch(
                `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
                { signal }
            );
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const json = (await res.json()) as {
                total?: { lastYear?: number };
                contributions?: ContributionDay[];
            };
            const days = Array.isArray(json.contributions) ? json.contributions : [];
            const total =
                typeof json.total?.lastYear === 'number'
                    ? json.total.lastYear
                    : days.reduce((sum, d) => sum + (d.count || 0), 0);
            const nextPayload: ContributionPayload = { total, days };
            setData(nextPayload);
            try {
                window.localStorage.setItem(`${CACHE_KEY_PREFIX}${username}`, JSON.stringify(nextPayload));
            } catch {
                // Ignore storage quota errors
            }
        } catch (err) {
            if (signal?.aborted) return;
            setError(err instanceof Error ? err.message : 'Unable to load activity');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        const controller = new AbortController();
        loadContributions(controller.signal);
        return () => controller.abort();
    }, [loadContributions, reloadTick]);

    const { weeks, months } = useMemo(() => buildCalendarWeeks(data?.days ?? []), [data]);

    const totalText = data
        ? lang === 'ID'
            ? `${data.total.toLocaleString()} kontribusi dalam setahun terakhir`
            : `${data.total.toLocaleString()} contributions in the last year`
        : lang === 'ID'
          ? 'Aktivitas kontribusi GitHub'
          : 'GitHub contribution activity';

    const inspectLabel = activeDay
        ? lang === 'ID'
            ? `${activeDay.count} kontribusi pada ${formatContributionDate(activeDay.date, lang)}`
            : `${activeDay.count} ${activeDay.count === 1 ? 'contribution' : 'contributions'} on ${formatContributionDate(activeDay.date, lang)}`
        : lang === 'ID'
          ? 'Arahkan atau ketuk kotak tanggal untuk melihat detail'
          : 'Hover or tap a day square to inspect activity';

    return (
        <section className="github-contrib-section" aria-label={totalText}>
            <div className="github-contrib-header">
                <h3 className="github-contrib-title">{totalText}</h3>
                <a
                    className="github-contrib-profile-link"
                    href={`https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <i className="fab fa-github" aria-hidden="true"></i>
                    <span>@{username}</span>
                </a>
            </div>

            <div className="github-contrib-card">
                {loading && !data ? (
                    <div className="github-contrib-status">
                        <i className="fas fa-spinner post-spinner" aria-hidden="true"></i>
                        <span>{lang === 'ID' ? 'Memuat aktivitas GitHub...' : 'Loading GitHub activity...'}</span>
                    </div>
                ) : error && !data ? (
                    <div className="github-contrib-status github-contrib-error">
                        <span>
                            {lang === 'ID'
                                ? 'Gagal memuat grafik kontribusi GitHub.'
                                : 'Could not load GitHub contribution chart.'}
                        </span>
                        <button
                            type="button"
                            className="github-contrib-retry"
                            onClick={() => {
                                setLoading(true);
                                setReloadTick((n) => n + 1);
                            }}
                        >
                            {lang === 'ID' ? 'Coba Lagi' : 'Retry'}
                        </button>
                    </div>
                ) : weeks.length === 0 ? (
                    <div className="github-contrib-status">
                        <span>{lang === 'ID' ? 'Belum ada data kontribusi.' : 'No contribution data available.'}</span>
                    </div>
                ) : (
                    <>
                        <div className="github-contrib-scroll">
                            <div className="github-contrib-matrix">
                                <div className="github-contrib-months" aria-hidden="true">
                                    {months.map((m) => (
                                        <span
                                            key={`${m.label}-${m.weekIndex}`}
                                            className="github-contrib-month"
                                            style={{ gridColumnStart: m.weekIndex + 1 }}
                                        >
                                            {m.label}
                                        </span>
                                    ))}
                                </div>

                                <div className="github-contrib-weekdays" aria-hidden="true">
                                    <span>Mon</span>
                                    <span>Wed</span>
                                    <span>Fri</span>
                                </div>

                                <div
                                    className="github-contrib-weeks"
                                    onMouseLeave={() => setActiveDay(null)}
                                >
                                    {weeks.map((week, weekIdx) => (
                                        <div key={weekIdx} className="github-contrib-week">
                                            {week.map((day, dayIdx) =>
                                                day ? (
                                                    <div
                                                        key={day.date}
                                                        className={`github-contrib-cell ${activeDay?.date === day.date ? 'active' : ''}`}
                                                        data-level={day.level}
                                                        title={`${day.count} contributions on ${day.date}`}
                                                        onMouseEnter={() => setActiveDay(day)}
                                                        onClick={() => setActiveDay(day)}
                                                    />
                                                ) : (
                                                    <div key={`pad-${weekIdx}-${dayIdx}`} className="github-contrib-cell empty-pad" />
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="github-contrib-footer">
                            <span className="github-contrib-inspect">{inspectLabel}</span>
                            <div className="github-contrib-legend" aria-label={lang === 'ID' ? 'Skala kontribusi' : 'Contribution scale'}>
                                <span>{lang === 'ID' ? 'Sedikit' : 'Less'}</span>
                                <span className="github-contrib-cell" data-level={0} aria-hidden="true" />
                                <span className="github-contrib-cell" data-level={1} aria-hidden="true" />
                                <span className="github-contrib-cell" data-level={2} aria-hidden="true" />
                                <span className="github-contrib-cell" data-level={3} aria-hidden="true" />
                                <span className="github-contrib-cell" data-level={4} aria-hidden="true" />
                                <span>{lang === 'ID' ? 'Banyak' : 'More'}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};
