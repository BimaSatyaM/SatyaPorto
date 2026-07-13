// ===== src/pages/Projects.tsx =====
import React from 'react';

const projects = [
    { title: 'E-Commerce', tech: 'React & Node.js', icon: 'fas fa-shopping-cart', gradient: 'linear-gradient(135deg,#1DB954,#0a7a30)' },
    { title: 'Blog CMS', tech: 'Full-stack blog platform', icon: 'fas fa-blog', gradient: 'linear-gradient(135deg,#ff6b6b,#ee5253)' },
    { title: 'Task Manager', tech: 'Productivity app', icon: 'fas fa-tasks', gradient: 'linear-gradient(135deg,#4834d4,#686de0)' },
    { title: 'Weather App', tech: 'Real-time forecast', icon: 'fas fa-cloud-sun', gradient: 'linear-gradient(135deg,#f39c12,#e67e22)' },
    { title: 'Restaurant', tech: 'Landing page & booking', icon: 'fas fa-utensils', gradient: 'linear-gradient(135deg,#1abc9c,#16a085)' },
    { title: 'Game Hub', tech: 'Gaming community', icon: 'fas fa-gamepad', gradient: 'linear-gradient(135deg,#9b59b6,#8e44ad)' }
];

interface ProjectsProps {
    playTrack: (index: number) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ playTrack }) => {
    return (
        <section id="projects" className="section">
            <div className="section-header">
                <h2>Featured Projects</h2>
                <a href="#projects" className="see-all" onClick={(e) => e.preventDefault()}>Show all</a>
            </div>
            <div className="projects-grid">
                {projects.map((project, i) => (
                    <div
                        key={project.title}
                        className="project-card"
                        onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (!target.closest('.play-btn')) {
                                alert(`🎵 ${project.title}\nProject details!`);
                            }
                        }}
                    >
                        <div className="card-image" style={{ background: project.gradient }}>
                            <i className={`${project.icon} card-icon`}></i>
                            <button
                                className="play-btn"
                                onClick={() => playTrack(i % 10)}
                            >
                                <i className="fas fa-play"></i>
                            </button>
                        </div>
                        <h4>{project.title}</h4>
                        <p>{project.tech}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};
