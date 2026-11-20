# Global Anti-Slop Design System & UI Rules
> **Author & Standard**: Personal & Global Design Manifest  
> **Core Aesthetic Reference**: Sky Canvas & Warm Cream (Default Light) / Obsidian Slate (Dark)  
> **Primary Directive**: *Content over Containers. Hierarchy through Typography & Space, never Box Spam.*

---

## 1. The Core Manifesto: Anti-Container & Anti-Box

The single most defining signature of generic "AI Slop" UI is **container addiction**: wrapping every word, number, status, and section in a rounded rectangle, pill, or bordered card.

```
AI Slop (Over-boxed):      [ [ Language ] [ 8 ] ]  --> Nested pills, borders everywhere, visual clutter
Modern Craft (Unboxed):    Language  8             --> Clean typography, subtle opacity, effortless breathing
```

### 1.1 The Anti-Box Mandate (Strictly Forbidden)
1. **No Nested Pills**: NEVER wrap a pill inside another pill (e.g., an outer capsule containing text and an inner capsule containing a count or badge).
2. **No Text Caging**: Plain text labels, tags, categories, metadata, and breadcrumbs must NOT be enclosed in boxed pill borders or contrasting badge containers unless they represent an interactive filter or a critical system alert.
3. **No Outer Card Nesting**: If a section sits on a page, do not put an outer card container around another grid of cards. Let content merge seamlessly directly into the canvas background (`background: transparent; border: none; box-shadow: none;`).
4. **No Circular Icon Boxes on Timelines**: When building activity feeds or timelines, let the icon or node breathe directly on the background. Do not enclose icons in circular background badges with heavy borders.
5. **No Boxed Action Buttons for Secondary Actions**: Secondary actions (e.g. *"Show more"*, *"View all"*, *"Load earlier"*) must never be styled as heavy card-like rounded blocks. Use clean, unboxed text buttons with subtle hover color shifts.
6. **No Dividing Lines Just to Fill Space**: Delete arbitrary horizontal rules (`<hr>`, `border-top`, scrollbar tracks) that cut across grids or lists. Separation must come from whitespace rhythm.

---

## 2. Color Palette, Harmony & Dual-Theme Foundation

Every project does **not** need to hardcode the exact hex values below. Sections **2.1** and **2.2** are **Signature Reference Examples** showing how colors should be mixed together so every surface, border, ink, and accent feels cohesive and intentional. Use them directly when you want the signature aesthetic, or build a project-specific palette following the same mixing principles in **2.3**.

### 2.1 Daylight Theme (Signature Example)
*A reference example of pairing a cool atmospheric canvas with warm tactile surfaces and a harmonized ocean accent:*
* **Canvas Background (`--bg-main`)**: `#edf7fe` (Crisp, sunlit sky blue canvas)
* **Surface / Card Elevation (`--bg-card`)**: `#faf2df` / `#fdfaf3` (Warm artisanal cream)
* **Surface Hover (`--bg-card-hover`)**: `#f3ead2` (Mellow toasted cream)
* **Primary Accent (`--primary`)**: `#0369a1` / `#0284c7` (Deep ocean blue)
* **Primary Soft (`--primary-soft`)**: `#e0f2fe` (Delicate sky wash)
* **Primary Ink (`--primary-ink`)**: `#ffffff`
* **Text Primary (`--text-primary`)**: `#0f172a` (Deep slate ink, high contrast)
* **Text Secondary (`--text-secondary`)**: `#475569` (Muted ocean slate)
* **Subtle Borders (`--border`)**: `rgba(2, 132, 199, 0.12)` or `rgba(15, 23, 42, 0.08)`

### 2.2 Obsidian Theme (Night Mode Signature Example)
*A reference example of pairing a deep midnight ground with stepped neutral-charcoal cards and a crisp electric accent:*
* **Canvas Background (`--bg-main`, `--bg-sidebar`)**: `#050812` (Deep space obsidian midnight)
* **Surface / Item Card (`--bg-card`)**: `#21262d` (GitHub contributor box charcoal, dedicated for item cards)
* **Surface Card Hover (`--bg-card-hover`)**: `#2a313c`
* **Elevated Surfaces (`--bg-elevated`)**: `#262c36`
* **Inputs & Inner Wells (`--bg-input`)**: `#121215`
* **Item Card Borders (`--border`)**: `#30363d` (GitHub contributor box border)
* **Borders Hover (`--border-hover`)**: `#484f58`
* **Primary Accent (`--primary`)**: `#38bdf8` (Electric cyan / sky)
* **Text Primary (`--text-primary`)**: `#f8fafc` (Clean snow white)
* **Text Body (`--text-body`)**: `#d1d5db`
* **Text Secondary (`--text-secondary`)**: `#9ca3af` (Slate smoke)

