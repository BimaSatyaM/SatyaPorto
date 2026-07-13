// ===== src/App.tsx =====
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { DetailView } from './components/DetailView';
import { ImageModal } from './components/ImageModal';
import { AudioProvider, useAudio } from './context/AudioContext';

// Import dedicated page components
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import { Contact } from './pages/Contact';

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



    const mainContentRef = useRef<HTMLDivElement | null>(null);

    // Dynamic Navigation helper exposed to window for embedded HTML onclick support
    useEffect(() => {
        window.goTo = (secId: string) => {
            setDetailPageKey(null);
            setActiveSection(secId);
        };
        return () => {
            delete window.goTo;
        };
    }, []);

    // Scroll container to top when page changes or details view changes
    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
    }, [activeSection, detailPageKey]);

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
    };

    const openDetailPage = (key: string) => {
        setDetailPageKey(key);
    };

    const handleBack = () => {
        if (detailPageKey) {
            setDetailPageKey(null);
            setActiveSection('about');
        }
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
                            {activeSection === 'home' && <Home />}
                            {activeSection === 'about' && <About openDetailPage={openDetailPage} />}
                            {activeSection === 'projects' && <Projects playTrack={playTrack} />}
                            {activeSection === 'contact' && <Contact />}
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
        </div>
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
