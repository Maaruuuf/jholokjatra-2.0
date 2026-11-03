"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { Place, UserStats } from "@/lib/types";
import { Card, ErrorBanner, ProgressBar, Spinner, Stars } from "@/components/ui";

function Ring({ percent }: { percent: number }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="neu rounded-full w-44 h-44 grid place-items-center" role="img" aria-label={`${percent}% visited`}>
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--sd)" strokeOpacity=".35" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * percent) / 100} />
      </svg>
      <span className="absolute text-2xl font-extrabold">{Math.round(percent)}%</span>
    </div>
  );
}

export default function VisitsPage() {
  const { t, name, cat, userId, ready, lang } = useApp();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    Promise.all([api.stats(userId), api.places(userId)]).then(([s, p]) => { setStats(s); setPlaces(p); })
      .catch((e: Error) => setError(e.message));
  }, [ready, userId]);

  if (!stats) return <><ErrorBanner message={error} /><Spinner label="Loading…" /></>;
  const visited = places.filter((p) => p.status === "visited").sort((a, b) => (b.visited_on ?? "").localeCompare(a.visited_on ?? ""));
  const wish = places.filter((p) => p.status === "wishlist");

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />
      <Card className="flex flex-wrap items-center gap-8">
        <div className="relative"><Ring percent={stats.percent_visited} /></div>
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold">{t("progress")}</h1>
          <p>{stats.visited} / {stats.total_places} · ⭐ {stats.wishlist} {t("wishlist")}</p>
          <p>{stats.divisions_visited.length} / {stats.divisions_total} {t("divisions")}</p>
          {stats.average_rating !== null && <p className="flex items-center gap-2"><Stars value={Math.round(stats.average_rating)} readOnly /> {stats.average_rating}</p>}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold mb-3">{t("divisions")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.by_division).map(([d, v]) => (
              <div key={d} className={`${v.visited ? "neu-in-sm" : "neu-sm"} p-3`}>
                <p className="font-semibold text-sm">{v.visited ? "✅" : "▫️"} {d}</p>
                <p className="text-xs text-muted mb-1">{v.visited}/{v.total}</p><ProgressBar value={v.visited} total={v.total} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-bold mb-3">{t("categories")}</h2>
          <ul className="space-y-3">
            {Object.entries(stats.by_category).filter(([, v]) => v.total > 0).map(([c, v]) => (
              <li key={c}><p className="text-sm mb-1">{cat(c).emoji} {cat(c).label} <span className="text-muted">({v.visited}/{v.total})</span></p><ProgressBar value={v.visited} total={v.total} /></li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="font-bold mb-3">🏅 {t("badges")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.badges.map((b) => (
            <li key={b.id} className={`${b.earned ? "neu" : "neu-in"} p-4 text-center`} style={{ opacity: b.earned ? 1 : 0.7 }}>
              <p className="text-3xl" aria-hidden>{b.earned ? "🏅" : "🔒"}</p>
              <p className="font-bold text-sm">{b.label}</p><p className="text-xs text-muted">{b.detail}</p>
            </li>
          ))}
        </ul>
      </Card>

      {[{ title: `✅ ${t("visited")}`, list: visited }, { title: `⭐ ${t("wishlist")}`, list: wish }].map((sec) => (
        <Card key={sec.title}>
          <h2 className="font-bold mb-3">{sec.title} ({sec.list.length})</h2>
          {sec.list.length === 0 ? <p className="text-muted">{t("empty")} <Link className="underline text-accent" href="/">{t("explore")}</Link></p> : (
            <ul className="grid gap-3 md:grid-cols-2">
              {sec.list.map((p) => (
                <li key={p.id}><Link href={`/place/${p.id}`} className="neu-sm p-3 flex gap-3 items-start">
                  <span className="text-2xl" aria-hidden>{cat(p.category).emoji}</span>
                  <span className="flex-1 min-w-0"><span className="block font-semibold">{name(p)}</span>
                    <span className="block text-xs text-muted">{p.visited_on ? new Date(`${p.visited_on}T00:00:00`).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB") : p.district}</span>
                    {p.rating && <Stars value={p.rating} readOnly />}
                    {p.note && <span className="block text-sm mt-1">“{p.note}”</span>}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
