"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";

export const BreakTracker = () => {
  const { t } = useTranslation();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulated, setAccumulated] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);

  const isRunning = startTime !== null;

  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setCurrentOffset(Math.floor((Date.now() - startTime!) / 1000));
    }, 200);
    
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const toggleTracker = () => {
    if (isRunning) {
      // Pause
      setAccumulated(prev => prev + currentOffset);
      setCurrentOffset(0);
      setStartTime(null);
    } else {
      // Start / Resume
      setStartTime(Date.now());
    }
  };

  const resetTracker = () => {
    setStartTime(null);
    setAccumulated(0);
    setCurrentOffset(0);
  };

  const totalSeconds = accumulated + currentOffset;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const timeString = [
    hours > 0 ? hours.toString().padStart(2, '0') : null,
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].filter(Boolean).join(':');

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center bg-surface-container-low rounded-[40px] p-space-2xl relative overflow-hidden transition-all duration-700">
      
      {/* Soft Ambient Glow - specific to Leisure feel */}
      <div 
        className={cn(
          "absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-primary/10 via-surface-container-low/50 to-surface-container-low pointer-events-none transition-all duration-1000 ease-in-out",
          isRunning ? "opacity-100 scale-110" : "opacity-0 scale-100"
        )}
      ></div>

      <div className="relative z-10 flex flex-col items-center gap-space-lg">
        
        {/* Soft Label */}
        <div className="flex items-center gap-2 text-on-surface-variant font-label-ui text-label-ui uppercase tracking-widest font-medium">
          <span className="material-symbols-outlined text-[18px]">self_improvement</span>
          {isRunning ? t.entertainment.ocioCooldownActive : t.navigation.entertainment}
        </div>

        {/* Count-up Timer */}
        <div 
          className={cn(
            "font-display-lg text-[80px] md:text-[100px] leading-none font-medium tabular-nums tracking-tight transition-colors duration-700 ease-out",
            isRunning ? "text-accent-primary" : "text-on-surface-variant/80"
          )}
        >
          {timeString}
        </div>

        {/* Relaxed Controls */}
        <div className="flex items-center gap-space-md mt-space-sm">
          <button 
            onClick={toggleTracker}
            aria-label={isRunning ? t.common.pause : t.common.startSession}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/30",
              isRunning 
                ? "bg-surface-container-highest text-on-surface hover:bg-surface-container-highest/80 hover:scale-95" 
                : "bg-surface-container-highest text-accent-primary hover:bg-surface-container-highest/80 hover:scale-105"
            )}
          >
            <span className="material-symbols-outlined text-[28px]">
              {isRunning ? "pause" : "play_arrow"}
            </span>
          </button>
          
          <button 
            onClick={resetTracker}
            disabled={totalSeconds === 0}
            aria-label={t.common.endSession}
            className="w-12 h-12 rounded-full text-on-surface-variant/60 flex items-center justify-center hover:text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:hover:bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[22px]">restart_alt</span>
          </button>
        </div>

      </div>
    </div>
  );
};
