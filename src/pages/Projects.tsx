import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PostForm } from '../components/PostForm';
import { PostList } from '../components/PostList';

export const Projects: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const [editingPost, setEditingPost] = useState<any | null>(null);

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
                <h2 className="about-title">Featured Projects</h2>
                <p className="about-subtitle">A showcase of recent creations shared by our community.</p>
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
