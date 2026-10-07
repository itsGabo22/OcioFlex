# Epic Audit Report: Client-Side i18n & Interactivity

## 1. Current Architecture
- **Framework:** Next.js 16.4.0 (App Router), React 19.3.0.
- **Client Boundaries:** src/theme/ThemeContext.tsx is "use client". layout.tsx is a Server Component that wraps children in <ThemeProvider> and <AppShell>.
- **Styling:** Tailwind CSS v4, utilizing global CSS variables for Foco/Ocio themes.
- **Provider Location:** I will create src/context/LanguageContext.tsx (and ToastContext.tsx) and wrap them in a new Providers.tsx client component to keep layout.tsx clean and server-rendered.

## 2. Current Provider/Context Structure
- ThemeContext exists (oco | ocio) but lacks persistence. 
- No existing LanguageContext.
- No existing ToastContext.

## 3. Current Foco/Ocio Theme Implementation
- Fully CSS-driven via .theme-ocio class toggled on the ody tag via ThemeContext. This will be reused exactly as is for the Settings route.

## 4. Current Route Structure
- / (Dashboard)
- /deep-work
- /entertainment
- Need to create /settings.

## 5. Current i18n Status
- No internationalization system. 
- Hardcoded English strings across all UI components.

## 6. Current Persistence Mechanism
- None currently active for Theme or Language.
- I will implement safe client-side localStorage persistence for Language (with fallback to 'es') avoiding hydration mismatches.

## 7. User-Facing Strings Identified
- Approximately 40-50 strings across: Sidebar navigation, Dashboard headers & KPIs, Deep Work timer & timeline, Entertainment break tracker & media cards.

## 8. Interactive Elements Identified
- ~15 interactive elements (Sidebar nav links, Context toggle, Dashboard 'Today' / 'Start Session' buttons, SessionTimer 'Pause'/'End' buttons, Media Cards, BreakTracker controls).

## 9. Functional Interactive Elements
- ~6 functional elements (Sidebar navigation links via Next.js <Link>, Foco/Ocio context toggle).

## 10. Dead / Incomplete Interactive Elements
- ~9 dead elements (Dashboard 'Today', Dashboard 'Start Session', SessionTimer buttons, BreakTracker buttons, Media Cards).

## 11. Existing Toast/Feedback Infrastructure
- **None.** No existing Toast/Alert library is installed. I will build a lightweight ToastProvider using the existing design tokens.

## 12. Exact Client/Server Boundary Strategy
- layout.tsx will remain a Server Component.
- A new src/providers/AppProviders.tsx (Client Component) will encapsulate ThemeProvider, LanguageProvider, and ToastProvider.
- Leaf components needing translation (e.g., DashboardHeader, KpiCard) will be marked "use client" where necessary, though many interactive ones (like SessionTimer) already naturally lean towards client-side.

## 13. Exact Files Expected to Change
- src/app/layout.tsx
- src/components/shell/*
- src/components/dashboard/*
- src/components/deep-work/*
- src/components/entertainment/*
- src/app/settings/page.tsx (New)
- src/locales/en.ts, src/locales/es.ts (New)
- src/context/* (New)

## 14. Proposed Atomic Commit Sequence
1. eat(i18n): add client-side language context and toast provider
2. eat(settings): add language and context controls
3. eat(i18n): translate shared navigation and shell
4. eat(i18n): translate dashboard and deep work
5. eat(i18n): translate entertainment and settings
6. eat(interactions): complete application feedback and actions

## 15. Potential Risks
- Hydration mismatches during language initialization from localStorage. (Mitigated by initializing safely post-mount).
- Excessive "use client" propagation. (Mitigated by keeping pure layouts server-rendered).
- Layout shifts from longer Spanish strings. (Mitigated by using flex/grid constraints).
