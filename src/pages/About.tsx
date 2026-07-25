import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const About: React.FC = () => {
    const { t, lang } = useLanguage();
    
    // Dynamic CV paths based on active language
    const cvPath = lang === 'ID' 
        ? "/assets/cv/BIMA SATYA MAHENDRA-resume (id).pdf" 
        : "/assets/cv/BIMA SATYA MAHENDRA-resume (en).pdf";
        
    const cvFilename = lang === 'ID'
        ? "BIMA SATYA MAHENDRA-resume (id).pdf"
        : "BIMA SATYA MAHENDRA-resume (en).pdf";

    return (
        <section id="about" className="section">
            <div className="about-header">
                <h2 className="about-title">
                    <i className="fas fa-user" style={{ marginRight: '10px' }}></i>{t('about.title')}
                </h2>
                <p className="about-subtitle">{t('about.subtitle')}</p>
            </div>
            <div className="about-divider"></div>

            <div className="hero-page-content">
                <p>{t('about.bio1')}</p>
                <p>{t('about.bio2')}</p>
                <p>{t('about.bio3')}</p>
                <p>{t('about.bio4')}</p>
                <p>{t('about.bestRegards')}</p>
                <p className="about-signature">
                    Bima Satya Mahendra
                </p>
            </div>

            {/* CV DOWNLOAD SECTION */}
            <div className="cv-download-container" style={{ marginTop: '20px', marginBottom: '20px' }}>
                <a 
                    href={cvPath} 
                    download={cvFilename} 
                    className="cv-download-box"
                >
                    <div className="cv-download-left">
                        <div className="cv-icon-wrapper">
                            <i className="fas fa-file-pdf"></i>
                        </div>
                        <div className="cv-details">
                            <h4>{t('about.cvTitle')}</h4>
                            <p>{t('about.cvSubtitle')}</p>
                        </div>
                    </div>
                    <div className="cv-download-btn-circle">
                        <i className="fas fa-download"></i>
                    </div>
                </a>
            </div>

            <div className="about-divider"></div>

            {/* EDUCATION SECTION */}
            <div className="education-section">
                <h3 className="education-section-title">
                    <i className="fas fa-graduation-cap"></i> {t('about.eduTitle')}
                </h3>
                <p className="education-section-subtitle">{t('about.eduSubtitle')}</p>
                
                <div className="education-list">
                    {/* ITERA Card */}
                    <div className="education-card">
                        <div className="education-logo">
                            <img 
                                src="/assets/itera.png" 
                                alt="ITERA Logo" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                        </div>
                        <div className="education-info">
                            <h3>{t('about.edu1Title')}</h3>
                            <p className="education-details">
                                {t('about.edu1Details')}
                            </p>
                            <p className="education-meta">
                                {t('about.edu1Meta')} <span className="country-code"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="12" height="8" style={{ marginRight: '4px', verticalAlign: 'middle', borderRadius: '1px' }}><rect width="3" height="1" fill="#E21F26"/><rect y="1" width="3" height="1" fill="#FFFFFF"/></svg>ID</span>
                            </p>
                        </div>
                    </div>

                    {/* SMAN 3 Card */}
                    <div className="education-card">
                        <div className="education-logo">
                            <img 
                                src="/assets/sman3.png" 
                                alt="SMAN 3 Logo" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                        </div>
                        <div className="education-info">
                            <h3>{t('about.edu2Title')}</h3>
                            <p className="education-details">
                                {t('about.edu2Details')}
                            </p>
                            <p className="education-meta">
                                {t('about.edu2Meta')} <span className="country-code"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="12" height="8" style={{ marginRight: '4px', verticalAlign: 'middle', borderRadius: '1px' }}><rect width="3" height="1" fill="#E21F26"/><rect y="1" width="3" height="1" fill="#FFFFFF"/></svg>ID</span>
                            </p>
                        </div>
                    </div>
            </div>
        </div>

        <div className="about-divider"></div>

        {/* EXPERIENCE SECTION */}
        <div className="education-section" style={{ marginTop: '30px' }}>
            <h3 className="education-section-title">
                <i className="fas fa-briefcase"></i> {t('about.expTitle')}
            </h3>
            <p className="education-section-subtitle">{t('about.expSubtitle')}</p>
            
            <div className="education-list">
                <div className="education-card" style={{ justifyContent: 'center', textAlign: 'center', padding: '40px 20px', borderStyle: 'dashed' }}>
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '15px' }}>
                        <i className="fas fa-tools" style={{ marginRight: '8px' }}></i>
                        {t('about.expPlaceholder')}
                    </p>
                </div>
            </div>
        </div>

    </section>
    );
};
