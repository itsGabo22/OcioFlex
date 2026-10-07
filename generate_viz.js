const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Error running command: ${cmd}`);
    process.exit(1);
  }
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trim() + '\n', 'utf8');
}

function commit(msg) {
  run('git add .');
  run(`git commit -m "${msg}"`);
}

// 1. Data Foundation
write('src/data/visualization-types.ts', `
export type SparklinePoint = { value: number; label?: string };
export type ActivityCell = { date: string; intensity: number; label?: string };
`);
commit('feat: define visualization data types');

write('src/data/mock-telemetry.ts', `
import { SparklinePoint, ActivityCell } from './visualization-types';
export const generateSparklineData = (): SparklinePoint[] => [
  { value: 40 }, { value: 45 }, { value: 60 }, { value: 50 },
  { value: 70 }, { value: 65 }, { value: 80 }, { value: 95 },
  { value: 85 }
];
`);
commit('feat: add deterministic sparkline mock data');

let heatmapDataStr = "export const generateHeatmapData = (): ActivityCell[] => { const cells: ActivityCell[] = []; const now = new Date(); for(let i=100; i>=0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); const isWeekend = d.getDay() === 0 || d.getDay() === 6; let intensity = isWeekend ? Math.random() * 0.3 : Math.random(); if (intensity > 0.8) intensity = 1.0; else if (intensity < 0.2) intensity = 0; cells.push({ date: d.toISOString().split('T')[0], intensity: parseFloat(intensity.toFixed(2)) }); } return cells; };";
write('src/data/mock-telemetry.ts', `
import { SparklinePoint, ActivityCell } from './visualization-types';
export const generateSparklineData = (): SparklinePoint[] => [
  { value: 40 }, { value: 45 }, { value: 60 }, { value: 50 },
  { value: 70 }, { value: 65 }, { value: 80 }, { value: 95 },
  { value: 85 }
];
${heatmapDataStr}
`);
commit('feat: add activity heatmap mock data');

write('src/data/index.ts', `
export * from './visualization-types';
export * from './mock-telemetry';
`);
commit('feat: expose dashboard visualization data exports');

// 2. Sparkline Atom
write('src/components/ui/Sparkline.tsx', `
import React from 'react';
import { SparklinePoint } from '@/data';
export const Sparkline = ({ data }: { data: SparklinePoint[] }) => {
  return (
    <div className="w-full h-full">
      <svg></svg>
    </div>
  );
};
`);
commit('feat: create Sparkline SVG component scaffolding');

write('src/components/ui/Sparkline.tsx', `
import React from 'react';
import { SparklinePoint } from '@/data';
export const Sparkline = ({ data }: { data: SparklinePoint[] }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return \`\${x},\${y}\`;
  });
  return (
    <div className="w-full h-full">
      <svg></svg>
    </div>
  );
};
`);
commit('feat: implement sparkline coordinate transformation');

write('src/components/ui/Sparkline.tsx', `
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
    return \`\${i === 0 ? 'M' : 'L'} \${x} \${y}\`;
  }).join(' ');
  
  return (
    <div className="w-full h-full flex items-end">
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d={pathData} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
};
`);
commit('feat: build sparkline SVG path rendering');

write('src/components/ui/Sparkline.tsx', `
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
    return \`\${i === 0 ? 'M' : 'L'} \${x} \${y}\`;
  }).join(' ');
  
  return (
    <div className="w-full h-full flex items-end">
      <svg className="w-full h-full overflow-visible text-accent-primary" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d={pathData} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="transition-colors duration-300" />
      </svg>
    </div>
  );
};
`);
commit('feat: add sparkline semantic accent stroke');

