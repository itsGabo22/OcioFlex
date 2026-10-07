"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface w-full flex flex-col">
      <Header />
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isCollapsed ? "pl-[68px]" : "pl-[260px]"
        )}
      >
        <main className="relative pt-10 min-h-screen w-full px-space-lg py-space-md">
          {children}
        </main>
      </div>
    </div>
  );
};
