"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/ThemeContext";
import { useTranslation } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const pathname = usePathname();
  const { mode, toggleMode } = useTheme();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleNotImplemented = (e: React.MouseEvent) => {
    e.preventDefault();
    toast(t.feedback.featureUnavailable, "default");
  };

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col bg-surface border-r border-surface-container-highest transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] relative pb-space-lg flex-shrink-0",
        isCollapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 px-space-md flex items-center justify-between relative">
          <div className="flex items-center gap-space-sm min-w-[200px]">
            <div className="w-7 h-7 rounded bg-accent-container flex items-center justify-center text-on-accent-container shadow-sm flex-shrink-0 transition-colors">
              <span className="material-symbols-outlined text-[18px]">token</span>
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
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
          >
            <span className="material-symbols-outlined text-[18px]">dock_to_right</span>
          </button>
        </div>

        <div className={cn("p-2 rounded-lg bg-surface-container-low flex items-center gap-2.5 mt-2 transition-all w-[228px] mx-space-sm", isCollapsed ? "opacity-0 invisible" : "opacity-100 visible")}>
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-body-compact text-body-compact font-semibold">AV</div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-primary ring-2 ring-surface-container-lowest transition-colors"></span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-title-md text-title-md text-on-surface truncate leading-tight">Alex V. Novak</span>
            <span className="font-label-ui text-label-ui text-on-surface-variant truncate">Deep Work &bull; Software Eng</span>
          </div>
        </div>

        <div className="pt-space-xs mt-2 w-[228px] mx-space-sm">
          <div className={cn("px-space-xs pb-1 flex items-center justify-between transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
            <span className="font-label-ui text-label-ui uppercase tracking-wider text-on-surface-variant font-semibold">{t.navigation.workspaceEngine}</span>
            <span className="font-code-inline text-code-inline text-on-surface-variant/70">05 {t.navigation.nodes}</span>
          </div>
          <nav className="flex flex-col gap-0.5 mt-2">
            <NavItem href="/deep-work" icon="terminal" label={t.navigation.deepWork} active={pathname === "/deep-work"} collapsed={isCollapsed} tag="RUNNING" />
            <NavItem href="/entertainment" icon="headphones" label={t.navigation.entertainment} active={pathname === "/entertainment"} collapsed={isCollapsed} tag="MEDIA" />
            <NavItem href="/" icon="monitoring" label={t.navigation.dashboard} active={pathname === "/"} collapsed={isCollapsed} tag="SYS" />
            <NavItem href="#" onClick={handleNotImplemented} icon="rule_settings" label={t.navigation.contextRules} collapsed={isCollapsed} tag="CFG" />
            <NavItem href="#" onClick={handleNotImplemented} icon="dataset" label={t.navigation.analyticsLog} collapsed={isCollapsed} tag="DB" />
          </nav>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 relative px-space-sm w-[260px]">
        <div className="flex flex-col w-[228px]">
          <NavItem href="/settings" icon="settings" label={t.navigation.settings} active={pathname === "/settings"} collapsed={isCollapsed} tag="CFG" />
        </div>
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
                  <span className="material-symbols-outlined text-[14px]">bolt</span> {t.settings.foco.toUpperCase()}
                </button>
                <button
                  onClick={() => mode !== "ocio" && toggleMode()}
                  className={cn(
                    "flex items-center justify-center gap-1 py-1 rounded shadow-xs font-code-inline text-code-inline font-semibold transition-colors z-10",
                    mode === "ocio" ? "bg-surface-container-lowest text-accent-primary" : "text-on-surface-variant hover:text-on-surface"
                  )}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">sports_esports</span> {t.settings.ocio.toUpperCase()}
                </button>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="font-code-inline text-code-inline text-on-surface-variant">{t.navigation.switchMode}</span>
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
                    <span className="font-title-md text-title-md font-bold text-on-surface whitespace-nowrap">{t.navigation.toggleMode}</span>
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

const NavItem = ({ href = "#", icon, label, active, collapsed, tag, onClick }: { href?: string, icon: string, label: string, active?: boolean, collapsed: boolean, tag?: string, onClick?: (e: React.MouseEvent) => void }) => {
  return (
    <Link href={href}
      onClick={onClick}
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
