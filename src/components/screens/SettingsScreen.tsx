"use client";

import React, { useEffect, useId, useState } from "react";
import { Check, CircleCheck, CircleAlert, KeyRound, LoaderCircle, LogOut, RefreshCcw, ShieldCheck, LifeBuoy, PlugZap, Trash2 } from "lucide-react";
import { fmt, useApp, type Mood } from "@/context/AppContext";
import { Button, Dialog, Field, FlexMark, PageHeader, Segmented, fieldClass } from "@/components/ui/primitives";
import { Initials } from "@/components/shell/AppShell";
import { aiClearKey, aiSetKey, aiTest, type AiErrorCode } from "@/lib/ai";
import { passwordStrength, type AuthErr } from "@/lib/auth";
import { profileLabel } from "@/lib/profileLabel";
import { isTauri } from "@/lib/tauri";
import { DayFields, GoalsField, NameField, ObstaclesField, OccupationField, RhythmFields, TastesField } from "@/components/onboarding/ProfileFields";
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

const VERSION = "1.0.0";
const SECTIONS = ["account", "profile", "assistant", "appearance", "data", "about"] as const;

function Section({ id, title, sub, children, i, right }: { id: string; title: string; sub?: string; children: React.ReactNode; i: number; right?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="card p-7 rise scroll-mt-8" style={{ ["--i" as string]: Math.min(i, 5) }}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 id={`${id}-h`} className="display text-[26px]">{title}</h2>
          {sub && <p className="text-[13.5px] text-ink-2 mt-1.5 max-w-[560px] text-pretty">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-6 mt-6 border-t border-line first:border-0 first:pt-0 first:mt-0">
      <h3 className="text-[14px] font-semibold text-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}

const SWATCH: Record<Mood, string[]> = { foco: ["#0f5f58", "#2fa39a", "#d8ede8", "#f7f3ec"], ocio: ["#c2431f", "#f29b6b", "#fdf0e8", "#f7f3ec"] };

export function SettingsScreen() {
  const { t } = useApp();
  const [active, setActive] = useState<string>("account");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const id = window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }), 80);
      return () => clearTimeout(id);
    }
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    const io = new IntersectionObserver(
      (es) => {
        const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { root: main, rootMargin: "0px 0px -60% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div>
      <PageHeader title={t.settings.title} sub={t.settings.sub} />
      <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-8 items-start max-[1180px]:grid-cols-[168px_minmax(0,1fr)] max-[1180px]:gap-6">
        <nav aria-label={t.settings.sections} className="sticky top-8 flex flex-col gap-0.5 rise" style={{ ["--i" as string]: 1 }}>
          {SECTIONS.map((s) => (
            <a
              key={s}
              href={`#${s}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s)?.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, "", `#${s}`);
                setActive(s);
              }}
              aria-current={active === s ? "true" : undefined}
              className={cn("relative h-10 flex items-center pl-4 rounded-[12px] text-[14px] font-semibold transition-colors", active === s ? "text-ink bg-accent-soft" : "text-ink-2 hover:text-ink hover:bg-bg-2")}
            >
              <span aria-hidden className={cn("absolute left-1.5 top-2.5 bottom-2.5 w-[3px] rounded-full transition-colors", active === s ? "bg-accent" : "bg-transparent")} />
              {t.settings.nav[s]}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-5 min-w-0">
          <AccountSection />
          <ProfileSection />
          <AssistantSection />
          <AppearanceSection />
          <DataSection />
          <Section id="about" i={6} title={t.settings.about.title}>
            <p className="mono text-[13px] text-ink">OcioFlex · {fmt(t.settings.about.version, { v: VERSION })}</p>
            <p className="text-[13px] text-ink-2 mt-2 leading-[19px]">{t.settings.about.credits}</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function AccountSection() {
  const { t, user, profile, logout, changePassword, deleteAccount, toast } = useApp();
  const S = t.settings.account;
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [del, setDel] = useState(false);
  const [word, setWord] = useState("");
  const uid = useId();
  const strength = passwordStrength(next);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await changePassword(cur, next);
      setCur("");
      setNext("");
      toast(S.pwChanged, "success");
    } catch (x) {
      setErr(t.auth.errors[(x as AuthErr).code] ?? t.auth.errors.io);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section id="account" i={1} title={S.title} sub={S.sub}>
      <div className="flex items-center gap-4 rounded-[18px] bg-surface-2 border border-line p-4">
        <Initials name={profile.name || user?.displayName || ""} size={48} />
        <div className="min-w-0">
          <p className="text-[12.5px] text-ink-2">{S.signedInAs}</p>
          <p className="text-[16px] font-semibold text-ink truncate">{profile.name || user?.displayName}</p>
          <p className="text-[13px] text-ink-2 truncate">{user?.sample ? t.nav.sample : user?.login}</p>
        </div>
        <Button variant="outline" className="ml-auto" onClick={() => void logout()}><LogOut size={16} aria-hidden />{S.logout}</Button>
      </div>
      {user?.sample ? (
        <p className="text-[13.5px] text-ink-2 mt-4">{S.sampleNote}</p>
      ) : (
        <Sub title={S.changePw}>
          <form onSubmit={change} className="grid grid-cols-2 gap-4 items-start">
            <Field id={`${uid}-c`} label={S.current}>
              <input id={`${uid}-c`} type="password" className={fieldClass} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field id={`${uid}-n`} label={S.newPw} hint={next ? t.auth.strength[strength] : t.auth.passwordPh}>
              <input id={`${uid}-n`} type="password" className={fieldClass} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </Field>
            <div className="col-span-2 flex items-center gap-4">
              <Button type="submit" disabled={busy || !cur || next.length < 8}>{busy && <LoaderCircle size={16} className="animate-spin" aria-hidden />}{S.update}</Button>
              <p className="text-[13px] text-danger" aria-live="polite">{err}</p>
            </div>
          </form>
        </Sub>
      )}
      <Sub title={S.danger}>
        <div className="flex items-center justify-between gap-6">
          <p className="text-[13.5px] text-ink-2 max-w-[440px]">{S.dangerSub}</p>
          <Button variant="outline" className="!text-danger hover:!border-danger shrink-0" onClick={() => setDel(true)}><Trash2 size={16} aria-hidden />{S.danger}</Button>
        </div>
      </Sub>
      <Dialog open={del} onClose={() => setDel(false)} label={S.danger}>
        <h2 className="display text-[28px] text-ink">{S.danger}</h2>
        <p className="text-[14px] leading-[21px] text-ink-2 mt-3">{S.dangerSub}</p>
        <div className="mt-5">
          <Field id={`${uid}-w`} label={fmt(S.confirm, { word: S.word })}>
            <input id={`${uid}-w`} data-autofocus className={fieldClass} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" spellCheck={false} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-7">
          <Button variant="ghost" onClick={() => setDel(false)}>{t.common.cancel}</Button>
          <Button variant="danger" disabled={word.trim().toUpperCase() !== S.word} onClick={() => void deleteAccount()}>{S.deleteCta}</Button>
        </div>
      </Dialog>
    </Section>
  );
}

function ProfileSection() {
  const { t, profile, saveProfile, redoOnboarding, startTour } = useApp();
  const S = t.settings.profile;
  const set = (patch: Partial<Profile>) => saveProfile({ ...profile, ...patch });
  return (
    <Section
      id="profile"
      i={2}
      title={S.title}
      sub={S.sub}
      right={
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={startTour}><LifeBuoy size={15} aria-hidden />{S.tour}</Button>
          <Button variant="soft" size="sm" onClick={redoOnboarding}><RefreshCcw size={15} aria-hidden />{S.redo}</Button>
        </div>
      }
    >
      <div className="rounded-[18px] p-5 border border-line mb-2" style={{ background: "radial-gradient(90% 140% at 100% 0%, color-mix(in srgb, var(--glow) 40%, transparent), transparent 60%), var(--surface-2)" }}>
        <p className="display text-[22px] leading-[1.25] text-ink" style={{ fontWeight: 430 }}>{profileLabel(profile, t)}</p>
      </div>
      <Sub title={t.onboarding.steps.name.title}><div className="max-w-[360px]"><NameField p={profile} set={set} /></div></Sub>
      <Sub title={t.onboarding.steps.occupation.title}><OccupationField p={profile} set={set} compact /></Sub>
      <Sub title={S.typical}><DayFields p={profile} set={set} compact /></Sub>
      <Sub title={S.rhythm}><RhythmFields p={profile} set={set} compact /></Sub>
      <Sub title={S.goals}><GoalsField p={profile} set={set} compact /></Sub>
      <Sub title={S.obstacles}><ObstaclesField p={profile} set={set} compact /></Sub>
      <Sub title={S.tastes}><TastesField p={profile} set={set} compact /></Sub>
    </Section>
  );
}

function AssistantSection() {
  const { t, ai, refreshAi, toast } = useApp();
  const S = t.settings.assistant;
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState<false | "save" | "test" | "remove">(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const desktop = isTauri();
  const uid = useId();
  const errText = (e: unknown) => S.errors[(typeof e === "string" ? e : "io") as AiErrorCode] ?? S.errors.io;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !desktop) return;
    setBusy("save");
    setResult(null);
    try {
      await aiSetKey(key.trim());
      setKey("");
      toast(t.toast.keySaved, "success");
      refreshAi();
    } catch (x) {
      setResult({ ok: false, text: errText(x) });
    } finally {
      setBusy(false);
    }
  };
  const test = async () => {
    setBusy("test");
    setResult(null);
    try {
      await aiTest();
      setResult({ ok: true, text: S.testOk });
    } catch (x) {
      setResult({ ok: false, text: errText(x) });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy("remove");
    try {
      await aiClearKey();
      toast(t.toast.keyRemoved);
      setResult(null);
      refreshAi();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section id="assistant" i={3} title={S.title} sub={S.sub}>
      <p className="flex items-center gap-3 text-[14.5px] text-ink">
        <FlexMark size={26} />
        {ai?.mode === "live" ? fmt(S.live, { model: ai.model }) : S.local}
      </p>
      <form onSubmit={save} className="mt-6">
        <Field id={`${uid}-k`} label={S.keyLabel} hint={desktop ? S.getKey : S.browserOnly}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <KeyRound size={16} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" />
              <input id={`${uid}-k`} type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder={S.keyPh} disabled={!desktop} autoComplete="off" spellCheck={false} className={cn(fieldClass, "pl-11 disabled:bg-bg-2 disabled:text-ink-2 disabled:border-dashed disabled:cursor-not-allowed")} />
            </div>
            <Button type="submit" disabled={!key.trim() || !desktop || !!busy}>{busy === "save" && <LoaderCircle size={16} className="animate-spin" aria-hidden />}{S.saveKey}</Button>
          </div>
        </Field>
      </form>
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => void test()} disabled={!ai?.configured || !desktop || !!busy}>
          {busy === "test" ? <LoaderCircle size={15} className="animate-spin" aria-hidden /> : <PlugZap size={15} aria-hidden />}
          {busy === "test" ? S.testing : S.test}
        </Button>
        {ai?.configured && desktop && <Button variant="ghost" size="sm" onClick={() => void remove()} disabled={!!busy}>{S.removeKey}</Button>}
        <p className={cn("text-[13px] flex items-center gap-1.5", result?.ok ? "text-ok" : "text-danger")} aria-live="polite">
          {result && (result.ok ? <CircleCheck size={15} aria-hidden /> : <CircleAlert size={15} aria-hidden />)}
          {result?.text}
        </p>
      </div>
      <p className="text-[13px] text-ink-2 flex items-start gap-2 mt-5 leading-[19px]"><ShieldCheck size={16} className="text-accent shrink-0 mt-0.5" aria-hidden />{S.privacy}</p>
    </Section>
  );
}

function AppearanceSection() {
  const { t, lang, setLang, mood, setMood } = useApp();
  return (
    <Section id="appearance" i={4} title={t.settings.nav.appearance}>
      <Sub title={t.settings.language}>
        <div className="flex items-center gap-4">
          <Segmented label={t.settings.language} value={lang} onChange={setLang} options={[{ value: "es", label: t.settings.spanish }, { value: "en", label: t.settings.english }]} className="w-[280px]" />
          <p className="text-[13px] text-ink-2">{t.settings.languageSub}</p>
        </div>
      </Sub>
      <Sub title={t.settings.context}>
        <p className="text-[13px] text-ink-2 -mt-2 mb-4">{t.settings.contextSub}</p>
        <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label={t.settings.context}>
          {(["foco", "ocio"] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mood === m} onClick={() => setMood(m)}
              className={cn("text-left rounded-[18px] border p-4 transition-all duration-300 bg-surface", mood === m ? "border-accent shadow-[var(--shadow-2)]" : "border-line hover:border-line-strong")}>
              <div className="flex h-12 rounded-[12px] overflow-hidden border border-line">
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
      </Sub>
    </Section>
  );
}

function DataSection() {
  const { t, seedData, clearData } = useApp();
  const S = t.settings.data;
  const [confirm, setConfirm] = useState(false);
  return (
    <Section id="data" i={5} title={S.title} sub={S.sub}>
      <div className="flex items-center justify-between gap-6 py-1">
        <p className="text-[13.5px] text-ink-2 max-w-[420px]">{S.seedHint}</p>
        <Button variant="soft" onClick={seedData}>{S.seed}</Button>
      </div>
      <div className="flex items-center justify-between gap-6 pt-5 mt-5 border-t border-line">
        <p className="text-[13.5px] text-ink-2 max-w-[420px]">{S.clearHint}</p>
        <Button variant={confirm ? "danger" : "outline"} onClick={() => { if (confirm) { clearData(); setConfirm(false); } else { setConfirm(true); setTimeout(() => setConfirm(false), 3500); } }}>
          {confirm ? S.confirm : S.clear}
        </Button>
      </div>
    </Section>
  );
}
