import * as THREE from 'three';
import {
    createNameplateTexture,
    createSkillLogoTexture,
    getMusicNoteTexture,
    getSleepyZzzTexture,
    resolveThemeColor,
} from './textures';
import { EARTH_RADIUS } from './studioRoom';
import type { Skill3DNode, StudioThemeColors } from './types';

export interface MascotNeighbor {
    id: string;
    x: number;
    y: number;
    z: number;
}

export interface MascotMusicSnapshot {
    isListening: boolean;
    isSleepHours: boolean;
    songIndex: number;
    progressSec: number;
    durationSec: number;
}

export interface SkillWorkstation {
    group: THREE.Group;
    skill: Skill3DNode;
    setSkill: (skill: Skill3DNode, index: number) => void;
    setTheme: (theme: StudioThemeColors) => void;
    setInitialPosition: (x: number, y: number, z: number) => void;
    getPositionNormal: () => { x: number; y: number; z: number };
    getMusicState: () => MascotMusicSnapshot;
    update: (
        dt: number,
        elapsed: number,
        opts: {
            isSelected: boolean;
            isHovered: boolean;
            isVisible: boolean;
            isJakartaNight: boolean;
            musicEpoch: number;
            liveAudioEnergy: number;
            syncedAudioSongIndex?: number;
            syncedAudioTime?: number;
            syncedAudioDuration?: number;
            cameraPos: THREE.Vector3;
            cameraQuat: THREE.Quaternion;
            neighbors: MascotNeighbor[];
        }
    ) => void;
    getHitTarget: () => THREE.Object3D;
    getFocusTargetWorld: (out: THREE.Vector3) => THREE.Vector3;
    dispose: () => void;
}

function damp(current: number, target: number, speed: number, dt: number): number {
    return current + (target - current) * (1 - Math.exp(-speed * dt));
}

function resolveFallbackPrimary(theme: StudioThemeColors): string {
    return theme.textPrimary || (theme.isLight ? '#0f172a' : '#f8fafc');
}

interface SharedMascotAssets {
    hitBox: THREE.BoxGeometry;
    shadowDisc: THREE.CircleGeometry;
    floorRing: THREE.RingGeometry;
    coinCore: THREE.CylinderGeometry;
    outerTorus: THREE.TorusGeometry;
    faceCircle: THREE.CircleGeometry;
    leadCrown: THREE.TorusGeometry;
    armCyl: THREE.CylinderGeometry;
    handSphere: THREE.SphereGeometry;
    legCyl: THREE.CylinderGeometry;
    shoeBox: THREE.BoxGeometry;
    nameplatePlane: THREE.PlaneGeometry;
    barbellBar: THREE.CylinderGeometry;
    barbellPlate: THREE.CylinderGeometry;
    guitarBody: THREE.CylinderGeometry;
    guitarNeck: THREE.BoxGeometry;
    carChassisBox: THREE.BoxGeometry;
    carGlassBox: THREE.BoxGeometry;
    carSteeringTorus: THREE.TorusGeometry;
    carWheelCyl: THREE.CylinderGeometry;
    carRimCyl: THREE.CylinderGeometry;
    carLightBox: THREE.BoxGeometry;
    bikeWheelTorus: THREE.TorusGeometry;
    bikeSpokeBox: THREE.BoxGeometry;
    bikeTubeCyl: THREE.CylinderGeometry;
    bikeSeatBox: THREE.BoxGeometry;
    bikeHandleCyl: THREE.CylinderGeometry;
    headbandTorus: THREE.TorusGeometry;
    earCupCyl: THREE.CylinderGeometry;
    earAccentCyl: THREE.CylinderGeometry;
    musicNotePlane: THREE.PlaneGeometry;
    sleepyZzzPlane: THREE.PlaneGeometry;
    hitMat: THREE.MeshBasicMaterial;
    coinBodyMat: THREE.MeshLambertMaterial;
    limbMat: THREE.MeshLambertMaterial;
    gloveMat: THREE.MeshLambertMaterial;
    crownMat: THREE.MeshBasicMaterial;
    shadowMat: THREE.MeshBasicMaterial;
    barbellBarMat: THREE.MeshLambertMaterial;
    barbellPlateMat: THREE.MeshLambertMaterial;
    guitarBodyMat: THREE.MeshLambertMaterial;
    guitarNeckMat: THREE.MeshLambertMaterial;
    carGlassMat: THREE.MeshBasicMaterial;
    carLightMat: THREE.MeshBasicMaterial;
    carTailMat: THREE.MeshBasicMaterial;
    headphoneMat: THREE.MeshLambertMaterial;
    headphoneAccentMat: THREE.MeshLambertMaterial;
    musicNoteMat: THREE.MeshBasicMaterial;
    sleepyZzzMat: THREE.MeshBasicMaterial;
}

let sharedAssets: SharedMascotAssets | null = null;

