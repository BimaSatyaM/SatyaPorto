// ===== src/pages/About.tsx =====
import React from 'react';

interface AboutProps {
    openDetailPage: (key: string) => void;
}

export const About: React.FC<AboutProps> = ({ openDetailPage }) => {
    return (
        <section id="about" className="section">
            <div className="section-header">
                <h2>About Me</h2>
            </div>
            <div className="about-grid">
                <a
                    href="#who-i-am"
                    className="about-card-link"
                    onClick={(e) => {
                        e.preventDefault();
                        openDetailPage('who-i-am');
                    }}
                >
                    <div className="about-card">
                        <div className="about-card-icon"><i className="fas fa-code"></i></div>
                        <h3>Who I Am</h3>
                        <p>Web developer dengan passion dalam membangun experience digital yang menakjubkan.</p>
                        <span className="read-more">Read More <i className="fas fa-arrow-right"></i></span>
                    </div>
                </a>

                <a
                    href="#what-i-do"
                    className="about-card-link"
                    onClick={(e) => {
                        e.preventDefault();
                        openDetailPage('what-i-do');
                    }}
                >
                    <div className="about-card">
                        <div className="about-card-icon"><i className="fas fa-rocket"></i></div>
                        <h3>What I Do</h3>
                        <p>Membangun website modern dari landing page hingga aplikasi web complex.</p>
                        <span className="read-more">Read More <i className="fas fa-arrow-right"></i></span>
                    </div>
                </a>

                <a
                    href="#my-vision"
                    className="about-card-link"
                    onClick={(e) => {
                        e.preventDefault();
                        openDetailPage('my-vision');
                    }}
                >
                    <div className="about-card">
                        <div className="about-card-icon"><i className="fas fa-lightbulb"></i></div>
                        <h3>My Vision</h3>
                        <p>Menciptakan website yang indah, functional, dan memberikan nilai nyata.</p>
                        <span className="read-more">Read More <i className="fas fa-arrow-right"></i></span>
                    </div>
                </a>
            </div>

            <h3 className="skills-title">Technical Skills</h3>
            <div className="skills-items">
                <div className="skill-badge"><i className="fab fa-flutter"></i> Flutter</div>
                <div className="skill-badge"><i className="fab fa-python"></i> Python</div>
                <div className="skill-badge"><i className="fab fa-react"></i> React</div>
                <div className="skill-badge"><i className="fas fa-code"></i> C/C++</div>
                <div className="skill-badge"><i className="fab fa-figma"></i> Figma</div>
            </div>
        </section>
    );
};
