// ===== src/components/ImageModal.tsx =====
import React, { useEffect, useState, useCallback } from 'react';

interface ImageModalProps {
    isOpen: boolean;
    imageSrc?: string;
    images?: string[];
    initialIndex?: number;
    onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ 
    isOpen, 
    imageSrc, 
    images, 
    initialIndex = 0, 
    onClose 
}) => {
    const [renderState, setRenderState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Normalize images list
    const allImages = images && images.length > 0 ? images : (imageSrc ? [imageSrc] : []);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setRenderState('opening');
            const timer = setTimeout(() => setRenderState('open'), 10);
            return () => clearTimeout(timer);
        } else {
            if (renderState === 'open' || renderState === 'opening') {
                setRenderState('closing');
                const timer = setTimeout(() => setRenderState('closed'), 250);
                return () => clearTimeout(timer);
            }
        }
    }, [isOpen, initialIndex]);

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

    if (renderState === 'closed' || allImages.length === 0) return null;

    const currentImg = allImages[currentIndex] || allImages[0];

    return (
        <div 
            id="imageModal" 
            className={`image-modal ${renderState === 'open' ? 'show' : ''}`}
            style={{ display: 'flex' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <span className="image-modal-close" id="modalClose" onClick={onClose} title="Close (Esc)">
                &times;
            </span>

            {allImages.length > 1 && (
                <div className="image-modal-counter">
                    <i className="fas fa-images"></i> {currentIndex + 1} / {allImages.length}
                </div>
            )}

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

            <div className="image-modal-img-container" onClick={(e) => e.stopPropagation()}>
                <img 
                    key={currentImg}
                    className="image-modal-content" 
                    id="fullImage" 
                    src={currentImg} 
                    alt={`Preview ${currentIndex + 1}`} 
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

            {/* Bottom mini indicator dots */}
            {allImages.length > 1 && (
                <div className="image-modal-dots">
                    {allImages.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={`image-modal-dot ${idx === currentIndex ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentIndex(idx);
                            }}
                            aria-label={`Jump to image ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
