# OcioFlex Design System

## 1. Overview
The OcioFlex Design System defines the visual architecture for a desktop application that balances productivity and leisure. Constrained strictly to a **Light Theme**, the system uses semantic CSS variables and tokens to dynamically shift the application's mood between intense focus and relaxed downtime, without ever sacrificing structural consistency.

## 2. Context Engine
The central product concept revolves around a dual-context loop:
- **FOCO:** The state of productivity, concentration, and Deep Work. Visuals are sharper, intense, and structured.
- **OCIO:** The state of leisure, breaks, and Entertainment. Visuals are softer, approachable, and relaxed.

OcioFlex uses a single, persistent Application Shell. Context shifting happens instantaneously through CSS variable inheritance, eliminating the need for React component duplication or runtime JavaScript color recalculations.

## 3. Visual Philosophy
- **Light Theme Only:** The application strictly avoids dark mode. Depth is achieved through surface layering, subtle borders, and delicate elevation rather than stark contrast.
- **Semantic Mapping:** Colors are abstracted into semantic tokens (`accent-primary`, `surface-container`) ensuring that identical React components can render completely differently depending on the active context.
- **Approachable Density:** UI density dynamically adapts. Focus contexts utilize dense utility layouts, while Leisure contexts favor generous spacing and translucent elements.

## 4. Color System
OcioFlex leverages CSS variables defined in `src/app/globals.css`.

### Semantic Tokens
- `--color-accent-primary`: The dominant brand color for active states, timers, and primary buttons.
- `--color-surface-container-lowest` to `-highest`: The structural grays scaling from pure white to soft slate, establishing visual hierarchy.
- `--color-on-surface`: The primary ink color for high-contrast text.
- `--color-on-surface-variant`: A muted ink for supporting text and labels.

### Contextual Palettes
- **Foco Palette:** Maps `accent-primary` to Emerald (`#006948`). It is rigid, reassuring, and highly visible.
- **Ocio Palette:** Maps `accent-primary` to Fuchsia/Magenta (`#c028d7` / `tertiary-container`). It is vibrant, energetic, and lightweight.

## 5. Typography
The system uses three distinct font families mapped in `tailwind.config.ts`:
- **Inter:** The primary workhorse font. Used for body text (`body-default`, `body-compact`), headings (`headline-sm`, `title-md`), and UI elements (`label-ui`).
- **Plus Jakarta Sans:** Used strictly for massive display numerals (`display-lg`, `display-md`), providing tight, geometric, tracking-reduced impact for countdown timers and KPI metrics.
- **JetBrains Mono:** Used for tabular data, metrics, and developer-style tags (`code-inline`, `code-metric`).

## 6. Geometry & Shape Language
The border-radius strategy is intentionally split between contexts:
- **Foco / Structural Constraints:** Dashboard elements, KPI cards, and the App Shell use rigid Tailwind radii (`rounded-xl`, `rounded-2xl`).
- **Ocio Leisure Constraint:** Leisure components break the structural mold. The `BreakTracker` uses an ultra-soft `rounded-[40px]`, while `MediaCards` utilize `rounded-3xl` to feel less like software and more like playable widgets.

## 7. Surfaces & Elevation
Depth in the Light Theme relies heavily on subtle borders and surface shading:
- **Base:** `--color-surface` and `--color-surface-container-lowest` provide the brilliant white foundation.
- **Borders:** `--color-surface-container-high` and `-highest` outline cards gracefully.
- **Translucency (Glassmorphism):** Ocio components optionally blend `bg-surface-container-lowest` with opacity and `backdrop-blur` for lightweight hovering effects without degrading legibility.

## 8. Context Architecture
**How Foco and Ocio shift dynamically:**
1. The `ThemeProvider` injects a `.theme-ocio` class onto the HTML `body` tag when the user toggles the context.
2. Inside `globals.css`, `.theme-ocio` overrides the `accent-*` CSS variables, repointing them from the primary (Emerald) scale to the tertiary (Fuchsia) scale.
3. Every Tailwind utility class (e.g., `text-accent-primary` or `bg-accent-primary`) natively recalculates through browser inheritance. 
4. No React components re-render because of color changes.

## 9. Component Architecture
Important reusable structures located in `src/components/`:
- **`AppShell` & `Sidebar`:** The persistent layout managers preventing DOM remounts during route transitions.
- **`KpiCard`:** Dashboard statistical wrapper.
- **`Sparkline` & `ActivityHeatmap`:** Data-driven SVG/CSS Grid primitives.
- **`SessionTimer`:** The robust UNIX-timestamp-based countdown organism for Deep Work.
- **`BreakTracker`:** The count-up organism for Ocio routing.
- **`MediaCard`:** The translucent quick-launch widget for Entertainment.

## 10. Responsive Design
OcioFlex uses CSS Grid and Flexbox for responsive, JS-free layouts:
- **Desktop:** Expansive 1440px+ `max-w-[1600px]` layouts with an expanded 260px Sidebar. Grid layouts expand up to 4 columns.
- **Tablet:** The Sidebar gracefully collapses to an icon-only 68px state. Grids collapse to 2 columns.
- **Mobile:** Typography scales dynamically. The massive 140px Deep Work timer scales down to 100px. Dashboards stack into a single `flex-col` layout preventing any horizontal overflow.

## 11. Accessibility
- **Keyboard Navigation:** Custom controls implement robust `focus-visible:ring-accent-primary` styles for clear visual focus boundaries.
- **Semantic Elements:** Standard `<button>`, `<a>` (via `next/link`), and `<section>` tags are used.
- **Contrast:** The Light Theme token system guarantees accessible contrast between text variants and lowest/highest surface containers.

## 12. Design Principles
1. **Semantic Inheritance Over Hardcoding:** Never hardcode HEX or RGB values. Rely exclusively on design tokens.
2. **Context Shapes Output:** Let CSS cascades handle Foco/Ocio switching.
3. **Responsive-First:** Never calculate layout positions in Javascript.
4. **Accuracy Above All:** Timers must never rely on React render interval math.

## 13. Implementation Reference
- **Global CSS Tokens:** `src/app/globals.css`
- **Tailwind Mapping:** `tailwind.config.ts`
- **Shared Components:** `src/components/`
- **Context Provider:** `src/components/providers/ThemeProvider.tsx`
