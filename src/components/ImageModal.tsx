// ===== src/components/ImageModal.tsx =====
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ImageModalProps {
    isOpen: boolean;
    imageSrc?: string;
    images?: string[];
    initialIndex?: number;
    title?: string;
    subtitle?: string;
    onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ 
    isOpen, 
    imageSrc, 
    images, 
    initialIndex = 0, 
    title,
    subtitle,
    onClose 
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const thumbnailsRef = useRef<HTMLDivElement>(null);

    // Normalize images list
    const allImages = images && images.length > 0 ? images : (imageSrc ? [imageSrc] : []);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    // Scroll active thumbnail into view smoothly
    useEffect(() => {
        if (!isOpen || allImages.length <= 1) return;
        if (thumbnailsRef.current) {
            const activeThumb = thumbnailsRef.current.children[currentIndex] as HTMLElement;
            if (activeThumb) {
                activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentIndex, isOpen, allImages.length]);

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1));
    }, [allImages.length]);

    const handleNext = useCallback((e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setCurrentIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0));
    }, [allImages.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft' && allImages.length > 1) {
                handlePrev();
            } else if (e.key === 'ArrowRight' && allImages.length > 1) {
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, allImages.length, handlePrev, handleNext, onClose]);

    // Touch swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = null;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current !== null && touchEndX.current !== null && allImages.length > 1) {
            const deltaX = touchStartX.current - touchEndX.current;
            const SWIPE_THRESHOLD = 50;
            if (deltaX > SWIPE_THRESHOLD) {
                handleNext();
            } else if (deltaX < -SWIPE_THRESHOLD) {
                handlePrev();
            }
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    // Do NOT render into DOM if closed or no images
    if (!isOpen || allImages.length === 0) return null;

    const currentImg = allImages[currentIndex] || allImages[0];

    return createPortal(
        <div 
            id="imageModal" 
            className="image-modal show"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Top Bar with Title, Counter, and Close Button */}
            <div className="image-modal-top-bar" onClick={(e) => e.stopPropagation()}>
                <div className="image-modal-header-info">
                    {title && <h3 className="image-modal-title">{title}</h3>}
                    {subtitle && <p className="image-modal-subtitle">{subtitle}</p>}
                </div>

                <div className="image-modal-top-actions">
                    {allImages.length > 1 && (
                        <div className="image-modal-counter">
                            <i className="fas fa-images"></i> {currentIndex + 1} / {allImages.length}
                        </div>
                    )}
                    <button 
                        type="button"
                        className="image-modal-close" 
                        id="modalClose" 
                        onClick={onClose} 
                        title="Close (Esc)"
                        aria-label="Close modal"
                    >
                        &times;
                    </button>
                </div>
            </div>

            {/* Left navigation arrow */}
            {allImages.length > 1 && (
                <button 
                    type="button" 
                    className="image-modal-nav-btn prev"
                    onClick={handlePrev}
                    aria-label="Previous Image"
                    title="Previous (Left Arrow)"
                >
                    <i className="fas fa-chevron-left"></i>
                </button>
            )}

            {/* Center Image Container */}
            <div className="image-modal-img-container" onClick={(e) => e.stopPropagation()}>
                <img 
                    key={currentImg}
                    className="image-modal-content" 
                    id="fullImage" 
                    src={currentImg} 
                    alt={title ? `${title} - Screenshot ${currentIndex + 1}` : `Preview ${currentIndex + 1}`} 
                />
            </div>

            {/* Right navigation arrow */}
            {allImages.length > 1 && (
                <button 
                    type="button" 
                    className="image-modal-nav-btn next"
                    onClick={handleNext}
                    aria-label="Next Image"
                    title="Next (Right Arrow)"
                >
                    <i className="fas fa-chevron-right"></i>
                </button>
            )}

            {/* Bottom Interactive Thumbnail Strip Gallery */}
            {allImages.length > 1 && (
                <div className="image-modal-bottom-gallery" onClick={(e) => e.stopPropagation()}>
                    <div className="image-modal-thumbs-strip" ref={thumbnailsRef}>
                        {allImages.map((thumbUrl, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`image-modal-thumb-item ${idx === currentIndex ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex(idx);
                                }}
                                title={`View photo ${idx + 1}`}
                                aria-label={`View photo ${idx + 1}`}
                            >
                                <img src={thumbUrl} alt={`Thumbnail ${idx + 1}`} />
                                <span className="image-modal-thumb-index">{idx + 1}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

