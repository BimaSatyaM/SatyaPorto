import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

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

export interface CodingStatusData {
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

const CACHE_KEY = 'satya_wakatime_stats_v3';

function readCachedStatus(): CodingStatusData | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CodingStatusData;
        if (typeof parsed?.isCoding === 'boolean' && typeof parsed?.totalHoursEn === 'string') {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

export const CodingStatus: React.FC = () => {
    const { lang } = useLanguage();
    const [status, setStatus] = useState<CodingStatusData | null>(readCachedStatus);
    const [loading, setLoading] = useState<boolean>(() => readCachedStatus() === null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/coding-status', { signal: controller.signal });
                if (!res.ok) return;
                const data = (await res.json()) as CodingStatusData;
                if (!isMounted) return;
                setStatus(data);
                try {
                    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                } catch {
                    // Ignore localStorage quota errors
                }
            } catch {
                // Keep cached data on network error
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        void fetchStatus();
        const interval = window.setInterval(fetchStatus, 60000);

        return () => {
            isMounted = false;
            controller.abort();
            window.clearInterval(interval);
        };
    }, []);

    if (loading && !status) {
        return (
            <section className="wakatime-section loading" aria-label="WakaTime Statistics Dashboard">
                <i className="fas fa-spinner post-spinner" aria-hidden="true" />
                <span>{lang === 'ID' ? 'Memuat statistik WakaTime...' : 'Loading WakaTime stats...'}</span>
            </section>
        );
    }

    if (!status) return null;

    const isCoding = status.isCoding;
    const statusLabel = isCoding
        ? lang === 'ID'
            ? 'Sedang Menulis Kode'
            : 'Currently Coding'
        : lang === 'ID'
          ? 'Sedang Beristirahat'
          : 'Away / Idle';

    const todayCodingTime = lang === 'ID' ? status.totalHoursId : status.totalHoursEn;
    const allTimeValue = status.allTimeText || 'N/A';

    return (
        <section className="wakatime-section" aria-label="WakaTime Statistics Dashboard">
            {/* Header sitting seamlessly on background */}
            <div className="wakatime-header">
                <div className="wakatime-header-left">
                    <h3 className="wakatime-title">
                        <span className="wakatime-logo-badge" aria-hidden="true">
                            <i className="far fa-check-circle" />
                        </span>
                        <span>WakaTime Stats</span>
                    </h3>
                    <p className="wakatime-subtitle">
                        {lang === 'ID'
                            ? 'Aktivitas coding tercatat via WakaTime & Antigravity 2.0.'
                            : 'Coding activity tracked via WakaTime & Antigravity 2.0.'}
                    </p>
                </div>

                <div className="wakatime-header-right">
                    <span className="wakatime-last-update">
                        Last Update: {status.lastUpdate}
                    </span>
                </div>
            </div>

            {/* 2-Column Grid merged directly into background */}
            <div className="wakatime-grid">
                {/* Card 1: Start Date */}
                <div className="wakatime-stat-box">
                    <span className="wakatime-stat-label">
                        {lang === 'ID' ? 'Tanggal Mulai' : 'Start Date'}
                    </span>
                    <span className="wakatime-stat-value">{status.dateText}</span>
                </div>

                {/* Card 2: Live Status */}
                <div className="wakatime-stat-box">
                    <span className="wakatime-stat-label">
                        {lang === 'ID' ? 'Status Langsung' : 'Live Status'}
                    </span>
                    <div className="wakatime-stat-value-status">
                        <span className={`wakatime-status-dot ${isCoding ? 'active' : 'idle'}`} aria-hidden="true" />
                        <span>{statusLabel}</span>
                    </div>
                </div>

                {/* Card 3: Today's Coding Time */}
                <div className="wakatime-stat-box">
                    <span className="wakatime-stat-label">
                        {lang === 'ID' ? 'Waktu Coding Hari Ini' : "Today's Coding Time"}
                    </span>
                    <span className="wakatime-stat-value accent">{todayCodingTime}</span>
                </div>

                {/* Card 4: Digital Timer & Timezone */}
                <div className="wakatime-stat-box">
                    <span className="wakatime-stat-label">
                        {lang === 'ID' ? 'Timer Digital & Zona Waktu' : 'Digital Timer & Timezone'}
                    </span>
                    <span className="wakatime-stat-value">{status.totalDigital} • {status.timezone}</span>
                </div>

                {/* Card 5: Active Projects Today & AI Sessions */}
                <div className="wakatime-stat-box">
                    <span className="wakatime-stat-label">
                        {status.projects.length > 1
                            ? (lang === 'ID' ? 'Proyek Teratas Hari Ini' : 'Top Projects Today')
                            : (lang === 'ID' ? 'Proyek Aktif' : 'Active Project')}
                    </span>
                    <div className="wakatime-project-wrap">
                        <span className="wakatime-stat-value">
                            {status.project ? (
                                <>
                                    {status.project}
                                    {status.projects[0]?.text && (
                                        <span className="wakatime-project-primary-time">
                                            {' '}• {status.projects[0].text}
                                        </span>
                                    )}
                                </>
                            ) : (
                                lang === 'ID' ? 'Belum ada proyek aktif' : 'No active project'
                            )}
                        </span>
                        {status.aiSessions > 0 && (
                            <span className="wakatime-ai-badge" title="Antigravity 2.0 AI Sessions">
                                <i className="fas fa-robot" aria-hidden="true" />
                                {status.aiSessions} AI Session{status.aiSessions > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    {status.projects.length > 1 && (
                        <div className="wakatime-sub-projects" aria-label="Other active projects today">
                            <span className="wakatime-sub-projects-label">
                                {lang === 'ID' ? 'Juga aktif: ' : 'Also active: '}
                            </span>
                            {status.projects
                                .slice(1)
                                .map((p) => `${p.name}${p.text ? ` (${p.text})` : ''}`)
                                .join(' • ')}
                        </div>
                    )}
                </div>

                {/* Card 6: All-Time Coding Since Joined */}
                <div className="wakatime-stat-box">
                    <span className="wakatime-stat-label">
                        {lang === 'ID' ? 'Total Coding Sejak Bergabung' : 'All-Time Coding Since Joined'}
                    </span>
                    <span className="wakatime-stat-value">{allTimeValue}</span>
                </div>

                {/* Card 7: Top Languages (Full Width) */}
                <div className="wakatime-stat-box full-width">
                    <span className="wakatime-stat-label">
                        {lang === 'ID' ? 'Bahasa Pemrograman Teratas' : 'Top Languages'}
                    </span>

                    {status.languages.length > 0 ? (
                        <div className="wakatime-languages-list">
                            {status.languages.map((l) => (
                                <div key={l.name} className="wakatime-lang-row">
                                    <div className="wakatime-lang-info">
                                        <span className="wakatime-lang-name">{l.name}</span>
                                        <span className="wakatime-lang-time">{l.text || `${l.percent}%`}</span>
                                    </div>
                                    <div className="wakatime-lang-bar-bg">
                                        <div
                                            className="wakatime-lang-bar-fill"
                                            style={{ width: `${Math.min(100, Math.max(4, l.percent))}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span className="wakatime-stat-value placeholder">
                            {lang === 'ID' ? 'N/A (Belum ada data bahasa hari ini)' : "N/A (Awaiting today's activity)"}
                        </span>
                    )}
                </div>
            </div>
        </section>
    );
};
