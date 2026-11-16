/** Runtime guard: true only inside the Tauri webview. In plain Chrome the app runs through shims (visual review only). */
export const isTauri = (): boolean => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: inv } = await import("@tauri-apps/api/core");
  return inv<T>(cmd, args);
}

export async function showWindow(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().show();
  } catch {
    /* the Rust core shows the window after a short delay anyway */
  }
}

const ALLOWED = /^(https:\/\/|steam:\/\/|spotify:)/i;
export const isAllowedUrl = (url: string) => ALLOWED.test(url.trim());

export async function openExternal(url: string): Promise<boolean> {
  if (!isAllowedUrl(url)) return false;
  try {
    if (isTauri()) {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    return true;
  } catch {
    return false;
  }
}

/** Shared localStorage helpers for the browser-review shims. Never used inside the desktop app. */
export const shimStore = {
  get<T>(key: string): T | undefined {
    try {
      const raw = localStorage.getItem("ocioflex:" + key);
      return raw === null ? undefined : (JSON.parse(raw) as T);
    } catch {
      return undefined;
    }
  },
  set(key: string, value: unknown) {
    try {
      if (value === undefined || value === null) localStorage.removeItem("ocioflex:" + key);
      else localStorage.setItem("ocioflex:" + key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  },
};

/** Release builds behave like an app, not a web page: no context menu, no reload keys. */
export function lockDownWebview() {
  if (!isTauri() || process.env.NODE_ENV !== "production") return;
  window.addEventListener("contextmenu", (e) => {
    const el = e.target as HTMLElement | null;
    if (!el?.closest("input, textarea")) e.preventDefault();
  });
  window.addEventListener(
    "keydown",
    (e) => {
      const k = e.key.toLowerCase();
      if (k === "f5" || ((e.ctrlKey || e.metaKey) && (k === "r" || k === "p" || k === "u")) || (e.ctrlKey && e.shiftKey && (k === "i" || k === "j" || k === "c"))) {
        e.preventDefault();
      }
    },
    true,
  );
}
