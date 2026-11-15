import { invoke, isTauri, shimStore } from "./tauri";

/**
 * Local accounts. The REAL implementation is Rust (`src-tauri/src/auth`): Argon2id hashes in a file the
 * webview cannot read, lockout, hashed remember-me tokens. Everything below `── browser shim ──` exists
 * ONLY so the flows can be reviewed in plain Chrome; it is never reached inside the desktop app.
 */
export type User = { id: string; login: string; displayName: string; sample: boolean; created: number };
export type AuthErr = { code: "invalid" | "locked" | "taken" | "weak" | "bad_login" | "bad_name" | "no_session" | "io"; retryIn?: number };

const asErr = (e: unknown): AuthErr => {
  if (e && typeof e === "object" && "code" in e) return e as AuthErr;
  return { code: "io" };
};

async function call<T>(cmd: string, args: Record<string, unknown> | undefined, shim: () => Promise<T>): Promise<T> {
  try {
    return isTauri() ? await invoke<T>(cmd, args) : await shim();
  } catch (e) {
    throw asErr(e);
  }
}

export const authSession = () => call<User | null>("auth_session", undefined, shimSession);
export const authRegister = (login: string, displayName: string, password: string, remember: boolean) =>
  call<User>("auth_register", { login, displayName, password, remember }, () => shimRegister(login, displayName, password, remember));
export const authLogin = (login: string, password: string, remember: boolean) => call<User>("auth_login", { login, password, remember }, () => shimLogin(login, password, remember));
export const authLogout = () => call<void>("auth_logout", undefined, shimLogout);
export const authChangePassword = (current: string, next: string) => call<void>("auth_change_password", { current, next }, () => shimChange(current, next));
export const authDeleteAccount = (login?: string) => call<void>("auth_delete_account", { login: login ?? null }, () => shimDelete(login));
export const authSampleProfile = (displayName: string) => call<{ user: User; fresh: boolean }>("auth_sample_profile", { displayName }, () => shimSample(displayName));

export const MIN_PASSWORD = 8;

/** 0–4. Length first, then variety; never stored, never sent anywhere. */
export function passwordStrength(p: string): number {
  if (p.length < MIN_PASSWORD) return p.length === 0 ? 0 : 1;
  let s = 1;
  if (p.length >= 12) s++;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
  if (kinds >= 2) s++;
  if (kinds >= 3 && p.length >= 10) s++;
  return Math.min(4, s);
}

export function normalizeLogin(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s.length < 3 || s.length > 64) return null;
  if (s.includes("@")) {
    const [local, domain, extra] = s.split("@");
    return local && domain && extra === undefined && domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".") && !/\s/.test(s) ? s : null;
  }
  return /^[a-z0-9._-]+$/.test(s) ? s : null;
}

/* ───────────────────────── browser shim (review only) ───────────────────────── */

type ShimUser = User & { salt?: string; hash?: string; failed: number; lockedUntil: number };
const USERS = "shim:users";
const SESSION = "shim:session";
const REMEMBER = "shim:remember";
let current: string | null = null;

const users = () => shimStore.get<ShimUser[]>(USERS) ?? [];
const saveUsers = (u: ShimUser[]) => shimStore.set(USERS, u);
const pub = ({ id, login, displayName, sample, created }: ShimUser): User => ({ id, login, displayName, sample, created });
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)));
const delay = () => new Promise((r) => setTimeout(r, 380));

async function pbkdf2(password: string, saltB64: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 210_000 }, key, 256);
  return b64(bits);
}

async function shimSession(): Promise<User | null> {
  const id = current ?? sessionStorage.getItem("ocioflex:" + SESSION) ?? shimStore.get<string>(REMEMBER) ?? null;
  const u = users().find((x) => x.id === id);
  if (!u) return null;
  current = u.id;
  return pub(u);
}

function signIn(u: ShimUser, remember: boolean) {
  current = u.id;
  sessionStorage.setItem("ocioflex:" + SESSION, u.id);
  shimStore.set(REMEMBER, remember ? u.id : null);
  return pub(u);
}

async function shimRegister(login: string, displayName: string, password: string, remember: boolean): Promise<User> {
  await delay();
  const l = normalizeLogin(login);
  if (!l) throw { code: "bad_login" };
  if (!displayName.trim() || displayName.trim().length > 40) throw { code: "bad_name" };
  if (password.length < MIN_PASSWORD) throw { code: "weak" };
  const list = users();
  if (list.some((u) => u.login === l)) throw { code: "taken" };
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  const u: ShimUser = { id: b64(crypto.getRandomValues(new Uint8Array(9))).replace(/[^a-z0-9]/gi, "x"), login: l, displayName: displayName.trim(), sample: false, created: Date.now(), salt, hash: await pbkdf2(password, salt), failed: 0, lockedUntil: 0 };
  saveUsers([...list, u]);
  return signIn(u, remember);
}

async function shimLogin(login: string, password: string, remember: boolean): Promise<User> {
  await delay();
  const l = normalizeLogin(login);
  const list = users();
  const u = list.find((x) => x.login === l && !x.sample);
  if (!u || !u.salt) throw { code: "invalid" };
  const now = Date.now();
  if (u.lockedUntil > now) throw { code: "locked", retryIn: Math.ceil((u.lockedUntil - now) / 1000) };
  if ((await pbkdf2(password, u.salt)) === u.hash) {
    u.failed = 0;
    u.lockedUntil = 0;
    saveUsers(list);
    return signIn(u, remember);
  }
  u.failed++;
  let err: AuthErr = { code: "invalid" };
  if (u.failed >= 5) {
    const ms = Math.min(30_000 * 2 ** (u.failed - 5), 3_600_000);
    u.lockedUntil = now + ms;
    err = { code: "locked", retryIn: ms / 1000 };
  }
  saveUsers(list);
  throw err;
}

async function shimLogout() {
  current = null;
  sessionStorage.removeItem("ocioflex:" + SESSION);
  shimStore.set(REMEMBER, null);
}

async function shimChange(cur: string, next: string) {
  await delay();
  const list = users();
  const u = list.find((x) => x.id === current);
  if (!u || !u.salt || (await pbkdf2(cur, u.salt)) !== u.hash) throw { code: "invalid" };
  if (next.length < MIN_PASSWORD) throw { code: "weak" };
  u.salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  u.hash = await pbkdf2(next, u.salt);
  saveUsers(list);
}

async function shimDelete(login?: string) {
  await delay();
  const list = users();
  const target = current ? list.find((u) => u.id === current) : list.find((u) => u.login === normalizeLogin(login ?? ""));
  if (!target) throw { code: current ? "no_session" : "invalid" };
  saveUsers(list.filter((u) => u.id !== target.id));
  shimStore.set("u:" + target.id, null);
  if (current === target.id) await shimLogout();
}

async function shimSample(displayName: string) {
  await delay();
  const list = users();
  let u = list.find((x) => x.id === "sample");
  const fresh = !u;
  if (!u) {
    u = { id: "sample", login: "sample", displayName, sample: true, created: Date.now(), failed: 0, lockedUntil: 0 };
    saveUsers([...list, u]);
  }
  return { user: signIn(u, false), fresh };
}

/** Browser shim: the signed-in id, so `data.ts` can namespace localStorage. */
export const shimCurrentUser = () => current;
