"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/ThemeContext";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const { mode, toggleMode } = useTheme();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-10 bottom-0 bg-surface-container-lowest z-40 flex flex-col justify-between py-space-sm shadow-xs transition-all duration-300 ",
        isCollapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      <div className="flex flex-col gap-space-sm px-space-sm min-w-[260px]">
        <div className="flex items-center justify-between px-space-xs py-1 h-9 w-[228px]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded bg-accent-container flex items-center justify-center text-on-accent-container shadow-sm flex-shrink-0 transition-colors">
              <span className="material-symbols-outlined text-[18px]">token</span>
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight">OcioFlex</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-code-inline text-code-inline text-on-surface-variant font-medium">v2.4</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0 absolute left-[32px] ml-1"
            style={{ left: isCollapsed ? '28px' : '220px' }}
            title="Toggle Sidebar"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">dock_to_right</span>
          </button>
        </div>

        <div className={cn("p-2 rounded-lg bg-surface-container-low flex items-center gap-2.5 mt-2 transition-all w-[228px]", isCollapsed ? "opacity-0 invisible" : "opacity-100 visible")}>
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-body-compact text-body-compact font-semibold">AV</div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-primary ring-2 ring-surface-container-lowest transition-colors"></span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-title-md text-title-md text-on-surface truncate leading-tight">Alex V. Novak</span>
            <span className="font-label-ui text-label-ui text-on-surface-variant truncate">Deep Work &bull; Software Eng</span>
          </div>
        </div>

        <div className="pt-space-xs mt-2 w-[228px]">
          <div className={cn("px-space-xs pb-1 flex items-center justify-between transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
            <span className="font-label-ui text-label-ui uppercase tracking-wider text-on-surface-variant font-semibold">WORKSPACE ENGINE</span>
            <span className="font-code-inline text-code-inline text-on-surface-variant/70">05 NODES</span>
          </div>
          <nav className="flex flex-col gap-0.5 mt-2">
            <NavItem href="/deep-work" icon="terminal" label="Deep Work" active={pathname === "/deep-work"} collapsed={isCollapsed} tag="RUNNING" />
            <NavItem href="#" icon="headphones" label="Ocio Lounge" active={mode === "ocio"} collapsed={isCollapsed} tag="MEDIA" />
            <NavItem href="/" icon="monitoring" label="Dashboard" active={pathname === "/"} collapsed={isCollapsed} tag="SYS" />
            <NavItem href="#" icon="rule_settings" label="Context Rules" collapsed={isCollapsed} tag="CFG" />
            <NavItem href="#" icon="dataset" label="Analytics Log" collapsed={isCollapsed} tag="DB" />
          </nav>
        </div>
      </div>

      <div className="px-space-sm flex flex-col gap-space-sm w-[260px]">
        <div className="p-1.5 rounded-lg bg-surface-container-low flex flex-col gap-1.5 w-[228px]">
          {!isCollapsed ? (
            <>
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded bg-surface-container-high relative">
                <button
                  onClick={() => mode !== "foco" && toggleMode()}
                  className={cn(
                    "flex items-center justify-center gap-1 py-1 rounded shadow-xs font-code-inline text-code-inline font-semibold transition-colors z-10",
                    mode === "foco" ? "bg-surface-container-lowest text-accent-primary" : "text-on-surface-variant hover:text-on-surface"
                  )}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">bolt</span> FOCO
                </button>
                <button
                  onClick={() => mode !== "ocio" && toggleMode()}
                  className={cn(
                    "flex items-center justify-center gap-1 py-1 rounded shadow-xs font-code-inline text-code-inline font-semibold transition-colors z-10",
                    mode === "ocio" ? "bg-surface-container-lowest text-accent-primary" : "text-on-surface-variant hover:text-on-surface"
                  )}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">sports_esports</span> OCIO
                </button>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="font-code-inline text-code-inline text-on-surface-variant">SWITCH MODE</span>
                <span className="font-code-inline text-code-inline px-1 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">Cmd+X</span>
              </div>
            </>
          ) : (
            <button
              onClick={() => toggleMode()}
              className="w-full flex items-center justify-center py-2 rounded bg-surface-container-lowest text-accent-primary shadow-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent-primary group relative"
            >
              <span className="material-symbols-outlined text-[18px]">
                {mode === "foco" ? "bolt" : "sports_esports"}
              </span>
              <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-visible:opacity-100 group-focus-visible:visible transition-all duration-200 translate-x-1 group-hover:translate-x-0 group-focus-visible:translate-x-0">
                <div className="relative bg-surface-container-lowest rounded-xl shadow-xl px-space-sm py-2 w-max border border-surface-container-highest text-left">
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-surface-container-lowest border-l border-b border-surface-container-highest rotate-45"></div>
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="font-title-md text-title-md font-bold text-on-surface whitespace-nowrap">Toggle Mode</span>
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ href = "#", icon, label, active, collapsed, tag }: { href?: string, icon: string, label: string, active?: boolean, collapsed: boolean, tag?: string }) => {
  return (
    <Link href={href}
      className={cn(
        "group relative flex items-center justify-between rounded transition-all outline-none",
        collapsed ? "px-1 py-1.5 justify-center w-9" : "px-2.5 py-1.5 w-full",
        active 
          ? "bg-accent-container text-on-accent-container font-semibold shadow-sm" 
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:bg-surface-container-high"
      )}
    >
      <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        {!collapsed && <span className="font-body-compact text-body-compact whitespace-nowrap">{label}</span>}
      </div>
      {!collapsed && tag && (
        <span className="font-code-inline text-code-inline px-1 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
          {tag}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-visible:opacity-100 group-focus-visible:visible transition-all duration-200 translate-x-1 group-hover:translate-x-0 group-focus-visible:translate-x-0">
          <div className="relative bg-surface-container-lowest rounded-xl shadow-xl p-space-sm flex flex-col gap-1.5 w-[190px] border border-surface-container-highest text-left">
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-surface-container-lowest border-l border-b border-surface-container-highest rotate-45"></div>
            <div className="flex items-center justify-between relative z-10">
              <span className="font-title-md text-title-md font-bold text-on-surface whitespace-nowrap">{label}</span>
              {tag && <span className="font-label-ui text-label-ui px-1.5 py-0.5 rounded-full bg-accent-container text-on-accent-container font-bold">{tag}</span>}
            </div>
          </div>
        </div>
      )}
    </Link>
  );
};
