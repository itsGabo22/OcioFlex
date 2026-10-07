import React from 'react';
import { ActivityCell } from '@/data';
export const ActivityHeatmap = ({ data }: { data: ActivityCell[] }) => {
  return (
    <div className="w-full">
      <div className="grid"></div>
    </div>
  );
};
