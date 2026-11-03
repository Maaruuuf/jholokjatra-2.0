"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { CompareResponse, Place } from "@/lib/types";
import { Button, Card, Chip, ErrorBanner, Spinner } from "@/components/ui";

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function ComparePage() {
  const { t, name, userId, ready, lang } = useApp();
  const today = new Date();
  const [places, setPlaces] = useState<Place[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [start, setStart] = useState(iso(today));
  const [end, setEnd] = useState(iso(new Date(today.getTime() + 6 * 86400000)));
  const [res, setRes] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (ready) api.places(userId).then(setPlaces).catch((e: Error) => setError(e.message)); }, [ready, userId]);
  const byId = useMemo(() => Object.fromEntries(places.map((p) => [p.id, p])), [places]);
  const matches = places.filter((p) => !picked.includes(p.id) && (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.name_bn.includes(q))).slice(0, 8);
  const toggle = (id: string) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 6 ? [...s, id] : s));
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { weekday: "short", day: "numeric", month: "short" });

  async function run() {
    setLoading(true); setError(null); setRes(null);
    try { setRes(await api.compare({ places: picked, start_date: start, end_date: end, user_id: userId })); }
    catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Card>
        <h1 className="text-xl font-extrabold mb-1">⚖️ {t("compare")}</h1>
        <p className="text-sm text-muted mb-3">{t("pickPlaces")}</p>
        <div className="flex flex-wrap gap-2 mb-3" aria-live="polite">
          {picked.map((id) => byId[id] && <Chip key={id} pressed onClick={() => toggle(id)}>{name(byId[id])} ✕</Chip>)}
        </div>
        <input className="neu-input mb-3" type="search" placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("search")} />
        <div className="flex flex-wrap gap-2 mb-4">{matches.map((p) => <Chip key={p.id} pressed={false} onClick={() => toggle(p.id)}>+ {name(p)}</Chip>)}</div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm"><span className="text-muted block mb-1">{t("from")}</span><input type="date" className="neu-input" value={start} min={iso(today)} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="text-sm"><span className="text-muted block mb-1">{t("to")}</span><input type="date" className="neu-input" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></label>
          <Button primary disabled={picked.length < 2 || loading} onClick={run}>{t("run")}</Button>
        </div>
      </Card>
      <ErrorBanner message={error} onClose={() => setError(null)} />
      {loading && <Spinner label={t("checking")} />}
      {res && (
        <Card>
          <h2 className="font-bold mb-3">🏆 {t("ranking")} ({fmt(res.start_date)} – {fmt(res.end_date)})</h2>
          <ol className="space-y-3">
            {res.ranking.map((r, i) => {
              const total = r.go_days + r.caution_days + r.avoid_days || 1;
              return (
                <li key={r.place_id} className="neu-sm p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/place/${r.place_id}`} className="font-bold">#{i + 1} {byId[r.place_id] ? name(byId[r.place_id]) : r.name}</Link>
                    {!r.error && <span className="text-sm text-muted">avg score {r.average_score}{r.best_day ? ` · ${t("bestDays")}: ${fmt(r.best_day)}` : ""}</span>}
                  </div>
                  {r.error ? <p className="text-sm mt-1" style={{ color: "var(--avoid)" }}>{r.error}</p> : (
                    <>
                      <div className="neu-in-sm h-4 mt-2 flex overflow-hidden" role="img" aria-label={`${r.go_days} go, ${r.caution_days} caution, ${r.avoid_days} avoid days`}>
                        <div style={{ width: `${(100 * r.go_days) / total}%`, background: "var(--go)" }} />
                        <div style={{ width: `${(100 * r.caution_days) / total}%`, background: "var(--caution)" }} />
                        <div style={{ width: `${(100 * r.avoid_days) / total}%`, background: "var(--avoid)" }} />
                      </div>
                      <p className="text-xs text-muted mt-1">✅ {r.go_days} · ⚠️ {r.caution_days} · ⛔ {r.avoid_days}{r.top_risk ? ` — ${r.top_risk}` : ""}</p>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      )}
      <p className="text-xs text-muted">{t("advisory")}</p>
    </div>
  );
}
