import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import { getTechIcon } from '../../constants/techStack';
import type { StudioThemeColors } from './types';

const logoCache = new Map<string, THREE.CanvasTexture>();
const nameplateCache = new Map<string, THREE.CanvasTexture>();

// Staggered SVG rasterization queue so page load never spikes the main thread or GPU upload
const svgQueue: Array<() => void> = [];
let svgQueueRaf = 0;

function flushSvgQueue(): void {
    svgQueueRaf = 0;
    // Process at most 2 SVG icons per animation frame for zero frame drops
    const batch = svgQueue.splice(0, 2);
    for (const task of batch) {
        task();
    }
    if (svgQueue.length > 0) {
        svgQueueRaf = requestAnimationFrame(flushSvgQueue);
    }
}

function enqueueSvgTask(task: () => void): void {
    svgQueue.push(task);
    if (!svgQueueRaf && typeof requestAnimationFrame !== 'undefined') {
        svgQueueRaf = requestAnimationFrame(flushSvgQueue);
    }
}

export function resolveThemeColor(color: string | undefined | null, textPrimaryFallback: string): string {
    if (!color || typeof color !== 'string') {
        return '#38bdf8';
    }
    const isLight = typeof document !== 'undefined' && document.body.classList.contains('light-theme');
    const norm = color.trim().toLowerCase();
    if (norm.includes('var(--text-primary)') || (isLight && (norm === '#fff' || norm === '#ffffff'))) {
        if (textPrimaryFallback) return textPrimaryFallback;
        return isLight ? '#0f172a' : '#f8fafc';
    }
    return color;
}

function createCanvas(
    width: number,
    height: number,
    scale = 4
): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to acquire 2D canvas context');
    }
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    return [canvas, ctx];
}

function configureTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
}

