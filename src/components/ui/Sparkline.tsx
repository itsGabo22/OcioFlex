import React from 'react';
import { SparklinePoint } from '@/data';
export const Sparkline = ({ data }: { data: SparklinePoint[] }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  });
  return (
    <div className="w-full h-full">
      <svg></svg>
    </div>
  );
};
