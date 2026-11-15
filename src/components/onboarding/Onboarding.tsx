"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { fmt, useApp } from "@/context/AppContext";
import { stage } from "@/lib/stage";
import { targetFocusPct, type Profile } from "@/lib/profile";
import { profileLabel } from "@/lib/profileLabel";
import { Button } from "@/components/ui/primitives";
import { DayFields, GoalsField, LanguageField, NameField, ObstaclesField, OccupationField, RhythmFields, TastesField } from "./ProfileFields";
import { cn } from "@/lib/utils";

const KEYS = ["name", "occupation", "day", "rhythm", "goals", "obstacles", "tastes", "summary"] as const;

/** First-run questionnaire: one idea per screen, every step skippable, the orb reacting on the left. */
export function Onboarding() {
  const { t, profile, completeOnboarding } = useApp();
  const [i, setI] = useState(0);
  const [p, setP] = useState<Profile>(profile);
  const [dir, setDir] = useState(1);
  const head = useRef<HTMLHeadingElement>(null);
  const key = KEYS[i];
  const S = t.onboarding.steps;
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));

  useEffect(() => {
    stage.step = i;
    stage.pulse();
    head.current?.focus({ preventScroll: true });
  }, [i]);

  const go = (d: number) => {
    setDir(d);
    setI((x) => Math.max(0, Math.min(KEYS.length - 1, x + d)));
  };
  const finish = () => completeOnboarding(p);

  const step = S[key];
  return (
    <div className="onb card !bg-surface flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-7">
        <div className="flex items-center gap-1.5" aria-hidden>
          {KEYS.map((k, n) => (
            <span key={k} className={cn("h-1.5 rounded-full transition-all duration-500 ease-[var(--ease)]", n === i ? "w-7 bg-accent" : n < i ? "w-1.5 bg-accent-2" : "w-1.5 bg-line-strong")} />
          ))}
        </div>
        <p className="meta" aria-live="polite">{fmt(t.onboarding.progress, { n: i + 1, m: KEYS.length })}</p>
      </div>

      <form
        className="flex flex-col flex-1 min-h-0"
        onSubmit={(e) => {
          e.preventDefault();
          if (key === "summary") finish();
          else go(1);
        }}
      >
        <div key={key} className={cn("flex-1 min-h-0", dir > 0 ? "step-in" : "step-back")}>
          <h2 ref={head} tabIndex={-1} className="display text-[38px] leading-[1.06] text-ink text-balance outline-none">{step.title}</h2>
          <p className="text-[15px] text-ink-2 mt-3 mb-7 text-pretty">{step.sub}</p>

          {key === "name" && (
            <div className="flex flex-col gap-7">
              <NameField p={p} set={set} big />
              <LanguageField />
            </div>
          )}
          {key === "occupation" && <OccupationField p={p} set={set} />}
          {key === "day" && <DayFields p={p} set={set} />}
          {key === "rhythm" && <RhythmFields p={p} set={set} />}
          {key === "goals" && <GoalsField p={p} set={set} />}
          {key === "obstacles" && <ObstaclesField p={p} set={set} />}
          {key === "tastes" && <TastesField p={p} set={set} />}
          {key === "summary" && <Summary p={p} />}
        </div>

        <div className="flex items-center gap-3 mt-8 pt-5 border-t border-line">
          {i > 0 ? (
            <Button variant="ghost" onClick={() => go(-1)}>
              <ArrowLeft size={17} aria-hidden />
              {t.common.back}
            </Button>
          ) : (
            <span />
          )}
          <div className="ml-auto flex items-center gap-2">
            {key !== "summary" && (
              <Button variant="ghost" onClick={() => go(1)}>
                {t.onboarding.skipStep}
              </Button>
            )}
            <Button type="submit" size={key === "summary" ? "lg" : "md"} className={key === "summary" ? "" : "min-w-[132px]"}>
              {key === "summary" ? (
                <>
                  {t.onboarding.letsGo}
                  <Check size={18} aria-hidden />
                </>
              ) : (
                <>
                  {t.common.next}
                  <ArrowRight size={17} aria-hidden />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Summary({ p }: { p: Profile }) {
  const { t } = useApp();
  const S = t.onboarding.steps.summary;
  const tp = targetFocusPct(p);
  const rows: [string, string][] = [
    [S.rhythm, [p.chronotype ? t.profile.chronotype[p.chronotype] : null, p.window ? t.profile.window[p.window] : null].filter(Boolean).join(" · ") || S.none],
    [S.goal, `${p.goals.map((g) => t.profile.goals[g]).join(", ") || S.none} · ${fmt(t.common.perWeek, { n: p.weeklyGoalH })}`],
    [S.session, `${p.sessionLen} min`],
    [S.target, `${tp}:${100 - tp}`],
    [S.leisure, p.tastes.map((x) => t.profile.tastes[x]).join(", ") || S.none],
  ];
  return (
    <div>
      <div className="rounded-[22px] p-6 border border-line" style={{ background: "radial-gradient(90% 120% at 100% 0%, color-mix(in srgb, var(--glow) 45%, transparent), transparent 60%), var(--surface-2)" }}>
        {p.name && <p className="meta text-accent mb-2">{p.name}</p>}
        <p className="display text-[26px] leading-[1.2] text-ink" style={{ fontWeight: 430 }}>{profileLabel(p, t)}</p>
      </div>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[14px]">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-ink-2">{k}</dt>
            <dd className="text-ink font-semibold text-right">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}
