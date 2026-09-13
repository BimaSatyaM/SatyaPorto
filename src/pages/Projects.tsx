import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PostForm } from '../components/PostForm';
import { PostList } from '../components/PostList';

export const Projects: React.FC = () => {
    const { t } = useLanguage();
    const { user, isAdmin } = useAuth();
    const [editingPost, setEditingPost] = useState<any | null>(null);

    React.useEffect(() => {
        const stored = sessionStorage.getItem('edit_project_data');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setEditingPost(parsed);
                sessionStorage.removeItem('edit_project_data');
                setTimeout(() => {
                    const mainContent = document.querySelector('.main-content');
                    if (mainContent) {
                        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }, 100);
            } catch (e) {
                console.error('Failed to parse edit_project_data:', e);
            }
        }
    }, []);

    const handleEditPost = (post: any) => {
        setEditingPost(post);
        // Scroll back to top where form is
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <section id="projects" className="section">
            <div className="about-header">
                <h2 className="about-title">{t('projects.title')}</h2>
                <p className="about-subtitle">{t('projects.subtitle')}</p>
            </div>
            <div className="about-divider"></div>

            {/* Render form if logged in as Admin */}
            {user && isAdmin && (
                <PostForm 
                    editData={editingPost} 
                    onCancelEdit={() => setEditingPost(null)} 
                />
            )}

            {/* Renders the grid list of project posts for all visitors */}
            <PostList onEditPost={handleEditPost} />
        </section>
    );
};
