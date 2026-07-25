import React, { useState, useEffect } from 'react';
import { PostList } from '../components/PostList';
import { db } from '../firebase/config';
import { useLanguage } from '../context/LanguageContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { getTechIcon } from '../constants/techStack';

interface SkillItem {
    id: string;
    name: string;
    categories: string[];
    color: string;
}

export const Home: React.FC = () => {
    const { t } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [skills, setSkills] = useState<SkillItem[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(true);

    // Fetch skills from Firestore in real-time
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
            setSkills(fetched);
            setLoadingSkills(false);
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
                </div>
                <div className="hero-page-right">
                    <div className="hero-photo-box">
                        <img src="/assets/foto2.jpg" alt="Bima Satya Mahendra" />
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
                            key={cat.id}
                            className={`filter-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.label} <span className="pill-count">{cat.count}</span>
                        </button>
                    ))}
                </div>

                {/* Skills badges grid */}
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
                                        '--skill-color': skillColor,
                                        background: `color-mix(in srgb, ${skillColor} 8%, transparent)`,
                                        border: `1px solid color-mix(in srgb, ${skillColor} 20%, transparent)`
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

                {/* Animated Warning Banner */}
                <div className="skills-warning-banner">
                    <div className="warning-banner-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="warning-banner-text">
                        {t('home.warning')}
                    </div>
                </div>

                {/* Divider Line */}
                <div className="about-divider"></div>

                {/* COMMUNITY PROJECT FEED SECTION */}
                <div className="education-section" style={{ marginTop: '24px' }}>
                    <h3 className="education-section-title">
                        <i className="fas fa-project-diagram"></i> {t('home.projectShowcaseTitle')}
                    </h3>
                    <p className="education-section-subtitle">{t('home.projectShowcaseSubtitle')}</p>
                    <PostList limitCount={8} showFilters={false} layout="slider" />
                </div>
            </div>
        </section>
    );
};
