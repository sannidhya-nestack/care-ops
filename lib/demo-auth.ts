const DEMO_SESSION_KEY = "careops-demo-session";

const DEFAULT_LOGIN_ID = "demo@careops.ai";
const DEFAULT_LOGIN_PASS = "careops123";

export interface DemoUser {
  email: string;
}

export function getDemoLoginId(): string {
  return process.env.NEXT_PUBLIC_LOGIN_ID || DEFAULT_LOGIN_ID;
}

export function getDemoLoginPass(): string {
  return process.env.NEXT_PUBLIC_LOGIN_PASS || DEFAULT_LOGIN_PASS;
}

export function validateDemoCredentials(email: string, password: string): boolean {
  return email === getDemoLoginId() && password === getDemoLoginPass();
}

export function getDemoSession(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const { email } = JSON.parse(raw) as { email: string };
    if (!email) return null;
    return { email };
  } catch {
    return null;
  }
}

export function setDemoSession(email: string): DemoUser {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ email }));
  window.dispatchEvent(new Event("demo-auth-changed"));
  return { email };
}

export function clearDemoSession(): void {
  localStorage.removeItem(DEMO_SESSION_KEY);
  window.dispatchEvent(new Event("demo-auth-changed"));
}

export function subscribeDemoAuth(onChange: (user: DemoUser | null) => void): () => void {
  const sync = () => onChange(getDemoSession());
  sync();
  window.addEventListener("demo-auth-changed", sync);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener("demo-auth-changed", sync);
    window.removeEventListener("storage", sync);
  };
}
