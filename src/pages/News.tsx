import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ImageModal } from '../components/ImageModal';
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    updateDoc,
    serverTimestamp,
    query,
    orderBy 
} from 'firebase/firestore';

interface NewsMessage {
    id: string;
    text: string;
    createdAt: any;
    userDisplayName?: string;
    userPhotoURL?: string;
    userId?: string;
    fileUrl?: string;
    fileUrls?: string[];
    fileName?: string;
    fileType?: 'image' | 'file';
    reactions?: Record<string, string[]>;
}

export const News: React.FC = () => {
    const { t } = useLanguage();
    const { user, isAdmin } = useAuth();
    const [messages, setMessages] = useState<NewsMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    
    // Multi-photo state for attachments
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    
    // Multi-photo carousel & fullscreen modal state
    const [activePhotoIndices, setActivePhotoIndices] = useState<Record<string, number>>({});
    const [previewModal, setPreviewModal] = useState<{ images: string[]; initialIndex: number } | null>(null);

    const [activePickerMsgId, setActivePickerMsgId] = useState<string | null>(null);
    const [tooltipState, setTooltipState] = useState<{ msgId: string; key: string } | null>(null);

    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const lastPasteTimestampRef = useRef<number>(0);

    const COMMON_EMOJIS = [
        '👍', '❤️', '🔥', '🚀', '💡', '🎉', '🤪', '🍉', '🌐', 
        '👏', '😂', '🥳', '😢', '😱', '😎', '🤔', '👀', '💯', 
        '✨', '⚡', '💻', '🎨', '🍕', '🍻', '👑', '👾', '🎮', 
        '💎', '🌍', '🐱', '🐶', '🍿', '☕', '🎂', '🎈', '🏁',
        '😊', '🤩', '😉', '😴', '😡', '😭', '🙄', '🤥', '🤫',
        '🤭', '🤯', '🤠'
    ];

    // Click outside listener for picker dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setActivePickerMsgId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Tooltip timer
    useEffect(() => {
        if (tooltipState) {
            const timer = setTimeout(() => {
                setTooltipState(null);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [tooltipState]);

    const triggerLoginTooltip = (msgId: string, key: string) => {
        setTooltipState({ msgId, key });
    };

    // Fetch messages in real-time chronologically (ascending order)
    useEffect(() => {
        const newsCollection = collection(db, 'news');
        const q = query(newsCollection, orderBy('createdAt', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: NewsMessage[] = [];
            snapshot.forEach(docSnap => {
                fetched.push({
                    id: docSnap.id,
                    ...docSnap.data()
                } as NewsMessage);
            });
            setMessages(fetched);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching chat news:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Scroll to bottom on load/update
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Clean up preview object URLs when component unmounts
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    const isImageFile = (f: File): boolean => {
        if (f.type && f.type.startsWith('image/')) return true;
        const ext = f.name.split('.').pop()?.toLowerCase();
        const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'heic', 'heif', 'bmp'];
        return !!ext && imageExtensions.includes(ext);
    };

    const compressAndConvertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 900;
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

    // Handle file selection (multi-file)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !user || !isAdmin) return;

        const validImageFiles = files.filter(isImageFile);
        if (validImageFiles.length === 0) {
            alert('Only image files are allowed.');
            return;
        }

        const newPreviews = validImageFiles.map(f => URL.createObjectURL(f));
        setSelectedFiles(prev => [...prev, ...validImageFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviews]);
        e.target.value = '';
    };

    // Handle pasting image from clipboard (Ctrl+V)
    const handlePaste = (e: React.ClipboardEvent | ClipboardEvent) => {
        if (!user || !isAdmin) return;

        // Prevent duplicate firing within 250ms
        const now = Date.now();
        if (now - lastPasteTimestampRef.current < 250) {
            return;
        }
        lastPasteTimestampRef.current = now;

        const items = e.clipboardData?.items;
        if (!items) return;

        const newPastedFiles: File[] = [];
        const seenSizes = new Set<number>();

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type && item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file && file.size > 0 && !seenSizes.has(file.size)) {
                    seenSizes.add(file.size);
                    newPastedFiles.push(file);
                }
            }
        }

        if (newPastedFiles.length > 0) {
            e.preventDefault();
            const newPreviews = newPastedFiles.map(f => URL.createObjectURL(f));
            setSelectedFiles(prev => [...prev, ...newPastedFiles]);
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    // Listen for global Ctrl+V pasting anywhere on the Announcement Channel
    useEffect(() => {
        const onGlobalPaste = (e: ClipboardEvent) => {
            if (!user || !isAdmin) return;
            handlePaste(e);
        };
        window.addEventListener('paste', onGlobalPaste);
        return () => window.removeEventListener('paste', onGlobalPaste);
    }, [user, isAdmin]);

    // Remove single attached file
    const handleRemoveFile = (indexToRemove: number) => {
        setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
        setPreviewUrls(prev => {
            if (prev[indexToRemove]) URL.revokeObjectURL(prev[indexToRemove]);
            return prev.filter((_, idx) => idx !== indexToRemove);
        });
    };

    // Handle sending message/announcement with multi-photos
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isAdmin) return;

        // Require either message text or at least one attached photo
        if (!inputText.trim() && selectedFiles.length === 0) return;

        setSending(true);
        try {
            const uploadedUrls: string[] = [];

            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const base64 = await compressAndConvertToBase64(file);
                    uploadedUrls.push(base64);
                }
            }

            const newsCollection = collection(db, 'news');
            await addDoc(newsCollection, {
                text: inputText.trim(),
                fileUrl: uploadedUrls[0] || null,
                fileUrls: uploadedUrls,
                fileName: selectedFiles.length > 0 ? selectedFiles[0].name : null,
                fileType: uploadedUrls.length > 0 ? 'image' : null,
                createdAt: serverTimestamp(),
                userId: user.uid,
                userDisplayName: user.displayName || 'Bima Satya Mahendra',
                userPhotoURL: user.photoURL || '/assets/foto.jpg'
            });

            // Clear inputs
            setInputText('');
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            setSelectedFiles([]);
            setPreviewUrls([]);
        } catch (err: any) {
            console.error('Error sending announcement:', err);
            alert('Failed to send announcement: ' + (err.message || err));
        } finally {
            setSending(false);
        }
    };

    // Handle deleting announcement
    const handleDeleteMessage = async (msgId: string) => {
        if (!window.confirm('Delete this announcement?')) return;

        try {
            const docRef = doc(db, 'news', msgId);
            await deleteDoc(docRef);
        } catch (err: any) {
            console.error('Error deleting message:', err);
            alert('Failed to delete announcement: ' + (err.message || err));
        }
    };

    // Handle toggling reaction
    const handleReact = async (msgId: string, emoji: string, currentReactions: Record<string, string[]> | undefined) => {
        if (!user) {
            triggerLoginTooltip(msgId, emoji);
            return;
        }

        const newsRef = doc(db, 'news', msgId);
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
            await updateDoc(newsRef, { reactions });
        } catch (err: any) {
            console.error('Error toggling news reaction:', err);
        }
    };

    const formatMessageTime = (createdAt: any) => {
        if (!createdAt) return '';
        const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <section id="news" className="section">
            <div className="about-header">
                <h2 className="about-title">
                    <i className="fas fa-bullhorn" style={{ marginRight: '10px' }}></i>
                    {t('news.title')}
                </h2>
                <p className="about-subtitle">{t('news.subtitle')}</p>
            </div>
            <div className="about-divider"></div>

            {/* Chat Container */}
            <div className="chat-container">
                {/* Messages List Area */}
                <div className="chat-messages-list">
                    {loading ? (
                        <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                            <i className="fas fa-spinner post-spinner" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
                            <p>Loading chat feed...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                            <i className="fas fa-comments" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.6 }}></i>
                            <p>{t('news.noMessages')}</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const allImages = (msg.fileUrls && msg.fileUrls.length > 0)
                                ? msg.fileUrls
                                : (msg.fileUrl ? [msg.fileUrl] : []);
                            const activeImgIndex = activePhotoIndices[msg.id] || 0;
                            const isMultiPhoto = allImages.length > 1;

                            return (
                                <div key={msg.id} className="chat-message-item admin-message">
                                    <img 
                                        src={msg.userPhotoURL || '/assets/foto.jpg'} 
                                        alt={msg.userDisplayName || 'Bima Satya Mahendra'} 
                                        className="chat-avatar"
                                    />
                                    <div className="chat-message-content">
                                        <div className="chat-message-header">
                                            <span className="chat-sender-name">
                                                {msg.userDisplayName || 'Bima Satya Mahendra'}
                                            </span>
                                            <span className="chat-sender-badge">Admin</span>
                                            <span className="chat-timestamp">
                                                {formatMessageTime(msg.createdAt)}
                                            </span>
                                        </div>
                                        <div className="chat-bubble-container">
                                            <div className="chat-bubble" style={{ maxWidth: '440px', padding: allImages.length > 0 ? '8px 10px' : '10px 16px' }}>
                                                {/* Piled-Up Multi-Photo Stack Gallery */}
                                                {allImages.length > 0 && (
                                                    <div 
                                                        className="photo-pile-container" 
                                                        style={{ 
                                                            marginBottom: msg.text ? '8px' : '0', 
                                                            position: 'relative',
                                                            padding: isMultiPhoto ? '4px' : '0'
                                                        }}
                                                    >
                                                        {isMultiPhoto && <div className="photo-pile-layer layer-1"></div>}
                                                        {allImages.length > 2 && <div className="photo-pile-layer layer-2"></div>}

                                                        <div 
                                                            className="photo-pile-img-wrapper"
                                                            style={{
                                                                borderRadius: '8px',
                                                                overflow: 'hidden',
                                                                position: 'relative',
                                                                zIndex: 1,
                                                                background: '#09090b',
                                                                border: '1px solid rgba(255, 255, 255, 0.1)'
                                                            }}
                                                        >
                                                            {isMultiPhoto && (
                                                                <div className="photo-pile-badge">
                                                                    <i className="fas fa-images"></i>
                                                                    <span>{activeImgIndex + 1}/{allImages.length}</span>
                                                                </div>
                                                            )}

                                                            <img 
                                                                key={activeImgIndex}
                                                                src={allImages[activeImgIndex]} 
                                                                alt="Attachment" 
                                                                className="chat-bubble-image photo-fade-in" 
                                                                onClick={() => setPreviewModal({ images: allImages, initialIndex: activeImgIndex })}
                                                                style={{ 
                                                                    cursor: 'pointer', 
                                                                    width: '100%', 
                                                                    maxHeight: '340px', 
                                                                    objectFit: 'contain',
                                                                    display: 'block'
                                                                }}
                                                            />

                                                            {/* In-Card Slider Navigation Arrows */}
                                                            {isMultiPhoto && (
                                                                <>
                                                                    <button 
                                                                        type="button" 
                                                                        className="photo-pile-nav-btn prev"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActivePhotoIndices(prev => ({
                                                                                ...prev,
                                                                                [msg.id]: ((prev[msg.id] || 0) - 1 + allImages.length) % allImages.length
                                                                            }));
                                                                        }}
                                                                        title="Previous photo"
                                                                    >
                                                                        <i className="fas fa-chevron-left"></i>
                                                                    </button>
                                                                    <button 
                                                                        type="button" 
                                                                        className="photo-pile-nav-btn next"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActivePhotoIndices(prev => ({
                                                                                ...prev,
                                                                                [msg.id]: ((prev[msg.id] || 0) + 1) % allImages.length
                                                                            }));
                                                                        }}
                                                                        title="Next photo"
                                                                    >
                                                                        <i className="fas fa-chevron-right"></i>
                                                                    </button>

                                                                    {/* Indicator Dots */}
                                                                    <div className="photo-pile-dots-container">
                                                                        {allImages.map((_, dotIdx) => (
                                                                            <span 
                                                                                key={dotIdx} 
                                                                                className={`photo-pile-dot ${activeImgIndex === dotIdx ? 'active' : ''}`}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActivePhotoIndices(prev => ({ ...prev, [msg.id]: dotIdx }));
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {msg.text && <p style={{ margin: 0 }}>{msg.text}</p>}
                                                
                                                {/* Render active reactions inside bubble */}
                                                {msg.reactions && Object.entries(msg.reactions).filter(([_, uids]) => uids && uids.length > 0).length > 0 && (
                                                    <div className="chat-reactions-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
                                                        {Object.entries(msg.reactions)
                                                            .filter(([_, uids]) => uids && uids.length > 0)
                                                            .sort((a, b) => b[1].length - a[1].length)
                                                            .map(([emoji, uids]) => {
                                                                const hasReacted = user && uids.includes(user.uid);
                                                                const showTooltip = tooltipState && tooltipState.msgId === msg.id && tooltipState.key === emoji;

                                                                return (
                                                                    <div key={emoji} style={{ position: 'relative', display: 'inline-block' }}>
                                                                        {showTooltip && (
                                                                            <div className="reaction-login-tooltip" style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }}>
                                                                                {t('projects.loginReact')}
                                                                            </div>
                                                                        )}
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleReact(msg.id, emoji, msg.reactions);
                                                                            }} 
                                                                            className={`reaction-pill-btn ${hasReacted ? 'active' : ''}`}
                                                                            style={{ padding: '3px 8px', height: '24px', borderRadius: '12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer' }}
                                                                        >
                                                                            <span>{emoji}</span> 
                                                                            <span>{uids.length}</span>
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Smiley reaction button next to bubble, visible on hover */}
                                            <div className="chat-reaction-action-container">
                                                {tooltipState && tooltipState.msgId === msg.id && tooltipState.key === 'add-btn' && (
                                                    <div className="reaction-login-tooltip" style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }}>
                                                        {t('projects.loginReact')}
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!user) {
                                                            triggerLoginTooltip(msg.id, 'add-btn');
                                                            return;
                                                        }
                                                        setActivePickerMsgId(activePickerMsgId === msg.id ? null : msg.id);
                                                    }} 
                                                    className={`chat-reaction-trigger-btn ${activePickerMsgId === msg.id ? 'active' : ''}`}
                                                    title="Add reaction"
                                                >
                                                    <i className="far fa-smile"></i>
                                                </button>

                                                {/* Floating Emoji Picker Popover */}
                                                {activePickerMsgId === msg.id && (
                                                    <div className="chat-floating-emoji-picker" ref={pickerRef}>
                                                        <div className="picker-inline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>{t('projects.selectReaction')}</span>
                                                            <button 
                                                                className="picker-inline-close-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActivePickerMsgId(null);
                                                                }}
                                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                        <div className="picker-inline-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                                                            {COMMON_EMOJIS.map((emoji) => {
                                                                const uids = (msg.reactions && msg.reactions[emoji]) || [];
                                                                const hasReacted = user && uids.includes(user.uid);
                                                                return (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleReact(msg.id, emoji, msg.reactions);
                                                                            setActivePickerMsgId(null);
                                                                        }}
                                                                        className={`picker-inline-emoji-btn ${hasReacted ? 'active' : ''}`}
                                                                        style={{ background: hasReacted ? 'rgba(56, 189, 248, 0.15)' : 'transparent', border: 'none', fontSize: '16px', padding: '4px', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.1s' }}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Deletion controls */}
                                            {user && isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="chat-action-delete"
                                                    title="Delete Message"
                                                    style={{ marginLeft: '4px' }}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Multi-Photo Attachment Preview Bar */}
                {user && isAdmin && previewUrls.length > 0 && (
                    <div className="chat-attachment-preview-bar">
                        {previewUrls.map((url, idx) => (
                            <div key={idx} className="chat-preview-thumbnail-wrapper">
                                <img src={url} alt={`Preview ${idx + 1}`} className="chat-preview-thumbnail" />
                                <span className="photo-thumbnail-order-badge" style={{ bottom: '2px', left: '2px', fontSize: '8px', padding: '1px 4px' }}>
                                    #{idx + 1}
                                </span>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveFile(idx)} 
                                    className="chat-preview-close-btn"
                                    title="Remove photo"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="chat-input-area">
                    {user && isAdmin ? (
                        <form onSubmit={handleSend} className="chat-input-form">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                multiple
                                style={{ display: 'none' }}
                                disabled={sending}
                            />
                            <button
                                type="button"
                                className="chat-attach-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending}
                                title="Attach Photos (Multi-select supported)"
                            >
                                <i className="far fa-image"></i>
                            </button>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={t('news.inputPlaceholder')}
                                className="chat-input-field"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                className="chat-send-btn"
                                disabled={sending || (!inputText.trim() && selectedFiles.length === 0)}
                                title="Send Announcement"
                            >
                                {sending ? <i className="fas fa-spinner post-spinner"></i> : <i className="fas fa-paper-plane"></i>}
                            </button>
                        </form>
                    ) : (
                        <div className="chat-read-only-notice">
                            <i className="fas fa-lock" style={{ marginRight: '6px' }}></i>
                            {t('news.readOnlyNotice')}
                        </div>
                    )}
                </div>
            </div>

            {/* Fullscreen Multi-Photo Image Modal */}
            <ImageModal 
                isOpen={!!previewModal}
                images={previewModal?.images}
                imageSrc={previewModal ? previewModal.images[previewModal.initialIndex] : ''}
                initialIndex={previewModal?.initialIndex || 0}
                onClose={() => setPreviewModal(null)}
            />
        </section>
    );
};
