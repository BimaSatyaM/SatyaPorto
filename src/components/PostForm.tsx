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
    const [imageUrl, setImageUrl] = useState('');
    const [featured, setFeatured] = useState(false);
    
    // Upload image states
    const [uploadingImage, setUploadingImage] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Populate form fields if editing
    useEffect(() => {
        if (editData) {
            setTitle(editData.title);
            setDescription(editData.description);
            setSelectedTechs(editData.techStack || []);
            setProjectLink(editData.projectLink || '');
            setType(editData.type || 'web');
            setCategory(editData.category || 'personal');
            setImageUrl(editData.imageUrl || '');
            setFeatured(editData.featured || false);
        } else {
            setTitle('');
            setDescription('');
            setSelectedTechs([]);
            setProjectLink('');
            setType('web');
            setCategory('personal');
            setImageUrl('');
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        setError(null);

        try {
            // Race the Firebase Storage upload against a 3-second timeout
            const uploadPromise = (async () => {
                const storageRef = ref(storage, `project-images/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                return await getDownloadURL(snapshot.ref);
            })();

            const timeoutPromise = new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('Firebase upload timed out')), 3000)
            );

            const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
            setImageUrl(downloadUrl);
        } catch (err: any) {
            console.warn('Firebase Storage upload failed, falling back to compressed local Base64:', err);
            try {
                const base64 = await compressAndConvertToBase64(file);
                setImageUrl(base64);
            } catch (fallbackErr: any) {
                setError('Failed to process image: ' + fallbackErr.message);
            }
        } finally {
            setUploadingImage(false);
        }
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
                    imageUrl: imageUrl.trim() || null,
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
                    imageUrl: imageUrl.trim() || null,
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
                setImageUrl('');
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

    // Filter matching options in autocomplete list
    const filteredTechs = AVAILABLE_TECH.filter(
        (tech) =>
            tech.name.toLowerCase().includes(techInput.toLowerCase()) &&
            !selectedTechs.includes(tech.name)
    );

    return (
        <div className="post-form-container">
            <h3 className="post-form-title">
                <i className={editData ? "fas fa-edit" : "fas fa-plus-circle"}></i>
                {editData ? 'Edit Project' : 'Share a New Project'}
            </h3>

            {error && (
                <div className="post-error-alert">
                    <i className="fas fa-exclamation-circle"></i> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="post-form">
                <div className="post-form-row">
                    <div className="post-form-group flex-grow">
                        <label htmlFor="title">Project Title</label>
                        <input
                            id="title"
                            type="text"
                            placeholder="e.g., E-Commerce Platform"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="post-input"
                            required
                        />
                    </div>
                </div>

                <div className="post-form-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="post-form-group" style={{ flex: 1, minWidth: '150px' }}>
                        <label htmlFor="type">Project Type</label>
                        <select
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value as 'web' | 'mobile')}
                            className="post-select"
                        >
                            <option value="web">Web</option>
                            <option value="mobile">Mobile</option>
                        </select>
                    </div>

                    <div className="post-form-group" style={{ flex: 1, minWidth: '150px' }}>
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="post-select"
                        >
                            <option value="personal">Personal Project</option>
                            <option value="internship">Internship</option>
                            <option value="freelance">Freelance</option>
                            <option value="lomba">Lomba</option>
                        </select>
                    </div>
                </div>

                <div className="post-form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        placeholder="Tell the community about your project..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="post-textarea"
                        required
                    />
                </div>

                {/* SEARCHABLE AUTOCOMPLETE DROPDOWN TAG SELECTOR */}
                <div className="post-form-group" ref={dropdownRef}>
                    <label htmlFor="techSearch">Tech Stack</label>
                    <div className="searchable-dropdown-container">
                        <input
                            id="techSearch"
                            type="text"
                            placeholder="Type CSS, React, Python... (Press Enter to add custom)"
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

                        {isDropdownOpen && (
                            <div className="searchable-dropdown-menu">
                                <div className="dropdown-options-list">
                                    {filteredTechs.map((tech) => (
                                        <div
                                            key={tech.name}
                                            onClick={() => {
                                                handleToggleTech(tech.name);
                                                setTechInput('');
                                                setIsDropdownOpen(false);
                                            }}
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
                                            No matches. Press enter to add "{techInput}"
                                        </div>
                                    )}
                                </div>
                                <div className="dropdown-footer">
                                    <i className="fas fa-pencil-alt" title="Autocomplete search"></i>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Tech Tags Capsule list */}
                    {selectedTechs.length > 0 && (
                        <div className="selected-tech-tags-list">
                            {selectedTechs.map((tech) => {
                                const info = AVAILABLE_TECH.find((t) => t.name === tech);
                                return (
                                    <span key={tech} className="selected-tag-capsule">
                                        {info && (
                                            <span className="tag-capsule-icon" style={{ color: info.color }}>
                                                {info.icon}
                                            </span>
                                        )}
                                        {tech}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleTech(tech)}
                                            className="remove-tag-btn"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* DUAL IMAGE UPLOAD & URL SELECTOR ROW */}
                <div className="post-form-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div className="post-form-group" style={{ flex: 2, minWidth: '200px' }}>
                        <label>Thumbnail Image</label>
                        <div className="image-upload-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {imageUrl ? (
                                <div className="uploaded-image-preview-container" style={{ position: 'relative', width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button 
                                        type="button" 
                                        onClick={() => setImageUrl('')} 
                                        className="remove-preview-img-btn"
                                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <label className="file-upload-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1c1c1e', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <i className="fas fa-cloud-upload-alt"></i> Upload from Local
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileChange} 
                                            style={{ display: 'none' }} 
                                        />
                                    </label>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>or</span>
                                    <input
                                        id="imageUrl"
                                        type="url"
                                        placeholder="Paste image URL here..."
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="post-input"
                                        style={{ flex: 1, margin: 0 }}
                                    />
                                </div>
                            )}

                            {uploadingImage && (
                                <div style={{ fontSize: '12px', color: 'var(--primary)' }}>
                                    <i className="fas fa-spinner post-spinner"></i> Uploading / compressing image...
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="post-form-group" style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', marginTop: '30px' }}>
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

                <div className="post-form-group">
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
                        disabled={submitting}
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
