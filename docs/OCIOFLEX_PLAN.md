# OcioFlex — Redesign Master Plan (Prompt 1 → 2 → 3)

## A. Current state & gaps

**Stack:** Next 16.4.0 (Turbopack, `output: "export"`), React 19.3, Tailwind 4 (+ `tailwind.config.ts` tokens), Tauri 2.12 (Rust 2024, only `tauri-plugin-log`). State = React Context (Language, Theme, Toast). No tests, no `.env`, no `docs/`. `.gitignore` lacks `.env*`. Git: `main` clean; work on `feat/redesign`.

**Routes:** `/` dashboard (4 KPI cards, heatmap, sparklines — all mock), `/deep-work` (timestamp countdown 45:00, mock session list), `/entertainment` (count-up timer, 4 inert media cards), `/settings` (language + Foco/Ocio). Sidebar items "Reglas de Contexto" and "Registro Analítico" are `#` stubs (toast "not implemented"). Fake "Alex V. Novak" profile, "v2.4", "85 NODOS", "Cmd+X", "SYNCED" are invented chrome.

**Health:** `tsc` OK · `cargo check` OK (2m53 cold) · `next build` compiles and prerenders 5 routes but exits non-zero: Next 16.4.0 prints a security-advisory error (SecurityFatalError); fix = bump to latest 16.x patch (WP1). The dev server runs in plain Chrome; the app uses no Tauri APIs yet, so no shim is needed now. Once WP6 adds commands, a `isTauri()` guard + mock `invoke` path is required for browser review.

**Gap vs requirements**
| Req | State | Gap |
|---|---|---|
| 1 Native desktop | Tauri shell; window 800×600, id `com.tauri.dev`, CSP null, default icon, Material Symbols from Google CDN (breaks offline), `next/font/google` | window cfg, identifier, CSP, offline fonts/icons, installer metadata, persistence |
| 2 Light theme | Already light only (`#f9f9ff`) | generic look; replace with new tokens |
| 3 ES/EN | typed Context, `es.ts`/`en.ts`, localStorage, default hard-coded "es", `<html lang="en">` | OS-locale default, `lang` attr, hard-coded mock strings, plural/format rules |
| 4 AI | none | all (WP6–7) |
| 5 Visual + 3D | mediocre | all |
| Data | all mock; timer lost on reload; only lang persisted | persistence layer |

Hazards: hydration mismatch history (bddd846), Sidebar layout regression (b6cbe4a); stray root scripts (`patch_*.js`, `generate_viz.js`, `Audit-*.md`) to clean in WP1.

## Visual critique (1280×800, 4 screens captured)
1. **No hierarchy/focal point:** all cards same weight; dashboard heatmap floats in a huge empty white panel; KPI row reads like a spreadsheet.
2. **Fake-hacker chrome:** monospace pills (`RUNNING`, `SYS`, `CFG`, `DB`), "OcioFlex Engine", "ALINEACIÓN: LÍNEA BASE 4PX" contradict a calm leisure product and eat space.
3. **Timid color:** cool blue-white + one green; the Foco/Ocio duality (best idea) is only a toggle, not felt. Settings page nearly empty, content jammed at top.
4. **Default Inter everywhere;** 45:00 hero is big but lifeless; 10–11px low-contrast labels.
5. **Dead states, no motion:** media cards inert, timeline mock, no transition between contexts, no illustration/3D. (Orange "1 Insight" badge is the Next dev overlay, not product.)

## References (principles only)
Visited awwwards SOTD and 3D collection (2 pages; page text extraction was blocked by the browser tool, so notes come from the visible cards: "Dialed", "World of the Nomad", SOTD grid):
- **One object, one color story (Dialed):** a single glossy object on a flat saturated field with huge type → ONE orb on a soft gradient, type overlapping its edge.
- **Calm museum 3D (Nomad):** muted warm palette, centered object, slow idle motion, minimal UI → idle rotation ≤ 0.15 rad/s, no scroll-jacking.
- **SOTD grids:** oversized display type, negative space, tiny uppercase meta labels, hairline dividers → display 72–128px, meta 11px caps +0.08em, 1px hairlines.
- **Motion:** staggered reveal (40ms), expo ease-out, hover lift 2px, nothing > 600ms.

## B. Design direction (DECIDED)
**Concept "Paper & Tide":** warm-paper light theme; one skeleton, two moods. **Foco = deep tide teal on ivory; Ocio = apricot/coral on blush.** Context switch cross-fades the whole canvas via CSS vars (600ms).

