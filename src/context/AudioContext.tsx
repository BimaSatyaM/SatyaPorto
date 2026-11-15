// ===== src/context/AudioContext.tsx =====
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
    preloadTrack: (index: number) => void;
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
    const loadedTrackIndexRef = useRef<number>(-1);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const attachedAudioRef = useRef<WeakSet<HTMLAudioElement>>(new WeakSet());
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const pendingSeekRatioRef = useRef<number | null>(null);
    const durationCacheRef = useRef<Map<number, number>>(new Map());
    const preloaderPoolRef = useRef<HTMLAudioElement[]>([]);
    const preloadedIndicesRef = useRef<Set<number>>(new Set());

    const attachAudioAnalyser = useCallback((audio: HTMLAudioElement | null) => {
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
    }, []);

    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(() => {
        const saved = sessionStorage.getItem('currentSongIndex');
        const parsed = saved ? parseInt(saved, 10) : 0;
        return parsed >= 0 && parsed < playlist.length ? parsed : 0;
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

    const currentTrackIndexRef = useRef(currentTrackIndex);
    currentTrackIndexRef.current = currentTrackIndex;
    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;
    const repeatRef = useRef(repeat);
    repeatRef.current = repeat;
    const shuffleRef = useRef(shuffle);
    shuffleRef.current = shuffle;
    const volumeRef = useRef(volume);
    volumeRef.current = volume;

    const currentTrack = playlist[currentTrackIndex] || playlist[0];

    // Background byte-range pre-warmer so next/hovered tracks stream immediately on click
    const preloadTrack = useCallback((index: number) => {
        if (typeof window === 'undefined') return;
        if (index < 0 || index >= playlist.length) return;
        if (index === loadedTrackIndexRef.current || preloadedIndicesRef.current.has(index)) return;

        const song = playlist[index];
        if (!song) return;

        preloadedIndicesRef.current.add(index);
        let pool = preloaderPoolRef.current;
        if (pool.length < 2) {
            const preloader = new Audio();
            preloader.preload = 'metadata';
            preloader.volume = 0;
            pool.push(preloader);
        } else {
            const recycled = pool.shift()!;
            pool.push(recycled);
        }

        const targetPreloader = pool[pool.length - 1];
        targetPreloader.preload = 'auto';
        targetPreloader.src = song.file;
        targetPreloader.onloadedmetadata = () => {
            if (Number.isFinite(targetPreloader.duration) && targetPreloader.duration > 0) {
                durationCacheRef.current.set(index, targetPreloader.duration);
            }
        };
        targetPreloader.load();
    }, []);

    const startTrack = useCallback((index: number, seekRatio: number | null) => {
        if (index < 0 || index >= playlist.length) return;
        const audio = audioRef.current;
        const song = playlist[index];
        if (!audio || !song) return;

        const clampedRatio = seekRatio !== null ? Math.max(0, Math.min(0.98, seekRatio)) : null;
        pendingSeekRatioRef.current = clampedRatio;

        const isSameSource = loadedTrackIndexRef.current === index && audio.src.endsWith(encodeURI(song.file));

        if (!isSameSource) {
            loadedTrackIndexRef.current = index;
            audio.preload = 'auto';
            const cachedDur = durationCacheRef.current.get(index) || 0;
            setDuration(cachedDur);
            if (clampedRatio !== null && cachedDur > 0) {
                const estTime = clampedRatio * cachedDur;
                setCurrentTime(estTime);
                // Media fragment hints browser byte-range stream offset immediately
                audio.src = `${song.file}#t=${estTime.toFixed(1)}`;
            } else {
                setCurrentTime(0);
                audio.src = song.file;
            }
        } else if (clampedRatio !== null) {
            const dur = audio.duration || durationCacheRef.current.get(index) || 0;
            if (audio.readyState >= 1 && Number.isFinite(dur) && dur > 0) {
                const target = clampedRatio * dur;
                audio.currentTime = target;
                setCurrentTime(target);
                pendingSeekRatioRef.current = null;
            }
        } else {
            audio.currentTime = 0;
            setCurrentTime(0);
            pendingSeekRatioRef.current = null;
        }

        currentTrackIndexRef.current = index;
        setCurrentTrackIndex(index);
        setIsPlaying(true);

        attachAudioAnalyser(audio);
        audio.play().catch((err) => {
            if (err?.name === 'AbortError') return;
            console.error('Failed to play audio:', err);
            setIsPlaying(false);
        });

        // Pre-warm the next track in queue
        const nextIdx = (index + 1) % playlist.length;
        preloadTrack(nextIdx);
    }, [attachAudioAnalyser, preloadTrack]);

    const handleNext = useCallback(() => {
        const cur = currentTrackIndexRef.current;
        if (shuffleRef.current && playlist.length > 1) {
            let nextIndex = cur;
            while (nextIndex === cur) {
                nextIndex = Math.floor(Math.random() * playlist.length);
            }
            startTrack(nextIndex, null);
        } else {
            const nextIndex = (cur + 1) % playlist.length;
            startTrack(nextIndex, null);
        }
    }, [startTrack]);

    const handlePrev = useCallback(() => {
        const audio = audioRef.current;
        if (audio && audio.currentTime > 3) {
            audio.currentTime = 0;
            setCurrentTime(0);
        } else {
            const prevIndex = (currentTrackIndexRef.current - 1 + playlist.length) % playlist.length;
            startTrack(prevIndex, null);
        }
    }, [startTrack]);

    // Initialize a single persistent streaming HTMLAudioElement once on mount
    useEffect(() => {
        const initialIdx = currentTrackIndexRef.current;
        const initialSong = playlist[initialIdx] || playlist[0];
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.volume = volumeRef.current;
        audio.src = initialSong.file;
        loadedTrackIndexRef.current = initialIdx;
        audioRef.current = audio;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            const dur = audio.duration || 0;
            if (Number.isFinite(dur) && dur > 0) {
                durationCacheRef.current.set(loadedTrackIndexRef.current, dur);
                setDuration(dur);
                if (pendingSeekRatioRef.current !== null) {
                    const target = Math.max(0, Math.min(0.98, pendingSeekRatioRef.current)) * dur;
                    if (Math.abs(audio.currentTime - target) > 0.75) {
                        audio.currentTime = target;
                    }
                    setCurrentTime(target);
                    pendingSeekRatioRef.current = null;
                }
            }
        };

        const handleEnded = () => {
            if (repeatRef.current) {
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

        // Pre-warm the next track after initial mount
        const nextIdx = (initialIdx + 1) % playlist.length;
        preloadTrack(nextIdx);

        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
        };
    }, [attachAudioAnalyser, handleNext, preloadTrack]);

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

    const playTrack = useCallback((index: number) => {
        startTrack(index, null);
    }, [startTrack]);

    const playTrackAt = useCallback((index: number, progressRatio: number) => {
        startTrack(index, progressRatio);
    }, [startTrack]);

    const pauseAudio = useCallback(() => {
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
    }, []);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlayingRef.current) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.preload = 'auto';
            attachAudioAnalyser(audio);
            audio.play()
                .then(() => {
                    setIsPlaying(true);
                    preloadTrack((currentTrackIndexRef.current + 1) % playlist.length);
                })
                .catch((err) => {
                    if (err?.name === 'AbortError') return;
                    console.error('Failed to play audio:', err);
                    alert('Gagal memutar audio! Pastikan file audio tersedia di folder assets.');
                });
        }
    }, [attachAudioAnalyser, preloadTrack]);

    const getAudioEnergy = useCallback(() => {
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
    }, []);

    const seek = useCallback((percent: number) => {
        const audio = audioRef.current;
        if (!audio || isNaN(audio.duration) || audio.duration <= 0) return;
        const newTime = audio.duration * percent;
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    }, []);

    const changeVolume = useCallback((vol: number) => {
        const clamped = Math.max(0, Math.min(1, vol));
        setVolumeState(clamped);
    }, []);

    const toggleShuffle = useCallback(() => setShuffle((prev) => !prev), []);
    const toggleRepeat = useCallback(() => setRepeat((prev) => !prev), []);

    const toggleLike = useCallback((index: number) => {
        setLikedTracks((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    }, []);

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
    }, [togglePlay, handleNext, handlePrev]);

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
            preloadTrack,
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
