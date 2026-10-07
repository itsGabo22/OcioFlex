# Deep Work Audit & Implementation Plan

## 1. Routing & AppShell Architecture
- **Current State:** AppShell is mounted inside src/app/page.tsx. This causes a full remount (and resets isCollapsed state) on route change if we just replicate it in /deep-work/page.tsx. 
- **Plan:** Move <AppShell> into src/app/layout.tsx inside the <ThemeProvider>. This is the correct Next.js App Router pattern for persistent layouts. It guarantees the Sidebar and isCollapsed state persist across routes without remounts.
- **Navigation:** Sidebar.tsx currently uses native <a href="#">. I will update NavItem to accept a href prop and use Next.js <Link href={href}> for client-side routing. /deep-work will be linked from "Foco Workspace" or similar, but the prompt says "When the user selects Deep Work from the existing Sidebar...", I'll add a specific "Deep Work" NavItem or link it. Wait, the sidebar has "Foco Workspace", "Ocio Lounge", "Process Telemetry", "Context Rules", "Analytics Log". I'll change "Foco Workspace" to link to /deep-work or add a new one.

## 2. Components & Tokens
- **Tokens:** The project uses g-surface-container-lowest, 	ext-on-surface, g-accent-container, 	ext-accent-primary. Foco (Emerald) and Ocio (Fuchsia) seamlessly inherit via CSS variable overrides.
- **Reusability:** The KpiCard or general Dashboard grid logic can inspire the layout. AppShell will handle the global layout. 
- **New Components:** 
  - SessionTimer: Immersive timer. Uses 	ext-display-lg or a custom massive size based on --font-jetbrains-mono.
  - DailyTimeline: Secondary list mapped from mock data.
  - DeepWorkLayout: 2-column grid layout.

## 3. Data Architecture
- Create src/data/mock-sessions.ts exposing deterministic completed sessions.

## 4. Execution Steps
1. Move AppShell to layout.tsx and refactor Sidebar to use 
ext/link.
2. Create /deep-work/page.tsx with a basic layout wrapper.
3. Build SessionTimer component with robust setInterval state.
4. Build DailyTimeline with structured mock data.
5. Integrate, Polish, and perform Visual/Responsive/Accessibility QA.
