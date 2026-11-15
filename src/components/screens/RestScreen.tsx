"use client";

import React, { useState } from "react";
import { BookOpen, ExternalLink, Gamepad2, Link2, Music, MonitorPlay, Pause, Pencil, Play, Plus, Sparkles, Square, Trash2, X } from "lucide-react";
import { elapsedMs, useApp, useNow, type MediaItem, type MediaKind } from "@/context/AppContext";
import { fmtClock } from "@/components/shell/AppShell";
import { AiBadge, Button, Chip, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import { isAllowedUrl, openExternal } from "@/lib/tauri";
import { useAi } from "@/lib/useAi";
import { cn } from "@/lib/utils";

const ICONS: Record<MediaKind, React.ElementType> = { game: Gamepad2, video: MonitorPlay, music: Music, book: BookOpen, other: Link2 };
const KINDS: MediaKind[] = ["game", "video", "music", "book", "other"];

function RestTimer() {
  const { t, timer, startTimer, pauseTimer, resumeTimer, finishTimer, discardTimer } = useApp();
  const rest = timer?.kind === "rest" ? timer : null;
  const now = useNow(!!rest && !rest.pausedAt, 250);
  const ms = rest ? elapsedMs(rest, now) : 0;
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-line p-10 flex items-center justify-between gap-8 rise" style={{ ["--i" as string]: 1, background: "radial-gradient(70% 120% at 100% 0%, color-mix(in srgb, var(--glow) 55%, transparent) 0%, transparent 65%), linear-gradient(135deg, var(--accent-soft) 0%, color-mix(in srgb, var(--surface) 70%, var(--accent-soft)) 100%)" }}>
      <div className="min-w-0">
        <p className="meta text-accent flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full bg-accent", rest && !rest.pausedAt && "animate-pulse")} />
          {rest ? (rest.pausedAt ? t.rest.paused : t.rest.running) : t.rest.timerLabel}
        </p>
        <p className="display-timer text-[132px] text-ink mt-3 tabular-nums whitespace-nowrap">{fmtClock(ms)}</p>
        {!rest && <p className="text-[15px] text-ink-2 mt-3">{t.rest.idle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {!rest ? (
          <Button size="lg" onClick={() => startTimer("rest", 0, "")}><Play size={18} fill="currentColor" aria-hidden />{t.common.start}</Button>
        ) : (
          <>
            {rest.pausedAt ? (
              <Button size="lg" onClick={resumeTimer}><Play size={18} fill="currentColor" aria-hidden />{t.common.resume}</Button>
            ) : (
              <Button size="lg" onClick={pauseTimer}><Pause size={18} fill="currentColor" aria-hidden />{t.common.pause}</Button>
            )}
            <Button variant="soft" size="icon" onClick={finishTimer} aria-label={t.common.stop} title={t.common.stop}><Square size={16} fill="currentColor" aria-hidden /></Button>
            <Button variant="ghost" size="icon" onClick={discardTimer} aria-label={t.common.reset} title={t.common.reset}><X size={18} aria-hidden /></Button>
          </>
        )}
      </div>
    </section>
  );
}

