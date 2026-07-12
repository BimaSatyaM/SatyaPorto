// ===== src/App.tsx =====
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { DetailView } from './components/DetailView';
import { ImageModal } from './components/ImageModal';
import { AudioProvider, useAudio } from './context/AudioContext';

const projects = [
    { title: 'E-Commerce', tech: 'React & Node.js', icon: 'fas fa-shopping-cart', gradient: 'linear-gradient(135deg,#1DB954,#0a7a30)' },
    { title: 'Blog CMS', tech: 'Full-stack blog platform', icon: 'fas fa-blog', gradient: 'linear-gradient(135deg,#ff6b6b,#ee5253)' },
    { title: 'Task Manager', tech: 'Productivity app', icon: 'fas fa-tasks', gradient: 'linear-gradient(135deg,#4834d4,#686de0)' },
    { title: 'Weather App', tech: 'Real-time forecast', icon: 'fas fa-cloud-sun', gradient: 'linear-gradient(135deg,#f39c12,#e67e22)' },
    { title: 'Restaurant', tech: 'Landing page & booking', icon: 'fas fa-utensils', gradient: 'linear-gradient(135deg,#1abc9c,#16a085)' },
    { title: 'Game Hub', tech: 'Gaming community', icon: 'fas fa-gamepad', gradient: 'linear-gradient(135deg,#9b59b6,#8e44ad)' }
];

