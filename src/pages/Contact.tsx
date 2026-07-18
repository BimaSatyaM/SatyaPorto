// ===== src/pages/Contact.tsx =====
import React, { useState } from 'react';
import { SiGmail, SiInstagram, SiGithub } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

export const Contact: React.FC = () => {
    const { t } = useLanguage();
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('sending');
        setTimeout(() => {
            setFormStatus('sent');
            setTimeout(() => {
                setFormStatus('idle');
                setFormName('');
                setFormEmail('');
                setFormMessage('');
            }, 2000);
        }, 1200);
    };

    return (
        <section id="contact" className="section contact-page">
            <div className="contact-page-header">
                <h1>{t('contact.title')}</h1>
                <p>{t('contact.subtitle')}</p>
            </div>
            <div className="contact-page-divider"></div>
            
            <h2 className="contact-section-title">{t('contact.socialTitle')}</h2>
            
            <div className="contact-grid-container">
                {/* Gmail Card */}
                <a 
                    href="mailto:bmasatyaa@gmail.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="contact-card card-gmail"
                >
                    <div className="contact-watermark">
                        <SiGmail size={180} />
                    </div>
                    <div className="contact-card-content">
                        <h3>{t('contact.gmailTitle')}</h3>
                        <p>{t('contact.gmailSub')}</p>
                        <span className="contact-card-btn btn-gmail">
                            {t('contact.gmailBtn')} <span className="arrow">↗</span>
                        </span>
                    </div>
                    <div className="contact-card-icon">
                        <SiGmail size={72} />
                    </div>
                </a>

                {/* Instagram Card */}
                <a 
                    href="https://www.instagram.com/bmasatyaa/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="contact-card card-instagram"
                >
                    <div className="contact-watermark">
                        <SiInstagram size={160} />
                    </div>
                    <div className="contact-card-content">
                        <h3>{t('contact.igTitle')}</h3>
                        <p>{t('contact.igSub')}</p>
                        <span className="contact-card-btn btn-instagram">
                            {t('contact.igBtn')} <span className="arrow">↗</span>
                        </span>
                    </div>
                    <div className="contact-card-icon">
                        <SiInstagram size={64} />
                    </div>
                </a>

                {/* LinkedIn Card */}
                <a 
                    href="https://www.linkedin.com/in/bimasatya/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="contact-card card-linkedin"
                >
                    <div className="contact-watermark">
                        <FaLinkedin size={160} />
                    </div>
                    <div className="contact-card-content">
                        <h3>{t('contact.liTitle')}</h3>
                        <p>{t('contact.liSub')}</p>
                        <span className="contact-card-btn btn-linkedin">
                            {t('contact.liBtn')} <span className="arrow">↗</span>
                        </span>
                    </div>
                    <div className="contact-card-icon">
                        <FaLinkedin size={64} />
                    </div>
                </a>

                {/* Github Card */}
                <a 
                    href="https://github.com/BimaSatyaM" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="contact-card card-github"
                >
                    <div className="contact-watermark">
                        <SiGithub size={180} />
                    </div>
                    <div className="contact-card-content">
                        <h3>{t('contact.ghTitle')}</h3>
                        <p>{t('contact.ghSub')}</p>
                        <span className="contact-card-btn btn-github">
                            {t('contact.ghBtn')} <span className="arrow">↗</span>
                        </span>
                    </div>
                    <div className="contact-card-icon">
                        <SiGithub size={64} />
                    </div>
                </a>
            </div>

            {/* SEND ME A MESSAGE SECTION */}
            <div className="contact-form-section">
                <h2 className="contact-section-title">{t('contact.sendTitle')}</h2>
                <form id="contactForm" className="contact-form" onSubmit={handleContactSubmit}>
                    <div className="form-group">
                        <label>{t('contact.nameLabel')}</label>
                        <input
                            type="text"
                            id="name"
                            required
                            placeholder={t('contact.namePlaceholder')}
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('contact.emailLabel')}</label>
                        <input
                            type="email"
                            id="email"
                            required
                            placeholder={t('contact.emailPlaceholder')}
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('contact.msgLabel')}</label>
                        <textarea
                            id="message"
                            required
                            rows={5}
                            placeholder={t('contact.msgPlaceholder')}
                            value={formMessage}
                            onChange={(e) => setFormMessage(e.target.value)}
                        ></textarea>
                    </div>
                    <button type="submit" className="btn-primary" disabled={formStatus !== 'idle'}>
                        {formStatus === 'idle' && (
                            <>
                                <i className="fas fa-paper-plane"></i> {t('contact.sendBtn')}
                            </>
                        )}
                        {formStatus === 'sending' && (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> {t('contact.sendingBtn')}
                            </>
                        )}
                        {formStatus === 'sent' && (
                            <>
                                <i className="fas fa-check"></i> {t('contact.sentBtn')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </section>
    );
};
