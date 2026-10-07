import { SparklinePoint, ActivityCell } from './visualization-types';
export const generateSparklineData = (): SparklinePoint[] => [
  { value: 40 }, { value: 45 }, { value: 60 }, { value: 50 },
  { value: 70 }, { value: 65 }, { value: 80 }, { value: 95 },
  { value: 85 }
];
export const generateHeatmapData = (): ActivityCell[] => { const cells: ActivityCell[] = []; const now = new Date(); for(let i=100; i>=0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); const isWeekend = d.getDay() === 0 || d.getDay() === 6; let intensity = isWeekend ? Math.random() * 0.3 : Math.random(); if (intensity > 0.8) intensity = 1.0; else if (intensity < 0.2) intensity = 0; cells.push({ date: d.toISOString().split('T')[0], intensity: parseFloat(intensity.toFixed(2)) }); } return cells; };
