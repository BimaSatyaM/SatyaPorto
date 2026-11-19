// ===== src/components/Sidebar.tsx =====
import React, { useEffect, useState } from 'react';
import { Player } from './Player';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Import exact React Icons matching the reference image
import { GoHome, GoVerified } from 'react-icons/go';
import { FiUser, FiBox, FiSun, FiMoon } from 'react-icons/fi';
import { LuLayoutGrid, LuBook, LuNewspaper } from 'react-icons/lu';


interface SidebarProps {
    sidebarActive: boolean;
    setSidebarActive: (active: boolean) => void;
    onAvatarClick: () => void;
}

type ThemeMode = 'dark' | 'light';

export const Sidebar: React.FC<SidebarProps> = ({
    sidebarActive,
    setSidebarActive,
    onAvatarClick
}) => {
    const { lang, setLang, t, activeSection, setActiveSection } = useLanguage();
    const { user, loginWithGoogle, loginWithGitHub, logout } = useAuth();
    const [theme, setTheme] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('themePreference');
        return saved === 'dark' ? 'dark' : 'light';
    });

    useEffect(() => {
        document.body.classList.toggle('light-theme', theme === 'light');
        localStorage.setItem('themePreference', theme);
    }, [theme]);


    const menuItems = [
        { id: 'home', label: t('nav.home'), icon: <GoHome size={20} aria-hidden="true" /> },
        { id: 'about', label: t('nav.about'), icon: <FiUser size={20} aria-hidden="true" /> },
        { id: 'projects', label: t('nav.projects'), icon: <FiBox size={20} aria-hidden="true" /> },
        { id: 'news', label: t('nav.news'), icon: <LuNewspaper size={20} aria-hidden="true" /> },
        { id: 'dashboard', label: t('nav.dashboard'), icon: <LuLayoutGrid size={20} aria-hidden="true" /> },
        { id: 'contact', label: t('nav.contact'), icon: <LuBook size={20} aria-hidden="true" /> }
    ];



    const handleItemClick = (id: string) => {
        setActiveSection(id);
        if (window.innerWidth <= 768) {
            setSidebarActive(false);
        }
    };

    return (
        <aside className={`sidebar ${sidebarActive ? 'active' : ''}`} aria-label="Sidebar navigation">
            <div className="sidebar-profile">
                <button
                    type="button"
                    className="sidebar-avatar"
                    onClick={onAvatarClick}
                    aria-label="View profile photo"
                >
                    <img src="/assets/foto.jpg" alt="Bima Satya Mahendra" width={90} height={90} />
                </button>
                <h3 className="sidebar-profile-name">
                    Bima Satya Mahendra <GoVerified className="verified-badge" aria-hidden="true" />
                </h3>
                <span className="sidebar-profile-username">@bmasatyaa</span>
            </div>

            <div className="sidebar-controls">
                <div className="lang-toggle-pill" role="group" aria-label="Language switcher">
                    <button
                        type="button"
                        onClick={() => setLang('EN')}
                        className={`lang-btn ${lang === 'EN' ? 'active' : ''}`}
                        aria-pressed={lang === 'EN'}
                    >
                        EN
                    </button>
                    <button
                        type="button"
                        className={`lang-btn ${lang === 'ID' ? 'active' : ''}`}
                        onClick={() => setLang('ID')}
                        aria-pressed={lang === 'ID'}
                    >
                        ID
                    </button>
                </div>

                <div className="theme-toggle-pill" role="group" aria-label="Theme switcher">
                    <button
                        type="button"
                        className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => setTheme('dark')}
                        aria-label="Dark theme"
                        aria-pressed={theme === 'dark'}
                        title="Dark mode"
                    >
                        <FiMoon size={13} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => setTheme('light')}
                        aria-label="Light theme"
                        aria-pressed={theme === 'light'}
                        title="Light mode"
                    >
                        <FiSun size={13} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="sidebar-divider"></div>

            <nav className="nav-menu" aria-label="Primary pages">
                {menuItems.map((item) => {
                    const isActive = activeSection === item.id;

                    return (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={(e) => {
                                e.preventDefault();
                                handleItemClick(item.id);
                            }}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            <span className="nav-item-label">{item.label}</span>
                        </a>
                    );
                })}
            </nav>


            <div className="sidebar-divider"></div>

            <div className="sidebar-player-wrapper">
                <Player />
            </div>

            <div className="sidebar-divider"></div>

            <div className="sidebar-auth">
                {!user ? (
                    <div className="auth-login-buttons">
                        <button type="button" onClick={loginWithGoogle} className="auth-btn google-btn">
                            <i className="fab fa-google" aria-hidden="true"></i> {t('sidebar.loginGoogle')}
                        </button>
                        <button type="button" onClick={loginWithGitHub} className="auth-btn github-btn">
                            <i className="fab fa-github" aria-hidden="true"></i> {t('sidebar.loginGitHub')}
                        </button>
                    </div>
                ) : (
                    <div className="auth-user-info">
                        <img
                            src={user.photoURL || '/assets/foto.jpg'}
                            alt={user.displayName || 'User'}
                            className="auth-user-avatar"
                            width={34}
                            height={34}
                        />
                        <div className="auth-user-details">
                            <span className="auth-user-name" title={user.displayName || ''}>
                                {user.displayName || 'User'}
                            </span>
                            <button type="button" onClick={logout} className="auth-logout-btn">
                                <i className="fas fa-sign-out-alt" aria-hidden="true"></i> {t('sidebar.logout')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="sidebar-divider"></div>

            <div className="sidebar-copyright">
                <p>{t('sidebar.copyright1')}</p>
                <p className="copyright-author">{t('sidebar.copyright2')}</p>
            </div>
        </aside>
    );
};
