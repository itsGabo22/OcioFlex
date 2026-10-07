import React from "react";

export default function DeepWorkPage() {
  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto min-h-[calc(100vh-80px)] gap-space-lg animate-fade-in duration-500">
      
      {/* MAIN FOCUS AREA: Dominant timer section */}
      <section className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest rounded-2xl border border-surface-container-high p-space-2xl shadow-sm relative overflow-hidden">
        {/* Background ambient glow based on semantic accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-primary/5 via-surface-container-lowest to-surface-container-lowest opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10 w-full flex flex-col items-center gap-space-xl">
          <div className="font-code-inline text-code-inline px-2 py-1 rounded bg-surface-container-low text-on-surface-variant font-medium uppercase tracking-widest">
            Deep Work Session
          </div>
          
          {/* TIMER PLACEHOLDER */}
          <div className="font-display-lg text-[120px] leading-none font-bold text-accent-primary tabular-nums tracking-tighter">
            45:00
          </div>
          
          {/* CONTROLS PLACEHOLDER */}
          <div className="flex items-center gap-space-md mt-space-md">
            <button className="w-14 h-14 rounded-full bg-accent-primary text-on-accent-primary flex items-center justify-center shadow-md hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-[28px] translate-x-0.5">play_arrow</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined text-[24px]">stop</span>
            </button>
          </div>
          
          {/* TASK INPUT PLACEHOLDER */}
          <input 
            type="text" 
            placeholder="What is your focus?" 
            className="mt-space-xl w-full max-w-md bg-transparent border-b-2 border-surface-container-high focus:border-accent-primary outline-none px-2 py-3 text-center font-title-lg text-title-lg text-on-surface placeholder:text-on-surface-variant/50 transition-colors"
          />
        </div>
      </section>

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
