import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

interface ActivityRepoCommit {
    name: string;
    url: string;
    commitsText: string;
    percentage: number;
}

interface CreatedRepoDetails {
    name: string;
    url: string;
    language?: string;
    languageColor?: string;
    date?: string;
}

interface ActivityItem {
    id: string;
    type: 'commits' | 'repo_created' | 'pull_request' | 'private' | 'generic';
    title: string;
    date?: string;
    repos?: ActivityRepoCommit[];
    createdRepo?: CreatedRepoDetails;
}

interface ActivityMonthGroup {
    month: string;
    items: ActivityItem[];
    hasMore: boolean;
    nextFrom?: string;
    nextTo?: string;
}

interface ContributionPayload {
    total: number;
    days: ContributionDay[];
    activity?: ActivityMonthGroup;
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

const ACTIVITY_ICON_MAP: Record<ActivityItem['type'], string> = {
    commits: 'fas fa-code-branch',
    repo_created: 'fas fa-book',
    pull_request: 'fas fa-code-pull-request',
    private: 'fas fa-lock',
    generic: 'fas fa-circle-dot',
};

export const GitHubContributions: React.FC<GitHubContributionsProps> = ({ username }) => {
    const { lang } = useLanguage();
    const [data, setData] = useState<ContributionPayload | null>(() => readCachedContributions(username));
    const [loading, setLoading] = useState<boolean>(() => readCachedContributions(username) === null);
    const [error, setError] = useState<string | null>(null);
    const [activeDay, setActiveDay] = useState<ContributionDay | null>(null);
    const [reloadTick, setReloadTick] = useState(0);
    const [extraMonths, setExtraMonths] = useState<ActivityMonthGroup[]>([]);
    const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);