### 2.3 Color Mixing & Harmony Principles (How to Build Any Palette)
When creating a custom color mix for a new project, follow the same structural balance shown in **2.1** and **2.2** so every color matches and elevates the others:
* **Atmospheric Canvas + Complementary Surface**: Pair a calm, low-saturation background (`--bg-main`) with a deliberately distinct card surface (`--bg-card`) that creates natural separation without heavy shadows (for example, cool canvas + warm surface in light mode, or deep midnight ground + stepped charcoal surface in dark mode).
* **Cohesive Tonal Stepping**: Derive `--bg-card-hover`, `--bg-elevated`, `--bg-input`, and `--border` directly from the same hue family as the canvas/surface using subtle lightness and opacity steps. Never mix clashing undertones or harsh pure `#000000`/`#ffffff` borders.
* **One Deliberate Accent That Fits the Room**: Pick a single primary accent (`--primary`) that harmonizes with both the canvas and card surface, plus a translucent soft tint (`--primary-soft`) for subtle highlights and high-contrast ink (`--primary-ink`).
* **Tinted Ink Hierarchy**: Keep `--text-primary` crisp and effortless to read, and tint `--text-secondary` subtly toward the palette's base temperature so muted text feels native to the background.
* **Max 3 Core Tones + 1 Accent**: A neutral ground, an ink tone, an elevated surface, and one deliberate accent color.
* **Banned Color Treatments**:
  * Generic purple-to-blue or cyan-to-purple gradients.
  * Rainbow tag soup (every tag getting a random pastel color).
  * High-saturation neon glows on static borders.
  * Unmatched colors that clash with the surrounding surface temperature.

---

## 3. Anti-Slop UI Craft Rules

### 3.1 Border Radius Hygiene
* **Ban on Universal 999px Pills**: Never set `border-radius: 999px` on everything. When inputs, cards, dialogs, buttons, and badges are all pill-shaped, the UI loses functional character.
* **Intended Radii Scale**:
  * Micro components / day cells / tags: `3.5px` to `6px` (squircles, not aggressive circles).
  * Cards and structural panels: `12px` to `16px`.
  * Standalone primary interactive buttons / chips: `999px` (reserved for intentional tactile pills only).

### 3.2 Shadow & Elevation Restraint
* **No Multi-Layer Floating Softness**: When every card and button has a 30px blurry drop-shadow, the screen feels like it is floating in fog.
* **Matte Ground Plane**: Most components must sit flat on the surface. Use subtle borders (`1px solid var(--border)`) or 1–2% opacity shifts. Reserve elevation shadows (`0 8px 24px rgba(...)`) strictly for floating dropdowns, sticky players, or active modal dialogs.

### 3.3 Glassmorphism Limit
* Do not apply `backdrop-filter: blur(...)` to cards, navbars, sidebars, and footers simultaneously.
* Maximum of **1 surface** on the screen may use frosted glass (e.g., sticky top header or dock). Everything else remains solid or transparent.

### 3.4 No Fake AI Badges or Decorative Status Dots
* **No "AI Powered" Sparkle Capsules**: Sparkle (`✨`), lightning (`⚡`), or capsule badges that exist purely to scream "modern" are forbidden.
* **No Phantom Live Indicators**: A glowing or pulsing green dot must mark an actual active connection, recording, or live state. Never attach a pulsating green orb to static headings or portfolio sections.

### 3.5 Timeline & Connector Lines
* **Discontinuous Line Breaks**: Connectors must not run blindly through the center of icons or text. Break the connector line 4px above and below each node so the icon merges cleanly with the canvas.
* **Borderless Badges**: Timeline step icons float freely without circular card boundaries or drop shadows.

---

## 4. Typography & Information Hierarchy (Contrast > Boxes)

When tempted to put a box around information to make it stand out, **stop and use typography instead**:

| Goal | Slop Approach (Forbidden) | Modern Anti-Slop Solution (Required) |
| :--- | :--- | :--- |
| **Label + Count** | `[ Tag ] [ 12 ]` nested pill | `Tag` `<span class="opacity-60 text-xs font-mono">12</span>` |
| **Status Note** | High-contrast neon capsule badge | Subtle colored text + muted label font-weight |
| **Feature List** | 3 identical copy-paste boxed cards | Clean vertical list with tabular alignment & hairline rule |
| **Section Header** | Centered eyebrow pill above `<h2>` | Clean, left-aligned typographic hierarchy with semantic scale |
| **Card Category** | Colored pill chip above card title | Subtle uppercase letter-spaced secondary caption (no border) |

