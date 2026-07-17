import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { getTechIcon } from '../constants/techStack';

interface Comment {
    id: string;
    userId: string;
    userDisplayName: string;
    userPhotoURL?: string;
    text: string;
    createdAt: number;
}

interface Post {
    id: string;
    title: string;
    description: string;
    techStack: string[];
    projectLink?: string;
    userId: string;
    userDisplayName: string;
    userPhotoURL?: string;
    createdAt: any;
    likes?: string[];
    comments?: Comment[];
    reactions?: Record<string, string[]>;
    type?: 'web' | 'mobile';
    category?: 'personal' | 'internship' | 'freelance' | 'lomba';
    imageUrl?: string;
    featured?: boolean;
}

interface PostListProps {
    limitCount?: number;
    onEditPost?: (post: Post) => void;
    showFilters?: boolean;
    layout?: 'grid' | 'slider';
}

export const PostList: React.FC<PostListProps> = ({ 
    limitCount, 
    onEditPost, 
    showFilters = true, 
    layout = 'grid' 
}) => {
    const { user, isAdmin } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ref for horizontal slider
    const sliderRef = useRef<HTMLDivElement>(null);
    const [scrollRatio, setScrollRatio] = useState({ left: 0, width: 0 });

    const handleScroll = () => {
        if (sliderRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
            if (scrollWidth > 0) {
                const widthPercent = (clientWidth / scrollWidth) * 100;
                const leftPercent = (scrollLeft / scrollWidth) * 100;
                setScrollRatio({ left: leftPercent, width: widthPercent });
            }
        }
    };

    // Scroll slider function
    const scrollSlider = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const scrollAmount = 370; // 350px card + 20px gap
            sliderRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        if (!loading && posts.length > 0) {
            const timer = setTimeout(handleScroll, 150);
            return () => clearTimeout(timer);
        }
    }, [loading, posts]);

    useEffect(() => {
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, []);

    // Filters state
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Track expanded comments section per post
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    // Track comment input values per post
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

    // Track which post has the emoji picker dropdown open
    const [activePickerPostId, setActivePickerPostId] = useState<string | null>(null);
    // Track which post & reaction element has the login tooltip active
    const [tooltipState, setTooltipState] = useState<{ postId: string; key: string } | null>(null);

    const pickerRef = useRef<HTMLDivElement>(null);
    const COMMON_EMOJIS = [
        '👍', '❤️', '🔥', '🚀', '💡', '🎉', '🤪', '🍉', '🌐', 
        '👏', '😂', '🥳', '😢', '😱', '😎', '🤔', '👀', '💯', 
        '✨', '⚡', '💻', '🎨', '🍕', '🍻', '👑', '👾', '🎮', 
        '💎', '🌍', '🐱', '🐶', '🍿', '☕', '🎂', '🎈', '🏁',
        '😊', '🤩', '😉', '😴', '😡', '😭', '🙄', '🤥', '🤫',
        '🤭', '🤯', '🤠'
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setActivePickerPostId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (tooltipState) {
            const timer = setTimeout(() => {
                setTooltipState(null);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [tooltipState]);

    const triggerLoginTooltip = (postId: string, key: string) => {
        setTooltipState({ postId, key });
    };

    useEffect(() => {
        const postsCollection = collection(db, 'posts');
        const q = query(postsCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts: Post[] = [];
            snapshot.forEach((docSnap) => {
                fetchedPosts.push({
                    id: docSnap.id,
                    ...docSnap.data()
                } as Post);
            });
            // Client-side sorting: Pinned (featured) projects go first, then sorted by createdAt
            fetchedPosts.sort((a, b) => {
                const aFeatured = a.featured ? 1 : 0;
                const bFeatured = b.featured ? 1 : 0;
                if (aFeatured !== bFeatured) {
                    return bFeatured - aFeatured; // Featured (1) before non-featured (0)
                }
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });
            
            // Apply optional limit count
            if (limitCount && limitCount > 0) {
                setPosts(fetchedPosts.slice(0, limitCount));
            } else {
                setPosts(fetchedPosts);
            }
            setLoading(false);
        }, (err) => {
            setError('Failed to fetch posts: ' + err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [limitCount]);

    const handleDelete = async (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this project post?')) {
            return;
        }

        try {
            const docRef = doc(db, 'posts', postId);
            await deleteDoc(docRef);
        } catch (err: any) {
            alert('Failed to delete post: ' + err.message);
        }
    };

    const handleReact = async (postId: string, emoji: string, currentReactions: Record<string, string[]> | undefined) => {
        if (!user) {
            triggerLoginTooltip(postId, emoji);
            return;
        }

        const postRef = doc(db, 'posts', postId);
        const reactions = { ...(currentReactions || {}) };
        const userList = reactions[emoji] ? [...reactions[emoji]] : [];
        
        const index = userList.indexOf(user.uid);
        if (index > -1) {
            userList.splice(index, 1);
        } else {
            userList.push(user.uid);
        }
        
        if (userList.length === 0) {
            delete reactions[emoji];
        } else {
            reactions[emoji] = userList;
        }

        try {
            await updateDoc(postRef, { reactions });
        } catch (err: any) {
            console.error('Error toggling reaction:', err);
        }
    };

    const handleAddComment = async (e: React.FormEvent, postId: string) => {
        e.preventDefault();
        if (!user) {
            alert('Please log in using the sidebar to write a comment.');
            return;
        }

        const commentText = commentInputs[postId] || '';
        if (!commentText.trim()) return;

        const postRef = doc(db, 'posts', postId);
        const newComment: Comment = {
            id: Math.random().toString(36).substring(2, 9),
            userId: user.uid,
            userDisplayName: user.displayName || 'Anonymous User',
            userPhotoURL: user.photoURL || undefined,
            text: commentText.trim(),
            createdAt: Date.now()
        };

        try {
            await updateDoc(postRef, {
                comments: arrayUnion(newComment)
            });
            // Reset input
            setCommentInputs((prev) => ({
                ...prev,
                [postId]: ''
            }));
        } catch (err: any) {
            console.error('Error adding comment:', err);
        }
    };

    const handleCommentInputChange = (postId: string, value: string) => {
        setCommentInputs((prev) => ({
            ...prev,
            [postId]: value
        }));
    };

    const handleDeleteComment = async (postId: string, commentToDelete: Comment) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                comments: arrayRemove(commentToDelete)
            });
        } catch (err: any) {
            alert('Failed to delete comment: ' + err.message);
        }
    };

    const toggleComments = (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        setExpandedComments((prev) => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const formatCommentDate = (timeNumber: number) => {
        const date = new Date(timeNumber);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Real-time local filtering
    const filteredPosts = posts.filter(post => {
        const typeMatches = selectedType === 'all' || (post.type && post.type.toLowerCase() === selectedType.toLowerCase());
        
        let categoryMatches = false;
        if (selectedCategory === 'all') {
            categoryMatches = true;
        } else {
            const mappedCat = selectedCategory === 'Personal Project' ? 'personal' : selectedCategory.toLowerCase();
            categoryMatches = !!(post.category && post.category.toLowerCase() === mappedCat);
        }
        
        return typeMatches && categoryMatches;
    });

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <i className="fas fa-spinner post-spinner" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
                <p>Loading project showcase...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="post-error-alert" style={{ margin: '20px 0' }}>
                <i className="fas fa-exclamation-circle"></i> {error}
            </div>
        );
    }

    const typeFilters = ['all', 'web', 'mobile'];
    const categoryFilters = ['all', 'Personal Project'];

    return (
        <div className="project-feed-wrapper">
            {/* FILTER PILLS */}
            {showFilters && (
                <>
                    <div className="project-filters-container">
                        <div className="filter-group">
                            <span className="filter-label">TYPE</span>
                            <div className="filter-pills">
                                {typeFilters.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                        className={`filter-pill-btn ${selectedType === type ? 'active' : ''}`}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group" style={{ marginTop: '12px' }}>
                            <span className="filter-label">CATEGORY</span>
                            <div className="filter-pills">
                                {categoryFilters.map(cat => {
                                    const isActive = selectedCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`filter-pill-btn ${isActive ? 'active' : ''}`}
                                        >
                                            {cat === 'all' ? 'All' : cat === 'Personal Project' ? 'Personal Project' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="about-divider" style={{ margin: '24px 0' }}></div>
                </>
            )}

            {filteredPosts.length === 0 ? (
                <div className="auth-notice-card" style={{ padding: '40px 20px', maxWidth: '100%' }}>
                    <i className="fas fa-folder-open auth-notice-icon" style={{ fontSize: '32px' }}></i>
                    <p>No projects match the selected filters.</p>
                </div>
            ) : (
                <div className={layout === 'slider' ? "slider-outer-wrapper" : ""}>
                    {layout === 'slider' && (
                        <button 
                            type="button"
                            className="slider-nav-btn left" 
                            onClick={() => scrollSlider('left')}
                            aria-label="Scroll left"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    )}

                    <div 
                        className={layout === 'slider' ? "projects-slider-layout" : "projects-grid-layout"}
                        ref={layout === 'slider' ? sliderRef : undefined}
                        onScroll={layout === 'slider' ? handleScroll : undefined}
                    >
                        {filteredPosts.map((post) => {
                        const postComments = post.comments || [];
                        const isCommentsOpen = expandedComments[post.id] || false;

                        return (
                            <div key={post.id} className="project-grid-card">
                                {/* Thumbnail Image Section */}
                                <div className="project-card-image-wrapper">
                                    {post.imageUrl ? (
                                        <img 
                                            src={post.imageUrl} 
                                            alt={post.title} 
                                            className="project-card-image" 
                                        />
                                    ) : (
                                        /* Placeholder Vector Mountain/Sun Illustration */
                                        <svg className="placeholder-svg-mockup" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="100%" height="100%" fill="#1a1a1a" />
                                            <circle cx="200" cy="90" r="26" fill="#2d2d2d" />
                                            <path d="M60 240 L180 130 L270 190 L340 150 L400 240 Z" fill="#242424" />
                                        </svg>
                                    )}

                                    {/* Featured Ribbon Badge */}
                                    {post.featured && (
                                        <span className="featured-ribbon-badge">
                                            <i className="fas fa-thumbtack"></i> Featured
                                        </span>
                                    )}
                                </div>

                                {/* Project Info Area */}
                                <div className="project-card-details">
                                    <div className="project-title-row">
                                        <h4>{post.title}</h4>

                                        {/* Admin action overlays */}
                                        {user && isAdmin && (
                                            <div className="card-admin-actions">
                                                {onEditPost && (
                                                    <button 
                                                        onClick={() => onEditPost(post)} 
                                                        className="card-admin-btn edit-btn"
                                                        title="Edit"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => handleDelete(e, post.id)} 
                                                    className="card-admin-btn delete-btn"
                                                    title="Delete"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <p className="project-card-desc">{post.description}</p>

                                    {/* Tech stack icons representation */}
                                    {post.techStack && post.techStack.length > 0 && (
                                        <div className="project-tech-icons-row">
                                            {post.techStack.map((tech) => {
                                                const info = getTechIcon(tech);
                                                if (info) {
                                                    return (
                                                        <span key={tech} className="tech-logo-icon" style={{ color: info.color }} title={tech}>
                                                            {info.icon}
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span key={tech} className="tech-logo-text" title={tech}>
                                                        {tech}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Card Footer Interactions Bar */}
                                    <div className="project-card-actions-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                                        {/* Render active reactions, sorted by count */}
                                        {Object.entries(post.reactions || {})
                                            .filter(([_, uids]) => uids && uids.length > 0)
                                            .sort((a, b) => b[1].length - a[1].length)
                                            .map(([emoji, uids]) => {
                                            const hasReacted = user && uids.includes(user.uid);
                                            const showTooltip = tooltipState && tooltipState.postId === post.id && tooltipState.key === emoji;

                                            return (
                                                <div key={emoji} style={{ position: 'relative', display: 'inline-block' }}>
                                                    {showTooltip && (
                                                        <div className="reaction-login-tooltip">
                                                            Please login first to react
                                                        </div>
                                                    )}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReact(post.id, emoji, post.reactions);
                                                        }} 
                                                        className={`reaction-pill-btn ${hasReacted ? 'active' : ''}`}
                                                    >
                                                        <span style={{ fontSize: '13px' }}>{emoji}</span> 
                                                        <span>{uids.length}</span>
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        {/* Add reaction picker button */}
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            {tooltipState && tooltipState.postId === post.id && tooltipState.key === 'add-btn' && (
                                                <div className="reaction-login-tooltip">
                                                    Please login first to react
                                                </div>
                                            )}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!user) {
                                                        triggerLoginTooltip(post.id, 'add-btn');
                                                        return;
                                                    }
                                                    setActivePickerPostId(activePickerPostId === post.id ? null : post.id);
                                                }}
                                                className="reaction-add-btn"
                                                title="Add reaction"
                                            >
                                                <i className="fas fa-plus" style={{ fontSize: '10px' }}></i>
                                            </button>
                                        </div>

                                        <button 
                                            onClick={(e) => toggleComments(e, post.id)} 
                                            className="reaction-pill-btn"
                                        >
                                            <i className="far fa-comment"></i> 
                                            <span>{postComments.length}</span>
                                        </button>

                                        {post.projectLink && (
                                            <a 
                                                href={post.projectLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="card-visit-link-btn"
                                            >
                                                <i className="fas fa-external-link-alt"></i> Visit Project
                                            </a>
                                        )}
                                    </div>

                                    {/* Inline Emoji Selector Drawer */}
                                    {activePickerPostId === post.id && (
                                        <div className="reaction-emoji-picker-inline" ref={pickerRef}>
                                            <div className="picker-inline-header">
                                                <span>Select Reaction</span>
                                                <button 
                                                    className="picker-inline-close-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActivePickerPostId(null);
                                                    }}
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                            <div className="picker-inline-grid">
                                                {COMMON_EMOJIS.map((emoji) => {
                                                    const uids = (post.reactions && post.reactions[emoji]) || [];
                                                    const hasReacted = user && uids.includes(user.uid);
                                                    return (
                                                        <button
                                                            key={emoji}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleReact(post.id, emoji, post.reactions);
                                                            }}
                                                            className={`picker-inline-emoji-btn ${hasReacted ? 'active' : ''}`}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Comments drawers in the card */}
                                    {isCommentsOpen && (
                                        <div className="post-comments-section" style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
                                            {postComments.length > 0 && (
                                                <div className="comments-list" style={{ maxHeight: '150px' }}>
                                                    {postComments.map((comment) => (
                                                        <div key={comment.id} className="comment-item">
                                                            <img 
                                                                src={comment.userPhotoURL || 'assets/foto.jpg'} 
                                                                alt={comment.userDisplayName} 
                                                                className="comment-avatar" 
                                                            />
                                                            <div className="comment-content">
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span className="comment-author">
                                                                        {comment.userDisplayName} 
                                                                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', marginLeft: '8px', fontWeight: '400' }}>
                                                                            {formatCommentDate(comment.createdAt)}
                                                                        </span>
                                                                    </span>
                                                                    {isAdmin && (
                                                                        <button
                                                                            onClick={() => handleDeleteComment(post.id, comment)}
                                                                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '10px', transition: 'color 0.2s ease', padding: '0 4px' }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                                                                            title="Delete Comment"
                                                                        >
                                                                            <i className="fas fa-trash-alt"></i>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <p className="comment-text">{comment.text}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {user ? (
                                                <form onSubmit={(e) => handleAddComment(e, post.id)} className="comment-form">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Write a comment..." 
                                                        value={commentInputs[post.id] || ''} 
                                                        onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                                                        className="comment-input"
                                                        maxLength={300}
                                                        required
                                                    />
                                                    <button type="submit" className="comment-send-btn">
                                                        <i className="fas fa-paper-plane"></i>
                                                    </button>
                                                </form>
                                            ) : (
                                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px' }}>
                                                    🔒 Please log in to leave a comment.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    </div>

                    {layout === 'slider' && (
                        <button 
                            type="button"
                            className="slider-nav-btn right" 
                            onClick={() => scrollSlider('right')}
                            aria-label="Scroll right"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}
                </div>
            )}

            {layout === 'slider' && posts.length > 0 && (
                <div className="slider-scrollbar-track">
                    <div 
                        className="slider-scrollbar-thumb" 
                        style={{ 
                            left: `${scrollRatio.left}%`, 
                            width: `${scrollRatio.width}%` 
                        }}
                    />
                </div>
            )}
        </div>
    );
};
