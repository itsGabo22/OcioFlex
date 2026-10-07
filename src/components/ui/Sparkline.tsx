import React from 'react';
import { SparklinePoint } from '@/data';
export const Sparkline = ({ data }: { data: SparklinePoint[] }) => {
  return (
    <div className="w-full h-full">
      <svg></svg>
    </div>
  );
};
