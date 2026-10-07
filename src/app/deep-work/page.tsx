import React from "react";

import { SessionTimer } from "@/components/deep-work/SessionTimer";

export default function DeepWorkPage() {
  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto min-h-[calc(100vh-80px)] gap-space-lg animate-fade-in duration-500">
      
      {/* MAIN FOCUS AREA: Dominant timer section */}
      <SessionTimer />

      {/* SECONDARY AREA: Daily Timeline */}
      <aside className="w-full lg:w-[380px] flex flex-col bg-surface-container-lowest rounded-2xl border border-surface-container-high p-space-lg shadow-sm">
        <h3 className="font-label-ui text-label-ui uppercase tracking-wider text-on-surface-variant font-semibold mb-space-lg pb-space-sm border-b border-surface-container-high flex justify-between items-center">
          <span>Today's Sessions</span>
          <span className="bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface">3</span>
        </h3>
        
        {/* TIMELINE PLACEHOLDER */}
        <div className="flex-1 flex flex-col gap-space-md opacity-50">
          <div className="font-code-inline text-code-inline text-center py-space-xl">
            TIMELINE WILL MOUNT HERE
          </div>
        </div>
      </aside>

    </div>
  );
}
