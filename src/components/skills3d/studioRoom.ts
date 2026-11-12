import * as THREE from 'three';
import type { StudioThemeColors } from './types';

export const EARTH_RADIUS = 3.4;

const earthTextureCache = new Map<boolean, THREE.CanvasTexture>();

export function getStudioThemeColors(): StudioThemeColors {
    const isLight = typeof document !== 'undefined' && document.body.classList.contains('light-theme');
    const computed =
        typeof document !== 'undefined'
            ? getComputedStyle(document.body).getPropertyValue('--text-primary').trim()
            : '';

    if (isLight) {
        return {
            isLight: true,
            sky: '#0f2142',
            floor: '#0284c7',
            floorAccent: '#38bdf8',
            wall: '#1e3a6d',
            deskTop: '#faf2df',
            deskLeg: '#54738e',
            chair: '#0284c7',
            monitorShell: '#334155',
            skin: '#f2c29b',
            shirt: '#1e3a5f',
            pants: '#334155',
            textPrimary: computed || '#0f172a',
        };
    }

    return {
        isLight: false,
        sky: '#050812',
        floor: '#0369a1',
        floorAccent: '#38bdf8',
        wall: '#0f172a',
        deskTop: '#212736',
        deskLeg: '#475569',
        chair: '#0ea5e9',
        monitorShell: '#0f172a',
        skin: '#e8b48e',
        shirt: '#1e293b',
        pants: '#0f172a',
        textPrimary: computed || '#f8fafc',
    };
}

export interface StudioEnvironment {
    roomGroup: THREE.Group;
    earthGroup: THREE.Group;
    update: (dt: number, elapsed: number) => void;
    applyTheme: (theme: StudioThemeColors) => void;
    dispose: () => void;
}

function createStarfieldPoints(count: number, minRadius: number, maxRadius: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
        new THREE.Color('#ffffff'),
        new THREE.Color('#7dd3fc'),
        new THREE.Color('#fde68a'),
        new THREE.Color('#c4b5fd'),
    ];

    let seed = 11310 >>> 0;
    const nextRand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
        const u = nextRand();
        const v = nextRand();
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        const r = minRadius + nextRand() * (maxRadius - minRadius);

        const sinPhi = Math.sin(phi);
        positions[i * 3] = r * sinPhi * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.cos(phi);
        positions[i * 3 + 2] = r * sinPhi * Math.sin(theta);

        const col = palette[i & 3];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.45,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        sizeAttenuation: true,
        depthWrite: false,
    });

    return new THREE.Points(geo, mat);
}

