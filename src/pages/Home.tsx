import React, { useState, useEffect, useMemo } from 'react';
import { PostList } from '../components/PostList';
import { SkillsRoom3D } from '../components/SkillsRoom3D';
import { db } from '../firebase/config';
import { useLanguage } from '../context/LanguageContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { getTechIcon } from '../constants/techStack';

const SKILLS_CACHE_KEY = 'satya_skills_cache_v1';

function readCachedSkills(): SkillItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(SKILLS_CACHE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

class Skills3DErrorBoundary extends React.Component<
    { onErrorFallback: () => void; children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { onErrorFallback: () => void; children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch() {
        this.props.onErrorFallback();
    }

    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

interface SkillItem {
    id: string;
    name: string;
    categories: string[];
    color: string;
    isLead?: boolean;
}

export const Home: React.FC = () => {
    const { t, setActiveSection } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [webglFallback, setWebglFallback] = useState(false);
    const [skills, setSkills] = useState<SkillItem[]>(() => readCachedSkills());
    const [loadingSkills, setLoadingSkills] = useState(() => readCachedSkills().length === 0);

    // Fetch skills from Firestore in real-time and warm-cache for instant next paint
    useEffect(() => {
        const skillsCollection = collection(db, 'skills');
        const unsubscribe = onSnapshot(skillsCollection, (snapshot) => {
            const fetched: SkillItem[] = [];
            snapshot.forEach(docSnap => {
                fetched.push({
                    id: docSnap.id,
                    ...docSnap.data()
                } as SkillItem);
            });
            const nextSerialized = JSON.stringify(fetched);
            setSkills((prev) => (JSON.stringify(prev) === nextSerialized ? prev : fetched));
            setLoadingSkills(false);
            try {
                window.localStorage.setItem(SKILLS_CACHE_KEY, nextSerialized);
            } catch {
                // Ignore storage quota errors cleanly
            }
        }, (err) => {
            console.error('Error fetching skills list for Home:', err);
            setLoadingSkills(false);
        });

        return () => unsubscribe();
    }, []);

    // Ensure all databases are automatically tagged as 'Database' and 'Back End'
    const isKnownDatabase = (name: string): boolean => {
        const dbs = [
            'postgresql', 'mysql', 'mariadb', 'sql server', 'mongodb',
            'cassandra', 'dynamodb', 'redis', 'memcached', 'elasticsearch',
            'pinecone', 'milvus', 'sqlite', 'firebase', 'supabase',
            'cockroachdb', 'neo4j', 'couchdb', 'influxdb', 'clickhouse',
            'planetscale', 'prisma', 'surrealdb', 'faunadb', 'meilisearch',
            'arangodb'
        ];
        const clean = name.toLowerCase().trim();
        return dbs.some(db => clean.includes(db));
    };

    const categories = [
        { id: 'all', label: t('skills.all'), count: skills.length },
        {
            id: 'Language', label: t('skills.language'), count: skills.filter(s => {
                if (s.categories && s.categories.length > 0) return s.categories.includes('Language');
                return s.name.toLowerCase() === 'flutter';
            }).length
        },
        { id: 'Front End', label: t('skills.frontend'), count: skills.filter(s => s.categories && s.categories.includes('Front End')).length },
        {
            id: 'Back End', label: t('skills.backend'), count: skills.filter(s => {
                if (s.categories && s.categories.length > 0) return s.categories.includes('Back End');
                return isKnownDatabase(s.name);
            }).length
        },
        {
            id: 'Database', label: t('skills.database'), count: skills.filter(s => {
                if (s.categories && s.categories.length > 0) return s.categories.includes('Database');
                return isKnownDatabase(s.name);
            }).length
        },
        {
            id: 'Mobile', label: t('skills.mobile'), count: skills.filter(s => {
                if (s.categories && s.categories.length > 0) return s.categories.includes('Mobile');
                return s.name.toLowerCase() === 'flutter';
            }).length
        },
        { id: 'Tools', label: t('skills.tools'), count: skills.filter(s => s.categories && s.categories.includes('Tools')).length }
    ];

    const filteredSkills = selectedCategory === 'all'
        ? skills
        : skills.filter(s => {
            if (s.categories && s.categories.length > 0) {
                return s.categories.includes(selectedCategory);
            }
            // Fallback for legacy items with empty categories
            if (selectedCategory === 'Database' && isKnownDatabase(s.name)) return true;
            if (selectedCategory === 'Back End' && isKnownDatabase(s.name)) return true;
            if (selectedCategory === 'Mobile' && s.name.toLowerCase() === 'flutter') return true;
            if (selectedCategory === 'Language' && s.name.toLowerCase() === 'flutter') return true;
            return s.categories && s.categories.includes(selectedCategory);
        });

    const studioSkills = useMemo(
        () =>
            skills.map((s) => {
                const info = getTechIcon(s.name || '');
                return {
                    id: s.id,
                    name: s.name || 'Skill',
                    categories: Array.isArray(s.categories) ? s.categories : [],
                    color: info?.color || s.color || '#38bdf8',
                    isLead: Boolean(s.isLead),
                };
            }),
        [skills]
    );

    const visibleSkillIds = useMemo(
        () => new Set(filteredSkills.map((s) => s.id)),
        [filteredSkills]
    );

    const handleEditShowcasePost = (post: any) => {
        sessionStorage.setItem('edit_project_data', JSON.stringify(post));
        if (window.goTo) {
            window.goTo('projects');
        }
    };

    return (
        <section id="home" className="section hero-page">
            <div className="hero-page-container">
                <div className="hero-page-left">
                    <h1 className="hero-page-title">{t('home.welcome')}</h1>
                    <div className="hero-page-meta">
                        <span>{t('home.location')} <span className="country-code"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="12" height="8" style={{ marginRight: '4px', verticalAlign: 'middle', borderRadius: '1px' }}><rect width="3" height="1" fill="#E21F26" /><rect y="1" width="3" height="1" fill="#FFFFFF" /></svg>ID</span></span>
                    </div>
                    <div className="hero-page-content">
                        <p>{t('home.bio1')}</p>
                        <p>{t('home.bio2')}</p>
                    </div>
                    <div className="hero-cta-row">
                        <button
                            type="button"
                            className="hero-cta-primary"
                            onClick={() => setActiveSection('projects')}
                        >
                            {t('home.ctaProjects')}
                        </button>
                        <button
                            type="button"
                            className="hero-cta-secondary"
                            onClick={() => setActiveSection('contact')}
                        >
                            {t('home.ctaContact')}
                        </button>
                    </div>
                </div>
                <div className="hero-page-right">
                    <div className="hero-photo-box">
                        <img
                            src="/assets/foto.png"
                            alt="Bima Satya Mahendra"
                            width={260}
                            height={347}
                            fetchPriority="high"
                        />
                    </div>
                </div>
            </div>

            {/* DIVIDER LINE LIKE THE PHOTO */}
            <div className="skills-divider"></div>

            {/* SKILLS CONTAINER SECTION */}
            <div className="skills-section">
                <h3 className="skills-title">
                    <span className="code-bracket">&lt;/&gt;</span> {t('home.skillsTitle')}
                </h3>
                <p className="skills-subtitle">{t('home.skillsSubtitle')}</p>

                {/* Categories filter pills */}
                <div className="skills-filters">
                    {categories.map(cat => (
                        <button
                            type="button"
                            key={cat.id}
                            className={`filter-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                            aria-pressed={selectedCategory === cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.label} <span className="pill-count">{cat.count}</span>
                        </button>
                    ))}
                </div>

                {!webglFallback && (loadingSkills || studioSkills.length > 0) && (
                    <Skills3DErrorBoundary onErrorFallback={() => setWebglFallback(true)}>
                        <SkillsRoom3D
                            skills={studioSkills}
                            visibleSkillIds={visibleSkillIds}
                            warningText={t('home.warning')}
                            onWebGLUnavailable={() => setWebglFallback(true)}
                        />
                    </Skills3DErrorBoundary>
                )}

                {/* Fallback skills badges grid when WebGL is unavailable or skills are empty */}
                {(webglFallback || (!loadingSkills && skills.length === 0)) && (
                <div className="skills-grid" key={selectedCategory}>
                    {loadingSkills ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', gridColumn: '1 / -1' }}>
                            <i className="fas fa-spinner post-spinner"></i> Loading skills...
                        </div>
                    ) : filteredSkills.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', gridColumn: '1 / -1' }}>
                            No skills to showcase in this category.
                        </div>
                    ) : (
                        filteredSkills.map(skill => {
                            const info = getTechIcon(skill.name);
                            const skillColor = info ? info.color : (skill.color || '#38bdf8');
                            return (
                                <div
                                    key={skill.name}
                                    className="skill-badge"
                                    style={{
                                        '--skill-color': skillColor
                                    } as React.CSSProperties}
                                >
                                    <span className="skill-icon" style={{ color: skillColor }}>
                                        {info ? info.icon : <i className="fas fa-code"></i>}
                                    </span>
                                    <span className="skill-name">{skill.name}</span>
                                </div>
                            );
                        })
                    )}
                </div>
                )}

                {/* Divider Line */}
                <div className="about-divider"></div>

                {/* COMMUNITY PROJECT FEED SECTION */}
                <div className="education-section" style={{ marginTop: '24px' }}>
                    <h3 className="education-section-title">
                        <i className="fas fa-project-diagram"></i> {t('home.projectShowcaseTitle')}
                    </h3>
                    <p className="education-section-subtitle">{t('home.projectShowcaseSubtitle')}</p>
                    <PostList limitCount={8} showFilters={false} layout="slider" onEditPost={handleEditShowcasePost} />
                </div>
            </div>
        </section>
    );
};