function getSharedMascotAssets(theme: StudioThemeColors): SharedMascotAssets {
    if (!sharedAssets) {
        sharedAssets = {
            hitBox: new THREE.BoxGeometry(1.15, 1.6, 1.05),
            shadowDisc: new THREE.CircleGeometry(0.36, 24),
            floorRing: new THREE.RingGeometry(0.39, 0.46, 40),
            coinCore: new THREE.CylinderGeometry(0.4, 0.4, 0.13, 40),
            outerTorus: new THREE.TorusGeometry(0.41, 0.038, 12, 40),
            faceCircle: new THREE.CircleGeometry(0.39, 40),
            leadCrown: new THREE.TorusGeometry(0.14, 0.032, 10, 28),
            armCyl: new THREE.CylinderGeometry(0.038, 0.034, 0.25, 6),
            handSphere: new THREE.SphereGeometry(0.082, 6, 6),
            legCyl: new THREE.CylinderGeometry(0.042, 0.038, 0.25, 6),
            shoeBox: new THREE.BoxGeometry(0.13, 0.095, 0.21),
            nameplatePlane: new THREE.PlaneGeometry(1.06, 0.265),
            barbellBar: new THREE.CylinderGeometry(0.022, 0.022, 1.08, 6),
            barbellPlate: new THREE.CylinderGeometry(0.15, 0.15, 0.065, 12),
            guitarBody: new THREE.CylinderGeometry(0.16, 0.19, 0.065, 10),
            guitarNeck: new THREE.BoxGeometry(0.048, 0.4, 0.028),
            carChassisBox: new THREE.BoxGeometry(0.66, 0.24, 1.04),
            carGlassBox: new THREE.BoxGeometry(0.54, 0.17, 0.04),
            carSteeringTorus: new THREE.TorusGeometry(0.085, 0.018, 6, 12),
            carWheelCyl: new THREE.CylinderGeometry(0.14, 0.14, 0.085, 24),
            carRimCyl: new THREE.CylinderGeometry(0.07, 0.07, 0.094, 16),
            carLightBox: new THREE.BoxGeometry(0.11, 0.07, 0.03),
            bikeWheelTorus: new THREE.TorusGeometry(0.21, 0.032, 10, 28),
            bikeSpokeBox: new THREE.BoxGeometry(0.018, 0.37, 0.018),
            bikeTubeCyl: new THREE.CylinderGeometry(0.024, 0.024, 0.56, 6),
            bikeSeatBox: new THREE.BoxGeometry(0.14, 0.05, 0.2),
            bikeHandleCyl: new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6),
            headbandTorus: new THREE.TorusGeometry(0.45, 0.032, 12, 36, Math.PI),
            earCupCyl: new THREE.CylinderGeometry(0.115, 0.115, 0.085, 24),
            earAccentCyl: new THREE.CylinderGeometry(0.08, 0.08, 0.095, 24),
            musicNotePlane: new THREE.PlaneGeometry(0.34, 0.34),
            sleepyZzzPlane: new THREE.PlaneGeometry(0.46, 0.27),
            hitMat: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
            coinBodyMat: new THREE.MeshLambertMaterial(),
            limbMat: new THREE.MeshLambertMaterial(),
            gloveMat: new THREE.MeshLambertMaterial(),
            crownMat: new THREE.MeshBasicMaterial({ color: '#f59e0b' }),
            shadowMat: new THREE.MeshBasicMaterial({
                color: '#082f49',
                transparent: true,
                opacity: 0.28,
                side: THREE.DoubleSide,
                depthWrite: false,
            }),
            barbellBarMat: new THREE.MeshLambertMaterial({ color: '#cbd5e1' }),
            barbellPlateMat: new THREE.MeshLambertMaterial({ color: '#0ea5e9' }),
            guitarBodyMat: new THREE.MeshLambertMaterial({ color: '#f97316' }),
            guitarNeckMat: new THREE.MeshLambertMaterial({ color: '#fef3c7' }),
            carGlassMat: new THREE.MeshBasicMaterial({
                color: '#bae6fd',
                transparent: true,
                opacity: 0.72,
            }),
            carLightMat: new THREE.MeshBasicMaterial({ color: '#fef08a' }),
            carTailMat: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
            headphoneMat: new THREE.MeshLambertMaterial({ color: '#0f172a' }),
            headphoneAccentMat: new THREE.MeshLambertMaterial({ color: '#38bdf8' }),
            musicNoteMat: new THREE.MeshBasicMaterial({
                map: getMusicNoteTexture(),
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            }),
            sleepyZzzMat: new THREE.MeshBasicMaterial({
                map: getSleepyZzzTexture(),
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            }),
        };
    }
    syncSharedMascotTheme(theme);
    return sharedAssets;
}

export function syncSharedMascotTheme(theme: StudioThemeColors): void {
    if (!sharedAssets) return;
    sharedAssets.coinBodyMat.color.set(theme.isLight ? '#faf2df' : '#1e293b');
    sharedAssets.limbMat.color.set(theme.isLight ? '#e2e8f0' : '#94a3b8');
    sharedAssets.gloveMat.color.set(theme.isLight ? '#ffffff' : '#f1f5f9');
    sharedAssets.shadowMat.opacity = theme.isLight ? 0.24 : 0.34;
}

function makeInitialTangent(normal: THREE.Vector3, angleSeed: number, out: THREE.Vector3): THREE.Vector3 {
    const ref = Math.abs(normal.y) < 0.85 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const t1 = new THREE.Vector3().crossVectors(ref, normal).normalize();
    const t2 = new THREE.Vector3().crossVectors(normal, t1).normalize();
    return out
        .copy(t1)
        .multiplyScalar(Math.cos(angleSeed))
        .addScaledVector(t2, Math.sin(angleSeed))
        .normalize();
}

