import React from 'react';
import { ActivityCell } from '@/data';
export const ActivityHeatmap = ({ data }: { data: ActivityCell[] }) => {
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
      <div className="flex gap-[4px] min-w-max py-2 px-1">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-[4px]">
            {week.map((cell, j) => (
              <button 
                key={j} 
                className="w-4 h-4 rounded-[4px] bg-surface-container-highest relative group hover:scale-110 hover:z-10 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary transition-all duration-200"
                title={`${cell.date}: ${Math.round(cell.intensity * 100)}% Activity`}
                aria-label={`Activity on ${cell.date}`}
              >
                <div 
                  className="absolute inset-0 bg-accent-primary rounded-[inherit] transition-colors duration-300"
                  style={{ opacity: cell.intensity }}
                />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
