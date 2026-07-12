// ===== src/components/Player.tsx =====
import React, { useRef, useState, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';

const formatTime = (s: number) => {
    if (isNaN(s) || s < 0) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const Player: React.FC = () => {
    const {
        currentTrackIndex,
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        shuffle,
        repeat,
        likedTracks,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        changeVolume,
        toggleShuffle,
        toggleRepeat,
        toggleLike
    } = useAudio();

    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const volumeBarRef = useRef<HTMLDivElement | null>(null);

    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    const [isDraggingVolume, setIsDraggingVolume] = useState(false);

    // Track dragging state locally so UI updates smoothly during mouse move
    const [localProgressPct, setLocalProgressPct] = useState<number | null>(null);

    const isLiked = likedTracks[currentTrackIndex] || false;

    // Format progress percentage
    const progressPct = localProgressPct !== null
        ? localProgressPct
        : duration > 0 ? (currentTime / duration) * 100 : 0;

    // Seek handler logic
    const handleProgressChange = (clientX: number) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        setLocalProgressPct(pct * 100);
        return pct;
    };

    const handleProgressMouseDown = (e: React.MouseEvent) => {
        setIsDraggingProgress(true);
        handleProgressChange(e.clientX);
    };

    const handleProgressTouchStart = (e: React.TouchEvent) => {
        setIsDraggingProgress(true);
        handleProgressChange(e.touches[0].clientX);
    };

    // Volume handler logic
    const handleVolumeChange = (clientX: number) => {
        if (!volumeBarRef.current) return;
        const rect = volumeBarRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        changeVolume(pct);
    };

    const handleVolumeMouseDown = (e: React.MouseEvent) => {
        setIsDraggingVolume(true);
        handleVolumeChange(e.clientX);
    };

    const handleVolumeTouchStart = (e: React.TouchEvent) => {
        setIsDraggingVolume(true);
        handleVolumeChange(e.touches[0].clientX);
    };

    // Global listeners for drag and drop
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingProgress) {
                handleProgressChange(e.clientX);
            }
            if (isDraggingVolume) {
                handleVolumeChange(e.clientX);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isDraggingProgress) {
                handleProgressChange(e.touches[0].clientX);
            }
            if (isDraggingVolume) {
                handleVolumeChange(e.touches[0].clientX);
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isDraggingProgress) {
                const pct = handleProgressChange(e.clientX);
                if (pct !== undefined) seek(pct);
                setIsDraggingProgress(false);
                setLocalProgressPct(null);
            }
            if (isDraggingVolume) {
                setIsDraggingVolume(false);
            }
        };

        const handleTouchEnd = () => {
            if (isDraggingProgress) {
                if (localProgressPct !== null) {
                    seek(localProgressPct / 100);
                }
                setIsDraggingProgress(false);
                setLocalProgressPct(null);
            }
            if (isDraggingVolume) {
                setIsDraggingVolume(false);
            }
        };

        if (isDraggingProgress || isDraggingVolume) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: true });
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDraggingProgress, isDraggingVolume, localProgressPct]);

    // Volume Icon helper
    const getVolumeIcon = () => {
        if (volume === 0) return 'fas fa-volume-mute';
        if (volume < 0.5) return 'fas fa-volume-down';
        return 'fas fa-volume-up';
    };

    return (
        <div className="player">
            {/* TOP ROW: Track Metadata & Like */}
            <div className="player-top-row">
                <div className="player-left">
                    <div className="player-cover">
                        <img id="playerCover" src={currentTrack.cover} alt="Cover" />
                    </div>
                    <div className="player-info">
                        <h4 id="songTitle">{currentTrack.title}</h4>
                        <p id="songArtist">{currentTrack.artist}</p>
                    </div>
                </div>
                <button 
                    className={`like-btn ${isLiked ? 'liked' : ''}`}
                    onClick={() => toggleLike(currentTrackIndex)}
                >
                    <i className={isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
                </button>
            </div>

            {/* CONTROLS ROW */}
            <div className="player-controls-row">
                <button 
                    id="shuffleBtn" 
                    onClick={toggleShuffle}
                    style={{ color: shuffle ? '#22c55e' : '' }}
                >
                    <i className="fas fa-random"></i>
                </button>
                <button id="prevBtn" onClick={prevTrack}>
                    <i className="fas fa-step-backward"></i>
                </button>
                <button className="play-pause" id="playPauseBtn" onClick={togglePlay}>
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                <button id="nextBtn" onClick={nextTrack}>
                    <i className="fas fa-step-forward"></i>
                </button>
                <button 
                    id="repeatBtn" 
                    onClick={toggleRepeat}
                    style={{ color: repeat ? '#22c55e' : '' }}
                >
                    <i className="fas fa-redo"></i>
                </button>
            </div>

            {/* PROGRESS ROW */}
            <div className="player-progress-row">
                <span id="currentTime">
                    {localProgressPct !== null 
                        ? formatTime((localProgressPct / 100) * duration) 
                        : formatTime(currentTime)}
                </span>
                <div 
                    className="progress-bar" 
                    id="progressBar"
                    ref={progressBarRef}
                    onMouseDown={handleProgressMouseDown}
                    onTouchStart={handleProgressTouchStart}
                >
                    <div 
                        className="progress-fill" 
                        id="progressFill"
                        style={{ width: `${progressPct}%` }}
                    ></div>
                </div>
                <span id="totalTime">{formatTime(duration)}</span>
            </div>

            {/* BOTTOM VOLUME ROW */}
            <div className="player-volume-row">
                <button 
                    id="volumeIcon" 
                    title="Volume"
                    onClick={() => changeVolume(volume > 0 ? 0 : 0.5)}
                >
                    <i className={getVolumeIcon()}></i>
                </button>
                <div 
                    className="volume-bar" 
                    id="volumeBar"
                    ref={volumeBarRef}
                    onMouseDown={handleVolumeMouseDown}
                    onTouchStart={handleVolumeTouchStart}
                >
                    <div 
                        className="volume-fill" 
                        id="volumeFill"
                        style={{ width: `${volume * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