function paintMedallionBase(
    ctx: CanvasRenderingContext2D,
    size: number,
    resolvedColor: string,
    isLight: boolean
): void {
    const half = size / 2;
    const radius = half - 5;

    ctx.clearRect(0, 0, size, size);

    // Medallion coin face (fast solid fill, no radial gradients)
    ctx.beginPath();
    ctx.arc(half, half, radius, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? '#faf2df' : '#181b24';
    ctx.fill();

    // Crisp inner bevel ring
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(248, 250, 252, 0.1)';
    ctx.beginPath();
    ctx.arc(half, half, radius - 5, 0, Math.PI * 2);
    ctx.stroke();

    // Outer accent ring
    ctx.lineWidth = 4;
    ctx.strokeStyle = resolvedColor;
    ctx.beginPath();
    ctx.arc(half, half, radius - 1.5, 0, Math.PI * 2);
    ctx.stroke();
}

function drawFallbackGlyph(
    ctx: CanvasRenderingContext2D,
    size: number,
    skillName: string,
    resolvedColor: string
): void {
    const half = size / 2;
    const clean = skillName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const label = clean.length >= 2 ? clean.slice(0, 2) : '</>';

    ctx.fillStyle = resolvedColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 38px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillText(label, half, half + 2);
}

function prepareSvgMarkup(rawSvg: string, resolvedColor: string): string {
    let svg = rawSvg;
    if (!/xmlns=/.test(svg)) {
        svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    svg = svg.replace(/\s(width|height)="[^"]*"/gi, '');
    svg = svg.replace('<svg', '<svg width="512" height="512"');
    svg = svg.replace(/currentColor/gi, resolvedColor);
    return svg;
}

export function createSkillLogoTexture(
    skillName: string,
    rawColor: string,
    theme: StudioThemeColors
): THREE.CanvasTexture {
    const key = `${skillName}|${theme.isLight ? 'L' : 'D'}`;
    const cached = logoCache.get(key);
    if (cached) return cached;

    const size = 128;
    const [canvas, ctx] = createCanvas(size, size);
    const fallbackPrimary = theme.textPrimary || (theme.isLight ? '#0f172a' : '#f8fafc');
    const resolvedColor = resolveThemeColor(rawColor, fallbackPrimary);

    paintMedallionBase(ctx, size, resolvedColor, theme.isLight);
    drawFallbackGlyph(ctx, size, skillName, resolvedColor);

    const texture = configureTexture(canvas);
    logoCache.set(key, texture);

    enqueueSvgTask(() => {
        const info = getTechIcon(skillName);
        if (!info) return;
        try {
            const rawMarkup = renderToStaticMarkup(info.icon as ReactElement);
            const svgMarkup = prepareSvgMarkup(rawMarkup, resolvedColor);
            const url = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' }));
            const img = new Image();
            img.onload = () => {
                paintMedallionBase(ctx, size, resolvedColor, theme.isLight);
                const iconSize = 70;
                const offset = (size - iconSize) / 2;
                ctx.drawImage(img, offset, offset, iconSize, iconSize);
                texture.needsUpdate = true;
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } catch {
            // Keep synchronous fallback badge if SVG serialization fails
        }
    });

    return texture;
}

function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export function createNameplateTexture(
    skillName: string,
    rawColor: string,
    theme: StudioThemeColors,
    isLead = false
): THREE.CanvasTexture {
    const key = `${skillName}|${theme.isLight ? 'L' : 'D'}|${isLead ? '1' : '0'}`;
    const cached = nameplateCache.get(key);
    if (cached) return cached;

    // Compact 256x64 canvas with zero CPU shadowBlur calls for instant (<0.1ms) generation
    const width = 256;
    const height = 64;
    const [canvas, ctx] = createCanvas(width, height);
    const fallbackPrimary = theme.textPrimary || (theme.isLight ? '#0f172a' : '#f8fafc');
    const skillColor = resolveThemeColor(rawColor, fallbackPrimary);

    const pad = 5;
    const pillW = width - pad * 2;
    const pillH = height - pad * 2;
    const radius = pillH / 2;

    // Pill background
    drawRoundedRect(ctx, pad, pad, pillW, pillH, radius);
    ctx.fillStyle = theme.isLight ? '#faf2df' : '#151923';
    ctx.fill();

    // Pill border (no slow shadowBlur)
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = theme.isLight ? '#006d9e' : skillColor;
    ctx.stroke();

    // Accent bar (light) or dot (dark)
    if (theme.isLight) {
        drawRoundedRect(ctx, pad + 12, pad + 13, 6, pillH - 26, 3);
        ctx.fillStyle = skillColor;
        ctx.fill();
    } else {
        ctx.fillStyle = skillColor;
        ctx.beginPath();
        ctx.arc(pad + 19, height / 2, 6.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Lead star marker on the right
    if (isLead) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(width - pad - 20, height / 2, 7, 0, Math.PI * 2);
        ctx.fill();
    }

    // Label text fitted cleanly inside pill
    const textLeft = pad + 32;
    const textRight = isLead ? width - pad - 36 : width - pad - 14;
    const maxTextWidth = Math.max(60, textRight - textLeft);

    let fontSize = 21;
    ctx.font = `700 ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
    while (fontSize > 12 && ctx.measureText(skillName).width > maxTextWidth) {
        fontSize -= 1;
        ctx.font = `700 ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
    }

    ctx.fillStyle = theme.isLight ? '#0f172a' : '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = (textLeft + textRight) / 2;
    ctx.fillText(skillName, centerX, height / 2 + 1, maxTextWidth);

    const texture = configureTexture(canvas);
    nameplateCache.set(key, texture);
    return texture;
}

let musicNoteTex: THREE.CanvasTexture | null = null;
let sleepyZzzTex: THREE.CanvasTexture | null = null;

export function getMusicNoteTexture(): THREE.CanvasTexture {
    if (musicNoteTex) return musicNoteTex;
    const size = 64;
    const [canvas, ctx] = createCanvas(size, size);

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.arc(32, 32, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 32px "Segoe UI Symbol", "Apple Color Emoji", sans-serif';
    ctx.fillText('♫', 32, 34);

    musicNoteTex = configureTexture(canvas);
    return musicNoteTex;
}

export function getSleepyZzzTexture(): THREE.CanvasTexture {
    if (sleepyZzzTex) return sleepyZzzTex;
    const width = 96;
    const height = 56;
    const [canvas, ctx] = createCanvas(width, height);

    ctx.clearRect(0, 0, width, height);
    drawRoundedRect(ctx, 4, 6, width - 8, height - 12, 22);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#818cf8';
    ctx.stroke();

    ctx.fillStyle = '#c7d2fe';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 23px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Zzz', width / 2, height / 2 + 1);

    sleepyZzzTex = configureTexture(canvas);
    return sleepyZzzTex;
}

export function disposeTextureCache(): void {
    if (musicNoteTex) {
        musicNoteTex.dispose();
        musicNoteTex = null;
    }
    if (sleepyZzzTex) {
        sleepyZzzTex.dispose();
        sleepyZzzTex = null;
    }
    if (svgQueueRaf && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(svgQueueRaf);
        svgQueueRaf = 0;
    }
    svgQueue.length = 0;

    for (const tex of logoCache.values()) {
        tex.dispose();
    }
    logoCache.clear();

    for (const tex of nameplateCache.values()) {
        tex.dispose();
    }
    nameplateCache.clear();
}
