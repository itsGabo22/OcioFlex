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
