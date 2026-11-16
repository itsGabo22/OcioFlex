"use client";

import { useCallback, useState } from "react";
import { aiGenerate, type AiFeature, type AiMap } from "./ai";
import { useApp } from "@/context/AppContext";

export type AiState<F extends AiFeature> = { status: "idle" | "loading" | "done" | "error"; data: AiMap[F] | null };

/** Runs one of Flex's features. A provider failure quietly falls back to the local engine and says so once. */
export function useAi<F extends AiFeature>(feature: F) {
  const { lang, toast, t } = useApp();
  const [state, setState] = useState<AiState<F>>({ status: "idle", data: null });

  const run = useCallback(
    async (payload: Record<string, unknown>) => {
      setState((s) => ({ ...s, status: "loading" }));
      try {
        const res = await aiGenerate(feature, payload, lang);
        if (res.fallback) toast(t.flex.fallback, "default");
        setState({ status: "done", data: res.data });
      } catch {
        setState((s) => ({ ...s, status: "error" }));
      }
    },
    [feature, lang, toast, t],
  );

  return { ...state, run };
}
