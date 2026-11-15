"use client";

import React, { useState } from "react";
import { Check, KeyRound, ShieldCheck } from "lucide-react";
import { fmt, useApp, type Mood } from "@/context/AppContext";
import { AiBadge, Button, PageHeader, Segmented } from "@/components/ui/primitives";
import { aiClearKey, aiSetKey } from "@/lib/ai";
import { isTauri } from "@/lib/tauri";
import { cn } from "@/lib/utils";

const VERSION = "1.0.0";

function Section({ title, sub, children, i, right }: { title: string; sub?: string; children: React.ReactNode; i: number; right?: React.ReactNode }) {
  return (
    <section className="card p-7 rise" style={{ ["--i" as string]: i }}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="display text-[24px]">{title}</h2>
          {sub && <p className="text-[13px] text-ink-2 mt-1.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

const SWATCH: Record<Mood, string[]> = { foco: ["#0f5f58", "#2fa39a", "#d8ede8", "#f7f3ec"], ocio: ["#c2431f", "#f29b6b", "#fdf0e8", "#f7f3ec"] };

export function SettingsScreen() {
  const { t, lang, setLang, mood, setMood, ai, refreshAi, toast, resetDemoData } = useApp();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const desktop = isTauri();

  const save = async () => {
    if (!key.trim() || !desktop) return;
    setBusy(true);
    try {
      await aiSetKey(key.trim());
      setKey("");
      toast(t.toast.keySaved, "success");
      refreshAi();
    } catch {
      toast(t.ai.error, "error");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await aiClearKey();
      toast(t.toast.keyRemoved);
      refreshAi();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[760px] flex flex-col gap-5">
      <PageHeader eyebrow={t.nav.settings} title={t.settings.title} sub={t.settings.sub} />

      <Section i={1} title={t.settings.language} sub={t.settings.languageSub}>
        <Segmented label={t.settings.language} value={lang} onChange={setLang} options={[{ value: "es", label: t.settings.spanish }, { value: "en", label: t.settings.english }]} className="w-[280px]" />
      </Section>

      <Section i={2} title={t.settings.context} sub={t.settings.contextSub}>
        <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label={t.settings.context}>
          {(["foco", "ocio"] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mood === m} onClick={() => setMood(m)}
              className={cn("text-left rounded-[18px] border p-4 transition-all duration-300 bg-surface", mood === m ? "border-accent shadow-[var(--shadow-2)]" : "border-line hover:border-line-strong")}>
              <div className="flex h-14 rounded-[12px] overflow-hidden border border-line">
                {SWATCH[m].map((c, k) => <span key={k} className="flex-1" style={{ background: c }} />)}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="display text-[20px]" style={{ fontWeight: 500 }}>{m === "foco" ? t.ctx.foco : t.ctx.ocio}</span>
                {mood === m && <span className="h-6 w-6 rounded-full bg-accent text-on-accent grid place-items-center"><Check size={14} aria-hidden /></span>}
              </div>
              <p className="text-[13px] text-ink-2 mt-1">{m === "foco" ? t.settings.focoDesc : t.settings.ocioDesc}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section i={3} title={t.settings.ai.title} sub={t.settings.ai.sub} right={<AiBadge />}>
        <p className="text-[14px] text-ink mb-4">
          {ai?.mode === "live" ? fmt(t.settings.ai.liveOn, { provider: ai.provider, model: ai.model }) : t.settings.ai.demoOn}
        </p>
        <label className="block">
          <span className="meta block mb-1.5">{t.settings.ai.keyLabel}</span>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <KeyRound size={16} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
              <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder={t.settings.ai.keyPh} disabled={!desktop} autoComplete="off" spellCheck={false}
                className="w-full h-11 rounded-[12px] border border-line bg-surface pl-11 pr-4 text-[14px] outline-none focus:border-accent transition-colors disabled:opacity-60" />
            </div>
            <Button onClick={() => void save()} disabled={!key.trim() || !desktop || busy}>{t.settings.ai.saveKey}</Button>
          </div>
        </label>
        <div className="flex items-center justify-between mt-4 gap-4">
          <p className="text-[13px] text-ink-2 flex items-center gap-2"><ShieldCheck size={15} className="text-accent shrink-0" aria-hidden />{desktop ? t.settings.ai.privacy : t.settings.ai.browserOnly}</p>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[12px] font-semibold text-ink-2">{ai?.configured ? t.settings.ai.configured : t.settings.ai.notConfigured}</span>
            {ai?.configured && desktop && <Button variant="ghost" size="md" onClick={() => void remove()} disabled={busy}>{t.settings.ai.removeKey}</Button>}
          </div>
        </div>
      </Section>

      <Section i={4} title={t.settings.data.title} sub={t.settings.data.sub}>
        <div className="flex items-center justify-between gap-6">
          <p className="text-[13px] text-ink-2 max-w-[360px]">{t.settings.data.resetHint}</p>
          <Button variant={confirm ? "primary" : "soft"} onClick={() => { if (confirm) { resetDemoData(); setConfirm(false); } else { setConfirm(true); setTimeout(() => setConfirm(false), 3500); } }}>
            {confirm ? t.settings.data.confirm : t.settings.data.reset}
          </Button>
        </div>
      </Section>

      <Section i={5} title={t.settings.about.title}>
        <p className="mono text-[13px] text-ink">OcioFlex · {fmt(t.settings.about.version, { v: VERSION })}</p>
        <p className="text-[13px] text-ink-2 mt-2 leading-[19px]">{t.settings.about.credits}</p>
      </Section>
    </div>
  );
}
