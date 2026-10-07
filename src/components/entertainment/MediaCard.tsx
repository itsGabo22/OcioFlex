import React from "react";
import { MediaActivity } from "@/data";

interface MediaCardProps {
  activity: MediaActivity;
}

export const MediaCard = ({ activity }: MediaCardProps) => {
  return (
    <button className="group w-full text-left flex flex-col justify-between p-space-lg rounded-3xl bg-surface-container-lowest/90 backdrop-blur-sm border border-surface-container-highest shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-accent-primary/30 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:-translate-y-1">
      
      {/* Header */}
      <div className="flex items-center gap-space-sm w-full mb-space-xl">
        <div className="w-10 h-10 rounded-2xl bg-surface-container-low flex items-center justify-center text-accent-primary group-hover:scale-110 group-hover:bg-accent-container group-hover:text-on-accent-container transition-all duration-300">
          <span className="material-symbols-outlined text-[20px]">{activity.icon}</span>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-label-ui text-label-ui uppercase tracking-wider text-on-surface-variant font-semibold truncate">
            {activity.platform}
          </span>
          <span className="font-code-inline text-code-inline text-on-surface-variant/70 truncate">
            {activity.title}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 w-full">
        <h4 className="font-title-lg text-title-lg text-on-surface font-semibold truncate leading-tight group-hover:text-accent-primary transition-colors duration-300">
          {activity.content}
        </h4>
        <span className="font-body-compact text-body-compact text-on-surface-variant truncate">
          {activity.status}
        </span>
      </div>

    </button>
  );
};
