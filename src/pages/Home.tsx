import React, { useState, useEffect } from 'react';
import { PostList } from '../components/PostList';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { getTechIcon } from '../constants/techStack';

interface SkillItem {
    id: string;
    name: string;
    categories: string[];
    color: string;
}

export const Home: React.FC = () => {
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
        { id: 'all', label: 'All', count: skills.length },
        { id: 'Language', label: 'Language', count: skills.filter(s => s.categories && (s.categories.includes('Language') || s.name.toLowerCase() === 'flutter')).length },
        { id: 'Front End', label: 'Front End', count: skills.filter(s => s.categories && s.categories.includes('Front End')).length },
        { id: 'Back End', label: 'Back End', count: skills.filter(s => s.categories && (s.categories.includes('Back End') || isKnownDatabase(s.name))).length },
        { id: 'Database', label: 'Database', count: skills.filter(s => s.categories && (s.categories.includes('Database') || isKnownDatabase(s.name))).length },
        { id: 'Mobile', label: 'Mobile', count: skills.filter(s => s.categories && (s.categories.includes('Mobile') || s.name.toLowerCase() === 'flutter')).length },
        { id: 'Tools', label: 'Tools', count: skills.filter(s => s.categories && s.categories.includes('Tools')).length }
    ];

    const filteredSkills = selectedCategory === 'all'
        ? skills
        : skills.filter(s => {
            const hasCat = s.categories && s.categories.includes(selectedCategory);
            if (selectedCategory === 'Database' && isKnownDatabase(s.name)) return true;
            if (selectedCategory === 'Back End' && isKnownDatabase(s.name)) return true;
            if (selectedCategory === 'Mobile' && s.name.toLowerCase() === 'flutter') return true;
            if (selectedCategory === 'Language' && s.name.toLowerCase() === 'flutter') return true;
            return hasCat;
        });

    return (
        <section id="home" className="section hero-page">
            <div className="hero-page-container">
                <div className="hero-page-left">
                    <h1 className="hero-page-title">Hi, I'm Bima Satya Mahendra</h1>
                    <div className="hero-page-meta">
                        <span>Based in Lampung, Indonesia <span className="country-code"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="12" height="8" style={{ marginRight: '4px', verticalAlign: 'middle', borderRadius: '1px' }}><rect width="3" height="1" fill="#E21F26" /><rect y="1" width="3" height="1" fill="#FFFFFF" /></svg>ID</span></span>
                    </div>
                    <div className="hero-page-content">
                        <p>
                            An Informatics Student and developer dedicated to building impactful digital solutions.
                            I specialize in developing scalable web platforms and mobile applications using a modern tech stack,
                            primarily React, Python, and Flutter.
                        </p>
                        <p>
                            Right now i'm focusing on improving my skills in several programming languages and frameworks since i'm still a student.
                            I combine technical expertise with proactive communication and dedication
                            to ensure every project delivers logical clarity and a meaningful real-world impact. I'm also
                            open to new opportunities and collaborations, so feel free to reach out!
                        </p>
                    </div>
                </div>
                <div className="hero-page-right">
                    <div className="hero-photo-box">
                        <img src="assets/foto2.jpg" alt="Bima Satya Mahendra" />
                    </div>
                </div>
            </div>

            {/* DIVIDER LINE LIKE THE PHOTO */}
            <div className="skills-divider"></div>

            {/* SKILLS CONTAINER SECTION */}
            <div className="skills-section">
                <h3 className="skills-title">
                    <span className="code-bracket">&lt;/&gt;</span> Skills
                </h3>
                <p className="skills-subtitle">My professional skills.</p>

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
                        I'm still learning all these languages/frameworks, and there's likely more to come in the future!
                    </div>
                </div>

                {/* Divider Line */}
                <div className="about-divider"></div>

                {/* COMMUNITY PROJECT FEED SECTION */}
                <div className="education-section" style={{ marginTop: '24px' }}>
                    <h3 className="education-section-title">
                        <i className="fas fa-project-diagram"></i> Project Showcase
                    </h3>
                    <p className="education-section-subtitle">Latest projects That I've Made.</p>
                    <PostList limitCount={8} showFilters={false} layout="slider" />
                </div>
            </div>
        </section>
    );
};
