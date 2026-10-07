"use client";

import React from "react";
import { FocusSession } from "@/data/mock-sessions";
import { useTranslation } from "@/context/LanguageContext";

interface DailyTimelineProps {
  sessions: FocusSession[];
}

export const DailyTimeline = ({ sessions }: DailyTimelineProps) => {
  const { t } = useTranslation();

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50 text-center p-space-xl">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant">hourglass_empty</span>
        <p className="font-body-compact text-body-compact text-on-surface-variant">{t.deepWork.noSessionsYet}</p>
        <p className="font-code-inline text-code-inline text-on-surface-variant/70">AWAITING FOCUS</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 relative">
      {/* Vertical connector line */}
      <div className="absolute left-[7px] top-3 bottom-8 w-[2px] bg-surface-container-high z-0"></div>

      {sessions.map((session, index) => (
        <div key={session.id} className="relative z-10 flex gap-space-md group pb-space-lg last:pb-0">
          
          {/* Node */}
          <div className="flex flex-col items-center pt-1.5">
            <div className="w-[16px] h-[16px] rounded-full bg-surface-container-lowest border-4 border-surface-container-highest group-hover:border-accent-primary transition-colors duration-300"></div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-space-sm">
              <span className="font-code-inline text-code-inline text-on-surface-variant font-medium">
                {session.timestamp}
              </span>
              <span className="font-label-ui text-label-ui px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-semibold">
                {session.durationMinutes} MIN
              </span>
            </div>
            <p className="font-body-compact text-body-compact text-on-surface font-medium">
              {session.task}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