**Tokens** (CSS vars in `globals.css`, exposed to Tailwind via `@theme`; replace M3 names)
```
--bg:#F7F3EC  --bg-2:#EFE9DE  --surface:#FFFFFF  --surface-2:#FBF8F3
--line:#E4DCCD  --line-strong:#CFC4B0
--ink:#1B1A17  --ink-2:#5B5648  --ink-3:#8B8574
Foco: --accent:#0F5F58  --accent-2:#2FA39A  --accent-soft:#D8EDE8  --on-accent:#FFFFFF
      --glow:#7ED6C8  --canvas:linear-gradient(160deg,#F7F3EC 0%,#E7F1EC 100%)
Ocio: --accent:#D9532F  --accent-2:#F29B6B  --accent-soft:#FBE0D3  --on-accent:#FFFFFF
      --glow:#FFB38A  --canvas:linear-gradient(160deg,#F7F3EC 0%,#FBE6DC 100%)
--ok:#2E7D4F  --warn:#B7791F  --danger:#B3261E
--grad-hero:radial-gradient(60% 60% at 70% 30%,var(--glow) 0%,transparent 70%)
--shadow-1:0 1px 2px rgba(27,26,23,.06),0 1px 1px rgba(27,26,23,.04)
--shadow-2:0 6px 20px -6px rgba(27,26,23,.12),0 2px 4px rgba(27,26,23,.05)
--shadow-3:0 24px 60px -20px rgba(27,26,23,.22)
--radius-sm:8px --radius-md:14px --radius-lg:22px --radius-xl:32px --radius-pill:999px
focus ring: 0 0 0 3px color-mix(in srgb,var(--accent) 35%,transparent)
```
Note: `#D9532F` with white text is ~4.0:1 — use it for large text/fills ≥ 18px bold only; small Ocio text uses `--ink`. Verify all pairs ≥ 4.5:1 in WP2.

**Fonts (bundled via npm `@fontsource-variable/*`; remove `next/font/google` and CDN link):** Display **Fraunces** (timer, H1, KPI numbers; axis `SOFT` 0 in Foco → 100 in Ocio, animated on switch) · UI/body **Instrument Sans** · tags/tabular numerics **Geist Mono** (sparingly). Scale px/line: 11/14 caps meta · 13/18 small · 15/22 body · 18/26 title · 28/32 h2 · 44/48 h1 · 96–128/1 timer. **Icons:** `lucide-react`.
**Spacing:** 4px base: 4·8·12·16·24·32·48·72·112. Content max 1120px, page padding 40px, card padding 24px, grid gap 20px.

**Shell:** native titlebar + left rail 232px (collapsible 72px): wordmark, 4 nav items (Home, Deep Work, Entertainment, Settings), Foco/Ocio switch pill at bottom, AI DEMO/LIVE chip. Remove fake profile and stub items. Main area scrolls over `--canvas`.

**Wireframes (1280×800)**
```
HOME                                        DEEP WORK
┌rail┬─────────────────────────────────┐   ┌rail┬───────────────────────────────┐
│Logo│ Buenos días        [Hoy][▶ Start]│   │    │ ENFOQUE            [AI: split]  │
│Home│ ┌─────────────┐  04h12 foco       │   │    │ [ task input ............... ] │
│Foco│ │  3D ORB     │  01h45 ocio       │   │    │      45:00 (Fraunces 128)       │
│Ocio│ │ hero 420px  │  ratio 70/30      │   │    │ [Start ▶][Reset] [25|45|60]     │
│    │ └─────────────┘                   │   │    │ ── Hoy ───────── ┌AI Coach────┐ │
│Set │ ┌KPI┐┌KPI┐┌KPI┐   heatmap 12 sem  │   │    │ timeline cards   │ insight    │ │
│[F|O]│ AI Coach card (insight + CTA)    │   │    │                  └────────────┘ │
└────┴─────────────────────────────────┘   └────┴───────────────────────────────┘
ENTERTAINMENT                               SETTINGS
│ DESCANSO  00:00 count-up (blush, r32)   │ Idioma [ES|EN] · Contexto [Foco|Ocio]
│ [AI: ¿qué hago en mi descanso?] + mood  │ IA: provider, DEMO/LIVE, key field
│ media cards ×4 (add/edit/launch)        │ Datos: export/reset · Acerca de
```
**Components:** Shell, Rail, NavItem, ContextSwitch, PageHeader, Card, StatCard, Sparkline, Heatmap, TimerDial (ring), Button (primary/ghost/soft), Segmented, Chip, Badge(demo), Input, AiCoachCard, BreakSuggestions, TaskSplitter, MediaCard (editable), Timeline, Toast, Hero3D + HeroFallback, EmptyState.
**Motion:** 120ms hover / 240ms UI / 600ms context crossfade; ease `cubic-bezier(.22,1,.36,1)`; page enter = fade + 8px rise, stagger 40ms ≤ 6 items; timer ring linear 1s; `prefers-reduced-motion` → opacity-only.