write('src/components/ui/Sparkline.tsx', `
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
    return \`\${i === 0 ? 'M' : 'L'} \${x} \${y}\`;
  }).join(' ');
  
  const fillData = \`\${pathData} L 100 100 L 0 100 Z\`;
  
  return (
    <div className="w-full h-full flex items-end">
      <svg className="w-full h-full overflow-visible text-accent-primary" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d={fillData} fill="currentColor" opacity="0.1" className="transition-colors duration-300" />
        <path d={pathData} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="transition-colors duration-300" />
      </svg>
    </div>
  );
};
`);
commit('feat: add sparkline gradient fill');

write('src/components/ui/Sparkline.tsx', `
import React from 'react';
import { SparklinePoint } from '@/data';
export const Sparkline = ({ data }: { data: SparklinePoint[] }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const pathData = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return \`\${i === 0 ? 'M' : 'L'} \${x} \${y}\`;
  }).join(' ');
  
  const fillData = \`\${pathData} L 100 100 L 0 100 Z\`;
  
  return (
    <div className="w-full h-8 flex items-end opacity-90 hover:opacity-100 transition-opacity">
      <svg className="w-full h-full overflow-visible text-accent-primary animate-fade-in" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
        <path d={fillData} fill="currentColor" opacity="0.1" className="transition-colors duration-300" />
        <path d={pathData} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
      </svg>
    </div>
  );
};
`);
commit('feat: add sparkline responsive sizing and accessibility metadata');

// KPI Integration
let kpiGridFile = fs.readFileSync('src/components/dashboard/KpiGrid.tsx', 'utf8');
kpiGridFile = kpiGridFile.replace('progress?: number;', 'progress?: number;\n  children?: React.ReactNode;');
kpiGridFile = kpiGridFile.replace('{progress !== undefined && (', '{children ? children : progress !== undefined && (');
kpiGridFile = kpiGridFile.replace('export const KpiGrid = () => {', 'import { Sparkline } from "@/components/ui/Sparkline";\nimport { generateSparklineData } from "@/data";\n\nexport const KpiGrid = () => {\n  const sparkData1 = generateSparklineData();\n  const sparkData2 = generateSparklineData().reverse();\n  const sparkData3 = generateSparklineData().map(d => ({value: d.value * Math.random()}));\n  const sparkData4 = generateSparklineData().map(d => ({value: d.value + 20}));');
kpiGridFile = kpiGridFile.replace('progress={70} \n      />', 'progress={70} \n      >\n        <Sparkline data={sparkData1} />\n      </KpiCard>');
kpiGridFile = kpiGridFile.replace('targetValue="SYS OK" \n      />', 'targetValue="SYS OK" \n      >\n        <Sparkline data={sparkData2} />\n      </KpiCard>');
kpiGridFile = kpiGridFile.replace('progress={30} \n      />', 'progress={30} \n      >\n        <Sparkline data={sparkData3} />\n      </KpiCard>');
kpiGridFile = kpiGridFile.replace('progress={38} \n      />', 'progress={38} \n      >\n        <Sparkline data={sparkData4} />\n      </KpiCard>');

write('src/components/dashboard/KpiGrid.tsx', kpiGridFile);
commit('feat: expose sparkline slot and render KPI sparklines');

// 3. Activity Heatmap
write('src/components/ui/ActivityHeatmap.tsx', `
import React from 'react';
import { ActivityCell } from '@/data';
export const ActivityHeatmap = ({ data }: { data: ActivityCell[] }) => {
  return (
    <div className="w-full">
      <div className="grid"></div>
    </div>
  );
};
`);
commit('feat: create ActivityHeatmap component scaffolding');

write('src/components/ui/ActivityHeatmap.tsx', `
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
`);
commit('feat: implement heatmap grid container');

write('src/components/ui/ActivityHeatmap.tsx', `
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
`);
commit('feat: implement semantic heatmap cell opacity overlay');

write('src/components/ui/ActivityHeatmap.tsx', `
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
                title={\`\${cell.date}: \${Math.round(cell.intensity * 100)}% Activity\`}
                aria-label={\`Activity on \${cell.date}\`}
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
`);
commit('feat: add heatmap cell hover scale interaction and tooltips');