function drawPolygon(
    ctx: CanvasRenderingContext2D,
    pts: Array<[number, number]>,
    w: number,
    h: number
): void {
    if (pts.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function getProceduralEarthTexture(isLight: boolean): THREE.CanvasTexture {
    const cached = earthTextureCache.get(isLight);
    if (cached) return cached;

    // 2048x1024 HD procedural canvas texture (cached across mounts & theme switches)
    const w = 512;
    const h = 256;
    const texScale = 4;
    const canvas = document.createElement('canvas');
    canvas.width = w * texScale;
    canvas.height = h * texScale;
    const ctx = canvas.getContext('2d');
    ctx?.scale(texScale, texScale);

    if (ctx) {
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
        if (isLight) {
            oceanGrad.addColorStop(0, '#0369a1');
            oceanGrad.addColorStop(0.5, '#0ea5e9');
            oceanGrad.addColorStop(1, '#0369a1');
        } else {
            oceanGrad.addColorStop(0, '#082f49');
            oceanGrad.addColorStop(0.5, '#0284c7');
            oceanGrad.addColorStop(1, '#082f49');
        }
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = isLight ? 'rgba(255, 255, 255, 0.14)' : 'rgba(125, 211, 252, 0.12)';
        ctx.lineWidth = 1;
        for (let lat = 1; lat < 6; lat++) {
            const y = (lat / 6) * h;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        for (let lon = 1; lon < 12; lon++) {
            const x = (lon / 12) * w;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        ctx.fillStyle = isLight ? '#34d399' : '#10b981';
        ctx.strokeStyle = isLight ? '#a7f3d0' : '#34d399';
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';

        const continents: Array<Array<[number, number]>> = [
            [[0.10, 0.16], [0.23, 0.14], [0.30, 0.22], [0.27, 0.34], [0.22, 0.42], [0.18, 0.40], [0.13, 0.28]],
            [[0.33, 0.10], [0.41, 0.09], [0.40, 0.19], [0.34, 0.18]],
            [[0.25, 0.47], [0.33, 0.50], [0.36, 0.59], [0.32, 0.76], [0.28, 0.83], [0.25, 0.66], [0.23, 0.53]],
            [[0.46, 0.17], [0.56, 0.15], [0.60, 0.24], [0.55, 0.32], [0.47, 0.31], [0.44, 0.24]],
            [[0.45, 0.36], [0.56, 0.36], [0.62, 0.48], [0.58, 0.69], [0.53, 0.76], [0.49, 0.62], [0.44, 0.47]],
            [[0.59, 0.16], [0.82, 0.15], [0.88, 0.26], [0.82, 0.42], [0.74, 0.46], [0.67, 0.42], [0.61, 0.33]],
            [[0.75, 0.50], [0.83, 0.49], [0.86, 0.54], [0.77, 0.55]],
            [[0.78, 0.62], [0.89, 0.61], [0.91, 0.73], [0.82, 0.76], [0.77, 0.69]],
        ];

        for (const poly of continents) {
            drawPolygon(ctx, poly, w, h);
        }

        ctx.fillStyle = isLight ? '#f8fafc' : '#e2e8f0';
        ctx.fillRect(0, 0, w, h * 0.055);
        ctx.fillRect(0, h * 0.915, w, h * 0.085);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    earthTextureCache.set(isLight, tex);
    return tex;
}

export function createStudioEnvironment(
    scene: THREE.Scene,
    initialTheme: StudioThemeColors
): StudioEnvironment {
    const roomGroup = new THREE.Group();
    roomGroup.name = 'earth-globe-environment';

    // 1. Single-draw-call starfield backdrop (340 stars)
    const stars = createStarfieldPoints(340, 18, 78);
    roomGroup.add(stars);

    // 2. Central 3D Earth Globe (MeshLambertMaterial compiles ~5x faster than PBR on mobile/reload)
    const earthGroup = new THREE.Group();
    roomGroup.add(earthGroup);

    const earthMat = new THREE.MeshLambertMaterial({
        map: getProceduralEarthTexture(initialTheme.isLight),
    });
    const earthMesh = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_RADIUS, 64, 48),
        earthMat
    );
    earthGroup.add(earthMesh);

    const atmoMat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.18,
        side: THREE.BackSide,
        depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_RADIUS * 1.055, 48, 36),
        atmoMat
    );
    earthGroup.add(atmoMesh);

    const orbitRingMat = new THREE.MeshBasicMaterial({
        color: '#7dd3fc',
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const orbitRing = new THREE.Mesh(
        new THREE.RingGeometry(EARTH_RADIUS * 1.42, EARTH_RADIUS * 1.44, 96),
        orbitRingMat
    );
    orbitRing.rotation.x = Math.PI * 0.42;
    orbitRing.rotation.y = 0.25;
    earthGroup.add(orbitRing);

    // 3. Orbiting Moon around the 3D Earth
    const moonOrbitPivot = new THREE.Group();
    moonOrbitPivot.rotation.z = 0.24;
    moonOrbitPivot.rotation.x = 0.12;
    roomGroup.add(moonOrbitPivot);

    const moonMat = new THREE.MeshLambertMaterial({
        color: '#e2e8f0',
        emissive: '#334155',
        emissiveIntensity: 0.22,
    });
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 10), moonMat);
    moonMesh.position.set(7.6, 0, 0);
    moonOrbitPivot.add(moonMesh);

    // 4. Lightweight 2-light setup (1 Hemisphere + 1 Directional)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x38bdf8, 1.35);
    roomGroup.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.1);
    sunLight.position.set(12, 14, 14);
    roomGroup.add(sunLight);

    const bgColor = new THREE.Color(initialTheme.sky);

    const applyTheme = (theme: StudioThemeColors): void => {
        bgColor.set(theme.sky);
        scene.background = bgColor;

        earthMat.map = getProceduralEarthTexture(theme.isLight);
        earthMat.needsUpdate = true;

        atmoMat.color.set(theme.isLight ? '#7dd3fc' : '#38bdf8');
        atmoMat.opacity = theme.isLight ? 0.24 : 0.18;
        orbitRingMat.opacity = theme.isLight ? 0.28 : 0.2;
        hemiLight.intensity = theme.isLight ? 1.4 : 1.25;
    };

    const update = (_dt: number, elapsed: number): void => {
        stars.rotation.y = elapsed * 0.012;
        moonOrbitPivot.rotation.y = elapsed * 0.3;
        orbitRing.rotation.z = elapsed * 0.04;
    };

    applyTheme(initialTheme);
    scene.add(roomGroup);

    const dispose = (): void => {
        roomGroup.traverse((obj) => {
            if (
                obj instanceof THREE.Mesh ||
                obj instanceof THREE.LineSegments ||
                obj instanceof THREE.Points
            ) {
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) {
                    for (const m of obj.material) m.dispose();
                } else {
                    obj.material.dispose();
                }
            }
        });
        scene.remove(roomGroup);
    };

    return { roomGroup, earthGroup, update, applyTheme, dispose };
}

export function getInitialSpawnPosition(
    index: number,
    total: number
): { x: number; y: number; z: number } {
    if (total <= 1) return { x: 0, y: 0.35, z: 0.93 };

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const y = 0.78 - (index / Math.max(1, total - 1)) * 1.48;
    const radiusAtY = Math.sqrt(Math.max(0.001, 1 - y * y));
    const theta = index * goldenAngle + 0.4;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    const len = Math.hypot(x, y, z) || 1;
    return { x: x / len, y: y / len, z: z / len };
}
