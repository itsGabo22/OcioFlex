"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Compass, TriangleAlert } from "lucide-react";
import { fmt, useApp } from "@/context/AppContext";
import { authDeleteAccount, passwordStrength, type AuthErr } from "@/lib/auth";
import { stage } from "@/lib/stage";
import { Button, Checkbox, Dialog, Field, fieldClass } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Tab = "in" | "up";

/** Lean the orb toward the field in focus; pulse on keystrokes (passwords only "breathe", so length is never shown). */
const leanTo = (y: number) => () => {
  stage.lean = { x: 1, y };
};
const unlean = () => {
  stage.lean = { x: 0, y: 0 };
};
let lastPulse = 0;
const tap = (secret: boolean) => () => {
  const now = performance.now();
  if (secret) {
    if (now - lastPulse > 900) {
      lastPulse = now;
      stage.pulse();
    }
    return;
  }
  if (now - lastPulse > 70) {
    lastPulse = now;
    stage.pulse();
  }
};

export function AuthCard() {
  const { t, login, register, enterSample } = useApp();
  const [tab, setTab] = useState<Tab>("in");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState<false | "form" | "sample">(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [forgot, setForgot] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);
  const uid = useId();
  const firstRef = useRef<HTMLInputElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const f = window.setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(f);
  }, [tab]);

  // live countdown while locked out
  useEffect(() => {
    if (lockLeft <= 0) return;
    const i = window.setInterval(() => setLockLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [lockLeft]);

  const strength = passwordStrength(pw);
  const errText = (e: AuthErr) => (e.code === "locked" ? fmt(t.auth.errors.locked, { n: e.retryIn ?? 30 }) : t.auth.errors[e.code] ?? t.auth.errors.io);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || lockLeft > 0) return;
    setError(null);
    setBusy("form");
    try {
      if (tab === "in") await login(id, pw, remember);
      else await register(id, name, pw, remember);
      setPw("");
    } catch (err) {
      const ae = err as AuthErr;
      setError(errText(ae));
      if (ae.code === "locked") setLockLeft(ae.retryIn ?? 30);
      setShake((n) => n + 1);
      setPw("");
      setBusy(false);
    }
  };

  const sample = async () => {
    setError(null);
    setBusy("sample");
    try {
      await enterSample();
    } catch (err) {
      setError(errText(err as AuthErr));
      setBusy(false);
    }
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setPw("");
  };
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next: Tab = tab === "in" ? "up" : "in";
    switchTab(next);
    tabs.current[next === "in" ? 0 : 1]?.focus();
  };

  const lockedMsg = lockLeft > 0 ? fmt(t.auth.errors.locked, { n: lockLeft }) : null;

  return (
    <div key={shake} className={cn("auth-card card !bg-surface", shake > 0 && "shake")}>
      <div role="tablist" aria-label={t.auth.tabs} onKeyDown={onTabKey} className="relative grid grid-cols-2 rounded-full bg-bg-2 border border-line p-1 mb-7">
        <span aria-hidden className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-[var(--shadow-1)] transition-transform duration-300 ease-[var(--ease)]" style={{ transform: tab === "up" ? "translateX(100%)" : "none" }} />
        {(["in", "up"] as const).map((k, i) => (
          <button
            key={k}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`${uid}-panel`}
            tabIndex={tab === k ? 0 : -1}
            onClick={() => switchTab(k)}
            className={cn("relative z-10 h-9 rounded-full text-[13.5px] font-semibold transition-colors", tab === k ? "text-ink" : "text-ink-2 hover:text-ink")}
          >
            {k === "in" ? t.auth.signIn : t.auth.signUp}
          </button>
        ))}
      </div>

      <form id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="mb-1">
          <h2 className="display text-[34px] leading-[1.05] text-ink">{tab === "in" ? t.auth.welcomeBack : t.auth.welcomeNew}</h2>
          <p className="text-[14px] text-ink-2 mt-2">{tab === "in" ? t.auth.welcomeBackSub : t.auth.welcomeNewSub}</p>
        </div>

        {tab === "up" && (
          <Field id={`${uid}-name`} label={t.auth.name}>
            <input
              ref={firstRef}
              id={`${uid}-name`}
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={leanTo(0.35)}
              onBlur={unlean}
              onKeyDown={tap(false)}
              placeholder={t.auth.namePh}
              autoComplete="nickname"
              maxLength={40}
            />
          </Field>
        )}

        <Field id={`${uid}-login`} label={t.auth.login}>
          <input
            ref={tab === "in" ? firstRef : undefined}
            id={`${uid}-login`}
            className={fieldClass}
            value={id}
            onChange={(e) => setId(e.target.value)}
            onFocus={leanTo(tab === "in" ? 0.25 : 0)}
            onBlur={unlean}
            onKeyDown={tap(false)}
            placeholder={t.auth.loginPh}
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={64}
          />
        </Field>

        <Field
          id={`${uid}-pw`}
          label={tab === "in" ? t.auth.password : t.auth.passwordNew}
          hint={
            tab === "up" && pw ? (
              <div className="flex items-center gap-3" aria-live="polite">
                <div className="flex gap-1 flex-1" aria-hidden>
                  {[1, 2, 3, 4].map((n) => (
                    <span key={n} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", n <= strength ? (strength <= 1 ? "bg-danger" : strength === 2 ? "bg-warn" : "bg-ok") : "bg-bg-2")} />
                  ))}
                </div>
                <span className="text-[12px] font-semibold text-ink-2 w-[118px] text-right" aria-hidden>{t.auth.strength[strength]}</span>
                <span className="sr-only">{fmt(t.auth.strengthLabel, { s: t.auth.strength[strength] })}</span>
              </div>
            ) : undefined
          }
        >
          <div className="relative">
            <input
              id={`${uid}-pw`}
              type={show ? "text" : "password"}
              className={cn(fieldClass, "pr-12")}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onFocus={leanTo(-0.2)}
              onBlur={unlean}
              onKeyDown={tap(true)}
              placeholder={tab === "up" ? t.auth.passwordPh : undefined}
              autoComplete={tab === "in" ? "current-password" : "new-password"}
              maxLength={256}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? t.auth.hide : t.auth.show}
              aria-pressed={show}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full text-ink-2 hover:text-ink hover:bg-bg-2 transition-colors"
            >
              {show ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between gap-3 -mt-0.5">
          <Checkbox id={`${uid}-remember`} checked={remember} onChange={setRemember} label={t.auth.remember} />
          {tab === "in" && (
            <button type="button" onClick={() => setForgot(true)} className="text-[13px] font-semibold text-accent underline-offset-4 hover:underline shrink-0">
              {t.auth.forgot}
            </button>
          )}
        </div>

        <div aria-live="assertive" className="min-h-0">
          {(error || lockedMsg) && (
            <p className="flex items-start gap-2 rounded-[12px] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] border border-[color-mix(in_srgb,var(--danger)_25%,transparent)] px-3.5 py-2.5 text-[13px] text-danger">
              <TriangleAlert size={15} className="shrink-0 mt-0.5" aria-hidden />
              {lockedMsg ?? error}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full mt-1" disabled={!!busy || lockLeft > 0} aria-disabled={!!busy || lockLeft > 0}>
          {busy === "form" ? (
            <>
              <LoaderCircle size={18} className="animate-spin" aria-hidden />
              {t.auth.working}
            </>
          ) : (
            <>
              {tab === "in" ? t.auth.submitIn : t.auth.submitUp}
              <ArrowRight size={18} aria-hidden />
            </>
          )}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5 text-[12px] font-semibold text-ink-3 uppercase tracking-[0.1em]" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        {t.auth.or}
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        onClick={() => void sample()}
        disabled={!!busy}
        className="sample-btn group w-full flex items-center gap-3.5 rounded-[16px] border border-line bg-surface-2 px-4 py-3 text-left transition-[border-color,background-color,transform] duration-200 hover:border-line-strong hover:bg-surface active:scale-[0.99] disabled:opacity-60"
      >
        <span className="h-10 w-10 shrink-0 rounded-full bg-accent-soft grid place-items-center text-accent">
          {busy === "sample" ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : <Compass size={18} aria-hidden />}
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold text-ink">{t.auth.sample}</span>
          <span className="block text-[12.5px] text-ink-2 mt-0.5">{t.auth.sampleHint}</span>
        </span>
        <ArrowRight size={16} className="ml-auto shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </button>

      <ForgotDialog open={forgot} onClose={() => setForgot(false)} initial={id} />
    </div>
  );
}

function ForgotDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: string }) {
  const { t, toast } = useApp();
  const [who, setWho] = useState(initial);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const uid = useId();
  const ok = word.trim().toUpperCase() === t.auth.forgotWord && who.trim().length >= 3;

  const run = async () => {
    if (!ok) return;
    setBusy(true);
    setErr(null);
    try {
      await authDeleteAccount(who.trim());
      toast(t.auth.forgotDone, "success");
      setWord("");
      onClose();
    } catch {
      setErr(t.auth.forgotMissing);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} label={t.auth.forgotTitle} className="max-w-[520px]">
      <h2 className="display text-[28px] leading-[1.1] text-ink pr-6">{t.auth.forgotTitle}</h2>
      <p className="text-[14px] leading-[21px] text-ink-2 mt-3">{t.auth.forgotBody}</p>
      <div className="flex flex-col gap-4 mt-6">
        <Field id={`${uid}-who`} label={t.auth.forgotWho}>
          <input id={`${uid}-who`} data-autofocus className={fieldClass} value={who} onChange={(e) => setWho(e.target.value)} autoComplete="off" spellCheck={false} />
        </Field>
        <Field id={`${uid}-word`} label={fmt(t.auth.forgotConfirm, { word: t.auth.forgotWord })} error={err}>
          <input id={`${uid}-word`} className={fieldClass} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" spellCheck={false} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-7">
        <Button variant="ghost" onClick={onClose}>
          {t.common.cancel}
        </Button>
        <Button variant="danger" disabled={!ok || busy} onClick={() => void run()}>
          {t.auth.forgotCta}
        </Button>
      </div>
    </Dialog>
  );
}