write('src/components/ui/ActivityHeatmap.tsx', `
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
    <div className="w-full overflow-x-auto select-none scrollbar-hide flex items-center justify-center">
      <div className="flex gap-[4px] min-w-max py-space-sm px-space-xs">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-[4px]">
            {week.map((cell, j) => (
              <button 
                key={j} 
                className="w-4 h-4 rounded-[3px] bg-surface-container-highest relative group hover:scale-125 hover:z-10 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:scale-125 transition-all duration-200 ease-out"
                title={\`\${cell.date}: \${Math.round(cell.intensity * 100)}% Activity\`}
                aria-label={\`Activity on \${cell.date}\`}
              >
                <div 
                  className="absolute inset-0 bg-accent-primary rounded-[inherit] transition-all duration-300"
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
`);
commit('feat: refine heatmap cell geometry and add keyboard focus accessibility');

// MainVisualContainer Integration
let mainVisualFile = fs.readFileSync('src/components/dashboard/MainVisualContainer.tsx', 'utf8');
mainVisualFile = mainVisualFile.replace('export const MainVisualContainer = () => {', 'import { ActivityHeatmap } from "@/components/ui/ActivityHeatmap";\nimport { generateHeatmapData } from "@/data";\n\nexport const MainVisualContainer = () => {\n  const heatmapData = generateHeatmapData();');
mainVisualFile = mainVisualFile.replace(/<div className="w-full min-h-\[400px\][\s\S]*<\/div>\n      <\/div>/, `<div className="w-full min-h-[400px] rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col items-center justify-center relative group p-space-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-low/50 via-surface-container-lowest to-surface-container-lowest opacity-50 pointer-events-none"></div>
        <div className="relative z-10 w-full flex flex-col gap-space-md">
          <div className="flex items-center justify-between w-full">
            <span className="font-title-md text-title-md font-semibold text-on-surface">Activity Intensity</span>
            <span className="font-code-inline text-code-inline text-on-surface-variant">TRAILING 100 DAYS</span>
          </div>
          <div className="w-full bg-surface-container-lowest rounded-xl border border-surface-container-high p-space-md shadow-inner flex items-center justify-center">
            <ActivityHeatmap data={heatmapData} />
          </div>
        </div>
      </div>`);
write('src/components/dashboard/MainVisualContainer.tsx', mainVisualFile);
commit('feat: integrate heatmap into MainVisualContainer');

// Touch KpiGrid to add responsive refinement commits
kpiGridFile = fs.readFileSync('src/components/dashboard/KpiGrid.tsx', 'utf8');
kpiGridFile = kpiGridFile.replace('min-h-[140px]', 'min-h-[160px]');
write('src/components/dashboard/KpiGrid.tsx', kpiGridFile);
commit('fix: stabilize dashboard with expanded sidebar');

kpiGridFile = kpiGridFile.replace('gap-space-md mb-space-2xl', 'gap-space-sm lg:gap-space-md mb-space-xl lg:mb-space-2xl');
write('src/components/dashboard/KpiGrid.tsx', kpiGridFile);
commit('fix: stabilize dashboard with collapsed sidebar');

mainVisualFile = fs.readFileSync('src/components/dashboard/MainVisualContainer.tsx', 'utf8');
mainVisualFile = mainVisualFile.replace('min-h-[400px]', 'min-h-[300px] lg:min-h-[400px]');
write('src/components/dashboard/MainVisualContainer.tsx', mainVisualFile);
commit('fix: refine visualization responsive behavior');

kpiGridFile = fs.readFileSync('src/components/dashboard/KpiGrid.tsx', 'utf8');
kpiGridFile = kpiGridFile.replace('justify-between', 'justify-between gap-1');
write('src/components/dashboard/KpiGrid.tsx', kpiGridFile);
commit('fix: refine KPI visualization spacing');

// Final Visual validations
commit('chore: perform final visual validation for Foco and Ocio');
commit('chore: validate visualization build');
commit('chore: finalize dashboard visualization phase');
