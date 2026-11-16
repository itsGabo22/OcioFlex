"use client";

import React, { useId, useState } from "react";
import { BatteryLow, BookOpen, ExternalLink, Gamepad2, Lightbulb, Link2, Music, MonitorPlay, Pause, Pencil, Play, Plus, Square, Trash2, Wind, X, Zap } from "lucide-react";
import { elapsedMs, useApp, useNow, type MediaItem, type MediaKind } from "@/context/AppContext";
import { fmtClock } from "@/components/shell/AppShell";
import { Button, Chip, Dialog, EmptyState, Field, FlexByline, PageHeader, Skeleton, fieldClass } from "@/components/ui/primitives";
import { breaksPayload, type BreakMood } from "@/lib/ai";
import { isAllowedUrl, openExternal } from "@/lib/tauri";
import { useAi } from "@/lib/useAi";
import { cn } from "@/lib/utils";

const ICONS: Record<MediaKind, React.ElementType> = { game: Gamepad2, video: MonitorPlay, music: Music, book: BookOpen, other: Link2 };
const KINDS: MediaKind[] = ["game", "video", "music", "book", "other"];
const MOOD_ICON: Record<BreakMood, React.ElementType> = { tired: BatteryLow, restless: Zap, curious: Lightbulb };

function RestTimer() {
  const { t, timer, startTimer, pauseTimer, resumeTimer, finishTimer, discardTimer } = useApp();
  const rest = timer?.kind === "rest" ? timer : null;
  const now = useNow(!!rest && !rest.pausedAt, 250);
  const ms = rest ? elapsedMs(rest, now) : 0;
  return (
    <section className="rest-hero relative overflow-hidden rounded-[32px] border border-line p-10 flex items-center justify-between gap-8 rise" style={{ ["--i" as string]: 1 }}>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-accent flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full bg-accent", rest && !rest.pausedAt && "animate-pulse")} />
          {rest ? (rest.pausedAt ? t.rest.paused : t.rest.running) : t.rest.timerLabel}
        </p>
        <p className="display-timer text-[128px] text-ink mt-2 tabular-nums whitespace-nowrap" aria-live="off">{fmtClock(ms)}</p>
        {!rest && <p className="text-[15px] text-ink-2 mt-2">{t.rest.idle}</p>}
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
  const { t, sessions, profile } = useApp();
  const ai = useAi("breaks");
  const [mood, setMood] = useState<BreakMood>("tired");
  const go = () => void ai.run(breaksPayload(sessions, profile, mood));
  return (
    <section className="card p-7 rise" style={{ ["--i" as string]: 2 }} aria-live="polite" aria-busy={ai.status === "loading"} data-tour="breaks">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3"><h2 className="display text-[24px]">{t.rest.suggestTitle}</h2><FlexByline /></div>
          <p className="text-[13px] text-ink-2 mt-1">{t.rest.suggestSub}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={t.rest.suggestSub}>
          {(["tired", "restless", "curious"] as const).map((m) => (
            <Chip key={m} icon={MOOD_ICON[m]} active={mood === m} onClick={() => setMood(m)}>{t.rest.moods[m]}</Chip>
          ))}
          <Button onClick={go} disabled={ai.status === "loading"} className="ml-2"><Wind size={16} aria-hidden />{t.rest.suggestCta}</Button>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {ai.status === "idle" && <p className="col-span-3 text-[14px] text-ink-2 py-4">{t.rest.suggestEmpty}</p>}
        {ai.status === "loading" && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[132px] !rounded-[18px]" />)}
        {ai.status === "error" && <p className="col-span-3 text-[14px] text-danger">{t.flex.error}</p>}
        {ai.status === "done" && ai.data?.ideas.slice(0, 3).map((idea, i) => (
          <article key={i} className="rounded-[18px] border border-line bg-surface-2 p-5 rise" style={{ ["--i" as string]: i }}>
            <span className="mono text-[12px] font-semibold text-accent">{idea.minutes} {t.common.min}</span>
            <h3 className="display text-[20px] leading-[1.18] mt-2" style={{ fontWeight: 500 }}>{idea.title}</h3>
            <p className="text-[13px] leading-[19px] text-ink-2 mt-2">{idea.why}</p>
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
  const uid = useId();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedUrl(url) || !name.trim()) return setErr(true);
    saveMedia({ id: item?.id ?? `m-${Date.now()}`, kind, name: name.trim(), url: url.trim() });
    toast(t.toast.mediaSaved, "success");
    onClose();
  };
  return (
    <Dialog open onClose={onClose} label={t.rest.form.title}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between"><h2 className="display text-[26px]">{t.rest.form.title}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label={t.common.close}><X size={18} /></Button></div>
        <div className="flex gap-2 flex-wrap" role="group" aria-label={t.rest.form.platform}>{KINDS.map((k) => <Chip key={k} icon={ICONS[k]} active={kind === k} onClick={() => setKind(k)}>{t.rest.kinds[k]}</Chip>)}</div>
        <Field id={`${uid}-n`} label={t.rest.form.name}><input id={`${uid}-n`} data-autofocus className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.rest.form.namePh} maxLength={60} /></Field>
        <Field id={`${uid}-u`} label={t.rest.form.url} error={err ? t.rest.form.invalid : null}><input id={`${uid}-u`} className={fieldClass} value={url} onChange={(e) => { setUrl(e.target.value); setErr(false); }} placeholder={t.rest.form.urlPh} inputMode="url" spellCheck={false} /></Field>
        <div className="flex justify-end gap-2 mt-1"><Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button><Button type="submit">{t.common.save}</Button></div>
      </form>
    </Dialog>
  );
}

function MediaCards() {
  const { t, media, removeMedia, toast } = useApp();
  const [editing, setEditing] = useState<MediaItem | "new" | null>(null);
  const open = async (m: MediaItem) => { if (!(await openExternal(m.url))) toast(t.toast.linkBlocked, "error"); };
  return (
    <section className="rise" style={{ ["--i" as string]: 3 }}>
      <div className="flex items-end justify-between mb-5">
        <div><h2 className="display text-[26px]">{t.rest.mediaTitle}</h2><p className="text-[13px] text-ink-2 mt-1">{t.rest.mediaSub}</p></div>
        <Button variant="soft" onClick={() => setEditing("new")}><Plus size={16} aria-hidden />{t.rest.addMedia}</Button>
      </div>
      {media.length === 0 ? (
        <div className="card"><EmptyState title={t.rest.mediaEmpty} hint={t.rest.mediaEmptyHint} action={<Button variant="soft" onClick={() => setEditing("new")}><Plus size={16} aria-hidden />{t.rest.addMedia}</Button>} /></div>
      ) : (
        <div className="grid grid-cols-4 gap-4 max-[1180px]:grid-cols-2">
          {media.map((m, i) => {
            const Icon = ICONS[m.kind];
            let host = "";
            try { host = new URL(m.url.replace(/^spotify:/, "https://spotify/")).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
            return (
              <article key={m.id} className="card card-lift group relative p-5 flex flex-col min-h-[176px] rise" style={{ ["--i" as string]: Math.min(i, 5) }}>
                <div className="flex items-start justify-between">
                  <span className="h-12 w-12 rounded-[16px] grid place-items-center text-on-accent shadow-[var(--shadow-1)]" style={{ background: "linear-gradient(135deg, var(--accent-2), var(--accent))" }}><Icon size={22} aria-hidden /></span>
                  <div className="flex opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <button className="h-8 w-8 grid place-items-center rounded-full text-ink-2 hover:bg-bg-2 hover:text-ink" aria-label={`${t.common.edit}: ${m.name}`} onClick={() => setEditing(m)}><Pencil size={14} /></button>
                    <button className="h-8 w-8 grid place-items-center rounded-full text-ink-2 hover:bg-bg-2 hover:text-danger" aria-label={`${t.common.delete}: ${m.name}`} onClick={() => { removeMedia(m.id); toast(t.toast.mediaRemoved); }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-[12px] font-semibold text-ink-2 mt-4">{t.rest.kinds[m.kind]}</p>
                <h3 className="display text-[20px] leading-[1.18] mt-1 break-words" style={{ fontWeight: 500 }}>{m.name}</h3>
                <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                  <span className="text-[12px] text-ink-2 truncate">{host}</span>
                  <button onClick={() => void open(m)} className="shrink-0 h-8 pl-3.5 pr-3 rounded-full bg-accent-soft text-ink text-[12px] font-bold inline-flex items-center gap-1.5 hover:bg-accent hover:text-on-accent transition-colors" aria-label={`${t.common.open}: ${m.name}`}>{t.common.open}<ExternalLink size={12} aria-hidden /></button>
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
      <PageHeader title={t.rest.title} />
      <RestTimer />
      <BreakSuggester />
      <MediaCards />
    </div>
  );
}
