import React from "react";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-10 bg-surface-container-lowest z-50 flex items-center justify-between px-space-sm border-b border-surface-container-high">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-1">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-primary transition-colors"></span>
          <span className="font-code-metric text-code-metric text-on-surface font-bold tracking-tight">OcioFlex Engine</span>
        </div>
      </div>
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-low">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-primary transition-colors"></span>
          <span className="font-code-inline text-code-inline text-on-surface-variant uppercase tracking-wider font-medium">SYNCED</span>
        </div>
      </div>
    </header>
  );
};
