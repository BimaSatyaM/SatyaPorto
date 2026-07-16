// ===== src/pages/Home.tsx =====
import React, { useState } from 'react';
import { PostList } from '../components/PostList';
import {
    SiFlutter, SiCplusplus, SiC, SiPython, SiHtml5,
    SiReact, SiCss, SiGithub, SiNpm, SiTypescript, SiTailwindcss
} from 'react-icons/si';

interface SkillItem {
    name: string;
    icon: React.ReactNode;
    category: 'languages' | 'frontend' | 'mobile' | 'tools';
    color: string;
}

export const Home: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const skills: SkillItem[] = [
        { name: 'Flutter', icon: <SiFlutter />, category: 'mobile', color: '#02569B' },
        { name: 'C++', icon: <SiCplusplus />, category: 'languages', color: '#00599C' },
        { name: 'C', icon: <SiC />, category: 'languages', color: '#A8B9CC' },
        { name: 'Python', icon: <SiPython />, category: 'languages', color: '#3776AB' },
        { name: 'HTML5', icon: <SiHtml5 />, category: 'frontend', color: '#E34F26' },
        { name: 'React.js', icon: <SiReact />, category: 'frontend', color: '#61DAFB' },
        { name: 'CSS3', icon: <SiCss />, category: 'frontend', color: '#1572B6' },
        { name: 'GitHub', icon: <SiGithub />, category: 'tools', color: '#ffffff' },
        { name: 'npm', icon: <SiNpm />, category: 'tools', color: '#CB3837' },
        { name: 'TypeScript', icon: <SiTypescript />, category: 'frontend', color: '#3178C6' },
        { name: 'Tailwind CSS', icon: <SiTailwindcss />, category: 'frontend', color: '#06B6D4' }
    ];

    const categories = [
        { id: 'all', label: 'All', count: skills.length },
        { id: 'languages', label: 'Languages', count: skills.filter(s => s.category === 'languages').length },
        { id: 'frontend', label: 'Frontend', count: skills.filter(s => s.category === 'frontend').length },
        { id: 'mobile', label: 'Mobile', count: skills.filter(s => s.category === 'mobile').length },
        { id: 'tools', label: 'Tools', count: skills.filter(s => s.category === 'tools').length }
    ];

    const filteredSkills = selectedCategory === 'all'
        ? skills
        : skills.filter(s => s.category === selectedCategory);

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
                    {filteredSkills.map(skill => (
                        <div
                            key={skill.name}
                            className="skill-badge"
                            style={{ '--skill-color': skill.color } as React.CSSProperties}
                        >
                            <span className="skill-icon" style={{ color: skill.color }}>
                                {skill.icon}
                            </span>
                            <span className="skill-name">{skill.name}</span>
                        </div>
                    ))}
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
