# OcioFlex Visualization Audit & Execution Plan

## A. Existing Architecture
- **AppShell & Dashboard**: Built using flexbox and grid (grid-cols-4 for KPIs). It responds smoothly to the Sidebar width transition (pl-[68px] / pl-[260px]).
- **KpiCard**: Exposes a clean API for title, badge, value, and progress. The progress footer can easily be conditionally replaced by a children slot for the Sparkline.
- **MainVisualContainer**: Contains an empty placeholder section waiting for data.
- **Theme**: Relies entirely on .theme-ocio CSS variables in globals.css driving Tailwind tokens like ccent-primary.

## B. Stitch Reference
- Sparklines sit at the bottom of the KpiCard and take full width. They use a solid 2px stroke (	ext-primary) and an area fill beneath it (opacity: 0.1).
- Heatmaps are not explicitly drawn, but instructions dictate a rounded-cell grid mirroring GitHub contributions visually, but strictly maintaining OcioFlex semantic colors and spacing (space-base, space-xs).

## C. Data & Rendering Approach
- **Data**: A deterministic static set of mock data in src/data/mock-telemetry.ts will feed the components.
- **Sparkline**: Pure SVG + React. Will map data points to M... L... strings natively.
- **Heatmap**: CSS Grid with standard <div> elements. Semantic color overlay: A base g-surface-container-highest cell will contain an inner w-full h-full bg-accent-primary div with opacity={intensity}. This completely solves Foco/Ocio transitions without JS recalculations!

## D. Commit Roadmap
A 30+ commit roadmap has been formulated, separating data layers, primitive scaffolding, semantic styling, responsive refinements, and integration.

I am proceeding to execution.