**3D concept — "Tide Orb" (Home hero only):** procedural icosahedron displaced by simplex noise in a shader/`useFrame`, `MeshPhysicalMaterial` (clearcoat 1, roughness .25, iridescence .6, color = mix(`--accent`, `--glow`)), floating over a soft contact shadow; slow rotation, pointer parallax ±0.15 rad; noise amplitude/speed follow focus:leisure ratio (calm in Foco, livelier in Ocio); color lerps on context switch. Stack: `three` + `@react-three/fiber` + `@react-three/drei` (`Float`; lighting from `Lightformer`s, NO remote HDRI). Zero asset files. `next/dynamic({ssr:false})`, mounted after first paint; `dpr=[1,1.75]`; pause when tab hidden/off-screen. Fallback (reduced-motion, no WebGL, context lost): CSS radial-gradient blob, 12s float, same footprint.

## C. App chrome
`tauri.conf.json`: `identifier:"com.ocioflex.app"`; window `{label:"main", title:"OcioFlex", width:1280, height:800, minWidth:1024, minHeight:680, center:true, decorations:true, theme:"Light", visible:false}`. **Native titlebar decided** (avoids drag-region/snap-layout/caption-button bugs); show window after first paint (`getCurrentWindow().show()`, 1.5s timeout) to avoid white flash. Bundle: `targets:["nsis","msi"]`, `publisher`, `shortDescription`, `longDescription`, `copyright`, `category:"Productivity"`, NSIS languages Spanish+English, `installMode:"currentUser"`; remove android block. CSP: `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost; worker-src 'self' blob:`. Capabilities: `core:default`, `core:window:allow-show`, `store:default`, `opener` scoped. Icon: 1024px SVG mark (ivory rounded square + teal→coral orb) → `npx tauri icon`. Release builds: block context menu/F5.

## D. i18n
Keep the typed home-grown context (no new dep). Restructure `src/locales/{es,en}.ts` into namespaces (`nav, home, focus, rest, settings, ai, common, toast`); `types.ts` = `typeof en`, `es` must satisfy it. Formatting via `Intl.DateTimeFormat/NumberFormat/PluralRules` with active locale. Default: stored value → else `navigator.language` starts with `es` ? `es` : `en`; resolved in an effect (hydration-safe), sets `document.documentElement.lang`; persisted via storage layer. Mock data uses ids/keys, never literal text. Spanish is ~25–30% longer: no fixed-width buttons, `min-w` + padding, rail labels may wrap to 2 lines, truncate only user-entered text. AI calls pass `lang`.

