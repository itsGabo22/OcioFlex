import { BreakTracker } from "@/components/entertainment/BreakTracker";
import { MediaCard } from "@/components/entertainment/MediaCard";
import { getMediaActivities } from "@/data";

export default function EntertainmentPage() {
  const activities = getMediaActivities();

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto min-h-[calc(100vh-80px)] gap-space-xl animate-fade-in duration-500 pb-space-2xl">
      
      {/* TOP REGION: Break Tracker */}
      <section className="w-full flex items-center justify-center pt-space-xl pb-space-lg min-h-[35vh]">
        <BreakTracker />
      </section>

      {/* SECONDARY REGION: Media Grid */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-space-lg px-space-sm">
          <h2 className="font-title-md text-title-md font-semibold text-on-surface">Quick Launch</h2>
          <span className="font-code-inline text-code-inline text-on-surface-variant px-2 py-1 bg-surface-container-low rounded-full">
            LEISURE HUBS
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-md lg:gap-space-lg">
          {activities.map((activity) => (
            <MediaCard key={activity.id} activity={activity} />
          ))}
        </div>
      </section>
      
    </div>
  );
}
