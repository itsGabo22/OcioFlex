# Entertainment Route Audit & Implementation Plan

## 1. Current Route Architecture
- **AppShell**: Located in src/app/layout.tsx. It persists globally across routes.
- **Deep Work Route**: Located in src/app/deep-work/page.tsx. Uses lex-col lg:flex-row layout.
- **Entertainment Route**: Will be created at src/app/entertainment/page.tsx. It will inherit AppShell automatically and we will not duplicate it.

## 2. Ocio Semantic Tokens
- **Accent Primary**: --color-accent-primary (resolves to Fuchsia in .theme-ocio via 	ertiary-container).
- **Surfaces**: --color-surface-container-lowest to -highest are available for translucent cards and layout primitives.
- **Radii**: Standard Tailwind ounded-xl, ounded-2xl, ounded-3xl are available. I will use ounded-3xl for MediaCards and ounded-[32px] for the main Break Tracker to give it a noticeably softer, more approachable geometry than the structural ounded-2xl used in Deep Work.
- **Surfaces/Translucency**: g-surface-container-lowest/70 backdrop-blur-md can be used for subtle glassmorphism if appropriate.

## 3. Break Tracker Architecture
- A count-up timer. Will use Date.now() - startTime for precision.
- States: Idle, Running, Paused, Stopped.
- Visual: Large, relaxed circular or horizontal layout, prominent but less aggressive than Deep Work's 140px countdown. Emphasizes elapsed time elegantly.

## 4. Media Quick-Launch Cards
- Layout: CSS Grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4).
- Mock Data: src/data/mock-entertainment.ts exporting getMediaActivities().
- Structure: Soft geometry, platform context, currently active media, and quick-launch button.

## 5. Execution Strategy
1. **Route & Layout Scaffolding**: Create /entertainment, link it from Sidebar.tsx, scaffold the two major regions.
2. **Break Tracker**: Build <BreakTracker /> using robust timekeeping.
3. **Media Cards**: Create mock data, <MediaGrid />, <MediaCard /> with softer geometry.
4. **Integration & Validation**: QA responsiveness, build, lint. Verify 
pm run build. Take screenshots.

I am proceeding with Step 1.
