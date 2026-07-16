import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, onSnapshot, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { AVAILABLE_TECH, getTechIcon } from '../constants/techStack';

// Automated Tech Skill Classifier Helper
const classifyTechnology = (name: string): string[] => {
    const clean = name.toLowerCase().trim();
    const categories: string[] = [];

    // 1. Language checks
    const languages = ['javascript', 'typescript', 'python', 'c++', 'c', 'swift', 'kotlin', 'go', 'rust', 'ruby', 'php', 'java', 'dart', 'html5', 'css3'];
    if (languages.some(l => clean.includes(l)) || clean === 'js' || clean === 'ts') {
        categories.push('Language');
    }

    // 2. Front End checks
    const frontend = ['html', 'css', 'sass', 'scss', 'less', 'bootstrap', 'tailwind', 'react', 'vue', 'angular', 'svelte', 'solid', 'next.js', 'nuxt.js', 'remix', 'astro', 'vite'];
    if (frontend.some(f => clean.includes(f)) || clean === 'js' || clean === 'ts') {
        categories.push('Front End');
    }

    // 3. Back End checks
    const backend = ['node', 'bun', 'deno', 'express', 'nestjs', 'django', 'fastapi', 'flask', 'laravel', 'symfony', 'spring', 'dotnet', 'rails', 'ruby', 'go', 'rust', 'aws', 'firebase', 'supabase'];
    if (backend.some(b => clean.includes(b)) || clean === 'python' || clean === 'js' || clean === 'ts') {
        categories.push('Back End');
    }

    // 4. Database checks
    const database = ['postgres', 'mysql', 'mariadb', 'sql server', 'mongodb', 'cassandra', 'dynamodb', 'redis', 'memcached', 'elasticsearch', 'pinecone', 'milvus', 'sqlite', 'database', 'firebase', 'supabase'];
    if (database.some(d => clean.includes(d))) {
        categories.push('Database');
    }

    // 5. Mobile checks
    const mobile = ['flutter', 'react native', 'swift', 'kotlin', 'android', 'ios'];
    if (mobile.some(m => clean.includes(m))) {
        categories.push('Mobile');
    }

    // 6. Tools checks
    const tools = ['git', 'docker', 'kubernetes', 'github', 'gitlab', 'jenkins', 'terraform', 'ansible', 'npm', 'vite', 'vercel', 'netlify', 'railway', 'render', 'aws', 'gcp', 'azure', 'google cloud'];
    if (tools.some(t => clean.includes(t))) {
        categories.push('Tools');
    }

    // Specific explicit overrides
    if (clean === 'flutter') {
        // Flutter requires Dart which is a Language
        if (!categories.includes('Language')) categories.push('Language');
        if (!categories.includes('Mobile')) categories.push('Mobile');
    }

    return categories.length > 0 ? categories : ['Tools'];
};

interface SkillDoc {
    id: string;
    name: string;
    categories: string[];
    color: string;
}

