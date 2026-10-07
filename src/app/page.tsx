import { AppShell } from '@/components/shell/AppShell';

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-lg rounded-xl shadow-sm mb-space-xl">
        <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
          OCIOFLEX SYSTEM
        </h1>
        <p className="font-body-default text-body-default text-on-surface-variant max-w-2xl">
          One Product — Two Personalities. High-contrast light-mode context switching architecture.
        </p>
      </div>
    </AppShell>
  );
}
