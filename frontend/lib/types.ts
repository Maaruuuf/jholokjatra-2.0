export type Status = "visited" | "wishlist" | "none";
export type Verdict = "go" | "caution" | "avoid";

export interface Place {
  id: string; name: string; name_bn: string; category: string; division: string; district: string;
  lat: number; lon: number; description: string; best_season: string; unesco: boolean; must_visit: boolean;
  status: Status; visited_on: string | null; rating: number | null; note: string;
}
export interface UserPlaceUpdate { status: Status; visited_on?: string | null; rating?: number | null; note?: string }

export interface Evidence {
  source: string; metric: string; label: string; verdict: Verdict; message: string;
  value: number | null; unit: string; threshold: number | null; url: string; ref: string;
}
export interface DayVerdict {
  day: string; verdict: Verdict; score: number; reasons: Evidence[]; metrics: Record<string, number>;
  agents: Record<string, Verdict>;
}
export interface Tip { text: string; url: string }
export interface Hospital { name: string; lat: number; lon: number; distance_km: number }
export interface PlanResponse {
  plan_id: string; status: "complete" | "needs_approval" | "rejected"; destination: string; destination_key: string;
  start_date: string; end_date: string; days: DayVerdict[]; best_days: string[]; best_is_caution: boolean;
  avoid_days: string[]; narrative: string; narrative_source: string; conflicts: string[]; tips: Tip[];
  nearby_hospitals: Hospital[]; data_gaps: string[]; approval_question: string | null; tokens_used: number;
}
export interface Badge { id: string; label: string; detail: string; earned: boolean }
export interface UserStats {
  visited: number; wishlist: number; total_places: number; percent_visited: number; divisions_visited: string[];
  divisions_total: number; by_category: Record<string, { visited: number; total: number }>;
  by_division: Record<string, { visited: number; total: number }>; average_rating: number | null; badges: Badge[];
}
export interface NearbyPlace { place: Place; distance_km: number }
export interface CompareRow {
  place_id: string; name: string; go_days: number; caution_days: number; avoid_days: number;
  average_score: number; best_day: string | null; top_risk: string; error: string | null;
}
export interface CompareResponse { start_date: string; end_date: string; ranking: CompareRow[] }
export interface Preferences {
  risk_tolerance: "low" | "medium" | "high"; motion_sickness: boolean; traveling_with_kids: boolean; elderly_travelers: boolean;
}
export interface Health { status: string; version: string; llm_providers: string[] }