const PortfolioContent: React.FC = () => {
    const { playTrack } = useAudio();

    // UI and Navigation State
    const [activeSection, setActiveSection] = useState('home');
    const [detailPageKey, setDetailPageKey] = useState<string | null>(null);

    // Toast Notification State
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Sidebar Mobile Toggle State
    const [sidebarActive, setSidebarActive] = useState(false);

    // Profile Modal State
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    // Contact Form State
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const mainContentRef = useRef<HTMLDivElement | null>(null);

    // Dynamic Navigation helper exposed to window for embedded HTML onclick support
    useEffect(() => {
        window.goTo = (secId: string) => {
            setDetailPageKey(null);
            setTimeout(() => {
                const el = document.getElementById(secId);
                if (el && mainContentRef.current) {
                    mainContentRef.current.scrollTo({
                        top: el.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        };
        return () => {
            delete window.goTo;
        };
    }, []);

    // Scroll listener to update active sidebar menu item
    useEffect(() => {
        const mc = mainContentRef.current;
        if (!mc || detailPageKey) return;

        const handleScroll = () => {
            const sections = ['home', 'about', 'projects', 'contact'];
            let current = 'home';
            for (const id of sections) {
                const el = document.getElementById(id);
                if (el && mc.scrollTop >= el.offsetTop - 150) {
                    current = id;
                }
            }
            setActiveSection(current);
        };

        mc.addEventListener('scroll', handleScroll);
        return () => mc.removeEventListener('scroll', handleScroll);
    }, [detailPageKey]);

    const navigateTo = (secId: string) => {
        if (['dashboard'].includes(secId)) {
            setActiveSection(secId);
            setDetailPageKey(null);
            setToastMessage(`🤖 ${secId.replace('-', ' ').toUpperCase()} features are coming soon!`);
            setTimeout(() => setToastMessage(null), 3000);
            return;
        }

        setDetailPageKey(null);
        setActiveSection(secId);
        setTimeout(() => {
            const el = document.getElementById(secId);
            if (el && mainContentRef.current) {
                mainContentRef.current.scrollTo({
                    top: el.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        }, 50);
    };

    const openDetailPage = (key: string) => {
        setDetailPageKey(key);
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (detailPageKey) {
            setDetailPageKey(null);
            setActiveSection('about');
            setTimeout(() => {
                const el = document.getElementById('about');
                if (el && mainContentRef.current) {
                    mainContentRef.current.scrollTo({
                        top: el.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }, 50);
        }
    };

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
        <div className="app">
            {/* SIDEBAR - NOW INTEGRATES THE AUDIO PLAYER & PROFILE */}
            <Sidebar
                activeSection={activeSection}
                onNavigate={navigateTo}
                sidebarActive={sidebarActive}
                setSidebarActive={setSidebarActive}
                onAvatarClick={() => setIsAvatarModalOpen(true)}
            />


            {/* MOBILE MENU TOGGLE BUTTON (Floats on mobile top-left) */}
            <button
                className="menu-toggle"
                id="menuToggle"
                onClick={(e) => {
                    e.stopPropagation();
                    setSidebarActive(prev => !prev);
                }}>
                <i className="fas fa-bars"></i>
            </button>

            {/* MAIN PANEL */}
            <main className="main-content" ref={mainContentRef}>
                <div className="content-wrapper" onClick={() => {
                    if (sidebarActive) setSidebarActive(false);
                }}>
                    {detailPageKey ? (
                        <DetailView
                            pageKey={detailPageKey}
                            onBack={handleBack}
                        />
                    ) : (
                        <div id="mainView">
                            {/* HOME SECTION */}
                            <section id="home" className="section hero">
                                <div className="hero-bg"></div>
                                <div className="hero-content">
                                    <span className="hero-tag">
                                        <i className="fas fa-check-circle"></i>Developer
                                    </span>
                                    <h4>Profile</h4>
                                    <h1>Bima Satya M.</h1>
                                    <p className="hero-description">
                                        <span className="highlight">Informatics Student</span> • Based in Indonesia
                                    </p>
                                    <p className="hero-sub">
                                        Hello I'm <b>Bima Satya Mahendra</b> From{' '}
                                        <a href="https://itera.ac.id" target="_blank" rel="noreferrer">
                                            <b>Sumatra Institute Of Technology</b>
                                        </a>{' '}
                                        and im currently studying there in{' '}
                                        <b>Industrial Technology Faculty, Departement of Informatics Engineering.</b>{' '}
                                        Right now Im focusing on studying about Machine Learning and Web Development.
                                    </p>
                                </div>
                            </section>

                            {/* ABOUT SECTION */}
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

                            {/* PROJECTS SECTION */}
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

                            {/* CONTACT SECTION */}
                            <section id="contact" className="section">
                                <div className="section-header">
                                    <h2>Get In Touch</h2>
                                </div>
                                <div className="contact-wrapper">
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
                                    <div className="social-links">
                                        <h3>Follow Me</h3>
                                        <div className="socials">
                                            <a href="https://github.com/BimaSatyaM" target="_blank" rel="noreferrer" title="GitHub">
                                                <i className="fab fa-github"></i>
                                            </a>
                                            <a href="https://www.linkedin.com/in/bimasatya/" target="_blank" rel="noreferrer" title="LinkedIn">
                                                <i className="fab fa-linkedin"></i>
                                            </a>
                                            <a href="https://www.instagram.com/bmasatyaa/" target="_blank" rel="noreferrer" title="Instagram">
                                                <i className="fab fa-instagram"></i>
                                            </a>
                                            <a href="https://twitter.com/yourusername" target="_blank" rel="noreferrer" title="Twitter">
                                                <i className="fab fa-twitter"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>

            {/* FULLIMAGE AVATAR MODAL */}
            <ImageModal
                isOpen={isAvatarModalOpen}
                imageSrc="assets/foto.jpg"
                onClose={() => setIsAvatarModalOpen(false)}
            />

            {/* SPOTIFY-STYLE TOAST */}
            {
                toastMessage && (
                    <div className="spotify-toast">
                        {toastMessage}
                    </div>
                )
            }
        </div >
    );
};

export default function App() {
    return (
        <AudioProvider>
            <PortfolioContent />
        </AudioProvider>
    );
}

// Add global goTo type interface
declare global {
    interface Window {
        goTo?: (secId: string) => void;
    }
}
