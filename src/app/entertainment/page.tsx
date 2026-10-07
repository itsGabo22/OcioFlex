import React from "react";

export default function EntertainmentPage() {
  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto min-h-[calc(100vh-80px)] gap-space-xl animate-fade-in duration-500 pb-space-2xl">
      
      {/* TOP REGION: Break Tracker */}
      <section className="w-full flex items-center justify-center p-space-2xl min-h-[40vh]">
        {/* PLACEHOLDER */}
        <div className="flex flex-col items-center gap-space-lg">
          <div className="font-title-lg text-title-lg text-on-surface-variant font-medium">Break Tracker Placeholder</div>
          <div className="font-display-md text-display-md text-accent-primary">00:00:00</div>
        </div>
      </section>

      {/* SECONDARY REGION: Media Grid */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-space-lg px-space-sm">
          <h2 className="font-title-md text-title-md font-semibold text-on-surface">Quick Launch</h2>
          <span className="font-code-inline text-code-inline text-on-surface-variant px-2 py-1 bg-surface-container-low rounded-full">
            LEISURE HUBS
          </span>
        </div>
        
        {/* MEDIA GRID PLACEHOLDER */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-lg">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-48 rounded-3xl bg-surface-container-lowest border border-surface-container-high opacity-50 flex items-center justify-center">
              <span className="font-code-inline text-code-inline text-on-surface-variant">MEDIA CARD {item}</span>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
}
