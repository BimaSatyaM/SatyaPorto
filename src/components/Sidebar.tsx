// ===== src/components/Sidebar.tsx =====
import React from 'react';
import { Player } from './Player';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Import exact React Icons matching the reference image
import { GoHome, GoVerified } from 'react-icons/go';
import { FiUser, FiBox, FiArrowRight } from 'react-icons/fi';
import { LuLayoutGrid, LuBook, LuNewspaper } from 'react-icons/lu';


interface SidebarProps {
    sidebarActive: boolean;
    setSidebarActive: (active: boolean) => void;
    onAvatarClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    sidebarActive,
    setSidebarActive,
    onAvatarClick
}) => {
    const { lang, setLang, t, activeSection, setActiveSection } = useLanguage();
    const { user, loginWithGoogle, loginWithGitHub, logout } = useAuth();


    const menuItems = [
        { id: 'home', label: t('nav.home'), icon: <GoHome size={20} /> },
        { id: 'about', label: t('nav.about'), icon: <FiUser size={20} /> },
        { id: 'projects', label: t('nav.projects'), icon: <FiBox size={20} /> },
        { id: 'news', label: t('nav.news'), icon: <LuNewspaper size={20} /> },
        { id: 'dashboard', label: t('nav.dashboard'), icon: <LuLayoutGrid size={20} /> },
        { id: 'contact', label: t('nav.contact'), icon: <LuBook size={20} /> }
    ];



    const handleItemClick = (id: string) => {
        setActiveSection(id);
        if (window.innerWidth <= 768) {
            setSidebarActive(false);
        }
    };

    return (
        <aside className={`sidebar ${sidebarActive ? 'active' : ''}`}>
            {/* PROFILE/AVATAR SECTION */}
            <div className="sidebar-profile">
                <div className="sidebar-avatar" onClick={onAvatarClick}>
                    <img src="/assets/foto.jpg" alt="Bima Satya Mahendra" />
                </div>
                <h3 className="sidebar-profile-name">
                    Bima Satya Mahendra <GoVerified className="verified-badge" />
                </h3>
                <span className="sidebar-profile-username">@bmasatyaa</span>
            </div>

            {/* CONTROLS (LANGUAGE & THEME SEGMENTED SWITCHES) */}
            <div className="sidebar-controls">
                <div className="lang-toggle-pill">
                    {/* Language switch */}
                    <button
                        onClick={() => setLang('EN')}
                        className={`lang-btn ${lang === 'EN' ? 'active' : ''}`}
                    >
                        EN
                    </button>
                    <button
                        className={`lang-btn ${lang === 'ID' ? 'active' : ''}`}
                        onClick={() => setLang('ID')}
                    >
                        ID
                    </button>
                </div>
            </div>

            {/* DIVIDER LINE BELOW CONTROLS */}
            <div className="sidebar-divider"></div>

            {/* NAVIGATION MENU */}
            <nav className="nav-menu">
                {menuItems.map((item) => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleItemClick(item.id);
                        }}
                    >
                        <span className="nav-item-icon">{item.icon}</span>
                        <span className="nav-item-label">{item.label}</span>
                        {activeSection === item.id && (
                            <span className="nav-item-arrow">
                                <FiArrowRight size={14} />
                            </span>
                        )}
                    </a>
                ))}
            </nav>


            {/* DIVIDER LINE */}
            <div className="sidebar-divider"></div>

            {/* AUDIO PLAYER */}
            <div className="sidebar-player-wrapper">
                <Player />
            </div>

            {/* DIVIDER LINE */}
            <div className="sidebar-divider"></div>

            {/* USER AUTHENTICATION PANEL */}
            <div className="sidebar-auth">
                {!user ? (
                    <div className="auth-login-buttons">
                        <button onClick={loginWithGoogle} className="auth-btn google-btn">
                            <i className="fab fa-google"></i> {t('sidebar.loginGoogle')}
                        </button>
                        <button onClick={loginWithGitHub} className="auth-btn github-btn">
                            <i className="fab fa-github"></i> {t('sidebar.loginGitHub')}
                        </button>
                    </div>
                ) : (
                    <div className="auth-user-info">
                        <img
                            src={user.photoURL || '/assets/foto.jpg'}
                            alt={user.displayName || 'User'}
                            className="auth-user-avatar"
                        />
                        <div className="auth-user-details">
                            <span className="auth-user-name" title={user.displayName || ''}>
                                {user.displayName || 'User'}
                            </span>
                            <button onClick={logout} className="auth-logout-btn">
                                <i className="fas fa-sign-out-alt"></i> {t('sidebar.logout')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DIVIDER LINE */}
            <div className="sidebar-divider"></div>

            {/* COPYRIGHT */}
            <div className="sidebar-copyright">
                <p>{t('sidebar.copyright1')}</p>
                <p className="copyright-author">{t('sidebar.copyright2')}</p>
            </div>
        </aside>
    );
};
