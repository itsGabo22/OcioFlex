import React from "react";

import { ActivityHeatmap } from "@/components/ui/ActivityHeatmap";
import { generateHeatmapData } from "@/data";

export const MainVisualContainer = () => {
  const heatmapData = generateHeatmapData();
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
      
      <div className="w-full min-h-[300px] lg:min-h-[400px] rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col items-center justify-center relative group p-space-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-low/50 via-surface-container-lowest to-surface-container-lowest opacity-50 pointer-events-none"></div>
        <div className="relative z-10 w-full flex flex-col gap-space-md">
          <div className="flex items-center justify-between w-full">
            <span className="font-title-md text-title-md font-semibold text-on-surface">Activity Intensity</span>
            <span className="font-code-inline text-code-inline text-on-surface-variant">TRAILING 100 DAYS</span>
          </div>
          <div className="w-full bg-surface-container-lowest rounded-xl border border-surface-container-high p-space-md shadow-inner flex items-center justify-center">
            <ActivityHeatmap data={heatmapData} />
          </div>
        </div>
      </div>
    </section>
  );
};
