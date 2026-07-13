// ===== src/pages/Contact.tsx =====
import React, { useState } from 'react';
import { SiGmail, SiInstagram, SiGithub } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa';

export const Contact: React.FC = () => {
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
                <h1>Contact</h1>
                <p>Let's get in touch.</p>
            </div>
            <div className="contact-page-divider"></div>
            
            <h2 className="contact-section-title">Find me on social media</h2>
            
            <div className="contact-grid-container">
                {/* Stay in Touch (Gmail) - Full Width */}
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
                        <h3>Stay in Touch</h3>
                        <p>Reach out via email for inquiries or collaborations.</p>
                        <span className="contact-card-btn btn-gmail">
                            Go to Gmail <span className="arrow">↗</span>
                        </span>
                    </div>
                    <div className="contact-card-icon">
                        <SiGmail size={72} />
                    </div>
                </a>

                {/* Follow My Journey (Instagram) */}
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
                        <h3>Follow My Journey</h3>
                        <p>Follow my creative journey.</p>
                        <span className="contact-card-btn btn-instagram">
                            Go to Instagram <span className="arrow">↗</span>
                        </span>
                    </div>
                    <div className="contact-card-icon">
                        <SiInstagram size={64} />
                    </div>
                </a>

                {/* Let's Connect (LinkedIn) */}
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
                        <h3>Let's Connect</h3>
                        <p>Connect with me professionally.</p>
                        <span className="contact-card-btn btn-linkedin">
                            Go to Linkedin <span className="arrow">↗</span>
                        </span>
                    </div>
                    <div className="contact-card-icon">
                        <FaLinkedin size={64} />
                    </div>
                </a>

                {/* Explore the Code (Github) - Full Width at bottom */}
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
                        <h3>Explore the Code</h3>
                        <p>Explore my open-source work.</p>
                        <span className="contact-card-btn btn-github">
                            Go to Github <span className="arrow">↗</span>
                        </span>
                    </div>
                    <div className="contact-card-icon">
                        <SiGithub size={64} />
                    </div>
                </a>
            </div>

            {/* SEND ME A MESSAGE SECTION */}
            <div className="contact-form-section">
                <h2 className="contact-section-title">Send me a message</h2>
                <form id="contactForm" className="contact-form" onSubmit={handleContactSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            id="name"
                            required
                            placeholder="Your name"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            id="email"
                            required
                            placeholder="your@email.com"
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            id="message"
                            required
                            rows={5}
                            placeholder="Your message..."
                            value={formMessage}
                            onChange={(e) => setFormMessage(e.target.value)}
                        ></textarea>
                    </div>
                    <button type="submit" className="btn-primary" disabled={formStatus !== 'idle'}>
                        {formStatus === 'idle' && (
                            <>
                                <i className="fas fa-paper-plane"></i> Send Message
                            </>
                        )}
                        {formStatus === 'sending' && (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Sending...
                            </>
                        )}
                        {formStatus === 'sent' && (
                            <>
                                <i className="fas fa-check"></i> Sent!
                            </>
                        )}
                    </button>
                </form>
            </div>
        </section>
    );
};
