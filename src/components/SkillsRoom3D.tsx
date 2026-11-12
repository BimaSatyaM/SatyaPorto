import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getTechIcon } from '../constants/techStack';
import { useAudio } from '../context/AudioContext';
import { playlist } from '../data/portfolioData';
import {
    createSkillWorkstation,
    syncSharedMascotTheme,
    type MascotMusicSnapshot,
    type MascotNeighbor,
    type SkillWorkstation,
} from './skills3d/skillWorker';
import {
    createStudioEnvironment,
    getInitialSpawnPosition,
    getStudioThemeColors,
    type StudioEnvironment,
} from './skills3d/studioRoom';
import { resolveThemeColor } from './skills3d/textures';
import type { Skill3DNode } from './skills3d/types';

export interface SkillsRoom3DProps {
    skills: Skill3DNode[];
    visibleSkillIds: Set<string>;
    warningText?: string;
    onWebGLUnavailable?: () => void;
}

const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

function getOverviewCameraPos(_visibleCount: number): THREE.Vector3 {
    return new THREE.Vector3(0, 2.8, 15.2);
}

function getJakartaSleepHours(now: Date = new Date()): boolean {
    const hourText = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric',
        hour12: false,
    }).format(now);
    const hour = (Number.parseInt(hourText, 10) || 0) % 24;
    return hour >= 22 || hour < 7;
}

function formatTrackTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const SkillsRoom3D: React.FC<SkillsRoom3DProps> = ({
    skills,
    visibleSkillIds,
    warningText,
    onWebGLUnavailable,
}) => {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const rosterWrapRef = useRef<HTMLDivElement | null>(null);
    const rosterTriggerRef = useRef<HTMLButtonElement | null>(null);
    const stationsRef = useRef<Map<string, SkillWorkstation>>(new Map());
    const inspectAudioActiveRef = useRef<boolean>(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [webglError, setWebglError] = useState(false);
    const [rosterHovered, setRosterHovered] = useState(false);
    const [rosterPinned, setRosterPinned] = useState(false);
    const [isJakartaSleepHours, setIsJakartaSleepHours] = useState<boolean>(() =>
        getJakartaSleepHours()
    );
    const [activeMusicSnap, setActiveMusicSnap] = useState<MascotMusicSnapshot | null>(null);
    const [listeningCount, setListeningCount] = useState<number>(0);

    const {
        isPlaying,
        currentTrackIndex,
        currentTime,
        duration,
        togglePlay,
        playTrackAt,
        pauseAudio,
        getAudioEnergy,
    } = useAudio();

    const rosterOpen = rosterHovered || rosterPinned;

    // Keep latest props & interactive flags accessible inside rAF without recreating WebGL context
    const stateRef = useRef({
        skills,
        visibleSkillIds,
        selectedId,
        hoveredId,
        isPlaying,
        currentTrackIndex,
        currentTime,
        duration,
        isJakartaSleepHours,
        getAudioEnergy,
    });
    stateRef.current = {
        skills,
        visibleSkillIds,
        selectedId,
        hoveredId,
        isPlaying,
        currentTrackIndex,
        currentTime,
        duration,
        isJakartaSleepHours,
        getAudioEnergy,
    };

    const inspectSkillAudio = (nextSelectedId: string | null) => {
        if (!nextSelectedId) {
            if (inspectAudioActiveRef.current) {
                pauseAudio();
                inspectAudioActiveRef.current = false;
            }
            return;
        }
        const snap = stationsRef.current.get(nextSelectedId)?.getMusicState();
        if (snap?.isListening) {
            const ratio = snap.progressSec / Math.max(1, snap.durationSec);
            playTrackAt(snap.songIndex, ratio);
            inspectAudioActiveRef.current = true;
        } else if (inspectAudioActiveRef.current) {
            pauseAudio();
            inspectAudioActiveRef.current = false;
        }
    };

    const inspectSkillAudioRef = useRef(inspectSkillAudio);
    inspectSkillAudioRef.current = inspectSkillAudio;

    useEffect(() => {
        const syncClock = () => setIsJakartaSleepHours(getJakartaSleepHours());
        const timer = window.setInterval(syncClock, 30000);
        return () => window.clearInterval(timer);
    }, []);

    const resetTriggerRef = useRef<(() => void) | null>(null);

    const visibleSkills = useMemo(
        () => skills.filter((s) => visibleSkillIds.has(s.id)),
        [skills, visibleSkillIds]
    );

    const leadSkillId = useMemo(
        () => skills.find((s) => s.isLead)?.id ?? null,
        [skills]
    );

    useEffect(() => {
        if (!rosterOpen) return;

        const onDocPointerDown = (e: PointerEvent) => {
            if (rosterWrapRef.current && !rosterWrapRef.current.contains(e.target as Node)) {
                setRosterPinned(false);
                setRosterHovered(false);
            }
        };

        const onDocKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setRosterPinned(false);
                setRosterHovered(false);
                rosterTriggerRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', onDocPointerDown);
        document.addEventListener('keydown', onDocKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onDocPointerDown);
            document.removeEventListener('keydown', onDocKeyDown);
        };
    }, [rosterOpen]);

    const activeSkill = useMemo(() => {
        const targetId = hoveredId ?? selectedId ?? leadSkillId;
        if (!targetId) return null;
        return skills.find((s) => s.id === targetId && visibleSkillIds.has(s.id)) ?? null;
    }, [hoveredId, selectedId, leadSkillId, skills, visibleSkillIds]);

    const sceneRefs = useRef<{
        reconcileStations: () => void;
        triggerCameraReset: (focusSkillId: string | null) => void;
    } | null>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        let cleanupScene: (() => void) | null = null;

        // Defer WebGL creation by 1 frame so initial page load/reload never blocks UI paint
        // and React StrictMode double-mount never creates two WebGL contexts back-to-back.
        const initRaf = requestAnimationFrame(() => {
            const isMobile =
                typeof window !== 'undefined' &&
                window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;

            let renderer: THREE.WebGLRenderer;
            try {
                renderer = new THREE.WebGLRenderer({
                    antialias: !isMobile,
                    powerPreference: 'high-performance',
                });
                if (!renderer.getContext()) {
                    throw new Error('Empty WebGL context');
                }
            } catch {
                setWebglError(true);
                onWebGLUnavailable?.();
                return;
            }

            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.25));
            renderer.setSize(host.clientWidth || 640, host.clientHeight || 480);
            renderer.shadowMap.enabled = false;
            renderer.toneMapping = THREE.NoToneMapping;
            host.innerHTML = '';
            host.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            let currentTheme = getStudioThemeColors();
            const studioEnv: StudioEnvironment = createStudioEnvironment(scene, currentTheme);

            const workstationsGroup = new THREE.Group();
            scene.add(workstationsGroup);

            const initialCount = Math.max(
                1,
                stateRef.current.visibleSkillIds.size || stateRef.current.skills.length
            );
            const camera = new THREE.PerspectiveCamera(
                46,
                (host.clientWidth || 640) / Math.max(1, host.clientHeight || 480),
                0.1,
                260
            );
            camera.position.copy(getOverviewCameraPos(initialCount));

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.enablePan = false;
            controls.minDistance = 2.6;
            controls.maxDistance = 24.0;
            controls.minPolarAngle = 0.12;
            controls.maxPolarAngle = Math.PI - 0.12;
            controls.target.copy(DEFAULT_TARGET);

            const stations = new Map<string, SkillWorkstation>();
            stationsRef.current = stations;

            // Smooth camera & globe glide goals (rotates clicked mascot to top-front crest for an upright front view)
            let cameraGlideActive = false;
            const desiredCamPos = camera.position.clone();
            const desiredTarget = DEFAULT_TARGET.clone();
            const desiredGlobeQuat = new THREE.Quaternion();
            const localNormalTemp = new THREE.Vector3();
            const focusWorldNormal = new THREE.Vector3(0, 0.96, 0.28).normalize();
            const focusWorldTarget = new THREE.Vector3(0, 4.05, 1.18);
            const focusWorldCamPos = new THREE.Vector3(0, 4.35, 5.15);

            const triggerCameraReset = (focusSkillId: string | null) => {
                if (focusSkillId) {
                    const ws = stations.get(focusSkillId);
                    if (ws) {
                        const n = ws.getPositionNormal();
                        localNormalTemp.set(n.x, n.y, n.z).normalize();
                        desiredGlobeQuat.setFromUnitVectors(localNormalTemp, focusWorldNormal);
                        desiredTarget.copy(focusWorldTarget);
                        desiredCamPos.copy(focusWorldCamPos);
                        cameraGlideActive = true;
                        return;
                    }
                }
                desiredGlobeQuat.identity();
                desiredTarget.copy(DEFAULT_TARGET);
                desiredCamPos.copy(getOverviewCameraPos(stateRef.current.visibleSkillIds.size));
                cameraGlideActive = true;
            };

            const reconcileStations = () => {
                const {
                    skills: currentSkills,
                    visibleSkillIds: currentVisible,
                    selectedId: currentSelected,
                } = stateRef.current;
                const theme = getStudioThemeColors();
                const incomingIds = new Set(currentSkills.map((s) => s.id));

                for (const [id, ws] of stations) {
                    if (!incomingIds.has(id)) {
                        workstationsGroup.remove(ws.group);
                        ws.dispose();
                        stations.delete(id);
                    }
                }

                currentSkills.forEach((skill, idx) => {
                    const existing = stations.get(skill.id);
                    if (existing) {
                        existing.setSkill(skill, idx);
                    } else {
                        const ws = createSkillWorkstation(skill, idx, theme, playlist.length);
                        const spawn = getInitialSpawnPosition(idx, currentSkills.length);
                        ws.setInitialPosition(spawn.x, spawn.y, spawn.z);
                        stations.set(skill.id, ws);
                        workstationsGroup.add(ws.group);
                    }
                });

                if (currentSelected && !currentVisible.has(currentSelected)) {
                    setSelectedId(null);
                    triggerCameraReset(null);
                }
            };

            resetTriggerRef.current = () => {
                setSelectedId(null);
                triggerCameraReset(null);
                inspectSkillAudioRef.current(null);
            };

            sceneRefs.current = {
                reconcileStations,
                triggerCameraReset,
            };

            reconcileStations();

            const onControlsStart = () => {
                cameraGlideActive = false;
                setIsDragging(true);
            };
            const onControlsEnd = () => {
                setIsDragging(false);
            };
            controls.addEventListener('start', onControlsStart);
            controls.addEventListener('end', onControlsEnd);

            // Pointer hover + click raycasting (throttled on pointermove for lightweight mobile/desktop input)
            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2();
            let downX = 0;
            let downY = 0;
            let lastHoverTime = 0;

            const pickStationId = (clientX: number, clientY: number): string | null => {
                const rect = renderer.domElement.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) return null;
                pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
                pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(pointer, camera);
                const targets: THREE.Object3D[] = [];
                for (const [id, ws] of stations) {
                    if (stateRef.current.visibleSkillIds.has(id) && ws.group.visible) {
                        targets.push(ws.getHitTarget());
                    }
                }
                if (targets.length === 0) return null;

                const hits = raycaster.intersectObjects(targets, false);
                if (hits.length === 0) return null;
                const hitObj = hits[0].object;
                for (const [id, ws] of stations) {
                    if (ws.getHitTarget() === hitObj) {
                        return id;
                    }
                }
                return null;
            };

            const onPointerMove = (e: PointerEvent) => {
                if (e.pointerType === 'touch') return;
                const now = performance.now();
                if (now - lastHoverTime < 32) return;
                lastHoverTime = now;
                const hit = pickStationId(e.clientX, e.clientY);
                setHoveredId((prev) => (prev === hit ? prev : hit));
                renderer.domElement.style.cursor = hit ? 'pointer' : '';
            };

            const onPointerDown = (e: PointerEvent) => {
                downX = e.clientX;
                downY = e.clientY;
            };

            const onPointerUp = (e: PointerEvent) => {
                const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
                if (moved > 6) return;
                const hit = pickStationId(e.clientX, e.clientY);
                const next = hit && stateRef.current.selectedId === hit ? null : hit;
                setSelectedId(next);
                triggerCameraReset(next);
                inspectSkillAudioRef.current(next);
            };

            const onPointerLeave = () => {
                setHoveredId(null);
                renderer.domElement.style.cursor = '';
            };

            renderer.domElement.addEventListener('pointermove', onPointerMove, { passive: true });
            renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });
            renderer.domElement.addEventListener('pointerup', onPointerUp, { passive: true });
            renderer.domElement.addEventListener('pointerleave', onPointerLeave, { passive: true });

            // ResizeObserver for container size responsiveness
            const resizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (!entry) return;
                const w = Math.max(1, Math.floor(entry.contentRect.width));
                const h = Math.max(1, Math.floor(entry.contentRect.height));
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            });
            resizeObserver.observe(host);

            // Theme change watcher (Light Cream <-> Dark Mode)
            const themeObserver = new MutationObserver(() => {
                currentTheme = getStudioThemeColors();
                studioEnv.applyTheme(currentTheme);
                syncSharedMascotTheme(currentTheme);
                for (const ws of stations.values()) {
                    ws.setTheme(currentTheme);
                }
            });
            themeObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['class'],
            });

            // Visibility pause so offscreen / hidden tabs use zero GPU (always renders initial frame first)
            let isInViewport = true;
            let hasRenderedFirstFrame = false;
            const intersectionObserver = new IntersectionObserver(
                (entries) => {
                    isInViewport = entries[0]?.isIntersecting ?? true;
                },
                { threshold: 0.01 }
            );
            intersectionObserver.observe(host);

            let rafId = 0;
            let lastTime = performance.now();
            let elapsed = 0;
            const neighborPool: MascotNeighbor[] = [];
            const activeNeighbors: MascotNeighbor[] = [];
            const invGlobeQuat = new THREE.Quaternion();
            const localCamPos = new THREE.Vector3();
            const localCamQuat = new THREE.Quaternion();

            const animate = (now: number) => {
                rafId = requestAnimationFrame(animate);
                if (hasRenderedFirstFrame && (!isInViewport || document.hidden)) {
                    lastTime = now;
                    return;
                }
                hasRenderedFirstFrame = true;

                const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
                lastTime = now;
                elapsed += dt;

                studioEnv.update(dt, elapsed);

                if (cameraGlideActive) {
                    const factor = 1 - Math.exp(-5.5 * dt);
                    studioEnv.earthGroup.quaternion.slerp(desiredGlobeQuat, factor);
                    workstationsGroup.quaternion.copy(studioEnv.earthGroup.quaternion);
                    camera.position.lerp(desiredCamPos, factor);
                    controls.target.lerp(desiredTarget, factor);
                    if (
                        camera.position.distanceToSquared(desiredCamPos) < 0.0025 &&
                        controls.target.distanceToSquared(desiredTarget) < 0.0025 &&
                        1 - Math.abs(studioEnv.earthGroup.quaternion.dot(desiredGlobeQuat)) < 0.0005
                    ) {
                        cameraGlideActive = false;
                    }
                }

                invGlobeQuat.copy(workstationsGroup.quaternion).invert();
                localCamPos.copy(camera.position).applyQuaternion(invGlobeQuat);
                localCamQuat.copy(invGlobeQuat).multiply(camera.quaternion);

                const {
                    visibleSkillIds: liveVisible,
                    selectedId: liveSelected,
                    hoveredId: liveHovered,
                    isPlaying: livePlaying,
                    currentTrackIndex: liveTrackIdx,
                    currentTime: liveAudioTime,
                    duration: liveAudioDuration,
                    isJakartaSleepHours: liveJakartaNight,
                    getAudioEnergy: sampleEnergy,
                } = stateRef.current;

                const liveEnergy = livePlaying ? sampleEnergy() : 0;
                const musicEpoch = Math.floor(elapsed / 18);

                activeNeighbors.length = 0;
                let slotIdx = 0;
                for (const [id, ws] of stations) {
                    if (!liveVisible.has(id)) continue;
                    const pos = ws.getPositionNormal();
                    let slot = neighborPool[slotIdx];
                    if (!slot) {
                        slot = { id, x: pos.x, y: pos.y, z: pos.z };
                        neighborPool[slotIdx] = slot;
                    } else {
                        slot.id = id;
                        slot.x = pos.x;
                        slot.y = pos.y;
                        slot.z = pos.z;
                    }
                    activeNeighbors.push(slot);
                    slotIdx++;
                }

                for (const [id, ws] of stations) {
                    const isVisible = liveVisible.has(id);
                    const isSelected = liveSelected === id;
                    const isHovered = liveHovered === id;
                    const stationSnap = isSelected ? ws.getMusicState() : null;
                    const syncSelectedInspect = Boolean(
                        isSelected && inspectAudioActiveRef.current && livePlaying && stationSnap?.isListening
                    );

                    ws.update(dt, elapsed, {
                        isSelected,
                        isHovered,
                        isVisible,
                        isJakartaNight: liveJakartaNight,
                        musicEpoch,
                        liveAudioEnergy: syncSelectedInspect ? liveEnergy : 0,
                        syncedAudioSongIndex: syncSelectedInspect ? liveTrackIdx : undefined,
                        syncedAudioTime:
                            syncSelectedInspect && liveAudioDuration > 0 ? liveAudioTime : undefined,
                        syncedAudioDuration:
                            syncSelectedInspect && liveAudioDuration > 0 ? liveAudioDuration : undefined,
                        cameraPos: localCamPos,
                        cameraQuat: localCamQuat,
                        neighbors: activeNeighbors,
                    });
                }

                controls.update();
                renderer.render(scene, camera);
            };

            rafId = requestAnimationFrame(animate);

            cleanupScene = () => {
                cancelAnimationFrame(rafId);
                resizeObserver.disconnect();
                themeObserver.disconnect();
                intersectionObserver.disconnect();
                controls.removeEventListener('start', onControlsStart);
                controls.removeEventListener('end', onControlsEnd);
                renderer.domElement.removeEventListener('pointermove', onPointerMove);
                renderer.domElement.removeEventListener('pointerdown', onPointerDown);
                renderer.domElement.removeEventListener('pointerup', onPointerUp);
                renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
                controls.dispose();
                for (const ws of stations.values()) {
                    workstationsGroup.remove(ws.group);
                    ws.dispose();
                }
                stations.clear();
                stationsRef.current = new Map();
                studioEnv.dispose();
                renderer.dispose();
                sceneRefs.current = null;
                resetTriggerRef.current = null;
            };
        });

        return () => {
            cancelAnimationFrame(initRaf);
            cleanupScene?.();
        };
        // Intentionally mounts once; subsequent skills/filter updates run via sceneRefs effect below
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reconcile workstation pool when skills or filters change
    useEffect(() => {
        sceneRefs.current?.reconcileStations();
    }, [skills, visibleSkillIds, selectedId]);

    // Sample inspected logoson song & visible listener count cleanly at 4Hz
    useEffect(() => {
        const targetId = hoveredId ?? selectedId ?? leadSkillId;
        const sample = () => {
            const snap = targetId ? stationsRef.current.get(targetId)?.getMusicState() ?? null : null;
            setActiveMusicSnap(snap);

            let count = 0;
            for (const [id, ws] of stationsRef.current) {
                if (visibleSkillIds.has(id) && ws.getMusicState().isListening) {
                    count++;
                }
            }
            setListeningCount(count);
        };
        sample();
        const interval = window.setInterval(sample, 250);
        return () => window.clearInterval(interval);
    }, [hoveredId, selectedId, leadSkillId, visibleSkillIds]);

    if (webglError) {
        return null;
    }

    const textFallback = getStudioThemeColors().textPrimary;
    const activeTech = activeSkill ? getTechIcon(activeSkill.name) : null;
    const activeColor = activeSkill
        ? resolveThemeColor(activeTech?.color || activeSkill.color, textFallback)
        : '#38bdf8';

    const activeTrackInfo =
        activeMusicSnap && activeMusicSnap.isListening
            ? playlist[activeMusicSnap.songIndex] || playlist[0]
            : null;
    const isInspectAudioSynced =
        Boolean(selectedId && activeSkill?.id === selectedId && activeMusicSnap?.isListening) &&
        isPlaying &&
        currentTrackIndex === activeMusicSnap?.songIndex;
    const displayDurationSec =
        isInspectAudioSynced && duration > 0 ? duration : activeMusicSnap?.durationSec || 200;
    const displayProgressSec = isInspectAudioSynced
        ? currentTime
        : activeMusicSnap?.progressSec || 0;
    const displayProgressPct = Math.max(
        0,
        Math.min(100, (displayProgressSec / Math.max(1, displayDurationSec)) * 100)
    );

    const handleSelectRosterSkill = (skillId: string) => {
        setSelectedId(skillId);
        sceneRefs.current?.triggerCameraReset(skillId);
        inspectSkillAudio(skillId);
        setRosterPinned(false);
        setRosterHovered(false);
    };

    const handleCardMusicToggle = () => {
        if (!activeSkill || !activeMusicSnap?.isListening) return;
        if (isInspectAudioSynced) {
            togglePlay();
            inspectAudioActiveRef.current = !isPlaying;
            return;
        }
        setSelectedId(activeSkill.id);
        sceneRefs.current?.triggerCameraReset(activeSkill.id);
        inspectSkillAudio(activeSkill.id);
    };

    return (
        <div className="skills-3d-stage" aria-label="Interactive 3D Skills Studio">
            <div className="skills-3d-hud-top">
                <div className="skills-3d-hud-group">
                    <button
                        type="button"
                        className={`skills-3d-hud-btn skills-3d-music-btn ${isInspectAudioSynced ? 'playing' : ''}`}
                        onClick={() => {
                            if (selectedId && activeMusicSnap?.isListening) {
                                handleCardMusicToggle();
                            } else if (visibleSkills.length > 0) {
                                const firstListening = visibleSkills.find((s) =>
                                    stationsRef.current.get(s.id)?.getMusicState().isListening
                                );
                                if (firstListening) {
                                    handleSelectRosterSkill(firstListening.id);
                                }
                            }
                        }}
                        aria-pressed={isInspectAudioSynced}
                        title={
                            isInspectAudioSynced && activeTrackInfo
                                ? `Listening with ${activeSkill?.name}: ${activeTrackInfo.title}`
                                : 'Tap any headphone logoson to hear its song'
                        }
                    >
                        {isInspectAudioSynced ? (
                            <span className="skills-3d-music-eq" aria-hidden="true">
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        ) : (
                            <i className="fas fa-headphones" aria-hidden="true"></i>
                        )}
                        <span className="skills-3d-music-title">
                            {isInspectAudioSynced && activeTrackInfo
                                ? `${activeSkill?.name}: ${activeTrackInfo.title}`
                                : isJakartaSleepHours
                                  ? `All ${visibleSkills.length} Listening`
                                  : `${listeningCount} Listening · Tap to hear`}
                        </span>
                        {isJakartaSleepHours && (
                            <span className="skills-3d-music-mode" aria-label="Jakarta night mode">
                                <i className="fas fa-moon" aria-hidden="true"></i>
                                Zzz
                            </span>
                        )}
                    </button>

                    {(selectedId || activeSkill) && (
                        <button
                            type="button"
                            className="skills-3d-hud-btn"
                            onClick={() => resetTriggerRef.current?.()}
                            title="Reset camera to full studio view"
                        >
                            <i className="fas fa-compress-arrows-alt" aria-hidden="true"></i>
                            Reset View
                        </button>
                    )}
                </div>

                <div
                    ref={rosterWrapRef}
                    className="skills-3d-hud-group skills-3d-roster-wrap"
                    onPointerEnter={(e) => {
                        if (e.pointerType !== 'touch') setRosterHovered(true);
                    }}
                    onPointerLeave={(e) => {
                        if (e.pointerType !== 'touch') setRosterHovered(false);
                    }}
                >
                    <button
                        ref={rosterTriggerRef}
                        type="button"
                        className={`skills-3d-hud-btn skills-3d-roster-trigger ${rosterOpen ? 'active' : ''}`}
                        aria-expanded={rosterOpen}
                        aria-haspopup="true"
                        aria-controls="skills-active-popover"
                        onClick={() => setRosterPinned((prev) => !prev)}
                    >
                        <i
                            className="fas fa-globe-americas"
                            aria-hidden="true"
                            style={{ color: rosterOpen ? 'currentColor' : 'var(--primary)' }}
                        ></i>
                        <span>
                            {visibleSkills.length} Active{' '}
                            {visibleSkills.length === 1 ? 'Skill' : 'Skills'}
                        </span>
                        <i
                            className={`fas fa-chevron-down skills-3d-roster-chevron ${rosterOpen ? 'open' : ''}`}
                            aria-hidden="true"
                        ></i>
                    </button>

                    {rosterOpen && (
                        <div
                            id="skills-active-popover"
                            className="skills-3d-roster-panel"
                            role="region"
                            aria-label="Active skills in 3D view"
                        >
                            <div className="skills-3d-roster-header">
                                <span className="skills-3d-roster-title">
                                    Active in Orbit ({visibleSkills.length})
                                </span>
                                <button
                                    type="button"
                                    className="skills-3d-roster-close"
                                    aria-label="Close skills list"
                                    onClick={() => {
                                        setRosterPinned(false);
                                        setRosterHovered(false);
                                    }}
                                >
                                    <i className="fas fa-times" aria-hidden="true"></i>
                                </button>
                            </div>

                            {visibleSkills.length === 0 ? (
                                <div className="skills-3d-roster-empty">
                                    No skills match this filter.
                                </div>
                            ) : (
                                <ul className="skills-3d-roster-list">
                                    {visibleSkills.map((skill) => {
                                        const tech = getTechIcon(skill.name);
                                        const itemColor = resolveThemeColor(
                                            tech?.color || skill.color,
                                            textFallback
                                        );
                                        const isFocused = selectedId === skill.id;
                                        return (
                                            <li key={skill.id}>
                                                <button
                                                    type="button"
                                                    className={`skills-3d-roster-item ${isFocused ? 'selected' : ''}`}
                                                    aria-current={isFocused ? 'true' : undefined}
                                                    onClick={() => handleSelectRosterSkill(skill.id)}
                                                >
                                                    <span
                                                        className="skills-3d-roster-icon"
                                                        style={{ color: itemColor }}
                                                        aria-hidden="true"
                                                    >
                                                        {tech ? tech.icon : <i className="fas fa-code"></i>}
                                                    </span>
                                                    <span className="skills-3d-roster-name">
                                                        {skill.name}
                                                    </span>
                                                    {skill.isLead && (
                                                        <i
                                                            className="fas fa-star skills-3d-roster-lead"
                                                            aria-hidden="true"
                                                            title="Featured 3D Skill"
                                                        ></i>
                                                    )}
                                                    <span className="skills-3d-roster-cat">
                                                        {skill.categories[0] || 'Skill'}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div
                ref={hostRef}
                className={`skills-3d-canvas-host ${isDragging ? 'dragging' : ''}`}
            />

            {activeSkill && (
                <div
                    className="skills-3d-active-card"
                    style={{ borderColor: `${activeColor}66` }}
                >
                    <div className="skills-3d-active-top">
                        <span
                            className="skills-3d-active-icon"
                            style={{ color: activeColor }}
                        >
                            {activeTech ? activeTech.icon : <i className="fas fa-code"></i>}
                        </span>
                        <div className="skills-3d-active-meta">
                            <span className="skills-3d-active-name">
                                {activeSkill.name}
                                {activeSkill.isLead && (
                                    <i
                                        className="fas fa-star"
                                        style={{ color: '#f59e0b', fontSize: '12px' }}
                                        title="Featured 3D Skill (set in Dashboard)"
                                    ></i>
                                )}
                            </span>
                            <span className="skills-3d-active-cats">
                                {activeSkill.categories.join(' · ')}
                            </span>
                        </div>
                    </div>

                    {activeTrackInfo && activeMusicSnap?.isListening && (
                        <div className="skills-3d-track-box">
                            <div className="skills-3d-track-row">
                                <img
                                    src={activeTrackInfo.cover}
                                    alt={`${activeTrackInfo.title} cover`}
                                    className="skills-3d-track-cover"
                                    width={34}
                                    height={34}
                                />
                                <div className="skills-3d-track-info">
                                    <span className="skills-3d-track-title">
                                        {activeTrackInfo.title}
                                    </span>
                                    <span className="skills-3d-track-artist">
                                        {activeTrackInfo.artist}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="skills-3d-track-play"
                                    onClick={handleCardMusicToggle}
                                    aria-label={
                                        isInspectAudioSynced
                                            ? `Pause ${activeTrackInfo.title}`
                                            : `Hear ${activeTrackInfo.title}`
                                    }
                                    title={
                                        isInspectAudioSynced
                                            ? 'Pause song'
                                            : 'Hear song at exact timestamp'
                                    }
                                >
                                    <i
                                        className={`fas ${isInspectAudioSynced ? 'fa-pause' : 'fa-play'}`}
                                        aria-hidden="true"
                                    ></i>
                                </button>
                            </div>
                            <div className="skills-3d-track-progress-row">
                                <div className="skills-3d-track-bar" aria-hidden="true">
                                    <div
                                        className="skills-3d-track-bar-fill"
                                        style={{ width: `${displayProgressPct}%` }}
                                    ></div>
                                </div>
                                <span className="skills-3d-track-time">
                                    {formatTrackTime(displayProgressSec)} / {formatTrackTime(displayDurationSec)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="skills-3d-hint">
                Drag to orbit · Scroll to zoom · Click a skill logo to focus
            </div>

            {warningText && (
                <p className="skills-3d-warning-note">
                    {warningText}
                </p>
            )}
        </div>
    );
};

export default SkillsRoom3D;
