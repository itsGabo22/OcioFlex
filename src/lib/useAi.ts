"use client";

import { useCallback, useState } from "react";
import { aiGenerate, type AiFeature, type AiMap } from "./ai";
import { useApp } from "@/context/AppContext";

export type AiState<F extends AiFeature> = { status: "idle" | "loading" | "done" | "error"; data: AiMap[F][1] | null; mode: "live" | "demo" };

/** Runs one AI feature through the Rust core; falls back gracefully and tells the user once. */
export function useAi<F extends AiFeature>(feature: F) {
  const { lang, toast, t } = useApp();
  const [state, setState] = useState<AiState<F>>({ status: "idle", data: null, mode: "demo" });

  const run = useCallback(
    async (payload: AiMap[F][0]) => {
      setState((s) => ({ ...s, status: "loading" }));
      try {
        const res = await aiGenerate(feature, payload, lang);
        if (res.fallback) toast(t.toast.aiFallback);
        setState({ status: "done", data: res.data, mode: res.mode });
      } catch {
        setState((s) => ({ ...s, status: "error" }));
      }
    },
    [feature, lang, toast, t],
  );

  return { ...state, run };
}