export function createSkillWorkstation(
    initialSkill: Skill3DNode,
    initialIndex: number,
    initialTheme: StudioThemeColors,
    playlistLength = 1
): SkillWorkstation {
    let currentSkill = initialSkill;
    let currentTheme = initialTheme;
    type MascotActivity =
        | 'walk'
        | 'look'
        | 'wave'
        | 'stretch'
        | 'hop'
        | 'lift'
        | 'car'
        | 'bike'
        | 'listen'
        | 'sing'
        | 'guitar'
        | 'sleep';
    const IDLE_ACTIVITIES: MascotActivity[] = [
        'car',
        'bike',
        'lift',
        'wave',
        'stretch',
        'hop',
        'look',
        'guitar',
        'sing',
        'listen',
    ];

    const phase = initialIndex * 1.37;
    let rngState = ((initialIndex + 1) * 2654435761) >>> 0;
    const nextRand = (): number => {
        rngState = (rngState * 1664525 + 1013904223) >>> 0;
        return rngState / 4294967296;
    };

    // Shuffled deck of all 7 activities so each mascot never repeats an activity before cycling all 7
    const activityBag: MascotActivity[] = [];
    let lastIdleActivity: MascotActivity | null = null;
    const drawNextIdleActivity = (): MascotActivity => {
        if (activityBag.length === 0) {
            activityBag.push(...IDLE_ACTIVITIES);
            for (let i = activityBag.length - 1; i > 0; i--) {
                const j = Math.floor(nextRand() * (i + 1));
                const tmp = activityBag[i];
                activityBag[i] = activityBag[j];
                activityBag[j] = tmp;
            }
            if (lastIdleActivity && activityBag[activityBag.length - 1] === lastIdleActivity) {
                const swapIdx = activityBag.length - 2;
                const tmp = activityBag[activityBag.length - 1];
                activityBag[activityBag.length - 1] = activityBag[swapIdx];
                activityBag[swapIdx] = tmp;
            }
        }
        const picked = activityBag.pop() ?? 'wave';
        lastIdleActivity = picked;
        return picked;
    };

    let skillColor = resolveThemeColor(currentSkill.color, resolveFallbackPrimary(currentTheme));

    const shared = getSharedMascotAssets(currentTheme);

    const group = new THREE.Group();
    group.name = `skill-mascot-${currentSkill.id}`;

    // Invisible compact bounding box for pointer raycasting
    const hitTarget = new THREE.Mesh(shared.hitBox, shared.hitMat);
    hitTarget.position.set(0, 0.78, 0);
    hitTarget.userData = { skillId: currentSkill.id };
    group.add(hitTarget);

    const focusAnchor = new THREE.Object3D();
    focusAnchor.position.set(0, 0.85, 0);
    group.add(focusAnchor);

    // Per-skill accent material (shared between rim and shoes to cut material count in half)
    const accentMat = new THREE.MeshLambertMaterial({
        color: skillColor,
    });

    // Contact shadow & accent ring resting on the Earth's surface beneath sneakers
    const shadowDisc = new THREE.Mesh(shared.shadowDisc, shared.shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.032;
    group.add(shadowDisc);

    const floorRingMat = new THREE.MeshBasicMaterial({
        color: skillColor,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const floorRing = new THREE.Mesh(shared.floorRing, floorRingMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = 0.038;
    group.add(floorRing);

    // Animated body rig (bobs & tilts while walking around the Earth)
    const bodyRig = new THREE.Group();
    group.add(bodyRig);

    // 3D Skill Logo Medallion Body (center at y = 0.76)
    const logoGroup = new THREE.Group();
    logoGroup.position.set(0, 0.76, 0);
    bodyRig.add(logoGroup);

    const coinCore = new THREE.Mesh(shared.coinCore, shared.coinBodyMat);
    coinCore.rotation.x = Math.PI / 2;
    logoGroup.add(coinCore);

    const outerTorus = new THREE.Mesh(shared.outerTorus, accentMat);
    logoGroup.add(outerTorus);

    let logoTexture = createSkillLogoTexture(currentSkill.name, currentSkill.color, currentTheme);
    const faceMat = new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true });

    const frontFace = new THREE.Mesh(shared.faceCircle, faceMat);
    frontFace.position.z = 0.068;
    logoGroup.add(frontFace);

    const backFace = new THREE.Mesh(shared.faceCircle, faceMat);
    backFace.rotation.y = Math.PI;
    backFace.position.z = -0.068;
    logoGroup.add(backFace);

    // Lead star/crown floating above medallion when Admin marks skill as featured (isLead)
    const leadCrown = new THREE.Mesh(shared.leadCrown, shared.crownMat);
    leadCrown.rotation.x = Math.PI / 2;
    leadCrown.position.set(0, 1.28, 0);
    leadCrown.visible = Boolean(currentSkill.isLead);
    bodyRig.add(leadCrown);

    // Cute Arms + Gloved Hands attached cleanly to left & right of medallion
    const buildArm = (side: -1 | 1) => {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.42, 0.74, 0);
        pivot.rotation.z = side * 0.24;
        bodyRig.add(pivot);

        const arm = new THREE.Mesh(shared.armCyl, shared.limbMat);
        arm.position.y = -0.13;
        pivot.add(arm);

        const hand = new THREE.Mesh(shared.handSphere, shared.gloveMat);
        hand.position.y = -0.27;
        pivot.add(hand);

        return pivot;
    };

    const leftArmPivot = buildArm(-1);
    const rightArmPivot = buildArm(1);

    // Cute Legs + Sneakers attached to bottom of medallion
    const buildLeg = (side: -1 | 1) => {
        const hip = new THREE.Group();
        hip.position.set(side * 0.15, 0.36, 0);
        bodyRig.add(hip);

        const leg = new THREE.Mesh(shared.legCyl, shared.limbMat);
        leg.position.y = -0.12;
        hip.add(leg);

        const shoe = new THREE.Mesh(shared.shoeBox, accentMat);
        shoe.position.set(0, -0.28, 0.035);
        hip.add(shoe);

        return hip;
    };

    const leftHipPivot = buildLeg(-1);
    const rightHipPivot = buildLeg(1);

    // Floating camera-facing pill nameplate above the mascot
    const nameplatePivot = new THREE.Group();
    nameplatePivot.position.set(0, 1.44, 0);
    group.add(nameplatePivot);

    const nameplateMat = new THREE.MeshBasicMaterial({
        map: createNameplateTexture(
            currentSkill.name,
            currentSkill.color,
            currentTheme,
            Boolean(currentSkill.isLead)
        ),
        transparent: true,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
    });
    const nameplateMesh = new THREE.Mesh(shared.nameplatePlane, nameplateMat);
    nameplatePivot.add(nameplateMesh);

    // Lightweight activity props (all share pooled geometries/materials; hidden when inactive)
    const barbellProp = new THREE.Group();
    barbellProp.visible = false;
    bodyRig.add(barbellProp);

    const barMesh = new THREE.Mesh(shared.barbellBar, shared.barbellBarMat);
    barMesh.rotation.z = Math.PI / 2;
    barbellProp.add(barMesh);

    const leftPlate = new THREE.Mesh(shared.barbellPlate, shared.barbellPlateMat);
    leftPlate.rotation.z = Math.PI / 2;
    leftPlate.position.x = -0.45;
    barbellProp.add(leftPlate);

    const rightPlate = new THREE.Mesh(shared.barbellPlate, shared.barbellPlateMat);
    rightPlate.rotation.z = Math.PI / 2;
    rightPlate.position.x = 0.45;
    barbellProp.add(rightPlate);

    const guitarProp = new THREE.Group();
    guitarProp.position.set(0.03, 0.66, 0.16);
    guitarProp.rotation.z = -0.68;
    guitarProp.visible = false;
    bodyRig.add(guitarProp);

    const guitarBodyMesh = new THREE.Mesh(shared.guitarBody, shared.guitarBodyMat);
    guitarBodyMesh.rotation.x = Math.PI / 2;
    guitarProp.add(guitarBodyMesh);

    const guitarNeckMesh = new THREE.Mesh(shared.guitarNeck, shared.guitarNeckMat);
    guitarNeckMesh.position.y = 0.25;
    guitarProp.add(guitarNeckMesh);

    const headphoneProp = new THREE.Group();
    headphoneProp.visible = false;
    bodyRig.add(headphoneProp);

    const headbandMesh = new THREE.Mesh(shared.headbandTorus, shared.headphoneMat);
    headbandMesh.position.set(0, 0.76, 0);
    headphoneProp.add(headbandMesh);

    const addEarCup = (side: -1 | 1) => {
        const cup = new THREE.Mesh(shared.earCupCyl, shared.headphoneMat);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(side * 0.45, 0.76, 0);
        headphoneProp.add(cup);

        const accent = new THREE.Mesh(shared.earAccentCyl, shared.headphoneAccentMat);
        accent.rotation.z = Math.PI / 2;
        accent.position.set(side * 0.465, 0.76, 0);
        headphoneProp.add(accent);
    };
    addEarCup(-1);
    addEarCup(1);

    const carProp = new THREE.Group();
    carProp.visible = false;
    group.add(carProp);

    const carChassis = new THREE.Mesh(shared.carChassisBox, accentMat);
    carChassis.position.set(0, 0.27, 0.04);
    carProp.add(carChassis);

    const carWindshield = new THREE.Mesh(shared.carGlassBox, shared.carGlassMat);
    carWindshield.position.set(0, 0.44, 0.36);
    carWindshield.rotation.x = -0.35;
    carProp.add(carWindshield);

    const carSteering = new THREE.Mesh(shared.carSteeringTorus, shared.headphoneMat);
    carSteering.position.set(0, 0.46, 0.23);
    carSteering.rotation.x = -0.45;
    carProp.add(carSteering);

    const carWheels: THREE.Group[] = [];
    for (const wx of [-0.35, 0.35] as const) {
        for (const wz of [-0.3, 0.36] as const) {
            const wheelGroup = new THREE.Group();
            wheelGroup.position.set(wx, 0.14, wz);
            const tire = new THREE.Mesh(shared.carWheelCyl, shared.headphoneMat);
            tire.rotation.z = Math.PI / 2;
            wheelGroup.add(tire);
            const rim = new THREE.Mesh(shared.carRimCyl, shared.barbellBarMat);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);
            carProp.add(wheelGroup);
            carWheels.push(wheelGroup);
        }
    }

    for (const lx of [-0.22, 0.22] as const) {
        const headlight = new THREE.Mesh(shared.carLightBox, shared.carLightMat);
        headlight.position.set(lx, 0.29, 0.565);
        carProp.add(headlight);

        const taillight = new THREE.Mesh(shared.carLightBox, shared.carTailMat);
        taillight.position.set(lx, 0.29, -0.485);
        carProp.add(taillight);
    }

    const bikeProp = new THREE.Group();
    bikeProp.visible = false;
    group.add(bikeProp);

    const bikeWheels: THREE.Group[] = [];
    for (const wz of [-0.4, 0.4] as const) {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(0, 0.21, wz);
        const tire = new THREE.Mesh(shared.bikeWheelTorus, shared.headphoneMat);
        tire.rotation.y = Math.PI / 2;
        wheelGroup.add(tire);
        const spokeA = new THREE.Mesh(shared.bikeSpokeBox, shared.barbellBarMat);
        wheelGroup.add(spokeA);
        const spokeB = new THREE.Mesh(shared.bikeSpokeBox, shared.barbellBarMat);
        spokeB.rotation.x = Math.PI / 2;
        wheelGroup.add(spokeB);
        bikeProp.add(wheelGroup);
        bikeWheels.push(wheelGroup);
    }

    const rearStay = new THREE.Mesh(shared.bikeTubeCyl, accentMat);
    rearStay.position.set(0, 0.35, -0.22);
    rearStay.rotation.x = 0.92;
    bikeProp.add(rearStay);

    const mainTube = new THREE.Mesh(shared.bikeTubeCyl, accentMat);
    mainTube.position.set(0, 0.4, 0.12);
    mainTube.rotation.x = -0.95;
    bikeProp.add(mainTube);

    const frontFork = new THREE.Mesh(shared.bikeTubeCyl, accentMat);
    frontFork.position.set(0, 0.46, 0.35);
    frontFork.rotation.x = -0.18;
    bikeProp.add(frontFork);

    const bikeSeat = new THREE.Mesh(shared.bikeSeatBox, shared.headphoneMat);
    bikeSeat.position.set(0, 0.49, -0.09);
    bikeProp.add(bikeSeat);

    const bikeHandlebar = new THREE.Mesh(shared.bikeHandleCyl, shared.headphoneMat);
    bikeHandlebar.position.set(0, 0.72, 0.31);
    bikeHandlebar.rotation.z = Math.PI / 2;
    bikeProp.add(bikeHandlebar);

    const musicNoteMesh = new THREE.Mesh(shared.musicNotePlane, shared.musicNoteMat);
    musicNoteMesh.position.set(0.38, 1.32, 0.05);
    musicNoteMesh.visible = false;
    group.add(musicNoteMesh);

    const sleepyZzzMesh = new THREE.Mesh(shared.sleepyZzzPlane, shared.sleepyZzzMat);
    sleepyZzzMesh.position.set(-0.36, 1.32, 0.06);
    sleepyZzzMesh.visible = false;
    group.add(sleepyZzzMesh);

    // Continuous great-circle walking state on the 3D Earth (never deadlocks or freezes)
    const normal = new THREE.Vector3(0, 0.35, 0.93).normalize();
    const tangentDir = makeInitialTangent(normal, initialIndex * 2.19, new THREE.Vector3());
    const facingDir = tangentDir.clone();

    const sideTangent = new THREE.Vector3();
    const awayVec = new THREE.Vector3();
    const camVec = new THREE.Vector3();
    const rightVec = new THREE.Vector3();
    const forwardVec = new THREE.Vector3();
    const basisMat = new THREE.Matrix4();
    const invGroupQuat = new THREE.Quaternion();

    let walkPhase = phase;
    let wheelAngle = 0;
    let pedalPhase = phase;
    let visScale = 1;
    let hoverBoost = 0;
    let ringOpacity = 0.38;
    let waveBlend = 0;
    let stretchBlend = 0;
    let lookBlend = 0;
    let hopBlend = 0;
    let liftBlend = 0;
    let carBlend = 0;
    let bikeBlend = 0;
    let listenBlend = 0;
    let singBlend = 0;
    let guitarBlend = 0;
    let sleepBlend = 0;
    let headphoneBlend = 0;
    let smoothMusicEnergy = 0;
    let lastMusicEpoch = -1;
    let daytimeListener = false;
    const safePlaylistLen = Math.max(1, playlistLength);
    const pickRandomSongIndex = (exclude?: number): number => {
        if (safePlaylistLen <= 1) return 0;
        let next = Math.floor(Math.random() * safePlaylistLen);
        if (next === exclude) {
            next = (next + 1 + Math.floor(Math.random() * (safePlaylistLen - 1))) % safePlaylistLen;
        }
        return next;
    };
    let songIndex = pickRandomSongIndex();
    let songDurationSec = 185 + (songIndex % 6) * 14;
    let songProgressSec = Math.floor(Math.random() * Math.max(1, songDurationSec - 25));
    let isListeningState = false;
    let isSleepState = false;
    let hasSpawnPos = false;
    const baseWalkSpeed = 0.46 + (initialIndex % 5) * 0.055;
    let currentSpeed = baseWalkSpeed;

    let activity: MascotActivity =
        initialIndex === 0
            ? 'lift'
            : initialIndex % 8 === 1
              ? 'wave'
              : initialIndex % 8 === 2
                ? 'bike'
                : initialIndex % 8 === 3
                  ? 'stretch'
                  : initialIndex % 8 === 4
                    ? 'car'
                    : initialIndex % 8 === 5
                      ? 'guitar'
                      : initialIndex % 8 === 6
                        ? 'sing'
                        : initialIndex % 8 === 7
                          ? 'listen'
                          : 'walk';
    if (activity !== 'walk') {
        lastIdleActivity = activity;
    }
    let activityTimer =
        activity === 'walk'
            ? 12.0 + (initialIndex % 5) * 2.5
            : activity === 'car' || activity === 'bike'
              ? 18.0 + (initialIndex % 4) * 3.0
              : activity === 'lift'
                ? 14.0 + (initialIndex % 3) * 2.5
                : 10.0 + (initialIndex % 3) * 2.0;
    let activityClock = 0;

    const syncSurfaceTransform = (): void => {
        group.position.copy(normal).multiplyScalar(EARTH_RADIUS);
        rightVec.crossVectors(normal, facingDir);
        if (rightVec.lengthSq() < 0.0001) {
            makeInitialTangent(normal, phase, facingDir);
            rightVec.crossVectors(normal, facingDir);
        }
        rightVec.normalize();
        forwardVec.crossVectors(rightVec, normal).normalize();
        basisMat.makeBasis(rightVec, normal, forwardVec);
        group.quaternion.setFromRotationMatrix(basisMat);
    };

    const applyVisualColors = (): void => {
        skillColor = resolveThemeColor(currentSkill.color, resolveFallbackPrimary(currentTheme));
        accentMat.color.set(skillColor);
        floorRingMat.color.set(skillColor);
        syncSharedMascotTheme(currentTheme);
        leadCrown.visible = Boolean(currentSkill.isLead);
        nameplatePivot.position.y = currentSkill.isLead ? 1.54 : 1.42;

        nameplateMat.map = createNameplateTexture(
            currentSkill.name,
            currentSkill.color,
            currentTheme,
            Boolean(currentSkill.isLead)
        );
        nameplateMat.needsUpdate = true;

        logoTexture = createSkillLogoTexture(currentSkill.name, currentSkill.color, currentTheme);
        faceMat.map = logoTexture;
        faceMat.needsUpdate = true;
    };

    const setInitialPosition = (x: number, y: number, z: number): void => {
        if (hasSpawnPos) return;
        hasSpawnPos = true;
        normal.set(x, y, z).normalize();
        makeInitialTangent(normal, initialIndex * 2.19 + 0.5, tangentDir);
        facingDir.copy(tangentDir);
        syncSurfaceTransform();
    };

    const getPositionNormal = (): { x: number; y: number; z: number } => ({
        x: normal.x,
        y: normal.y,
        z: normal.z,
    });

    const setSkill = (skill: Skill3DNode, _index: number): void => {
        const changed =
            skill.name !== currentSkill.name ||
            skill.color !== currentSkill.color ||
            Boolean(skill.isLead) !== Boolean(currentSkill.isLead);
        currentSkill = skill;
        hitTarget.userData = { skillId: skill.id };
        group.name = `skill-mascot-${skill.id}`;
        if (changed) applyVisualColors();
    };

    const setTheme = (theme: StudioThemeColors): void => {
        currentTheme = theme;
        applyVisualColors();
    };

    const update: SkillWorkstation['update'] = (dt, elapsed, opts) => {
        const safeDt = Math.min(Math.max(dt, 0), 0.05);

        visScale = damp(visScale, opts.isVisible ? 1 : 0, 10, safeDt);
        group.visible = visScale > 0.02;
        if (!group.visible) return;

        const interactive = opts.isSelected || opts.isHovered;
        const targetBoost = opts.isSelected ? 0.24 : opts.isHovered ? 0.12 : currentSkill.isLead ? 0.08 : 0;
        hoverBoost = damp(hoverBoost, targetBoost, 10, safeDt);

        if (opts.musicEpoch !== lastMusicEpoch) {
            const wasDaytimeListener = daytimeListener;
            lastMusicEpoch = opts.musicEpoch;
            const roll =
                (((initialIndex + 1) * 2654435761) ^ ((opts.musicEpoch + 3) * 2246822519)) >>> 0;
            daytimeListener = roll % 100 < 45 || initialIndex % 4 === opts.musicEpoch % 4;
            // Keep selected mascot steady while inspected; otherwise shuffle song when starting a daytime listen
            if (opts.isSelected && wasDaytimeListener) {
                daytimeListener = true;
            } else if (!wasDaytimeListener && daytimeListener) {
                songIndex = pickRandomSongIndex(songIndex);
                songDurationSec = 185 + (songIndex % 6) * 14;
                songProgressSec = Math.floor(Math.random() * Math.max(1, songDurationSec - 25));
            }
        }

        const isNightMode = opts.isJakartaNight;
        const isListeningNow =
            isNightMode ||
            daytimeListener ||
            activity === 'guitar' ||
            activity === 'sing' ||
            activity === 'listen';
        isListeningState = isListeningNow;
        isSleepState = isNightMode;

        if (isListeningNow) {
            if (opts.isSelected && opts.syncedAudioSongIndex !== undefined) {
                songIndex = opts.syncedAudioSongIndex;
                if (
                    opts.syncedAudioDuration !== undefined &&
                    opts.syncedAudioDuration > 0 &&
                    opts.syncedAudioTime !== undefined
                ) {
                    songDurationSec = opts.syncedAudioDuration;
                    songProgressSec = opts.syncedAudioTime;
                } else {
                    songDurationSec = 185 + (songIndex % 6) * 14;
                }
            } else {
                songProgressSec += safeDt;
                if (songProgressSec >= songDurationSec) {
                    songProgressSec = 0;
                    songIndex = pickRandomSongIndex(songIndex);
                    songDurationSec = 185 + (songIndex % 6) * 14;
                }
            }
        }

        const selfBeatEnergy = isListeningNow
            ? 0.24 + 0.52 * Math.pow(0.5 + 0.5 * Math.sin(songProgressSec * 6.4 + phase), 2)
            : 0;
        const targetEnergy =
            opts.isSelected && opts.liveAudioEnergy > 0 ? opts.liveAudioEnergy : selfBeatEnergy;
        smoothMusicEnergy = damp(smoothMusicEnergy, targetEnergy, 12, safeDt);

        if (!interactive) {
            activityClock += safeDt;

            if (isNightMode) {
                activity = 'sleep';
                currentSpeed = damp(currentSpeed, 0, 6.0, safeDt);
                // Face calmly toward camera in place while resting
                camVec.copy(opts.cameraPos).addScaledVector(normal, -EARTH_RADIUS);
                camVec.addScaledVector(normal, -normal.dot(camVec));
                if (camVec.lengthSq() > 0.0001) {
                    camVec.normalize();
                    facingDir.lerp(camVec, 1 - Math.exp(-3.0 * safeDt));
                    facingDir.addScaledVector(normal, -normal.dot(facingDir));
                    if (facingDir.lengthSq() > 0.0001) {
                        facingDir.normalize();
                    }
                }
            } else {
                if (activity === 'sleep') {
                    activity = 'walk';
                    activityTimer = 12.0 + nextRand() * 8.0;
                    activityClock = 0;
                }

                activityTimer -= safeDt;
                if (activityTimer <= 0) {
                    if (activity === 'walk') {
                        activity = drawNextIdleActivity();
                        if (activity === 'car') {
                            activityTimer = 20.0 + nextRand() * 12.0;
                        } else if (activity === 'bike') {
                            activityTimer = 18.0 + nextRand() * 10.0;
                        } else if (activity === 'lift') {
                            activityTimer = 14.0 + nextRand() * 8.0;
                        } else if (activity === 'stretch') {
                            activityTimer = 12.0 + nextRand() * 6.0;
                        } else if (
                            activity === 'guitar' ||
                            activity === 'sing' ||
                            activity === 'listen'
                        ) {
                            activityTimer = 14.0 + nextRand() * 8.0;
                        } else {
                            activityTimer = 8.0 + nextRand() * 6.0;
                        }
                    } else {
                        activity = 'walk';
                        activityTimer = 14.0 + nextRand() * 10.0;
                    }
                    activityClock = 0;
                }

                if (activity === 'walk' || activity === 'car' || activity === 'bike') {
                    // Calm great-circle strolling or cruising + gentle neighbor deflection
                    sideTangent.crossVectors(normal, tangentDir).normalize();
                    const wanderTurn =
                        Math.sin(elapsed * 0.45 + phase) * (activity === 'walk' ? 0.34 : 0.24);
                    tangentDir.addScaledVector(sideTangent, wanderTurn * safeDt);

                    for (const other of opts.neighbors) {
                        if (other.id === currentSkill.id) continue;
                        const dx = normal.x - other.x;
                        const dy = normal.y - other.y;
                        const dz = normal.z - other.z;
                        const chordSq = dx * dx + dy * dy + dz * dz;
                        if (chordSq > 0.0001 && chordSq < 0.42 * 0.42) {
                            const chord = Math.sqrt(chordSq);
                            awayVec
                                .set(dx, dy, dz)
                                .addScaledVector(normal, -(dx * normal.x + dy * normal.y + dz * normal.z));
                            if (awayVec.lengthSq() > 0.0001) {
                                awayVec.normalize();
                                tangentDir.addScaledVector(awayVec, (0.42 - chord) * 7.5 * safeDt);
                            }
                        }
                    }

                    tangentDir.addScaledVector(normal, -normal.dot(tangentDir));
                    if (tangentDir.lengthSq() > 0.0001) {
                        tangentDir.normalize();
                    } else {
                        makeInitialTangent(normal, elapsed + phase, tangentDir);
                    }

                    const targetMoveSpeed =
                        activity === 'car'
                            ? baseWalkSpeed * 2.15
                            : activity === 'bike'
                              ? baseWalkSpeed * 1.72
                              : baseWalkSpeed;
                    currentSpeed = damp(currentSpeed, targetMoveSpeed, 4.5, safeDt);
                    const angularStep = (currentSpeed / EARTH_RADIUS) * safeDt;
                    normal.addScaledVector(tangentDir, angularStep).normalize();
                    tangentDir.addScaledVector(normal, -normal.dot(tangentDir)).normalize();

                    facingDir.lerp(tangentDir, 1 - Math.exp(-6.0 * safeDt));
                    facingDir.addScaledVector(normal, -normal.dot(facingDir));
                    if (facingDir.lengthSq() > 0.0001) {
                        facingDir.normalize();
                    } else {
                        facingDir.copy(tangentDir);
                    }
                } else {
                    currentSpeed = damp(currentSpeed, 0, 5.5, safeDt);
                    if (
                        activity === 'wave' ||
                        activity === 'lift' ||
                        activity === 'guitar' ||
                        activity === 'sing' ||
                        activity === 'listen'
                    ) {
                        camVec.copy(opts.cameraPos).addScaledVector(normal, -EARTH_RADIUS);
                        camVec.addScaledVector(normal, -normal.dot(camVec));
                        if (camVec.lengthSq() > 0.0001) {
                            camVec.normalize();
                            facingDir.lerp(camVec, 1 - Math.exp(-4.5 * safeDt));
                            facingDir.addScaledVector(normal, -normal.dot(facingDir));
                            if (facingDir.lengthSq() > 0.0001) {
                                facingDir.normalize();
                            }
                        }
                    }
                }
            }
        } else {
            currentSpeed = damp(currentSpeed, 0, 8.5, safeDt);
            // Smoothly turn in the local tangent plane to face the camera when hovered/clicked
            camVec.copy(opts.cameraPos).addScaledVector(normal, -EARTH_RADIUS);
            camVec.addScaledVector(normal, -normal.dot(camVec));
            if (camVec.lengthSq() > 0.0001) {
                camVec.normalize();
                facingDir.lerp(camVec, 1 - Math.exp(-8.0 * safeDt));
                facingDir.addScaledVector(normal, -normal.dot(facingDir));
                if (facingDir.lengthSq() > 0.0001) {
                    facingDir.normalize();
                }
            }
        }

        syncSurfaceTransform();
        group.scale.setScalar(Math.max(0.001, visScale * (1 + hoverBoost)));

        // Calm walking stride + lightweight idle & vehicle activity blends
        const isVehicle = activity === 'car' || activity === 'bike';
        const walkSpeedRatio = isVehicle ? 0 : Math.min(1, currentSpeed / baseWalkSpeed);
        walkPhase += (0.4 + walkSpeedRatio * 4.1) * safeDt;
        wheelAngle += currentSpeed * 6.5 * safeDt;
        pedalPhase += (1.2 + currentSpeed * 6.0) * safeDt;

        const isPropActive =
            carBlend > 0.3 || bikeBlend > 0.3 || liftBlend > 0.3 || guitarBlend > 0.3;
        const wantWave =
            (!isPropActive && interactive && !isNightMode) ||
            (!interactive && !isNightMode && activity === 'wave');
        const wantStretch = !isNightMode && activity === 'stretch';
        const wantLook = !interactive && !isNightMode && activity === 'look';
        const wantHop = !interactive && !isNightMode && activity === 'hop';
        const wantLift = !isNightMode && activity === 'lift';
        const wantCar = !isNightMode && activity === 'car';
        const wantBike = !isNightMode && activity === 'bike';
        const wantSleep = isNightMode;
        const wantListen = !isNightMode && activity === 'listen';
        const wantSing = !isNightMode && activity === 'sing';
        const wantGuitar = !isNightMode && activity === 'guitar';

        waveBlend = damp(waveBlend, wantWave ? 1 : 0, 7.5, safeDt);
        stretchBlend = damp(stretchBlend, wantStretch ? 1 : 0, 6.5, safeDt);
        lookBlend = damp(lookBlend, wantLook ? 1 : 0, 6.5, safeDt);
        hopBlend = damp(hopBlend, wantHop ? 1 : 0, 7.5, safeDt);
        liftBlend = damp(liftBlend, wantLift ? 1 : 0, 7.0, safeDt);
        carBlend = damp(carBlend, wantCar ? 1 : 0, 7.5, safeDt);
        bikeBlend = damp(bikeBlend, wantBike ? 1 : 0, 7.5, safeDt);
        listenBlend = damp(listenBlend, wantListen ? 1 : 0, 7.0, safeDt);
        singBlend = damp(singBlend, wantSing ? 1 : 0, 7.0, safeDt);
        guitarBlend = damp(guitarBlend, wantGuitar ? 1 : 0, 7.0, safeDt);
        sleepBlend = damp(sleepBlend, wantSleep ? 1 : 0, 6.0, safeDt);
        headphoneBlend = damp(headphoneBlend, isListeningNow ? 1 : 0, 8.5, safeDt);

        const vehicleMask = Math.min(1, carBlend + bikeBlend);
        const strideStrength = walkSpeedRatio * Math.max(0, 1 - vehicleMask);
        const swing = Math.sin(walkPhase) * 0.56 * strideStrength;
        const stepBounce = Math.abs(Math.sin(walkPhase)) * 0.052 * strideStrength;
        const selectedHop =
            opts.isSelected && !isNightMode && vehicleMask < 0.3
                ? Math.abs(Math.sin(elapsed * 5.2)) * 0.09
                : 0;
        const playHop = hopBlend * Math.abs(Math.sin(activityClock * 5.0)) * 0.18;
        const stretchLift = stretchBlend * (0.04 + Math.sin(activityClock * 3.2) * 0.025);
        const beatLift = smoothMusicEnergy * 0.085;
        const listenGroove = listenBlend * (beatLift + Math.abs(Math.sin(elapsed * 5.2 + phase)) * 0.04);
        const singGroove = singBlend * (beatLift + Math.abs(Math.sin(activityClock * 4.8)) * 0.05);
        const guitarGroove = guitarBlend * (beatLift + Math.abs(Math.sin(activityClock * 5.6)) * 0.045);
        const sleepBreath = sleepBlend * (Math.sin(elapsed * 1.45 + phase) * 0.018 + smoothMusicEnergy * 0.028);
        const carRideHeight = carBlend * (0.06 + Math.sin(elapsed * 22 + phase) * 0.007);
        const bikeRideHeight = bikeBlend * (0.2 + Math.abs(Math.sin(pedalPhase)) * 0.014);
        const musicBounce =
            isListeningNow && !isNightMode
                ? smoothMusicEnergy * 0.035 + Math.abs(Math.sin(elapsed * 4.8 + phase)) * 0.018
                : 0;

        bodyRig.position.y =
            stepBounce +
            selectedHop +
            playHop +
            stretchLift +
            listenGroove +
            singGroove +
            guitarGroove +
            sleepBreath +
            carRideHeight +
            bikeRideHeight +
            musicBounce;
        bodyRig.rotation.y =
            lookBlend * Math.sin(activityClock * 2.6) * 0.45 +
            hopBlend * Math.sin(activityClock * 2.5) * 0.25 +
            listenBlend * Math.sin(elapsed * 2.4 + phase) * 0.16 +
            singBlend * Math.sin(activityClock * 2.4) * 0.22;
        bodyRig.rotation.z =
            Math.sin(walkPhase) * 0.045 * strideStrength +
            lookBlend * Math.sin(activityClock * 2.6) * 0.06 +
            bikeBlend * Math.sin(elapsed * 2.2 + phase) * 0.05 +
            listenBlend * Math.sin(elapsed * 3.8 + phase) * (0.08 + smoothMusicEnergy * 0.06) +
            singBlend * Math.sin(activityClock * 2.8) * 0.09 +
            guitarBlend * Math.sin(activityClock * 3.2) * 0.07 +
            sleepBlend * Math.sin(elapsed * 1.1 + phase) * 0.085 +
            (isListeningNow && !isNightMode ? Math.sin(elapsed * 3.2 + phase) * 0.03 : 0);
        bodyRig.rotation.x =
            strideStrength * 0.04 -
            stretchBlend * 0.08 +
            liftBlend * 0.06 +
            bikeBlend * 0.16 +
            listenBlend * (0.06 + smoothMusicEnergy * 0.14) +
            sleepBlend * (0.17 + Math.sin(elapsed * 2.2 + phase) * 0.035);

        leftHipPivot.rotation.x =
            swing +
            carBlend * -0.45 +
            bikeBlend * (-0.35 + Math.sin(pedalPhase) * 0.52);
        rightHipPivot.rotation.x =
            -swing +
            carBlend * -0.45 +
            bikeBlend * (-0.35 + Math.sin(pedalPhase + Math.PI) * 0.52);

        // Smooth arm choreography across all activities
        const armBusy = Math.min(
            1,
            stretchBlend +
                hopBlend +
                liftBlend +
                carBlend +
                bikeBlend +
                listenBlend +
                guitarBlend +
                singBlend +
                sleepBlend
        );
        const armWalkWeight = Math.max(0, 1 - armBusy);
        const hopArmRaise = hopBlend * (1.25 + Math.sin(activityClock * 5.0) * 0.25);
        const stretchArmRaise = stretchBlend * (2.35 + Math.sin(activityClock * 3.5) * 0.14);
        const liftPulse = 0.5 + 0.5 * Math.sin(activityClock * 3.8);
        const liftArmRaise = liftBlend * (2.35 + liftPulse * 0.45);
        const singArmSwing = singBlend * (1.1 + Math.sin(activityClock * 5.0) * 0.35);
        const listenArmGroove = listenBlend * Math.sin(elapsed * 5.4 + phase) * (0.28 + smoothMusicEnergy * 0.25);

        leftArmPivot.rotation.x =
            -swing * 0.8 * armWalkWeight -
            carBlend * 1.0 -
            bikeBlend * 1.12 -
            guitarBlend * 0.65 -
            singBlend * 0.3 -
            listenBlend * (0.25 + listenArmGroove);
        leftArmPivot.rotation.z =
            -0.24 -
            stretchArmRaise -
            hopArmRaise -
            liftArmRaise +
            carBlend * 0.14 +
            bikeBlend * 0.12 +
            guitarBlend * 0.48 +
            sleepBlend * 0.12;

        rightArmPivot.rotation.x =
            swing * 0.8 * Math.max(0, armWalkWeight - waveBlend) -
            carBlend * 1.0 -
            bikeBlend * 1.12 -
            guitarBlend * 0.85 -
            singArmSwing +
            listenBlend * (0.25 + listenArmGroove);
        rightArmPivot.rotation.z =
            0.24 +
            waveBlend * (2.1 + Math.sin(elapsed * 9.5) * 0.32) * (1 - stretchBlend - liftBlend) +
            stretchArmRaise +
            hopArmRaise +
            liftArmRaise -
            carBlend * 0.14 -
            bikeBlend * 0.12 -
            guitarBlend * (0.45 + Math.sin(activityClock * 11.0) * 0.28) -
            sleepBlend * 0.12;

        // Toggle & animate activity props cleanly (0 GPU draw calls when invisible)
        carProp.visible = carBlend > 0.1;
        if (carProp.visible) {
            carProp.scale.setScalar(Math.min(1, carBlend * 1.25));
            for (const wheel of carWheels) {
                wheel.rotation.x = wheelAngle;
            }
        }

        bikeProp.visible = bikeBlend > 0.1;
        if (bikeProp.visible) {
            bikeProp.scale.setScalar(Math.min(1, bikeBlend * 1.25));
            for (const wheel of bikeWheels) {
                wheel.rotation.x = wheelAngle;
            }
        }
        barbellProp.visible = liftBlend > 0.12;
        if (barbellProp.visible) {
            barbellProp.position.set(0, 1.12 + liftPulse * 0.26, 0.04);
            barbellProp.scale.setScalar(Math.min(1, liftBlend * 1.4));
        }

        guitarProp.visible = guitarBlend > 0.12;
        if (guitarProp.visible) {
            guitarProp.scale.setScalar(Math.min(1, guitarBlend * 1.4));
            guitarProp.rotation.z = -0.68 + Math.sin(activityClock * 5.6) * 0.06;
        }

        headphoneProp.visible = headphoneBlend > 0.08;
        if (headphoneProp.visible) {
            const hpScale = Math.min(1.06, headphoneBlend * (1 + smoothMusicEnergy * 0.06));
            headphoneProp.scale.setScalar(hpScale);
        }

        const noteActive = isListeningNow
            ? Math.max(headphoneBlend, listenBlend, singBlend, guitarBlend)
            : 0;
        musicNoteMesh.visible = noteActive > 0.15;
        if (musicNoteMesh.visible) {
            musicNoteMesh.position.set(
                0.38 + Math.sin(elapsed * 3.2 + phase) * 0.06,
                1.3 + Math.sin(elapsed * 4.5 + phase) * 0.09 + smoothMusicEnergy * 0.06,
                0.08
            );
            musicNoteMesh.scale.setScalar(Math.min(1.15, noteActive * (1.05 + smoothMusicEnergy * 0.22)));
        }

        sleepyZzzMesh.visible = sleepBlend > 0.15;
        if (sleepyZzzMesh.visible) {
            const driftCycle = ((elapsed * 0.42 + phase) % 1);
            sleepyZzzMesh.position.set(
                -0.34 - Math.sin(elapsed * 1.8 + phase) * 0.04,
                1.22 + driftCycle * 0.18,
                0.08
            );
            sleepyZzzMesh.scale.setScalar(Math.min(1, sleepBlend * (0.88 + Math.sin(elapsed * 1.8 + phase) * 0.12)));
        }

        // Contact shadow shrinks subtly on jump/hop
        const shadowScale = Math.max(0.65, 1 - (stepBounce + selectedHop + playHop + listenGroove) * 1.4);
        shadowDisc.scale.setScalar(shadowScale);

        // Ring opacity & crown float
        const targetRing = opts.isSelected
            ? 0.92
            : opts.isHovered
              ? 0.72
              : isListeningNow
                ? 0.56 + smoothMusicEnergy * 0.24
                : currentSkill.isLead
                  ? 0.5
                  : 0.32;
        ringOpacity = damp(ringOpacity, targetRing, 9.0, safeDt);
        floorRingMat.opacity = ringOpacity;
        if (leadCrown.visible) {
            leadCrown.position.y = 1.28 + Math.sin(elapsed * 3.0 + phase) * 0.03;
            leadCrown.rotation.z = elapsed * 1.2;
        }

        // Keep floating nameplate, music note & sleepy Zzz billboarded cleanly toward camera
        invGroupQuat.copy(group.quaternion).invert();
        nameplatePivot.quaternion.copy(invGroupQuat).multiply(opts.cameraQuat);
        if (musicNoteMesh.visible) {
            musicNoteMesh.quaternion.copy(nameplatePivot.quaternion);
        }
        if (sleepyZzzMesh.visible) {
            sleepyZzzMesh.quaternion.copy(nameplatePivot.quaternion);
        }
    };

    const getMusicState = (): MascotMusicSnapshot => ({
        isListening: isListeningState,
        isSleepHours: isSleepState,
        songIndex,
        progressSec: songProgressSec,
        durationSec: songDurationSec,
    });

    const getHitTarget = (): THREE.Object3D => hitTarget;

    const getFocusTargetWorld = (out: THREE.Vector3): THREE.Vector3 => {
        group.updateWorldMatrix(true, false);
        return focusAnchor.getWorldPosition(out);
    };

    const dispose = (): void => {
        accentMat.dispose();
        floorRingMat.dispose();
        faceMat.dispose();
        nameplateMat.dispose();
    };

    return {
        group,
        get skill() {
            return currentSkill;
        },
        setSkill,
        setTheme,
        setInitialPosition,
        getPositionNormal,
        getMusicState,
        update,
        getHitTarget,
        getFocusTargetWorld,
        dispose,
    };
}
