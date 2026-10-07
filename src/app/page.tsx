import { AppShell } from "@/components/shell/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { MainVisualContainer } from "@/components/dashboard/MainVisualContainer";

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col w-full max-w-[1600px] mx-auto animate-fade-in duration-500">
        <DashboardHeader />
        <KpiGrid />
        <MainVisualContainer />
      </div>
    </AppShell>
  );
}
