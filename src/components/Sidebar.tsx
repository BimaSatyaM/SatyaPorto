// ===== src/components/Sidebar.tsx =====
import React, { useState } from 'react';
import { Player } from './Player';
import { useAuth } from '../context/AuthContext';

// Import exact React Icons matching the reference image
import { GoHome, GoVerified } from 'react-icons/go';
import { FiUser, FiBox, FiArrowRight } from 'react-icons/fi';
import { LuLayoutGrid, LuBook } from 'react-icons/lu';


interface SidebarProps {
    activeSection: string;
    onNavigate: (section: string) => void;
    sidebarActive: boolean;
    setSidebarActive: (active: boolean) => void;
    onAvatarClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeSection,
    onNavigate,
    sidebarActive,
    setSidebarActive,
    onAvatarClick
}) => {
    const [lang, setLang] = useState<'EN' | 'ID'>('ID');
    const { user, loginWithGoogle, loginWithGitHub, logout } = useAuth();


    const menuItems = [
        { id: 'home', label: 'Home', icon: <GoHome size={20} /> },
        { id: 'about', label: 'About', icon: <FiUser size={20} /> },
        { id: 'projects', label: 'Projects', icon: <FiBox size={20} /> },
        { id: 'dashboard', label: 'Dashboard', icon: <LuLayoutGrid size={20} /> },
        { id: 'contact', label: 'Contact', icon: <LuBook size={20} /> }
    ];



    const handleItemClick = (id: string) => {
        onNavigate(id);
        if (window.innerWidth <= 768) {
            setSidebarActive(false);
        }
    };

    return (
        <aside className={`sidebar ${sidebarActive ? 'active' : ''}`}>
            {/* PROFILE/AVATAR SECTION */}
            <div className="sidebar-profile">
                <div className="sidebar-avatar" onClick={onAvatarClick}>
                    <img src="assets/foto.jpg" alt="Bima Satya Mahendra" />
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
                        onClick={() => setLang('ID')}
                        className={`lang-btn ${lang === 'ID' ? 'active' : ''}`}
                    >
                        ID
                    </button>
                    <button
                        className={`lang-btn ${lang === 'EN' ? 'active' : ''}`}
                        onClick={() => setLang('EN')}
                    >
                        EN
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
                            <i className="fab fa-google"></i> Login with Google
                        </button>
                        <button onClick={loginWithGitHub} className="auth-btn github-btn">
                            <i className="fab fa-github"></i> Login with GitHub
                        </button>
                    </div>
                ) : (
                    <div className="auth-user-info">
                        <img 
                            src={user.photoURL || 'assets/foto.jpg'} 
                            alt={user.displayName || 'User'} 
                            className="auth-user-avatar" 
                        />
                        <div className="auth-user-details">
                            <span className="auth-user-name" title={user.displayName || ''}>
                                {user.displayName || 'User'}
                            </span>
                            <button onClick={logout} className="auth-logout-btn">
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DIVIDER LINE */}
            <div className="sidebar-divider"></div>

            {/* COPYRIGHT */}
            <div className="sidebar-copyright">
                <p>COPYRIGHT © 2026</p>
                <p className="copyright-author">Bima Satya. All rights reserved.</p>
            </div>
        </aside>
    );
};
