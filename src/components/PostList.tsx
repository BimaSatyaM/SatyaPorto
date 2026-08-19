import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getTechIcon } from '../constants/techStack';
import { ImageModal } from './ImageModal';

interface Comment {
    id: string;
    userId: string;
    userDisplayName: string;
    userPhotoURL?: string;
    text: string;
    imageUrl?: string;
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
    imageUrls?: string[];
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
    const { t } = useLanguage();
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

    // Multi-photo slider and modal state
    const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
    const [previewModal, setPreviewModal] = useState<{ images: string[]; initialIndex: number } | null>(null);

    // Track expanded comments section per post
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    // Track comment input values per post
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    // Track comment attached image per post
    const [commentImages, setCommentImages] = useState<Record<string, string>>({});
    const [commentUploading, setCommentUploading] = useState<Record<string, boolean>>({});

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

    const compressCommentImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
                        resolve(compressedBase64);
                    } else {
                        resolve(event.target?.result as string);
                    }
                };
                img.onerror = (err) => reject(err);
                img.src = event.target?.result as string;
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleCommentPaste = async (e: React.ClipboardEvent, postId: string) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    e.preventDefault();
                    setCommentUploading(prev => ({ ...prev, [postId]: true }));
                    try {
                        const base64 = await compressCommentImage(file);
                        setCommentImages(prev => ({ ...prev, [postId]: base64 }));
                    } catch (err) {
                        console.error('Failed to process pasted image:', err);
                    } finally {
                        setCommentUploading(prev => ({ ...prev, [postId]: false }));
                    }
                    break;
                }
            }
        }
    };

    const handleCommentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, postId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCommentUploading(prev => ({ ...prev, [postId]: true }));
        try {
            const base64 = await compressCommentImage(file);
            setCommentImages(prev => ({ ...prev, [postId]: base64 }));
        } catch (err) {
            console.error('Failed to process selected image:', err);
        } finally {
            setCommentUploading(prev => ({ ...prev, [postId]: false }));
        }
        e.target.value = '';
    };

    const handleAddComment = async (e: React.FormEvent, postId: string) => {
        e.preventDefault();
        if (!user) {
            alert('Please log in using the sidebar to write a comment.');
            return;
        }

        const commentText = commentInputs[postId] || '';
        const attachedImage = commentImages[postId] || undefined;
        if (!commentText.trim() && !attachedImage) return;

        const postRef = doc(db, 'posts', postId);
        const newComment: Comment = {
            id: Math.random().toString(36).substring(2, 9),
            userId: user.uid,
            userDisplayName: user.displayName || 'Anonymous User',
            userPhotoURL: user.photoURL || undefined,
            text: commentText.trim(),
            imageUrl: attachedImage,
            createdAt: Date.now()
        };

        try {
            await updateDoc(postRef, {
                comments: arrayUnion(newComment)
            });
            // Reset input and attached image
            setCommentInputs((prev) => ({
                ...prev,
                [postId]: ''
            }));
            setCommentImages((prev) => ({
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
        const skeletonCards = [1, 2, 3];
        return (
            <div className="project-feed-wrapper">
                {showFilters && (
                    <div className="project-filters-container">
                        <div className="filter-group">
                            <span className="filter-label">TYPE</span>
                            <div className="filter-pills">
                                <div className="skeleton-pill shimmer"></div>
                                <div className="skeleton-pill shimmer"></div>
                                <div className="skeleton-pill shimmer"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div className={layout === 'slider' ? "projects-slider-layout" : "projects-grid-layout"}>
                    {skeletonCards.map((num) => (
                        <div key={num} className="project-grid-card skeleton-card">
                            <div className="skeleton-image shimmer"></div>
                            <div className="project-card-details">
                                <div className="skeleton-title shimmer"></div>
                                <div className="skeleton-text shimmer"></div>
                                <div className="skeleton-text short shimmer"></div>
                                <div className="skeleton-tech-row">
                                    <div className="skeleton-tech-icon shimmer"></div>
                                    <div className="skeleton-tech-icon shimmer"></div>
                                    <div className="skeleton-tech-icon shimmer"></div>
                                </div>
                                <div className="skeleton-actions-row">
                                    <div className="skeleton-action-btn shimmer"></div>
                                    <div className="skeleton-action-btn shimmer"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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

                        const postImages: string[] = (post.imageUrls && post.imageUrls.length > 0)
                            ? post.imageUrls
                            : (post.imageUrl ? [post.imageUrl] : []);
                        const activeIdx = activeImageIndices[post.id] || 0;
                        const safeIdx = Math.min(activeIdx, Math.max(0, postImages.length - 1));
                        const currentImg = postImages[safeIdx];
                        const isMultiple = postImages.length > 1;

                        const handlePrevImage = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setActiveImageIndices(prev => ({
                                ...prev,
                                [post.id]: (safeIdx > 0 ? safeIdx - 1 : postImages.length - 1)
                            }));
                        };

                        const handleNextImage = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setActiveImageIndices(prev => ({
                                ...prev,
                                [post.id]: (safeIdx < postImages.length - 1 ? safeIdx + 1 : 0)
                            }));
                        };

                        return (
                            <div key={post.id} className="project-grid-card">
                                {/* Thumbnail Image Section */}
                                <div 
                                    className={`project-card-image-wrapper ${isMultiple ? 'photo-pile-container' : ''}`}
                                    onClick={() => {
                                        if (postImages.length > 0) {
                                            setPreviewModal({ images: postImages, initialIndex: safeIdx });
                                        }
                                    }}
                                    style={{ cursor: postImages.length > 0 ? 'pointer' : 'default' }}
                                >
                                    {/* Visual stacked layers behind for realistic photo pile effect */}
                                    {isMultiple && (
                                        <>
                                            <div className="photo-pile-layer layer-2" />
                                            <div className="photo-pile-layer layer-1" />
                                        </>
                                    )}

                                    {postImages.length > 0 ? (
                                        <img 
                                            key={`${post.id}-${safeIdx}`}
                                            src={currentImg} 
                                            alt={`${post.title} - ${safeIdx + 1}`} 
                                            className="project-card-image photo-fade-in" 
                                        />
                                    ) : (
                                        <div className="project-card-placeholder">
                                            <div className="placeholder-content">
                                                <div className="placeholder-icon-animate">
                                                    <i className="fas fa-laptop-code"></i>
                                                </div>
                                                <span className="placeholder-text">{t('projects.stillOnDevelopment')}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Featured Ribbon Badge */}
                                    {post.featured && (
                                        <span className="featured-ribbon-badge">
                                            <i className="fas fa-thumbtack"></i> Featured
                                        </span>
                                    )}

                                    {/* Multi-Photo Pile Count Badge */}
                                    {isMultiple && (
                                        <span className="photo-pile-badge" title={`${postImages.length} photos in this post`}>
                                            <i className="fas fa-images"></i> {safeIdx + 1}/{postImages.length}
                                        </span>
                                    )}

                                    {/* Prev / Next Navigation Buttons */}
                                    {isMultiple && (
                                        <>
                                            <button 
                                                type="button"
                                                className="photo-pile-nav-btn prev"
                                                onClick={handlePrevImage}
                                                aria-label="Previous photo"
                                                title="Previous photo"
                                            >
                                                <i className="fas fa-chevron-left"></i>
                                            </button>
                                            <button 
                                                type="button"
                                                className="photo-pile-nav-btn next"
                                                onClick={handleNextImage}
                                                aria-label="Next photo"
                                                title="Next photo"
                                            >
                                                <i className="fas fa-chevron-right"></i>
                                            </button>

                                            {/* Bottom mini indicator dots */}
                                            <div className="photo-pile-dots-container">
                                                {postImages.map((_, dotIdx) => (
                                                    <span 
                                                        key={dotIdx} 
                                                        className={`photo-pile-dot ${dotIdx === safeIdx ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImageIndices(prev => ({ ...prev, [post.id]: dotIdx }));
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </>
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
                                                            {t('projects.loginReact')}
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
                                                    {t('projects.loginReact')}
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
                                                <i className="fas fa-external-link-alt"></i> {t('projects.visit')}
                                            </a>
                                        )}
                                    </div>

                                    {/* Inline Emoji Selector Drawer */}
                                    {activePickerPostId === post.id && (
                                        <div className="reaction-emoji-picker-inline" ref={pickerRef}>
                                            <div className="picker-inline-header">
                                                <span>{t('projects.selectReaction')}</span>
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
                                                                src={comment.userPhotoURL || '/assets/foto.jpg'} 
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
                                                                {comment.text && <p className="comment-text">{comment.text}</p>}
                                                                {comment.imageUrl && (
                                                                    <div 
                                                                        className="comment-attached-img-container"
                                                                        onClick={() => setPreviewModal({ images: [comment.imageUrl!], initialIndex: 0 })}
                                                                        title="Click to view full photo"
                                                                    >
                                                                        <img src={comment.imageUrl} alt="Attached photo" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {user ? (
                                                <form onSubmit={(e) => handleAddComment(e, post.id)} className="comment-form">
                                                    {/* Attached Image Thumbnail Preview */}
                                                    {commentImages[post.id] && (
                                                        <div className="comment-preview-attached-box">
                                                            <img src={commentImages[post.id]} alt="Attachment Preview" />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setCommentImages(prev => ({ ...prev, [post.id]: '' }))}
                                                                className="comment-preview-remove-btn"
                                                                title="Remove attached photo"
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="comment-input-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                                                        <label 
                                                            className="comment-attach-btn" 
                                                            title="Attach or Paste (Ctrl+V) a photo"
                                                        >
                                                            <i className="fas fa-camera"></i>
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={(e) => handleCommentFileSelect(e, post.id)} 
                                                                style={{ display: 'none' }} 
                                                            />
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            placeholder={t('projects.writeComment')} 
                                                            value={commentInputs[post.id] || ''} 
                                                            onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                                                            onPaste={(e) => handleCommentPaste(e, post.id)}
                                                            className="comment-input"
                                                            maxLength={300}
                                                        />
                                                        <button 
                                                            type="submit" 
                                                            className="comment-send-btn"
                                                            disabled={commentUploading[post.id]}
                                                        >
                                                            {commentUploading[post.id] ? (
                                                                <i className="fas fa-spinner post-spinner"></i>
                                                            ) : (
                                                                <i className="fas fa-paper-plane"></i>
                                                            )}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px' }}>
                                                    🔒 {t('projects.loginComment')}
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

            {/* FULLSCREEN MULTI-IMAGE VIEWER MODAL */}
            {previewModal && (
                <ImageModal
                    isOpen={true}
                    images={previewModal.images}
                    initialIndex={previewModal.initialIndex}
                    onClose={() => setPreviewModal(null)}
                />
            )}
        </div>
    );
};
