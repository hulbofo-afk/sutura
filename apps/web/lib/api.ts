export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly details?: unknown) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, { ...init, headers, credentials: "same-origin", cache: "no-store" });
  if (!response.ok) {
    let payload: { error?: { message?: string; details?: unknown }; message?: string } | null = null;
    try { payload = await response.json(); } catch { /* non-JSON upstream error */ }
    throw new ApiError(payload?.error?.message ?? payload?.message ?? `Erreur serveur (${response.status})`, response.status, payload?.error?.details);
  }
  if (response.status === 204) return undefined as T;
  const type = response.headers.get("content-type") ?? "";
  return (type.includes("application/json") ? response.json() : response.blob()) as Promise<T>;
}

export function relativeDate(value: string): string {
  const timestamp = new Date(value).getTime();
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} semaine${days >= 14 ? "s" : ""}`;
  return `il y a ${Math.floor(days / 30)} mois`;
}
