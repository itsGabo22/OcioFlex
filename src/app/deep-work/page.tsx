import { SessionTimer } from "@/components/deep-work/SessionTimer";
import { DailyTimeline } from "@/components/deep-work/DailyTimeline";
import { getDailySessions } from "@/data";

export default function DeepWorkPage() {
  const sessions = getDailySessions();

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto min-h-[calc(100vh-80px)] gap-space-lg animate-fade-in duration-500">
      
      {/* MAIN FOCUS AREA: Dominant timer section */}
      <SessionTimer />

      {/* SECONDARY AREA: Daily Timeline */}
      <aside className="w-full lg:w-[380px] flex flex-col bg-surface-container-lowest rounded-2xl border border-surface-container-high p-space-lg shadow-sm">
        <h3 className="font-label-ui text-label-ui uppercase tracking-wider text-on-surface-variant font-semibold mb-space-lg pb-space-sm border-b border-surface-container-high flex justify-between items-center">
          <span>Today's Sessions</span>
          <span className="bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface">{sessions.length}</span>
        </h3>
        
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
          <DailyTimeline sessions={sessions} />
        </div>
      </aside>

    </div>
  );
}