function BreakSuggester() {
  const { t, sessions } = useApp();
  const ai = useAi("breaks");
  const [mood, setMood] = useState<"tired" | "restless" | "curious">("tired");
  const go = () => {
    const nowTs = Date.now();
    const last = [...sessions].filter((s) => s.kind === "focus").sort((a, b) => b.end - a.end)[0];
    void ai.run({ focusedMin: last ? Math.round((last.end - last.start) / 60000) : 45, hour: new Date(nowTs).getHours(), mood });
  };
  return (
    <section className="card p-7 rise" style={{ ["--i" as string]: 2 }} aria-live="polite">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3"><h2 className="display text-[24px]">{t.rest.suggestTitle}</h2><AiBadge /></div>
          <p className="text-[13px] text-ink-2 mt-1.5">{t.rest.suggestSub}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["tired", "restless", "curious"] as const).map((m) => <Chip key={m} active={mood === m} onClick={() => setMood(m)}>{t.rest.moods[m]}</Chip>)}
          <Button onClick={go} disabled={ai.status === "loading"} className="ml-2"><Sparkles size={16} aria-hidden />{t.rest.suggestCta}</Button>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {ai.status === "idle" && <p className="col-span-3 text-[14px] text-ink-2 py-4">{t.rest.suggestEmpty}</p>}
        {ai.status === "loading" && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[132px] !rounded-[18px]" />)}
        {ai.status === "error" && <p className="col-span-3 text-[14px] text-danger">{t.ai.error}</p>}
        {ai.status === "done" && ai.data?.ideas.slice(0, 3).map((idea, i) => (
          <article key={i} className="rounded-[18px] border border-line bg-surface-2 p-5 rise" style={{ ["--i" as string]: i }}>
            <span className="mono text-[12px] font-semibold text-accent">{idea.minutes} {t.common.min}</span>
            <h3 className="display text-[20px] leading-[1.15] mt-2" style={{ fontWeight: 500 }}>{idea.title}</h3>
            <p className="text-[13px] leading-[18px] text-ink-2 mt-2">{idea.why}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MediaDialog({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  const { t, saveMedia, toast } = useApp();
  const [name, setName] = useState(item?.name ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [kind, setKind] = useState<MediaKind>(item?.kind ?? "other");
  const [err, setErr] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedUrl(url) || !name.trim()) return setErr(true);
    saveMedia({ id: item?.id ?? `m-${Date.now()}`, kind, name: name.trim(), url: url.trim() });
    toast(t.toast.mediaSaved, "success");
    onClose();
  };
  const field = "w-full h-11 rounded-[12px] border border-line bg-surface px-4 text-[14px] outline-none focus:border-accent transition-colors select-text";
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[rgba(27,26,23,0.35)] backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={t.rest.form.title}>
      <form onSubmit={submit} className="card w-[460px] p-7 flex flex-col gap-4 !bg-surface rise" style={{ boxShadow: "var(--shadow-3)" }}>
        <div className="flex items-center justify-between"><h2 className="display text-[26px]">{t.rest.form.title}</h2><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t.common.close}><X size={18} /></Button></div>
        <div className="flex gap-2 flex-wrap">{KINDS.map((k) => <Chip type="button" key={k} active={kind === k} onClick={() => setKind(k)}>{t.rest.kinds[k]}</Chip>)}</div>
        <label><span className="meta block mb-1.5">{t.rest.form.name}</span><input autoFocus className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.rest.form.namePh} maxLength={60} /></label>
        <label><span className="meta block mb-1.5">{t.rest.form.url}</span><input className={field} value={url} onChange={(e) => { setUrl(e.target.value); setErr(false); }} placeholder={t.rest.form.urlPh} inputMode="url" /></label>
        {err && <p className="text-[13px] text-danger -mt-1">{t.rest.form.invalid}</p>}
        <div className="flex justify-end gap-2 mt-1"><Button type="button" variant="ghost" onClick={onClose}>{t.common.cancel}</Button><Button type="submit">{t.common.save}</Button></div>
      </form>
    </div>
  );
}

function MediaCards() {
  const { t, media, removeMedia, toast } = useApp();
  const [editing, setEditing] = useState<MediaItem | "new" | null>(null);
  const open = async (m: MediaItem) => { if (!(await openExternal(m.url))) toast(t.toast.linkBlocked, "error"); };
  return (
    <section className="rise" style={{ ["--i" as string]: 3 }}>
      <div className="flex items-end justify-between mb-5">
        <div><h2 className="display text-[26px]">{t.rest.mediaTitle}</h2><p className="text-[13px] text-ink-2 mt-1.5">{t.rest.mediaSub}</p></div>
        <Button variant="soft" onClick={() => setEditing("new")}><Plus size={16} aria-hidden />{t.rest.addMedia}</Button>
      </div>
      {media.length === 0 ? (
        <div className="card"><EmptyState title={t.rest.mediaEmpty} hint={t.rest.mediaEmptyHint} /></div>
      ) : (
        <div className="grid grid-cols-4 gap-4 max-[1180px]:grid-cols-2">
          {media.map((m, i) => {
            const Icon = ICONS[m.kind];
            let host = "";
            try { host = new URL(m.url.replace(/^spotify:/, "https://spotify/")).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
            return (
              <article key={m.id} className="card card-lift group relative p-5 flex flex-col min-h-[176px] rise" style={{ ["--i" as string]: i }}>
                <div className="flex items-start justify-between">
                  <span className="h-12 w-12 rounded-[16px] grid place-items-center text-on-accent shadow-[var(--shadow-1)]" style={{ background: "linear-gradient(135deg, var(--accent-2), var(--accent))" }}><Icon size={22} aria-hidden /></span>
                  <div className="flex opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <button className="h-8 w-8 grid place-items-center rounded-full text-ink-3 hover:bg-bg-2 hover:text-ink" aria-label={`${t.common.edit}: ${m.name}`} onClick={() => setEditing(m)}><Pencil size={14} /></button>
                    <button className="h-8 w-8 grid place-items-center rounded-full text-ink-3 hover:bg-bg-2 hover:text-danger" aria-label={`${t.common.delete}: ${m.name}`} onClick={() => { removeMedia(m.id); toast(t.toast.mediaRemoved); }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="meta mt-4">{t.rest.kinds[m.kind]}</p>
                <h3 className="display text-[20px] leading-[1.15] mt-1.5 break-words" style={{ fontWeight: 500 }}>{m.name}</h3>
                <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                  <span className="text-[12px] text-ink-3 truncate">{host}</span>
                  <button onClick={() => void open(m)} className="shrink-0 h-8 pl-3.5 pr-3 rounded-full bg-accent-soft text-ink text-[12px] font-bold inline-flex items-center gap-1.5 hover:bg-accent hover:text-on-accent transition-colors">{t.common.open}<ExternalLink size={12} aria-hidden /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {editing && <MediaDialog item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </section>
  );
}

export function RestScreen() {
  const { t } = useApp();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow={t.rest.eyebrow} title={t.rest.title} />
      <RestTimer />
      <BreakSuggester />
      <MediaCards />
    </div>
  );
}
