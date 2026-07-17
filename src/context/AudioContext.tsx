// ===== src/context/AudioContext.tsx =====
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { type Song, playlist } from '../data/portfolioData';

interface AudioContextType {
    playlist: Song[];
    currentTrackIndex: number;
    currentTrack: Song;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    shuffle: boolean;
    repeat: boolean;
    likedTracks: Record<number, boolean>;
    togglePlay: () => void;
    playTrack: (index: number) => void;
    nextTrack: () => void;
    prevTrack: () => void;
    seek: (percent: number) => void;
    changeVolume: (vol: number) => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    toggleLike: (index: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(() => {
        const saved = sessionStorage.getItem('currentSongIndex');
        return saved ? parseInt(saved, 10) : 0;
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    const [volume, setVolumeState] = useState<number>(() => {
        const saved = sessionStorage.getItem('audioVolume');
        return saved ? parseFloat(saved) : 0.2;
    });

    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [likedTracks, setLikedTracks] = useState<Record<number, boolean>>({});

    const currentTrack = playlist[currentTrackIndex] || playlist[0];

    // Lazy initialize audio element on client side
    useEffect(() => {
        const audio = new Audio(currentTrack.file);
        audio.volume = volume;
        audio.preload = 'none';
        audioRef.current = audio;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration || 0);
        };

        const handleEnded = () => {
            if (repeat) {
                audio.currentTime = 0;
                audio.play().catch((err) => console.log('Audio playback error', err));
            } else {
                handleNext();
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [currentTrackIndex]); // Recreate or reset audio element when track index changes

    // Sync volume change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            sessionStorage.setItem('audioVolume', volume.toString());
        }
    }, [volume]);

    // Save index
    useEffect(() => {
        sessionStorage.setItem('currentSongIndex', currentTrackIndex.toString());
    }, [currentTrackIndex]);

    const playTrack = (index: number) => {
        if (index < 0 || index >= playlist.length) return;
        setCurrentTrackIndex(index);
        setIsPlaying(true);
        // Play audio after the source updates in useEffect
        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.play()
                    .catch(err => {
                        console.error('Failed to play audio:', err);
                        alert('Gagal memutar audio! Pastikan file audio tersedia di folder assets.');
                        setIsPlaying(false);
                    });
            }
        }, 50);
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => {
                    console.error('Failed to play audio:', err);
                    alert('Gagal memutar audio! Pastikan file audio tersedia di folder assets.');
                });
        }
    };

    const handleNext = () => {
        if (shuffle && playlist.length > 1) {
            let nextIndex = currentTrackIndex;
            while (nextIndex === currentTrackIndex) {
                nextIndex = Math.floor(Math.random() * playlist.length);
            }
            playTrack(nextIndex);
        } else {
            const nextIndex = (currentTrackIndex + 1) % playlist.length;
            playTrack(nextIndex);
        }
    };

    const handlePrev = () => {
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
        } else {
            const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            playTrack(prevIndex);
        }
    };

    const seek = (percent: number) => {
        if (!audioRef.current || isNaN(audioRef.current.duration)) return;
        const newTime = audioRef.current.duration * percent;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const changeVolume = (vol: number) => {
        const clamped = Math.max(0, Math.min(1, vol));
        setVolumeState(clamped);
    };

    const toggleShuffle = () => setShuffle(prev => !prev);
    const toggleRepeat = () => setRepeat(prev => !prev);

    const toggleLike = (index: number) => {
        setLikedTracks(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Hotkeys handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            }
            if (e.shiftKey && e.code === 'ArrowRight') {
                e.preventDefault();
                handleNext();
            }
            if (e.shiftKey && e.code === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, currentTrackIndex, shuffle]);

    return (
        <AudioContext.Provider value={{
            playlist,
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
            playTrack,
            nextTrack: handleNext,
            prevTrack: handlePrev,
            seek,
            changeVolume,
            toggleShuffle,
            toggleRepeat,
            toggleLike
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
