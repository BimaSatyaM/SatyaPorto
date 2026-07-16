// ===== src/App.tsx =====
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageModal } from './components/ImageModal';
import { AudioProvider, useAudio } from './context/AudioContext';
import { AuthProvider } from './context/AuthContext';

// Import dedicated page components
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import { Contact } from './pages/Contact';
import { Dashboard } from './pages/Dashboard';

const PortfolioContent: React.FC = () => {
    const { playTrack } = useAudio();

    // UI and Navigation State
    const [activeSection, setActiveSection] = useState('home');



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
    }, []);

    // Scroll container to top when page changes
    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
    }, [activeSection]);

    const navigateTo = (secId: string) => {
        setActiveSection(secId);
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
                    <div id="mainView">
                        {activeSection === 'home' && <Home />}
                        {activeSection === 'about' && <About />}
                        {activeSection === 'projects' && <Projects playTrack={playTrack} />}
                        {activeSection === 'contact' && <Contact />}
                        {activeSection === 'dashboard' && <Dashboard />}
                    </div>
                </div>
            </main>

            {/* FULLIMAGE AVATAR MODAL */}
            <ImageModal
                isOpen={isAvatarModalOpen}
                imageSrc="assets/foto.jpg"
                onClose={() => setIsAvatarModalOpen(false)}
            />


        </div>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <AudioProvider>
                <PortfolioContent />
            </AudioProvider>
        </AuthProvider>
    );
}

// Add global goTo type interface
declare global {
    interface Window {
        goTo?: (secId: string) => void;
    }
}
