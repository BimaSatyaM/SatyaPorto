// ===== src/components/ImageModal.tsx =====
import React, { useEffect, useState } from 'react';

interface ImageModalProps {
    isOpen: boolean;
    imageSrc: string;
    onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageSrc, onClose }) => {
    const [renderState, setRenderState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

    useEffect(() => {
        if (isOpen) {
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
    }, [isOpen]);

    if (renderState === 'closed') return null;

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
            <span className="image-modal-close" id="modalClose" onClick={onClose}>
                &times;
            </span>
            <img 
                className="image-modal-content" 
                id="fullImage" 
                src={imageSrc} 
                alt="Profile Full" 
            />
        </div>
    );
};
