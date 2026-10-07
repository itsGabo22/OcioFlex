import React from "react";

export const MainVisualContainer = () => {
  return (
    <section className="flex flex-col mb-space-2xl">
      <div className="flex items-center justify-between pb-2 mb-space-md border-b border-surface-container-high">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-primary transition-colors"></span>
          <h2 className="font-title-md text-title-md text-on-surface font-semibold tracking-wide">
            System Telemetry & Activity Flow
          </h2>
        </div>
        <span className="font-code-inline text-code-inline text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">REAL-TIME SYNC</span>
      </div>
      
      <div className="w-full min-h-[400px] rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-low via-surface-container-lowest to-surface-container-lowest opacity-50"></div>
        <div className="flex flex-col items-center gap-4 relative z-10 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] opacity-20 group-hover:opacity-40 transition-opacity">monitoring</span>
          <div className="flex flex-col items-center gap-1">
            <span className="font-title-md text-title-md font-medium">Visualization Engine Placeholder</span>
            <span className="font-code-inline text-code-inline opacity-70">AWAITING TELEMETRY DATA STREAM</span>
          </div>
        </div>
        
        {/* Decorative Grid Lines to imply dashboard scaffolding */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
    </section>
  );
};
