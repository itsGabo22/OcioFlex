# OcioFlex

## 1. Project Overview
OcioFlex is a native desktop productivity and leisure tracking application. Built to explore the relationship between deep focus and quality downtime, the application operates through a dual-context visual architecture:
- **FOCO (Deep Work):** Emerald-themed, structural, and focused on countdown-driven productivity.
- **OCIO (Entertainment):** Fuchsia-themed, soft, and oriented around count-up leisure tracking and quick media access.

The application uses a persistent global shell, ensuring uninterrupted navigation across the Dashboard, Deep Work, and Entertainment routes.

## 2. Features
- **Global Dashboard:** Visualizes the balance between Foco and Ocio states using responsive heatmaps and sparkline indicators.
- **Deep Work Route:** An immersive, distraction-free environment featuring a robust timestamp-driven countdown timer and daily session timeline.
- **Entertainment Route:** A relaxed leisure hub featuring a count-up break tracker and translucent Media Quick-Launch cards.
- **Context Engine:** Instantaneous, CSS-driven theme switching (Foco ↔ Ocio) using semantic design tokens without heavy JavaScript recalculations.
- **Native Desktop App:** Powered by Tauri v2, bringing Next.js web technologies seamlessly into a desktop environment.

## 3. Technology Stack
- **Next.js:** `16.4.0` (App Router, Static Export)
- **React:** `19.3.0`
- **Styling:** Tailwind CSS (`@tailwindcss/turbopack`)
- **Desktop Runtime:** Tauri v2 (`@tauri-apps/cli`)
- **Language:** TypeScript

## 4. Project Structure
\`\`\`text
OcioFlex/
├── src/
│   ├── app/                # Next.js App Router (layout, page, routing)
│   ├── components/         # Reusable React components (UI, Dashboard, Deep Work)
│   ├── data/               # Mock telemetry and application state models
│   └── lib/                # Shared utilities
├── src-tauri/              # Native Rust and Tauri v2 configuration
├── public/                 # Static web assets
├── out/                    # Next.js static export destination (ignored in git)
├── tailwind.config.ts      # Design token mapping
└── next.config.ts          # Static export configuration
\`\`\`

## 5. Requirements
To run the OcioFlex development environment, you need:
- Node.js (LTS recommended)
- npm
- Rust & Cargo (Required for Tauri desktop builds)

## 6. Installation
Clone the repository and install the Node dependencies:
\`\`\`bash
git clone https://github.com/itsGabo22/OcioFlex.git
cd OcioFlex
npm install
\`\`\`

## 7. Web Development
To run the Next.js frontend in standard web-preview mode (browser):
\`\`\`bash
npm run dev
\`\`\`
The application will be available at `http://localhost:3000`.

## 8. Production Build
To generate the static frontend bundle:
\`\`\`bash
npm run build
\`\`\`
Next.js will output the completely static assets into the `out/` directory, ready to be consumed by Tauri.

## 9. Tauri Desktop Development
To launch OcioFlex as a native desktop application with hot-reloading:
\`\`\`bash
npx tauri dev
\`\`\`
*Note: Ensure your Rust toolchain and platform-specific C++ build tools are installed prior to running Tauri commands.*

## 10. Tauri Production Build
To compile the final native desktop executable for your operating system:
\`\`\`bash
npx tauri build
\`\`\`

## 11. Design System
The visual rules, geometry constraints, typography, and semantic token architecture powering OcioFlex are thoroughly documented in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md). 

## 12. Academic Context
This application was developed as part of a Software Engineering and Interface Design academic curriculum, focusing on modular architecture, CSS semantic variables, robust timekeeping constraints, and high-fidelity UI translation.

## 13. Development Notes
- **Static Export Constraints:** Because the application is embedded in Tauri, Next.js is configured for strictly static exports (`output: "export"`). Avoid server-only Next.js features (`getServerSideProps`, Server Actions).
- **Light Theme Only:** The application strictly enforces a Light Theme architecture. The semantic `accent-primary` tokens handle all contextual depth. Do not introduce Dark Mode variables.
