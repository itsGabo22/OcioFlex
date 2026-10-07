import React from 'react';
import { ActivityCell } from '@/data';
export const ActivityHeatmap = ({ data }: { data: ActivityCell[] }) => {
  // Convert 1D array to weeks for a grid layout
  const weeks: ActivityCell[][] = [];
  let currentWeek: ActivityCell[] = [];
  
  data.forEach((cell, i) => {
    currentWeek.push(cell);
    if (currentWeek.length === 7 || i === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="w-full overflow-x-auto select-none">
      <div className="flex gap-1.5 min-w-max">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            {week.map((cell, j) => (
              <div key={j} className="w-[14px] h-[14px] rounded-[3px] bg-surface-container-highest relative">
                <div 
                  className="absolute inset-0 bg-accent-primary rounded-[inherit] transition-all duration-300"
                  style={{ opacity: cell.intensity }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
