import React from 'react';
import { SparklinePoint } from '@/data';
export const Sparkline = ({ data }: { data: SparklinePoint[] }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const pathData = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  const fillData = `${pathData} L 100 100 L 0 100 Z`;
  
  return (
    <div className="w-full h-full flex items-end">
      <svg className="w-full h-full overflow-visible text-accent-primary" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d={fillData} fill="currentColor" opacity="0.1" className="transition-colors duration-300" />
        <path d={pathData} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="transition-colors duration-300" />
      </svg>
    </div>
  );
};
