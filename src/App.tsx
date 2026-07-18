// ===== src/App.tsx =====
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageModal } from './components/ImageModal';
import { AudioProvider } from './context/AudioContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

// Import pages lazily for code-splitting (download on-demand)
const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const About = React.lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Projects = React.lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const Contact = React.lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));

// Shimmer page skeleton loader component
const PageSkeleton: React.FC = () => (
    <div className="section" style={{ maxWidth: '760px', margin: '0 auto', width: '100%', padding: '40px 20px' }}>
        <div style={{ marginBottom: '24px' }}>
            <div className="shimmer" style={{ width: '40%', height: '36px', background: '#242424', borderRadius: '4px', marginBottom: '8px' }}></div>
            <div className="shimmer" style={{ width: '70%', height: '18px', background: '#1f1f1f', borderRadius: '4px' }}></div>
        </div>
        <div className="about-divider" style={{ margin: '20px 0' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            <div className="project-card skeleton-card shimmer" style={{ padding: '20px', borderRadius: '12px', background: '#111111', height: '280px' }}>
                <div className="skeleton-title shimmer"></div>
                <div className="skeleton-text shimmer"></div>
                <div className="skeleton-text shimmer"></div>
                <div className="skeleton-text short shimmer"></div>
                <div className="skeleton-tech-row">
                    <div className="skeleton-tech-icon shimmer"></div>
                    <div className="skeleton-tech-icon shimmer"></div>
                    <div className="skeleton-tech-icon shimmer"></div>
                </div>
            </div>
            <div className="project-card skeleton-card shimmer" style={{ padding: '20px', borderRadius: '12px', background: '#111111', height: '280px' }}>
                <div className="skeleton-title shimmer"></div>
                <div className="skeleton-text shimmer"></div>
                <div className="skeleton-text shimmer"></div>
                <div className="skeleton-text short shimmer"></div>
                <div className="skeleton-tech-row">
                    <div className="skeleton-tech-icon shimmer"></div>
                    <div className="skeleton-tech-icon shimmer"></div>
                    <div className="skeleton-tech-icon shimmer"></div>
                </div>
            </div>
        </div>
    </div>
);

const PortfolioContent: React.FC = () => {
    const { activeSection, setActiveSection } = useLanguage();

    // Sidebar Mobile Toggle State
    const [sidebarActive, setSidebarActive] = useState(false);

    // Profile Modal State
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const mainContentRef = useRef<HTMLDivElement | null>(null);

    // Dynamic Navigation helper exposed to window for embedded HTML onclick support
    useEffect(() => {
        window.goTo = (secId: string) => {
            setActiveSection(secId);
        };
        return () => {
            delete window.goTo;
        };
    }, [setActiveSection]);

    // Scroll container to top when page changes
    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
    }, [activeSection]);

    return (
        <div className="app">
            {/* SIDEBAR - NOW INTEGRATES THE AUDIO PLAYER & PROFILE */}
            <Sidebar
                sidebarActive={sidebarActive}
                setSidebarActive={setSidebarActive}
                onAvatarClick={() => setIsAvatarModalOpen(true)}
            />

            {/* Mobile Sidebar Hamburger Toggle Header */}
            <button 
                type="button"
                className="menu-toggle" 
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
                    <div id="mainView">
                        <React.Suspense fallback={<PageSkeleton />}>
                            {activeSection === 'home' && <Home />}
                            {activeSection === 'about' && <About />}
                            {activeSection === 'projects' && <Projects />}
                            {activeSection === 'contact' && <Contact />}
                            {activeSection === 'dashboard' && <Dashboard />}
                        </React.Suspense>
                    </div>
                </div>
            </main>

            {/* FULLIMAGE AVATAR MODAL */}
            <ImageModal
                isOpen={isAvatarModalOpen}
                imageSrc="/assets/foto.jpg"
                onClose={() => setIsAvatarModalOpen(false)}
            />
        </div>
    );
};

export default function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <AudioProvider>
                    <PortfolioContent />
                </AudioProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

// Add global goTo type interface
declare global {
    interface Window {
        goTo?: (secId: string) => void;
    }
}
