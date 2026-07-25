import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewMessage, setPreviewMessage] = useState<NewsMessage | null>(null);
    const [activePickerMsgId, setActivePickerMsgId] = useState<string | null>(null);
    const [tooltipState, setTooltipState] = useState<{ msgId: string; key: string } | null>(null);

    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

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

    // Clean up preview object URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Handle sending message/announcement
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isAdmin) return;

        // Require either message text or an attached file
        if (!inputText.trim() && !selectedFile) return;

        setSending(true);
        try {
            let downloadUrl = '';
            let fileName = '';
            let fileType: 'image' | 'file' | undefined = undefined;

            if (selectedFile) {
                const isImageFile = (f: File): boolean => {
                    if (f.type && f.type.startsWith('image/')) return true;
                    const ext = f.name.split('.').pop()?.toLowerCase();
                    const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'heic', 'heif', 'bmp'];
                    return !!ext && imageExtensions.includes(ext);
                };
                if (!isImageFile(selectedFile)) {
                    alert('Only image files are allowed.');
                    setSending(false);
                    return;
                }
                fileName = selectedFile.name;
                fileType = 'image';

                console.log('Bypassing Firebase Storage, compressing image to Base64 locally...');
                downloadUrl = await compressAndConvertToBase64(selectedFile);
                console.log('Base64 image compression completed successfully');
            }

            console.log('Adding document to news Firestore collection...');
            const newsCollection = collection(db, 'news');
            await addDoc(newsCollection, {
                text: inputText.trim(),
                fileUrl: downloadUrl || null,
                fileName: fileName || null,
                fileType: fileType || null,
                createdAt: serverTimestamp(),
                userId: user.uid,
                userDisplayName: user.displayName || 'Bima Satya Mahendra',
                userPhotoURL: user.photoURL || '/assets/foto.jpg'
            });
            console.log('Firestore news document added successfully!');

            // Clear inputs
            setInputText('');
            setSelectedFile(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
        } catch (err: any) {
            console.error('Error sending announcement:', err);
            alert('Failed to send announcement: ' + (err.message || err));
        } finally {
            setSending(false);
        }
    };

    const compressAndConvertToBase64 = (file: File): Promise<string> => {
        console.log('compressAndConvertToBase64 started for file:', file.name);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                console.log('FileReader finished reading file as data URL');
                const img = new Image();
                img.onload = () => {
                    console.log('Image object loaded successfully. Dimensions:', img.width, 'x', img.height);
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
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG
                        console.log('Image compressed successfully. Base64 length:', compressedBase64.length);
                        resolve(compressedBase64);
                    } else {
                        console.warn('Canvas 2D context not available. Resolving with raw base64');
                        resolve(event.target?.result as string);
                    }
                };
                img.onerror = (err) => {
                    console.error('Image object loading failed:', err);
                    reject(err);
                };
                console.log('Setting image src URL...');
                img.src = event.target?.result as string;
            };
            reader.onerror = (err) => {
                console.error('FileReader failed:', err);
                reject(err);
            };
        });
    };

    // Handle file selection (attachment)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !isAdmin) {
            console.log('File selection cancelled or not admin/logged in');
            return;
        }

        console.log('handleFileChange selected file:', file.name, 'size:', file.size, 'type:', file.type);
        setSelectedFile(file);

        const isImageFile = (f: File): boolean => {
            if (f.type && f.type.startsWith('image/')) return true;
            const ext = f.name.split('.').pop()?.toLowerCase();
            const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'heic', 'heif', 'bmp'];
            return !!ext && imageExtensions.includes(ext);
        };

        if (!isImageFile(file)) {
            alert('Only image files are allowed. Please select an image.');
            if (e.target) e.target.value = '';
            setSelectedFile(null);
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
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
                        messages.map((msg) => (
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
                                        <div className="chat-bubble">
                                            {msg.fileUrl && (
                                                msg.fileType === 'image' ? (
                                                    <img 
                                                        src={msg.fileUrl} 
                                                        alt="Attachment" 
                                                        className="chat-bubble-image" 
                                                        onClick={() => setPreviewMessage(msg)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                ) : (
                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="chat-file-attachment">
                                                        <i className="fas fa-file-alt chat-file-icon"></i>
                                                        <span className="chat-file-name" title={msg.fileName || 'Attachment'}>
                                                            {msg.fileName || 'Attachment'}
                                                        </span>
                                                        <i className="fas fa-download chat-file-download"></i>
                                                    </a>
                                                )
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
                        ))
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Attachment Preview Bar */}
                {user && isAdmin && selectedFile && (
                    <div className="chat-attachment-preview-bar">
                        {previewUrl ? (
                            <div className="chat-preview-thumbnail-wrapper">
                                <img src={previewUrl} alt="Preview" className="chat-preview-thumbnail" />
                                <button 
                                    type="button" 
                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} 
                                    className="chat-preview-close-btn"
                                    title="Remove attachment"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        ) : (
                            <div className="chat-preview-file-card">
                                <i className="fas fa-file-alt chat-file-icon" style={{ fontSize: '16px' }}></i>
                                <span className="chat-preview-info">{selectedFile.name}</span>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedFile(null)} 
                                    className="chat-preview-close-btn"
                                    title="Remove attachment"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Input Area / Read-Only Panel */}
                <div className="chat-input-area">
                    {user && isAdmin ? (
                        <form onSubmit={handleSend} className="chat-input-form">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                                disabled={sending}
                            />
                            <button
                                type="button"
                                className="chat-attach-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending}
                                title="Attach Photo"
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
                                disabled={sending || (!inputText.trim() && !selectedFile)}
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

            {/* Custom Full Image Preview Lightbox */}
            {previewMessage && (
                <div className="chat-lightbox" onClick={(e) => {
                    if (e.target === e.currentTarget) setPreviewMessage(null);
                }}>
                    {/* Header */}
                    <div className="chat-lightbox-header">
                        <button 
                            type="button" 
                            onClick={() => setPreviewMessage(null)} 
                            className="chat-lightbox-back-btn"
                            title="Back to chat"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <div className="chat-lightbox-sender">
                            <img 
                                src={previewMessage.userPhotoURL || '/assets/foto.jpg'} 
                                alt={previewMessage.userDisplayName || 'Bima Satya Mahendra'} 
                                className="chat-lightbox-avatar"
                            />
                            <div className="chat-lightbox-info">
                                <span className="chat-lightbox-name">
                                    {previewMessage.userDisplayName || 'Bima Satya Mahendra'}
                                </span>
                                <span className="chat-lightbox-time">
                                    {formatMessageTime(previewMessage.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Image Area */}
                    <div className="chat-lightbox-content" onClick={() => setPreviewMessage(null)}>
                        <img 
                            src={previewMessage.fileUrl} 
                            alt="Attachment Full View" 
                            className="chat-lightbox-image" 
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                </div>
            )}
        </section>
    );
};