export const Dashboard: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const [skillsList, setSkillsList] = useState<SkillDoc[]>([]);

    // Form & Autocomplete Search States
    const [techInput, setTechInput] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Classifier States
    const [selectedTechName, setSelectedTechName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#38bdf8');
    const [detectedCategories, setDetectedCategories] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // List categories for manually adjusting classification before adding
    const ALL_CLASSIFIER_CATEGORIES = ['Language', 'Front End', 'Back End', 'Database', 'Mobile', 'Tools'];

    // 1. Fetch current skills list in real time
    useEffect(() => {
        const skillsCollection = collection(db, 'skills');
        const unsubscribe = onSnapshot(skillsCollection, (snapshot) => {
            const fetched: SkillDoc[] = [];
            snapshot.forEach(docSnap => {
                fetched.push({
                    id: docSnap.id,
                    ...docSnap.data()
                } as SkillDoc);
            });
            setSkillsList(fetched);
        }, (err) => {
            console.error('Error fetching skills:', err);
        });

        return () => unsubscribe();
    }, []);

    // 2. Click outside dropdown dismisses it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 3. Auto-classify on technology select
    const handleSelectTechnology = (name: string, color: string) => {
        setSelectedTechName(name);
        setSelectedColor(color);
        const classification = classifyTechnology(name);
        setDetectedCategories(classification);
        setTechInput('');
        setIsDropdownOpen(false);
    };

    const handleCustomInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = techInput.trim();
            if (val) {
                // Check if it exists in DB
                const match = AVAILABLE_TECH.find(t => t.name.toLowerCase() === val.toLowerCase());
                if (match) {
                    handleSelectTechnology(match.name, match.color);
                } else {
                    setSelectedTechName(val);
                    setSelectedColor('#38bdf8'); // Default brand sky blue
                    const classification = classifyTechnology(val);
                    setDetectedCategories(classification);
                }
                setTechInput('');
                setIsDropdownOpen(false);
            }
        }
    };

    const handleCategoryToggle = (cat: string) => {
        setDetectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTechName) return;

        setSubmitting(true);
        setError(null);

        try {
            const skillsCollection = collection(db, 'skills');

            // Check if skill is already in list to avoid duplicates
            if (skillsList.some(s => s.name.toLowerCase() === selectedTechName.toLowerCase())) {
                throw new Error('This skill has already been added to your Home page!');
            }

            await addDoc(skillsCollection, {
                name: selectedTechName,
                categories: detectedCategories,
                color: selectedColor,
                createdAt: serverTimestamp()
            });

            // Reset selected states
            setSelectedTechName('');
            setSelectedColor('#38bdf8');
            setDetectedCategories([]);
        } catch (err: any) {
            setError(err.message || 'Failed to add skill.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSkill = async (skillId: string) => {
        if (!window.confirm('Delete this skill from your Home page showcase?')) return;
        try {
            const skillRef = doc(db, 'skills', skillId);
            await deleteDoc(skillRef);
        } catch (err: any) {
            alert('Failed to delete skill: ' + err.message);
        }
    };

    // Filter autocomplete options list
    const filteredTechs = AVAILABLE_TECH.filter(
        tech =>
            tech.name.toLowerCase().includes(techInput.toLowerCase()) &&
            !skillsList.some(s => s.name.toLowerCase() === tech.name.toLowerCase())
    );

    // If visitor or public (not whitelisted admin)
    if (!user || !isAdmin) {
        return (
            <section id="dashboard" className="section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '40px 20px' }}>
                <div className="auth-notice-card" style={{ maxWidth: '480px', padding: '40px 30px' }}>
                    <i className="fas fa-tools auth-notice-icon" style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: '20px' }}></i>
                    <h2 style={{ fontSize: '24px', fontWeight: '500', color: '#fff', marginBottom: '10px' }}>Dashboard</h2>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Dashboard features are still under development. Comeback later when updated!
                    </p>
                </div>
            </section>
        );
    }

    // Render Whitelisted Admin Panel View
    const selectedIconInfo = getTechIcon(selectedTechName);

    return (
        <section id="dashboard" className="section">
            <div className="about-header">
                <h2 className="about-title">
                    <i className="fas fa-sliders-h" style={{ marginRight: '10px' }}></i>Dashboard Admin
                </h2>
                <p className="about-subtitle">Manage skills, auto-classify technologies, and configure portfolio pages.</p>
            </div>
            <div className="about-divider"></div>

            <div className="dashboard-grid-layout" style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '760px', margin: '0 auto' }}>

                {/* 1. TECH SKILL CLASSIFIER PANEL CARD */}
                <div className="post-form-container" style={{ margin: 0, width: '100%' }}>
                    <h3 className="post-form-title">
                        <i className="fas fa-robot"></i> Tech Skill Classifier
                    </h3>

                    {error && (
                        <div className="post-error-alert" style={{ marginBottom: '16px' }}>
                            <i className="fas fa-exclamation-circle"></i> {error}
                        </div>
                    )}

                    <div className="post-form">
                        {/* Autocomplete Input Select */}
                        <div className="post-form-group" ref={dropdownRef} style={{ position: 'relative' }}>
                            <label>Search & Select Technology</label>
                            <div className="searchable-dropdown-container">
                                <input
                                    type="text"
                                    placeholder="Type tech name (e.g. Python, Flutter, Firebase)..."
                                    value={techInput}
                                    onChange={(e) => {
                                        setTechInput(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    onKeyDown={handleCustomInputSubmit}
                                    className="post-input"
                                    autoComplete="off"
                                />

                                {isDropdownOpen && (
                                    <div className="searchable-dropdown-menu">
                                        <div className="dropdown-options-list">
                                            {filteredTechs.map((tech) => (
                                                <div
                                                    key={tech.name}
                                                    onClick={() => handleSelectTechnology(tech.name, tech.color)}
                                                    className="dropdown-option-item"
                                                >
                                                    <span className="tech-option-pill">
                                                        <span className="tech-pill-icon" style={{ color: tech.color }}>
                                                            {tech.icon}
                                                        </span>
                                                        {tech.name}
                                                    </span>
                                                </div>
                                            ))}
                                            {filteredTechs.length === 0 && (
                                                <div className="dropdown-no-results">
                                                    No matches. Press Enter to add custom "{techInput}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Automatic Classification Fields */}
                        {selectedTechName && (
                            <form onSubmit={handleAddSkill} style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                <div className="classification-preview-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1c1c1e', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {/* Badge Preview */}
                                        <div
                                            className="skill-badge"
                                            style={{
                                                '--skill-color': selectedColor,
                                                margin: 0,
                                                background: `color-mix(in srgb, ${selectedColor} 8%, transparent)`,
                                                border: `1px solid color-mix(in srgb, ${selectedColor} 20%, transparent)`
                                            } as React.CSSProperties}
                                        >
                                            <span className="skill-icon" style={{ color: selectedColor }}>
                                                {selectedIconInfo ? selectedIconInfo.icon : <i className="fas fa-code"></i>}
                                            </span>
                                            <span className="skill-name" style={{ color: '#fff', fontWeight: 600 }}>{selectedTechName}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live preview</span>
                                    </div>

                                    {/* Color Indicator */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Color:</span>
                                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: selectedColor }} />
                                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{selectedColor}</span>
                                    </div>
                                </div>

                                <div className="post-form-group">
                                    <label>Auto-Classified Categories (Toggle to adjust)</label>
                                    <div className="categories-checkboxes" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                                        {ALL_CLASSIFIER_CATEGORIES.map(cat => {
                                            const isSelected = detectedCategories.includes(cat);
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => handleCategoryToggle(cat)}
                                                    className={`filter-pill-btn ${isSelected ? 'active' : ''}`}
                                                    style={{
                                                        background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                                                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                                                        color: isSelected ? '#000000' : 'var(--text-secondary)',
                                                        borderRadius: '20px',
                                                        padding: '6px 16px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        border: '1px solid var(--border)'
                                                    }}
                                                >
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="post-submit-btn-row" style={{ marginTop: '24px' }}>
                                    <button
                                        type="submit"
                                        className="post-submit-btn"
                                        disabled={submitting || detectedCategories.length === 0}
                                        style={{ width: '100%' }}
                                    >
                                        {submitting ? 'Adding to Home Page...' : 'Add Skill to Home Page'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* 2. CURRENT ACTIVE SKILLS LIST CARD */}
                <div className="about-content-box" style={{ margin: 0, padding: '24px 30px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-list-ul" style={{ color: 'var(--primary)' }}></i> Current Skills ({skillsList.length})
                    </h3>

                    {skillsList.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                            No skills added yet. Select a technology above to classify and showcase it!
                        </p>
                    ) : (
                        <div className="dashboard-skills-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {skillsList.map((skill) => {
                                const skillName = skill.name || 'Unnamed Skill';
                                const info = getTechIcon(skillName);
                                const skillColor = info ? info.color : (skill.color || '#38bdf8');
                                const skillCategories = skill.categories || [];
                                return (
                                    <div
                                        key={skill.id}
                                        className="dashboard-skill-row"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#121212', border: '1px solid var(--border)', borderRadius: '10px' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '18px', color: skillColor, display: 'flex', alignItems: 'center' }}>
                                                {info ? info.icon : <i className="fas fa-code"></i>}
                                            </span>
                                            <div>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', display: 'block' }}>{skillName}</span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {skillCategories.join(', ')}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteSkill(skill.id)}
                                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                                            title="Delete Skill"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </section>
    );
};
