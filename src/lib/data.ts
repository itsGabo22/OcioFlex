import { invoke, isTauri, shimStore } from "./tauri";
import { shimCurrentUser } from "./auth";

/**
 * Two scopes of persistence, both owned by the Rust core inside the app:
 * - user data: `users/<uid>/ocioflex.json` (sessions, media, timer, profile, tutorial, ui)
 * - device prefs: language and last mood, available before sign-in.
 * In plain Chrome (review only) both fall back to namespaced localStorage.
 */
export type UserDoc = Partial<Record<"sessions" | "media" | "timer" | "profile" | "tutorial" | "ui" | "seeded", unknown>>;

export async function loadUserData(): Promise<UserDoc> {
  if (isTauri()) return invoke<UserDoc>("data_load");
  return shimStore.get<UserDoc>("u:" + shimCurrentUser()) ?? {};
}

let queue: Promise<void> = Promise.resolve();

/** Merge-save; calls are serialised so a fast sequence of edits never lands out of order. */
export function saveUserData(patch: UserDoc): Promise<void> {
  queue = queue
    .then(async () => {
      if (isTauri()) {
        await invoke("data_save", { patch });
        return;
      }
      const key = "u:" + shimCurrentUser();
      const doc = { ...(shimStore.get<UserDoc>(key) ?? {}) } as Record<string, unknown>;
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) delete doc[k];
        else doc[k] = v;
      }
      shimStore.set(key, doc);
    })
    .catch(() => undefined);
  return queue;
}

export type Prefs = { lang?: "es" | "en"; mood?: "foco" | "ocio" };

export async function loadPrefs(): Promise<Prefs> {
  try {
    if (isTauri()) return await invoke<Prefs>("prefs_get");
  } catch {
    return {};
  }
  return shimStore.get<Prefs>("dev:prefs") ?? {};
}

export async function savePref<K extends keyof Prefs>(key: K, value: NonNullable<Prefs[K]>) {
  try {
    if (isTauri()) return await invoke("prefs_set", { key, value });
    shimStore.set("dev:prefs", { ...(shimStore.get<Prefs>("dev:prefs") ?? {}), [key]: value });
  } catch {
    /* non-fatal */
  }
}
