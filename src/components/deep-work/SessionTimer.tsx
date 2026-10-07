"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_TIME = 45 * 60; // 45 minutes

export const SessionTimer = () => {
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(DEFAULT_TIME);
  const [taskName, setTaskName] = useState("");

  const isRunning = endTime !== null;

  useEffect(() => {
    if (!endTime) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= endTime) {
        setRemaining(0);
        setEndTime(null);
        // Handle completion
      } else {
        setRemaining(Math.ceil((endTime - now) / 1000));
      }
    }, 200);
    
    return () => clearInterval(interval);
  }, [endTime]);

  const toggleTimer = () => {
    if (isRunning) {
      setEndTime(null); // Pause
    } else {
      if (remaining === 0) {
        // Restart from default if finished
        setRemaining(DEFAULT_TIME);
        setEndTime(Date.now() + DEFAULT_TIME * 1000);
      } else {
        // Resume
        setEndTime(Date.now() + remaining * 1000);
      }
    }
  };

  const stopTimer = () => {
    setEndTime(null);
    setRemaining(DEFAULT_TIME);
    setTaskName("");
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeString = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;

  return (
    <section className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest rounded-2xl border border-surface-container-high p-space-2xl shadow-sm relative overflow-hidden group">
      {/* Background ambient glow based on semantic accent */}
      <div 
        className={cn(
          "absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-primary/10 via-surface-container-lowest to-surface-container-lowest pointer-events-none transition-opacity duration-1000",
          isRunning ? "opacity-100" : "opacity-0"
        )}
      ></div>
      
      <div className="relative z-10 w-full flex flex-col items-center gap-space-xl">
        <div className="font-code-inline text-code-inline px-2 py-1 rounded bg-surface-container-low text-on-surface-variant font-medium uppercase tracking-widest flex items-center gap-2">
          {isRunning && <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>}
          {isRunning ? "Focus Active" : "Deep Work Ready"}
        </div>
        
        {/* TIMER DISPLAY */}
        <div 
          className={cn(
            "font-display-lg text-[100px] md:text-[140px] leading-none font-bold tabular-nums tracking-tighter transition-colors duration-500",
            isRunning ? "text-accent-primary" : "text-on-surface"
          )}
        >
          {timeString}
        </div>
        
        {/* CONTROLS */}
        <div className="flex items-center gap-space-md mt-space-sm">
          <button 
            onClick={toggleTimer}
            aria-label={isRunning ? "Pause Session" : "Start Session"}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/30",
              isRunning 
                ? "bg-surface-container-highest text-on-surface hover:bg-surface-container-highest/80" 
                : "bg-accent-primary text-on-accent-primary"
            )}
          >
            <span className="material-symbols-outlined text-[32px]">
              {isRunning ? "pause" : "play_arrow"}
            </span>
          </button>
          
          <button 
            onClick={stopTimer}
            disabled={!isRunning && remaining === DEFAULT_TIME}
            aria-label="Stop and Reset Timer"
            className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:hover:bg-surface-container-high outline-none focus-visible:ring-2 focus-visible:ring-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[24px]">stop</span>
          </button>
        </div>
        
        {/* TASK INPUT */}
        <input 
          type="text" 
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="What is your focus?" 
          className="mt-space-xl w-full max-w-md bg-transparent border-b-2 border-surface-container-high focus:border-accent-primary outline-none px-2 py-3 text-center font-title-lg text-title-lg text-on-surface placeholder:text-on-surface-variant/40 transition-colors"
        />
      </div>
    </section>
  );
};
