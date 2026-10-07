"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/Sparkline";
import { generateSparklineData } from "@/data";
import { useTranslation } from "@/context/LanguageContext";

interface KpiCardProps {
  title: string;
  badge?: string;
  value: string;
  targetLabel: string;
  targetValue: string;
  progress?: number;
  children?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export const KpiCard = ({ title, badge, value, targetLabel, targetValue, progress, trend, children }: KpiCardProps) => {
  return (
    <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between gap-1 min-h-[160px] transition-colors">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-label-ui text-label-ui text-on-surface-variant uppercase font-semibold tracking-wider">{title}</span>
          {badge && (
            <span className="font-code-inline text-code-inline px-1.5 py-0.5 rounded bg-accent-container text-on-accent-container font-semibold transition-colors">
              {badge}
            </span>
          )}
          {trend === "up" && (
            <span className="font-code-inline text-code-inline text-accent-primary flex items-center font-semibold transition-colors">
              <span className="material-symbols-outlined text-[13px] mr-0.5">trending_up</span> {badge}
            </span>
          )}
        </div>
        <span className="font-display-md text-display-md text-on-surface font-bold tracking-tight mt-1">{value}</span>
      </div>
      
      <div className="mt-space-md flex flex-col gap-1.5">
        <div className="flex justify-between items-center font-code-inline text-code-inline text-on-surface-variant">
          <span>{targetLabel}</span>
          <span className={cn(progress !== undefined && "text-accent-primary font-semibold transition-colors")}>{targetValue}</span>
        </div>
        {children ? children : progress !== undefined && (
          <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
            <div className="h-full bg-accent-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export const KpiGrid = () => {
  const { t } = useTranslation();
  const sparkData1 = generateSparklineData();
  const sparkData2 = generateSparklineData().reverse();
  const sparkData3 = generateSparklineData().map((d, i) => ({value: (d.value * (i + 1) * 7) % 100}));
  const sparkData4 = generateSparklineData().map(d => ({value: d.value + 20}));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm lg:gap-space-md mb-space-xl lg:mb-space-2xl">
      <KpiCard 
        title={t.dashboard.focusSession} 
        badge={t.common.active} 
        value="04h 12m" 
        targetLabel={`${t.common.target}: 06h 00m`} 
        targetValue={`70.0% ${t.common.completed}`} 
        progress={70} 
      >
        <Sparkline data={sparkData1} />
      </KpiCard>
      <KpiCard 
        title={t.dashboard.efficiencyScore} 
        trend="up"
        badge="+4.2%" 
        value="84.6%" 
        targetLabel={`${t.common.baseline}: 72.0%`} 
        targetValue={t.common.sysOk} 
      >
        <Sparkline data={sparkData2} />
      </KpiCard>
      <KpiCard 
        title={t.dashboard.ocioCooldown} 
        value="01h 45m" 
        targetLabel={`${t.common.allowance}: 02h 30m`} 
        targetValue={t.common.remaining} 
        progress={30} 
      >
        <Sparkline data={sparkData3} />
      </KpiCard>
      <KpiCard 
        title={t.dashboard.memoryCoreRes} 
        badge="SYS_RAM" 
        value="1.82 GB" 
        targetLabel={`${t.common.alloc}: RSS Peak 2.1 GB`} 
        targetValue="38% SYS" 
        progress={38} 
      >
        <Sparkline data={sparkData4} />
      </KpiCard>
    </div>
  );
};
