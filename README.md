# OcioFlex

Desktop app (Tauri v2 + Next.js static export) that balances **deep work** and **leisure**. Light theme, ES/EN, AI assistant with demo mode, one procedural 3D hero.

## Run
```bash
npm install
npm run tauri dev        # desktop app (Windows first)
npm run dev              # browser-only visual review (Tauri APIs are shimmed)
npm run tauri build      # installers (NSIS + MSI) in src-tauri/target/release/bundle
```
Requires Node 20+, Rust 1.90+, WebView2 (bundled by the installer).

## AI assistant (Balance Coach, Break Suggester, Task Splitter)
Works out of the box in **demo mode** (sample answers, `DEMO` badge). To go live, supply a Gemini API key any one of these ways (checked in this order):
1. In the app: **Settings → AI assistant → API key** (write-only; stored by the Rust core in the app config dir, the interface only learns "configured: yes/no").
2. Environment variables `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, or a `.env` file next to the executable.
3. In development, a `.env` at the repo root (copy `.env.example`).

The key never reaches the webview, logs or git (`.env` is ignored). Default model is `gemini-flash-latest` (override with `AI_MODEL`).

## Design
"Paper & Tide": warm ivory paper, **Foco** (deep teal) and **Ocio** (apricot) moods that cross-fade the whole canvas. Fraunces + Instrument Sans + Geist Mono, all bundled. See `docs/OCIOFLEX_PLAN.md`. Contrast of every token pair is verified by `node scripts/contrast.mjs`.

Credits: see `CREDITS.md`.