## E. AI
**Features:** (1) **Balance Coach** — from last 7 days of sessions → 2-sentence insight + one tweak (Home/Deep Work card). (2) **Break Suggester** — after focus, given minutes focused, time of day, mood chip → 3 break ideas (title, minutes, why). (3) **Task Splitter** — free-text task → 2–4 focus blocks with durations that prefill the timer.
**Architecture:** Rust `src-tauri/src/ai/{mod,gemini,demo}.rs`; deps `reqwest` (`default-features=false`, `json`, `rustls-tls`), `dotenvy`. Commands: `ai_generate(feature, payload, lang) -> Result<AiResult, AiError>`; `ai_status() -> {mode:"live"|"demo", provider, model}`; `ai_set_key(key)` writes `app_config_dir/ocioflex.env` and is never readable back. Prompts + JSON schemas live in Rust. Provider trait `Provider::complete(system,user)`; default `Gemini` (no provider exists in code today): `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, key in `x-goog-api-key` header, `responseMimeType: application/json`; room for `OpenAi`. 15s timeout, 1 retry; invalid JSON → demo fallback + toast. **The key never reaches the webview** (not in invoke results, not in `out/`).
`.env.example` (repo root; `.env` and `src-tauri/.env` gitignored):
```
AI_PROVIDER=gemini
AI_API_KEY=
AI_MODEL=gemini-2.5-flash
```
**Demo mode:** empty key → deterministic, localized (ES/EN) believable mocks in `demo.rs`, varied by payload hash, 600–1200ms fake latency; visible `DEMO` badge on every AI card and in Settings ("Add a key to go live").

## F. Data / persistence
`tauri-plugin-store` (`ocioflex.json`) behind `src/lib/storage.ts` (`get/set/subscribe`, falls back to `localStorage` outside Tauri so browser review works). Persist: `lang`, `context`, `activeTimer {kind,endsAt|startedAt,task}` (resumes after restart), `sessions[] {id,kind:"focus"|"rest",start,end,task,plannedMin}`, `media[]` (editable quick-launch; `tauri-plugin-opener` with allowed schemes https/steam/spotify only). Dashboard KPIs computed from `sessions`; first run seeds 14 days of realistic demo history flagged `seed:true`; Settings has "Reset demo data". Keep: timestamp-based timer logic, typed locale files, CSS-var context engine (renamed).

## G. Work packages (Prompt 2) — one run each, commit per WP
**WP1 Hygiene & Tauri base.** Bump `next` + `eslint-config-next` to latest 16.x patch (read `node_modules/next/dist/docs/` first); delete root `patch_*.js`, `generate_viz.js`; move `Audit-*.md`, `I18n-*.md` to `docs/archive/`; `.gitignore` += `.env*` (keep `.env.example`), `src-tauri/target`, `src-tauri/gen`; commit `src-tauri/Cargo.lock`; rename package `ocioflex`; apply §C config; add `.env.example`. *AC:* `npm run build` exits 0; `cargo check` OK; `npx tauri dev` opens 1280×800, min size enforced.
**WP2 Design system.** Install fontsource + lucide; new tokens/`@theme`; remove CDN + `next/font/google`; primitives (Button, Card, Segmented, Chip, Badge, Input, PageHeader). *AC:* zero external network requests; tokens match §B exactly; text contrast ≥ 4.5:1.
**WP3 Shell + context engine.** Rail, ContextSwitch, crossfading canvas, page-enter motion; remove fake chrome/stub nav; set `lang`. *AC:* Foco↔Ocio crossfade 600ms; keyboard nav with visible focus; rail collapses at 1024px.
**WP4 Screens.** Rebuild Home, Deep Work (TimerDial, presets 25/45/60, task input), Entertainment, Settings per wireframes + EmptyStates. *AC:* match wireframes at 1280×800 and 1024×680; no horizontal scroll; timers resume after reload.
**WP5 Hero 3D.** `Hero3D.tsx` + fallback per §B. *AC:* lazy chunk (not in initial JS); fallback with reduced-motion and with WebGL disabled; no console errors; added bundle ≤ 250 KB gz; ≥ 55 fps on integrated GPU.
**WP6 AI backend.** `ai/` module, adapter, demo mode, 3 commands, `src/lib/ai.ts` with `isTauri()` mock path. *AC:* empty key → demo JSON for all 3 features; with key → Gemini; `grep -r AI_API_KEY src out` finds nothing; no command returns the key.
**WP7 AI UI + persistence.** `storage.ts` + store plugin, sessions/media persistence, AiCoachCard, BreakSuggestions, TaskSplitter, Settings AI panel with DEMO/LIVE badge. *AC:* all features work in demo and live; loading/error/empty states; data survives app restart.
**WP8 i18n completion.** Namespaced locales, OS default, Intl formatting, localized mocks, AI language. *AC:* runtime switch changes every visible string (no literal UI text left in `src/components`); no truncation in ES at 1024px.
**WP9 Packaging.** Icon set, NSIS/MSI, version 1.0.0, README rewrite (run/build/AI key), one `npx tauri build --bundles nsis`. *AC:* installer produced, installs, launches offline with correct name/icon.

## Polish list (Prompt 3)
Pixel pass vs wireframes at 1280×800 / 1024×680; ES long-string audit; hover/active/focus/disabled for every control; orb tuning (color, speed, parallax); timer-complete pulse + toast micro-interactions; AI skeleton states; heatmap tooltips; scroll shadows; reduced-motion QA; tab order + aria-labels; empty-state illustrations; release checks (no devtools/context menu); screenshot set for the course report; remove dead tokens/CSS.

## H. Risks & needs from Gabo
- **Gemini API key** (optional; demo mode ships by default): create in Google AI Studio, put in `.env` or Settings; never commit.
- Confirm identifier/publisher (`com.ocioflex.app`) and OK to bump Next (security advisory).
- Risks: WebView2 GPU variance (fallback + dpr cap); Next 16 differs from training data; first Rust build with reqwest/rustls ≈ 3–5 min; NSIS needs network for the WebView2 bootstrapper unless `embedBootstrapper`; opener URL scope must be tight.
- Assets: logo mark optional (else generated); no photos needed.