---

## 5. Concrete "Do This, Not That" Examples

### Example 1: Tag with Count
```html
<!-- ❌ FORBIDDEN: Boxed in a box (AI Slop) -->
<div class="px-3 py-1 rounded-full bg-cream border flex items-center gap-2">
  <span>Language</span>
  <span class="px-2 py-0.5 rounded-full bg-blue-100 text-xs">8</span>
</div>

<!-- ✅ CORRECT: Clean Typographic Pairing -->
<div class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
  <span>Language</span>
  <span class="text-xs font-semibold text-slate-400 tabular-nums">8</span>
</div>
```

### Example 2: Activity Timeline Item
```html
<!-- ❌ FORBIDDEN: Heavy circular container badge -->
<div class="timeline-item">
  <div class="w-8 h-8 rounded-full bg-white border shadow flex items-center justify-center">
    <GitIcon />
  </div>
  <p>Pushed commit</p>
</div>

<!-- ✅ CORRECT: Seamless icon floating directly on canvas -->
<div class="timeline-item">
  <div class="text-slate-500 hover:text-sky-600 transition-colors">
    <GitIcon />
  </div>
  <p>Pushed commit</p>
</div>
```

### Example 3: Dashboard Stat Display
```html
<!-- ❌ FORBIDDEN: Outer card wrapping an inner card grid -->
<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3>My Stats</h3>
  <div class="grid grid-cols-2 gap-4">
    <div class="border rounded-xl p-4 bg-gray-50">...</div>
  </div>
</div>

<!-- ✅ CORRECT: Direct canvas integration -->
<section class="w-full flex flex-col gap-4">
  <h3 class="text-lg font-bold text-slate-900 tracking-tight">Stats</h3>
  <div class="grid grid-cols-2 gap-3.5">
    <div class="rounded-xl border border-sky-900/10 bg-cream p-4">...</div>
  </div>
</section>
```

---

## 6. Pre-Commit Slop Gate (Mandatory Checklist)

Before approving or shipping any frontend interface, answer these 7 audit questions:

1. **The Box Test**: Did I wrap any plain word, number, or category in a pill or box that could stand cleanly on whitespace alone? *(If yes, unbox it).*
2. **The Nesting Test**: Is there any pill inside another pill, or an outer card wrapping a grid of cards? *(If yes, delete the outer wrapper).*
3. **The Line Test**: Is there an arbitrary horizontal scrollbar, dividing border, or timeline line cutting awkwardly through elements? *(If yes, remove or break it).*
4. **The Palette Test**: Do the colors harmonize cleanly (following the 2.1 / 2.2 signature examples or the 2.3 mixing rules: max 3 core tones + 1 matching accent, no clashing undertones or random purple gradients)?
5. **The Radius Test**: Are button, input, and card border-radii distinct and intentional rather than uniformly 999px?
6. **The Shadow Test**: Are elements grounded flat on the surface rather than swimming in diffuse multi-layer drop shadows?
7. **The Soul Test**: Does this look like handcrafted bespoke software built by an artisan, or an auto-generated AI template?

## 7. Code Rules
1. **No {/* ... */} or /* ... */ block comments**:
  Never write {/* ... */} comments inside JSX/TSX.
  Never write /* ... */ block comments in CSS/SCSS files (CSS does not support //, so omit block comments in stylesheets).
  Never write /* ... */ or /** ... */ block comments in TypeScript/JavaScript; use // single-line comments instead.
  Preserve valid strings, globs, and regexes containing /* (such as accept="image/*").
2. **Clean Comments**:
  Comment only the non-obvious why, not what the code does.
  Keep code self-documenting with clear symbol names and small, single-purpose functions.
3. **Change Discipline**:
  Reuse existing project helpers, components, and tokens instead of duplicating logic.
  Remove unused files, dead CSS rules, and orphan assets rather than leaving them behind.
  Run project lint, tests, and build checks after non-trivial edits

## 8. Commit Name Rules

For new features that do not yet exist, use this format:
- add(feature_name): [description/message]
- example: add(login): redirection to use Single Sign On

For feature updates or requests:
- update(feature_name): [description/message]
- example: update(login): update Single Sign On to include login by email as well

For fixes, errors, or cases where a feature or component is not working:
- fix(feature_name): [description/message]
- example: fix(login): login by username not working