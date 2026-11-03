"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { NearbyPlace, Place, PlanResponse, UserPlaceUpdate } from "@/lib/types";
import StatusControls from "@/components/StatusControls";
import { Button, Card, ErrorBanner, Spinner, VerdictBadge } from "@/components/ui";

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function PlacePage() {
  const { id } = useParams<{ id: string }>();
  const { t, name, cat, lang, userId, ready } = useApp();
  const today = new Date();
  const [place, setPlace] = useState<Place | null>(null);
  const [start, setStart] = useState(iso(today));
  const [end, setEnd] = useState(iso(new Date(today.getTime() + 6 * 86400000)));
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    api.place(id, userId).then(setPlace).catch((e: Error) => setError(e.message));
    api.nearby(id, userId, 120).then(setNearby).catch(() => undefined);
  }, [id, userId, ready]);

  const update = useCallback(async (b: UserPlaceUpdate) => {
    try { setPlace(await api.updatePlace(userId, id, b)); api.nearby(id, userId, 120).then(setNearby).catch(() => undefined); }
    catch (e) { setError((e as Error).message); }
  }, [id, userId]);

  async function run() {
    setLoading(true); setError(null); setPlan(null);
    try { setPlan(await api.plan({ destination: id, start_date: start, end_date: end, language: lang, user_id: userId })); }
    catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  async function decide(ok: boolean) {
    if (!plan) return;
    try { setPlan(await api.decide(plan.plan_id, ok)); } catch (e) { setError((e as Error).message); }
  }
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { weekday: "short", day: "numeric", month: "short" });

  if (!place) return <><ErrorBanner message={error} /><Spinner label="Loading…" /></>;
  const c = cat(place.category);

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <Link href="/" className="neu-btn inline-block">← {t("explore")}</Link>
        <Card>
          <h1 className="text-2xl font-extrabold">{name(place)}</h1>
          <p className="text-sm text-muted mb-2">{lang === "bn" ? place.name : place.name_bn}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="badge">{c.emoji} {c.label}</span>
            <span className="badge">📍 {place.district}, {place.division}</span>
            {place.must_visit && <span className="badge" style={{ color: "var(--caution)" }}>⭐ {t("mustVisit")}</span>}
            {place.unesco && <span className="badge" style={{ color: "var(--accent)" }}>🌐 {t("unesco")}</span>}
          </div>
          <p className="text-sm leading-relaxed mb-2">{place.description}</p>
          {place.best_season && <p className="text-sm mb-3"><span className="text-muted">{t("bestSeason")}: </span>{place.best_season}</p>}
          <StatusControls place={place} onUpdate={update} />
        </Card>
        {nearby.length > 0 && (
          <Card>
            <h2 className="font-bold mb-2">{t("nearbyUnvisited")}</h2>
            <ul className="space-y-2">
              {nearby.slice(0, 5).map((n) => (
                <li key={n.place.id}>
                  <Link href={`/place/${n.place.id}`} className="neu-sm p-3 flex items-center gap-3">
                    <span aria-hidden className="text-xl">{cat(n.place.category).emoji}</span>
                    <span className="flex-1 font-medium">{name(n.place)}</span>
                    <span className="text-xs text-muted">{n.distance_km} km</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="space-y-4 min-w-0">
        <Card>
          <h2 className="font-bold mb-3">🌦️ {t("bestDays")}</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm"><span className="text-muted block mb-1">{t("from")}</span>
              <input type="date" className="neu-input" value={start} min={iso(today)} max={iso(new Date(today.getTime() + 15 * 86400000))} onChange={(e) => setStart(e.target.value)} /></label>
            <label className="text-sm"><span className="text-muted block mb-1">{t("to")}</span>
              <input type="date" className="neu-input" value={end} min={start} max={iso(new Date(today.getTime() + 15 * 86400000))} onChange={(e) => setEnd(e.target.value)} /></label>
            <Button primary onClick={run} disabled={loading}>{t("run")}</Button>
          </div>
        </Card>

        <ErrorBanner message={error} onClose={() => setError(null)} />
        {loading && <Spinner label={t("checking")} />}

        {plan && (
          <>
            {plan.status === "needs_approval" && plan.approval_question && (
              <Card>
                <h3 className="font-bold mb-2">⚠️ {t("approveQ")}</h3>
                <p className="mb-3">{plan.approval_question}</p>
                <div className="flex gap-3"><Button primary onClick={() => decide(true)}>{t("yesRecommend")}</Button><Button onClick={() => decide(false)}>{t("no")}</Button></div>
              </Card>
            )}
            <Card>
              <p className="leading-relaxed">{plan.narrative}</p>
              {plan.best_days.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-2"><span className="font-bold">✅ {t("bestDays")}:</span>
                  {plan.best_days.map((d) => <span key={d} className="badge badge-go">{fmt(d)}</span>)}
                  {plan.best_is_caution && <span className="badge badge-caution">⚠️ {t("caution")}</span>}</p>
              )}
              <p className="text-xs text-muted mt-3">{plan.narrative_source} · {plan.tokens_used} tokens</p>
            </Card>
            {plan.conflicts.map((c2) => <div key={c2} className="neu-in-sm p-3 text-sm">🛡️ {c2}</div>)}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {plan.days.map((d) => (
                <article key={d.day} className="neu p-4 space-y-2" aria-label={fmt(d.day)}>
                  <div className="flex items-center justify-between gap-2"><h3 className="font-bold">{fmt(d.day)}</h3><VerdictBadge verdict={d.verdict} /></div>
                  <p className="text-xs text-muted">Score {d.score}/100</p>
                  {d.reasons.length === 0 && <p className="text-sm text-muted">No risk rules triggered.</p>}
                  <ul className="space-y-2">
                    {d.reasons.map((r, i) => (
                      <li key={i} className="text-sm neu-in-sm p-2">
                        <span className={`font-semibold badge-${r.verdict}`} style={{ background: "none", boxShadow: "none", padding: 0 }}>{r.label}</span>: {r.message}{" "}
                        {r.ref && <a className="underline text-accent" href={api.evidenceUrl(r.ref)} target="_blank" rel="noreferrer">{t("rawData")}</a>}
                      </li>
                    ))}
                  </ul>
                  <details className="text-xs text-muted"><summary className="cursor-pointer">metrics</summary>
                    <pre className="whitespace-pre-wrap mt-1">{JSON.stringify(d.metrics, null, 1)}</pre></details>
                </article>
              ))}
            </div>

            {plan.nearby_hospitals.length > 0 && (
              <Card><h3 className="font-bold mb-2">🏥 {t("hospitals")}</h3>
                <ul className="text-sm space-y-1">{plan.nearby_hospitals.map((h) => <li key={h.name + h.distance_km}>{h.name} · {h.distance_km} km</li>)}</ul></Card>
            )}
            {plan.tips.length > 0 && (
              <Card><h3 className="font-bold mb-2">💡 {t("tips")}</h3>
                <ul className="text-sm space-y-2">{plan.tips.map((tp, i) => <li key={i}>{tp.text}{tp.url && <a className="block text-xs underline text-accent" href={tp.url} target="_blank" rel="noreferrer">{tp.url}</a>}</li>)}</ul></Card>
            )}
            {plan.data_gaps.length > 0 && <p className="text-xs text-muted">Data gaps: {plan.data_gaps.join("; ")}</p>}
          </>
        )}
        <p className="text-xs text-muted">{t("advisory")}</p>
      </div>
    </div>
  );
}
