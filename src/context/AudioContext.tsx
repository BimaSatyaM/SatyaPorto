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
    playTrackAt: (index: number, progressRatio: number) => void;
    pauseAudio: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    seek: (percent: number) => void;
    changeVolume: (vol: number) => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    toggleLike: (index: number) => void;
    getAudioEnergy: () => number;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const attachedAudioRef = useRef<WeakSet<HTMLAudioElement>>(new WeakSet());
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const pendingSeekRatioRef = useRef<number | null>(null);
    const playTimerRef = useRef<number | null>(null);

    const attachAudioAnalyser = (audio: HTMLAudioElement | null) => {
        if (!audio || typeof window === 'undefined') return;
        const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        try {
            if (!audioCtxRef.current) {
                const ctx = new AudioCtx();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64;
                analyser.smoothingTimeConstant = 0.72;
                analyser.connect(ctx.destination);
                audioCtxRef.current = ctx;
                analyserRef.current = analyser;
                freqDataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
            }

            const ctx = audioCtxRef.current;
            const analyser = analyserRef.current;
            if (!ctx || !analyser) return;

            const wireSource = () => {
                if (ctx.state !== 'running' || attachedAudioRef.current.has(audio)) return;
                try {
                    sourceNodeRef.current?.disconnect();
                    const source = ctx.createMediaElementSource(audio);
                    source.connect(analyser);
                    sourceNodeRef.current = source;
                    attachedAudioRef.current.add(audio);
                } catch {
                    // Fallback time-synced energy stays active if media element capture fails
                }
            };

            if (ctx.state === 'suspended') {
                ctx.resume().then(wireSource).catch(() => {});
            } else {
                wireSource();
            }
        } catch {
            // Keep native HTMLAudioElement playback unaffected
        }
    };

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
            const dur = audio.duration || 0;
            setDuration(dur);
            if (pendingSeekRatioRef.current !== null && Number.isFinite(dur) && dur > 0) {
                const target = Math.max(0, Math.min(0.98, pendingSeekRatioRef.current)) * dur;
                audio.currentTime = target;
                setCurrentTime(target);
                pendingSeekRatioRef.current = null;
            }
        };

        const handleEnded = () => {
            if (repeat) {
                audio.currentTime = 0;
                audio.play().catch((err) => console.log('Audio playback error', err));
            } else {
                handleNext();
            }
        };

        const handlePlay = () => {
            if (audioCtxRef.current?.state === 'running') {
                attachAudioAnalyser(audio);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);

        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
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

    const startTrack = (index: number, seekRatio: number | null) => {
        if (index < 0 || index >= playlist.length) return;
        pendingSeekRatioRef.current = seekRatio;
        if (playTimerRef.current !== null) {
            window.clearTimeout(playTimerRef.current);
            playTimerRef.current = null;
        }
        attachAudioAnalyser(audioRef.current);
        setCurrentTrackIndex(index);
        setIsPlaying(true);
        // Play audio after the source updates in useEffect
        playTimerRef.current = window.setTimeout(() => {
            playTimerRef.current = null;
            if (audioRef.current) {
                attachAudioAnalyser(audioRef.current);
                audioRef.current.play()
                    .catch(err => {
                        console.error('Failed to play audio:', err);
                        setIsPlaying(false);
                    });
            }
        }, 50);
    };

    const playTrack = (index: number) => startTrack(index, null);

    const playTrackAt = (index: number, progressRatio: number) => {
        if (index < 0 || index >= playlist.length) return;
        const clampedRatio = Math.max(0, Math.min(0.98, progressRatio));
        if (index === currentTrackIndex && audioRef.current) {
            const audio = audioRef.current;
            if (audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0) {
                const target = clampedRatio * audio.duration;
                audio.currentTime = target;
                setCurrentTime(target);
                pendingSeekRatioRef.current = null;
            } else {
                pendingSeekRatioRef.current = clampedRatio;
            }
            attachAudioAnalyser(audio);
            audio.play()
                .then(() => setIsPlaying(true))
                .catch(err => {
                    console.error('Failed to play audio:', err);
                    setIsPlaying(false);
                });
            return;
        }
        startTrack(index, clampedRatio);
    };

    const pauseAudio = () => {
        if (playTimerRef.current !== null) {
            window.clearTimeout(playTimerRef.current);
            playTimerRef.current = null;
        }
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            attachAudioAnalyser(audioRef.current);
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => {
                    console.error('Failed to play audio:', err);
                    alert('Gagal memutar audio! Pastikan file audio tersedia di folder assets.');
                });
        }
    };

    const getAudioEnergy = () => {
        const audio = audioRef.current;
        if (!audio || audio.paused) return 0;

        const analyser = analyserRef.current;
        const freqData = freqDataRef.current;
        if (analyser && freqData && attachedAudioRef.current.has(audio)) {
            analyser.getByteFrequencyData(freqData);
            const bins = Math.min(10, freqData.length);
            let sum = 0;
            for (let i = 0; i < bins; i++) {
                sum += freqData[i];
            }
            const normalized = sum / (bins * 255);
            if (normalized > 0.01) {
                return Math.min(1, normalized * 1.45);
            }
        }

        const t = audio.currentTime || 0;
        return 0.25 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * 7.2), 2);
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
            playTrackAt,
            pauseAudio,
            nextTrack: handleNext,
            prevTrack: handlePrev,
            seek,
            changeVolume,
            toggleShuffle,
            toggleRepeat,
            toggleLike,
            getAudioEnergy
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
