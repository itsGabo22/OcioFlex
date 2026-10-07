import React from 'react';
import { ActivityCell } from '@/data';
export const ActivityHeatmap = ({ data }: { data: ActivityCell[] }) => {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-1.5 min-w-max">
        {data.map((cell, i) => (
          <div key={i} className="w-3 h-3 rounded-sm bg-surface-container-highest"></div>
        ))}
      </div>
    </div>
  );
};
