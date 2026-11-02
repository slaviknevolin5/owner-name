import { COOKIE_MAX_AGE, COOKIE_NAME, STORAGE_KEY } from "./constants";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

/** Get or create a stable device id (localStorage + cookie). */
export function getOrCreateDeviceId(): string {
  let id: string | null = null;

  try {
    id = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // private mode / blocked storage
  }

  if (!id) {
    id = readCookie(COOKIE_NAME);
  }

  if (!id) {
    id = randomId();
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
  writeCookie(COOKIE_NAME, id);

  return id;
}
