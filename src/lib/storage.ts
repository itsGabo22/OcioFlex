import { isTauri } from "./tauri";

type StoreLike = {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
};

let storePromise: Promise<StoreLike | null> | null = null;

function getStore(): Promise<StoreLike | null> {
  if (!isTauri()) return Promise.resolve(null);
  storePromise ??= import("@tauri-apps/plugin-store")
    .then((m) => m.load("ocioflex.json", { defaults: {}, autoSave: 200 } as never) as unknown as StoreLike)
    .catch(() => null);
  return storePromise;
}

const PREFIX = "ocioflex:";

/** Persistent key/value: tauri-plugin-store inside the app, localStorage in plain Chrome. */
export async function loadValue<T>(key: string): Promise<T | undefined> {
  const store = await getStore();
  if (store) return store.get<T>(key);
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export async function saveValue(key: string, value: unknown): Promise<void> {
  const store = await getStore();
  if (store) {
    await store.set(key, value);
    return;
  }
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}
