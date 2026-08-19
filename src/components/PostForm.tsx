import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_TECH } from '../constants/techStack';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface PostData {
    id: string;
    title: string;
    description: string;
    techStack: string[];
    projectLink?: string;
    type?: 'web' | 'mobile';
    category?: 'personal' | 'internship' | 'freelance' | 'lomba';
    imageUrl?: string;
    imageUrls?: string[];
    featured?: boolean;
}

interface PostFormProps {
    editData?: PostData | null;
    onCancelEdit?: () => void;
}

export const PostForm: React.FC<PostFormProps> = ({ editData, onCancelEdit }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    // Autocomplete select states
    const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
    const [techInput, setTechInput] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [projectLink, setProjectLink] = useState('');
    const [type, setType] = useState<'web' | 'mobile'>('web');
    const [category, setCategory] = useState<'personal' | 'internship' | 'freelance' | 'lomba'>('personal');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [urlInput, setUrlInput] = useState('');
    const [featured, setFeatured] = useState(false);
    
    // Upload image states
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lastPasteTimestampRef = useRef<number>(0);

    // Populate form fields if editing
    useEffect(() => {
        if (editData) {
            setTitle(editData.title);
            setDescription(editData.description);
            setSelectedTechs(editData.techStack || []);
            setProjectLink(editData.projectLink || '');
            setType(editData.type || 'web');
            setCategory(editData.category || 'personal');
            
            const initialImages = (editData.imageUrls && editData.imageUrls.length > 0)
                ? editData.imageUrls
                : (editData.imageUrl ? [editData.imageUrl] : []);
            setImageUrls(initialImages);
            
            setFeatured(editData.featured || false);
        } else {
            setTitle('');
            setDescription('');
            setSelectedTechs([]);
            setProjectLink('');
            setType('web');
            setCategory('personal');
            setImageUrls([]);
            setUrlInput('');
            setFeatured(false);
        }
    }, [editData]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const compressAndConvertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1000;
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
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75); // 75% quality JPEG
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

    const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploadingImage(true);
        setError(null);
        setUploadProgress({ current: 0, total: files.length });

        const newUrls: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadProgress({ current: i + 1, total: files.length });

            try {
                // Race the Firebase Storage upload against a 3.5-second timeout
                const uploadPromise = (async () => {
                    const storageRef = ref(storage, `project-images/${Date.now()}_${i}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    return await getDownloadURL(snapshot.ref);
                })();

                const timeoutPromise = new Promise<string>((_, reject) => 
                    setTimeout(() => reject(new Error('Firebase upload timed out')), 3500)
                );

                const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
                newUrls.push(downloadUrl);
            } catch (err) {
                console.warn('Firebase Storage upload failed, falling back to compressed local Base64:', err);
                try {
                    const base64 = await compressAndConvertToBase64(file);
                    newUrls.push(base64);
                } catch (fallbackErr: any) {
                    setError('Failed to process image: ' + fallbackErr.message);
                }
            }
        }

        setImageUrls(prev => [...prev, ...newUrls]);
        setUploadingImage(false);
        setUploadProgress(null);
        e.target.value = ''; // Reset input so re-selecting same files works
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        // Prevent duplicate trigger within 250ms
        const now = Date.now();
        if (now - lastPasteTimestampRef.current < 250) {
            return;
        }
        lastPasteTimestampRef.current = now;

        const items = e.clipboardData?.items;
        if (!items) return;

        const pastedFiles: File[] = [];
        const seenSizes = new Set<number>();

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type && item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file && file.size > 0 && !seenSizes.has(file.size)) {
                    seenSizes.add(file.size);
                    pastedFiles.push(file);
                }
            }
        }

        if (pastedFiles.length === 0) return;

        e.preventDefault();
        setUploadingImage(true);
        setError(null);
        setUploadProgress({ current: 0, total: pastedFiles.length });

        const newUrls: string[] = [];
        for (let i = 0; i < pastedFiles.length; i++) {
            const file = pastedFiles[i];
            setUploadProgress({ current: i + 1, total: pastedFiles.length });

            try {
                const uploadPromise = (async () => {
                    const storageRef = ref(storage, `project-images/${Date.now()}_pasted_${i}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    return await getDownloadURL(snapshot.ref);
                })();

                const timeoutPromise = new Promise<string>((_, reject) => 
                    setTimeout(() => reject(new Error('Firebase upload timed out')), 3500)
                );

                const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
                newUrls.push(downloadUrl);
            } catch (err) {
                try {
                    const base64 = await compressAndConvertToBase64(file);
                    newUrls.push(base64);
                } catch (fallbackErr: any) {
                    setError('Failed to process pasted image: ' + fallbackErr.message);
                }
            }
        }

        setImageUrls(prev => [...prev, ...newUrls]);
        setUploadingImage(false);
        setUploadProgress(null);
    };

    const handleAddUrl = () => {
        const trimmed = urlInput.trim();
        if (trimmed) {
            setImageUrls(prev => [...prev, trimmed]);
            setUrlInput('');
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleMoveImage = (fromIndex: number, direction: 'left' | 'right') => {
        const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= imageUrls.length) return;

        setImageUrls(prev => {
            const updated = [...prev];
            const item = updated[fromIndex];
            updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, item);
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError('You must be logged in to create or edit posts.');
            return;
        }

        if (!title.trim() || !description.trim()) {
            setError('Title and Description are required.');
            return;
        }

        setSubmitting(true);
        setError(null);

        const primaryImage = imageUrls.length > 0 ? imageUrls[0].trim() : null;

        try {
            if (editData) {
                // Update existing post
                const postRef = doc(db, 'posts', editData.id);
                await updateDoc(postRef, {
                    title: title.trim(),
                    description: description.trim(),
                    techStack: selectedTechs,
                    projectLink: projectLink.trim() || null,
                    type,
                    category,
                    imageUrl: primaryImage,
                    imageUrls: imageUrls,
                    featured,
                    updatedAt: serverTimestamp()
                });
                if (onCancelEdit) onCancelEdit();
            } else {
                // Create new post
                const postsCollection = collection(db, 'posts');
                await addDoc(postsCollection, {
                    title: title.trim(),
                    description: description.trim(),
                    techStack: selectedTechs,
                    projectLink: projectLink.trim() || null,
                    type,
                    category,
                    imageUrl: primaryImage,
                    imageUrls: imageUrls,
                    featured,
                    userId: user.uid,
                    userDisplayName: user.displayName || 'Anonymous User',
                    userPhotoURL: user.photoURL || null,
                    createdAt: serverTimestamp()
                });
                // Reset form
                setTitle('');
                setDescription('');
                setSelectedTechs([]);
                setProjectLink('');
                setType('web');
                setCategory('personal');
                setImageUrls([]);
                setUrlInput('');
                setFeatured(false);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit post.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleTech = (techName: string) => {
        setSelectedTechs((prev) =>
            prev.includes(techName)
                ? prev.filter((t) => t !== techName)
                : [...prev, techName]
        );
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = techInput.trim();
            if (val && !selectedTechs.includes(val)) {
                setSelectedTechs((prev) => [...prev, val]);
                setTechInput('');
                setIsDropdownOpen(false);
            }
        }
    };

    const handleSelectTechFromDropdown = (techName: string) => {
        if (!selectedTechs.includes(techName)) {
            setSelectedTechs((prev) => [...prev, techName]);
        }
        setTechInput('');
        setIsDropdownOpen(false);
    };

    const filteredTechs = AVAILABLE_TECH.filter(
        tech =>
            tech.name.toLowerCase().includes(techInput.toLowerCase()) &&
            !selectedTechs.includes(tech.name)
    );

    return (
        <div className="post-form-container" onPaste={handlePaste}>
            <h3 className="post-form-title">
                <i className={`fas fa-${editData ? 'edit' : 'plus-circle'}`}></i>
                {editData ? 'Edit Project Post' : 'Share New Project Post'}
            </h3>

            {error && (
                <div className="post-error-alert">
                    <i className="fas fa-exclamation-circle"></i> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="post-form">
                <div className="post-form-group">
                    <label htmlFor="title">Project Title *</label>
                    <input
                        id="title"
                        type="text"
                        placeholder="e.g., Adaptive Confluence Trading Bot"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="post-input"
                    />
                </div>

                <div className="post-form-group">
                    <label htmlFor="description">Description *</label>
                    <textarea
                        id="description"
                        placeholder="Describe your project, features, challenges, and solutions..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={4}
                        className="post-textarea"
                    />
                </div>

                {/* TECH STACK AUTOCOMPLETE SELECTOR */}
                <div className="post-form-group" ref={dropdownRef} style={{ position: 'relative' }}>
                    <label>Tech Stack & Tools</label>
                    <div className="searchable-dropdown-container">
                        <input
                            type="text"
                            placeholder="Type to search tech stack (e.g. React, Flutter, Python, Go)..."
                            value={techInput}
                            onChange={(e) => {
                                setTechInput(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onKeyDown={handleInputKeyDown}
                            className="post-input"
                            autoComplete="off"
                        />

                        {/* Autocomplete Dropdown List */}
                        {isDropdownOpen && (
                            <div className="searchable-dropdown-menu">
                                <div className="dropdown-options-list">
                                    {filteredTechs.map((tech) => (
                                        <div
                                            key={tech.name}
                                            onClick={() => handleSelectTechFromDropdown(tech.name)}
                                            className="dropdown-option-item"
                                        >
                                            <span className="tech-option-pill">
                                                <span className="tech-pill-icon" style={{ color: tech.color }}>
                                                    {tech.icon}
                                                </span>
                                                {tech.name}
                                            </span>
                                        </div>
                                    ))}
                                    {filteredTechs.length === 0 && (
                                        <div className="dropdown-no-results">
                                            No predefined tech found. Press <kbd>Enter</kbd> to add custom "{techInput}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Tech Tags Preview Pills */}
                    {selectedTechs.length > 0 && (
                        <div className="selected-tech-tags-wrapper">
                            {selectedTechs.map((tech) => {
                                const found = AVAILABLE_TECH.find(t => t.name.toLowerCase() === tech.toLowerCase());
                                const color = found ? found.color : '#38bdf8';
                                return (
                                    <span 
                                        key={tech} 
                                        className="selected-tech-tag"
                                        style={{ borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}
                                    >
                                        {found && <span style={{ color, marginRight: '6px' }}>{found.icon}</span>}
                                        {tech}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleTech(tech)}
                                            className="remove-tag-btn"
                                            title="Remove tag"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* MULTI-PHOTO UPLOAD & PILE PREVIEW SECTION */}
                <div className="post-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-images" style={{ color: 'var(--primary)' }}></i>
                            Post Photos ({imageUrls.length})
                        </label>
                        {imageUrls.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setImageUrls([])}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}
                            >
                                Clear all photos
                            </button>
                        )}
                    </div>

                    <div className="image-upload-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* File upload + URL input controls row */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label className="file-upload-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1c1c1e', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <i className="fas fa-cloud-upload-alt" style={{ color: 'var(--primary)' }}></i>
                                Upload Photos (Multiple)
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple
                                    onChange={handleFilesChange} 
                                    style={{ display: 'none' }} 
                                />
                            </label>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>or</span>
                            <div style={{ display: 'flex', flex: 1, minWidth: '220px', gap: '6px' }}>
                                <input
                                    type="url"
                                    placeholder="Paste image URL..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddUrl();
                                        }
                                    }}
                                    className="post-input"
                                    style={{ flex: 1, margin: 0 }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddUrl}
                                    className="post-submit-btn"
                                    style={{ padding: '0 16px', height: '42px', fontSize: '13px', whiteSpace: 'nowrap' }}
                                >
                                    + Add URL
                                </button>
                            </div>
                        </div>

                        {uploadingImage && uploadProgress && (
                            <div style={{ fontSize: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-spinner post-spinner"></i>
                                Uploading / compressing photos ({uploadProgress.current} / {uploadProgress.total})...
                            </div>
                        )}

                        {/* Multi-Photo Piled Thumbnails Strip Preview */}
                        {imageUrls.length > 0 && (
                            <div className="form-photos-preview-strip">
                                {imageUrls.map((img, idx) => (
                                    <div key={idx} className="form-photo-thumbnail-card">
                                        <img src={img} alt={`Preview ${idx + 1}`} />
                                        <span className="photo-thumbnail-order-badge">
                                            {idx === 0 ? 'Cover' : `#${idx + 1}`}
                                        </span>

                                        <div className="form-photo-actions-overlay">
                                            {idx > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveImage(idx, 'left')}
                                                    className="photo-action-btn"
                                                    title="Move left"
                                                >
                                                    <i className="fas fa-chevron-left"></i>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(idx)}
                                                className="photo-action-btn delete"
                                                title="Remove photo"
                                            >
                                                &times;
                                            </button>
                                            {idx < imageUrls.length - 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveImage(idx, 'right')}
                                                    className="photo-action-btn"
                                                    title="Move right"
                                                >
                                                    <i className="fas fa-chevron-right"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="post-form-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="post-form-group" style={{ flex: 2, minWidth: '220px' }}>
                        <label htmlFor="projectLink">Project Link (optional)</label>
                        <input
                            id="projectLink"
                            type="url"
                            placeholder="e.g., https://github.com/..."
                            value={projectLink}
                            onChange={(e) => setProjectLink(e.target.value)}
                            className="post-input"
                        />
                    </div>

                    <div className="post-form-group" style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                            <input
                                type="checkbox"
                                checked={featured}
                                onChange={(e) => setFeatured(e.target.checked)}
                                className="post-checkbox"
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            Featured Project
                        </label>
                    </div>
                </div>

                <div className="post-submit-btn-row">
                    {editData && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="post-cancel-btn"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        className="post-submit-btn"
                        disabled={submitting || uploadingImage}
                    >
                        {submitting ? (
                            <>
                                <i className="fas fa-spinner post-spinner"></i> Saving...
                            </>
                        ) : (
                            <>{editData ? 'Save Changes' : 'Post Project'}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