    const loadContributions = useCallback(async (signal?: AbortSignal) => {
        setError(null);
        const encodedUsername = encodeURIComponent(username);
        const endpoints = [
            `/api/github-contributions?username=${encodedUsername}`,
            `https://github-contributions-api.jogruber.de/v4/${encodedUsername}?y=last`,
        ];

        try {
            let lastError: Error | null = null;
            for (const endpoint of endpoints) {
                try {
                    const res = await fetch(endpoint, { signal });
                    const contentType = res.headers.get('content-type') ?? '';
                    if (!res.ok || !contentType.includes('application/json')) {
                        lastError = new Error(`HTTP ${res.status}`);
                        continue;
                    }
                    const json = (await res.json()) as {
                        total?: { lastYear?: number };
                        contributions?: ContributionDay[];
                        activity?: ActivityMonthGroup;
                    };
                    const days = Array.isArray(json.contributions) ? json.contributions : [];
                    if (days.length === 0) {
                        lastError = new Error('Empty contribution dataset');
                        continue;
                    }
                    const total =
                        typeof json.total?.lastYear === 'number'
                            ? json.total.lastYear
                            : days.reduce((sum, d) => sum + (d.count || 0), 0);
                    const nextPayload: ContributionPayload = {
                        total,
                        days,
                        activity: json.activity ?? readCachedContributions(username)?.activity,
                    };
                    setData(nextPayload);
                    setExtraMonths([]);
                    try {
                        window.localStorage.setItem(`${CACHE_KEY_PREFIX}${username}`, JSON.stringify(nextPayload));
                    } catch {
                        // Ignore storage quota errors
                    }
                    return;
                } catch (err) {
                    if (signal?.aborted) throw err;
                    lastError = err instanceof Error ? err : new Error('Unable to load activity');
                }
            }
            throw lastError ?? new Error('Unable to load activity');
        } catch (err) {
            if (signal?.aborted) return;
            setError(err instanceof Error ? err.message : 'Unable to load activity');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [username]);

    const activityMonths = useMemo(
        () => (data?.activity ? [data.activity, ...extraMonths] : []),
        [data?.activity, extraMonths]
    );

    const lastActivityMonth = activityMonths[activityMonths.length - 1];

    const handleShowMoreActivity = async () => {
        if (loadingMoreActivity || !lastActivityMonth?.hasMore || !lastActivityMonth.nextFrom || !lastActivityMonth.nextTo) {
            return;
        }
        setLoadingMoreActivity(true);
        try {
            const url = `/api/github-contributions?username=${encodeURIComponent(username)}&from=${encodeURIComponent(lastActivityMonth.nextFrom)}&to=${encodeURIComponent(lastActivityMonth.nextTo)}`;
            const res = await fetch(url);
            if (!res.ok) return;
            const json = (await res.json()) as { activity?: ActivityMonthGroup };
            const nextMonth = json.activity;
            if (nextMonth) {
                setExtraMonths((prev) =>
                    prev.some((m) => m.month === nextMonth.month) ? prev : [...prev, nextMonth]
                );
            }
        } catch {
            // Silently keep current timeline if pagination fetch fails
        } finally {
            setLoadingMoreActivity(false);
        }
    };

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

            {activityMonths.length > 0 && (
                <div className="github-activity-section">
                    <div className="github-contrib-header">
                        <h3 className="github-contrib-title">
                            {lang === 'ID' ? 'Aktivitas Terbaru' : 'Recent Activity'}
                        </h3>
                    </div>

                    <div className="github-contrib-card github-activity-card">
                        {activityMonths.map((monthGroup) => (
                            <div key={monthGroup.month} className="github-activity-month">
                                <div className="github-activity-month-heading">
                                    <span>{monthGroup.month}</span>
                                    <span className="github-activity-month-line" aria-hidden="true" />
                                </div>

                                {monthGroup.items.length === 0 ? (
                                    <p className="github-activity-empty">
                                        {lang === 'ID'
                                            ? 'Tidak ada aktivitas publik pada bulan ini.'
                                            : 'No public activity recorded for this month.'}
                                    </p>
                                ) : (
                                    <div className="github-activity-timeline">
                                        {monthGroup.items.map((item) => (
                                            <div key={item.id} className="github-activity-item">
                                                <span className="github-activity-badge" aria-hidden="true">
                                                    <i className={ACTIVITY_ICON_MAP[item.type]} />
                                                </span>

                                                <div className="github-activity-body">
                                                    <div className="github-activity-summary">
                                                        <span className="github-activity-item-title">
                                                            {item.title}
                                                        </span>
                                                        {item.date && !item.createdRepo && (
                                                            <span className="github-activity-date">
                                                                {item.date}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {item.repos && item.repos.length > 0 && (
                                                        <ul className="github-activity-repo-list">
                                                            {item.repos.map((repo) => (
                                                                <li key={repo.name} className="github-activity-repo-row">
                                                                    <div className="github-activity-repo-meta">
                                                                        <a
                                                                            href={repo.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="github-activity-repo-link"
                                                                        >
                                                                            {repo.name}
                                                                        </a>
                                                                        {repo.commitsText && (
                                                                            <span className="github-activity-commit-count">
                                                                                {repo.commitsText}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div
                                                                        className="github-activity-progress"
                                                                        title={`${repo.percentage}%`}
                                                                        aria-label={`${repo.percentage}% of commits in ${monthGroup.month}`}
                                                                    >
                                                                        <span
                                                                            className="github-activity-progress-fill"
                                                                            style={{ width: `${Math.max(6, repo.percentage)}%` }}
                                                                        />
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}

                                                    {item.createdRepo && (
                                                        <div className="github-activity-created-repo">
                                                            <a
                                                                href={item.createdRepo.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="github-activity-repo-link"
                                                            >
                                                                <i className="fas fa-book" aria-hidden="true" />
                                                                {item.createdRepo.name}
                                                            </a>
                                                            <div className="github-activity-created-meta">
                                                                {item.createdRepo.language && (
                                                                    <span className="github-activity-lang">
                                                                        <span
                                                                            className="github-activity-lang-dot"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    item.createdRepo.languageColor || 'var(--primary)',
                                                                            }}
                                                                            aria-hidden="true"
                                                                        />
                                                                        {item.createdRepo.language}
                                                                    </span>
                                                                )}
                                                                {(item.createdRepo.date || item.date) && (
                                                                    <span className="github-activity-date">
                                                                        {item.createdRepo.date || item.date}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {lastActivityMonth?.hasMore && lastActivityMonth.nextFrom && lastActivityMonth.nextTo && (
                            <button
                                type="button"
                                className="github-activity-more-btn"
                                onClick={handleShowMoreActivity}
                                disabled={loadingMoreActivity}
                            >
                                {loadingMoreActivity ? (
                                    <>
                                        <i className="fas fa-spinner post-spinner" aria-hidden="true" />
                                        <span>{lang === 'ID' ? 'Memuat...' : 'Loading...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{lang === 'ID' ? 'Tampilkan aktivitas lainnya' : 'Show more activity'}</span>
                                        <i className="fas fa-chevron-down" style={{ fontSize: '10.5px', opacity: 0.7 }} aria-hidden="true" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};
