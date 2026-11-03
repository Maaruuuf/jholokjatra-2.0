import type {
  CompareResponse, Health, NearbyPlace, Place, PlanResponse, Preferences, UserPlaceUpdate, UserStats,
} from "./types";

export const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010").replace(/\/$/, "");

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  } catch {
    throw new Error(`Cannot reach the API at ${API}. Is the backend running (uvicorn app.main:app --port 8010)?`);
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail ?? j);
    } catch { /* keep statusText */ }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

const q = (o: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  health: () => req<Health>("/health"),
  places: (userId: string) => req<Place[]>(`/places${q({ user_id: userId })}`),
  place: (id: string, userId: string) => req<Place>(`/places/${id}${q({ user_id: userId })}`),
  updatePlace: (userId: string, id: string, body: UserPlaceUpdate) =>
    req<Place>(`/users/${encodeURIComponent(userId)}/places/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  stats: (userId: string) => req<UserStats>(`/users/${encodeURIComponent(userId)}/stats`),
  nearby: (id: string, userId: string, radius = 120) =>
    req<NearbyPlace[]>(`/places/${id}/nearby${q({ user_id: userId, radius_km: radius })}`),
  plan: (body: { destination: string; start_date: string; end_date: string; language: string; user_id: string }) =>
    req<PlanResponse>("/plan", { method: "POST", body: JSON.stringify(body) }),
  decide: (planId: string, approved: boolean) =>
    req<PlanResponse>(`/plans/${planId}/decision`, { method: "POST", body: JSON.stringify({ approved }) }),
  compare: (body: { places: string[]; start_date: string; end_date: string; user_id: string }) =>
    req<CompareResponse>("/compare", { method: "POST", body: JSON.stringify(body) }),
  getPrefs: (userId: string) => req<Preferences>(`/preferences/${encodeURIComponent(userId)}`),
  putPrefs: (userId: string, p: Preferences) =>
    req<Preferences>(`/preferences/${encodeURIComponent(userId)}`, { method: "PUT", body: JSON.stringify(p) }),
  evidenceUrl: (ref: string) => `${API}/evidence/${ref}`,
};
