// ===== src/pages/About.tsx =====
import React from 'react';

export const About: React.FC = () => {
    return (
        <section id="about" className="section">
            <div className="about-header">
                <h2 className="about-title">
                    <i className="fas fa-user" style={{ marginRight: '10px' }}></i>About Me
                </h2>
                <p className="about-subtitle">A brief introduction about who I am.</p>
            </div>
            <div className="about-divider"></div>

            <div className="about-content-box">
                <div className="hero-page-content">
                    <p>
                        I'm Bima Satya Mahendra (Satya), currently studying at Informatics Departement, Sumatra Institute Of Technology.
                        I have an interest in software engineering development, web3, blockchain technology, and AI, Especially web3 and AI. I’ve been spending most of my time building projects and improving my skills in those areas.
                    </p>
                    <p>
                        Right now i'm still improving on my skills in several programming languages and frameworks since i'm still a student.
                        especially blockchain and AI. I enjoy turning ideas into working products, while making sure the code is not just functional, but also clean, structured, and easy to maintain. For me, good software isn’t just about making things work, but it’s about building them the right way.
                    </p>
                    <p>
                        Lately, I’ve been exploring blockchain and AI more deeply, experimenting with different tools and technologies, and understanding how systems actually work behind that.
                    </p>
                    <p>
                        Recently, I’ve been working on project that called "ACTS (Adaptive Confluence Trading System)" a Self Learning Trading Bot. I’m still learning all of that and improving myself. I’m open to collaborations, opportunities, or just connecting with people in the same space.
                    </p>
                    <p>
                        Best Regards,
                    </p>
                    <p className="about-signature">
                        Bima Satya Mahendra
                    </p>
                </div>
            </div>

            <div className="about-divider"></div>

            {/* EDUCATION SECTION */}
            <div className="education-section">
                <h3 className="education-section-title">
                    <i className="fas fa-graduation-cap"></i> Education
                </h3>
                <p className="education-section-subtitle">My educational journey.</p>
                
                <div className="education-list">
                    {/* ITERA Card */}
                    <div className="education-card">
                        <div className="education-logo">
                            <img 
                                src="assets/itera.png" 
                                alt="ITERA Logo" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                        </div>
                        <div className="education-info">
                            <h3>Institut Teknologi Sumatera</h3>
                            <p className="education-details">
                                Bachelor's degree <span>•</span> Informatics Engineering, (S.Kom) <span>•</span> GPA: -
                            </p>
                            <p className="education-meta">
                                2025 - Present <span>•</span> Lampung, Indonesia <span className="country-code"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="12" height="8" style={{ marginRight: '4px', verticalAlign: 'middle', borderRadius: '1px' }}><rect width="3" height="1" fill="#E21F26"/><rect y="1" width="3" height="1" fill="#FFFFFF"/></svg>ID</span>
                            </p>
                        </div>
                    </div>

                    {/* SMAN 3 Card */}
                    <div className="education-card">
                        <div className="education-logo">
                            <img 
                                src="assets/sman3.png" 
                                alt="SMAN 3 Logo" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                        </div>
                        <div className="education-info">
                            <h3>SMAN 3 Bandar Lampung</h3>
                            <p className="education-details">
                                Senior High School <span>•</span> Merdeka Curriculum
                            </p>
                            <p className="education-meta">
                                2022 - 2025 <span>•</span> Bandar Lampung, Lampung, Indonesia <span className="country-code"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="12" height="8" style={{ marginRight: '4px', verticalAlign: 'middle', borderRadius: '1px' }}><rect width="3" height="1" fill="#E21F26"/><rect y="1" width="3" height="1" fill="#FFFFFF"/></svg>ID</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    );
};
