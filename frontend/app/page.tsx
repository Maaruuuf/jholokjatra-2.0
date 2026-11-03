"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { CATEGORY } from "@/lib/i18n";
import type { Place, UserPlaceUpdate, UserStats } from "@/lib/types";
import PlaceDrawer from "@/components/PlaceDrawer";
import { Chip, ErrorBanner, ProgressBar, Spinner } from "@/components/ui";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false, loading: () => <div className="h-full grid place-items-center text-muted">Loading map…</div>,
});

type StatusFilter = "all" | "visited" | "wishlist" | "none";

export default function ExplorePage() {
  const { t, name, cat, userId, ready } = useApp();
  const [places, setPlaces] = useState<Place[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(() => { api.stats(userId).then(setStats).catch(() => undefined); }, [userId]);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    api.places(userId).then(setPlaces).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
    refreshStats();
  }, [ready, userId, refreshStats]);

  const update = useCallback(async (id: string, body: UserPlaceUpdate) => {
    try {
      const p = await api.updatePlace(userId, id, body);
      setPlaces((prev) => prev.map((x) => (x.id === id ? p : x)));
      refreshStats();
    } catch (e) { setError((e as Error).message); }
  }, [userId, refreshStats]);

  const filtered = useMemo(() => {
    const n = query.trim().toLowerCase();
    return places.filter((p) =>
      (category === "all" || p.category === category) &&
      (status === "all" || p.status === status) &&
      (!n || p.name.toLowerCase().includes(n) || p.name_bn.includes(n) || p.district.toLowerCase().includes(n)));
  }, [places, query, category, status]);

  const selected = places.find((p) => p.id === selectedId) ?? null;
  const statusOpts: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("all") }, { key: "visited", label: `✓ ${t("visited")}` },
    { key: "wishlist", label: `★ ${t("wishlist")}` }, { key: "none", label: t("notVisited") },
  ];

  return (
    <>
      <ErrorBanner message={error} onClose={() => setError(null)} />
      {stats && (
        <div className="neu p-4 mb-3 grid gap-2 md:grid-cols-[auto_1fr] md:items-center">
          <p className="font-bold">{t("progress")}: {stats.visited}/{stats.total_places} · {stats.divisions_visited.length}/{stats.divisions_total} {t("divisions")}</p>
          <ProgressBar value={stats.visited} total={stats.total_places} />
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-[380px_1fr] lg:h-[calc(100vh-210px)] lg:min-h-[520px]">
        {/* list panel */}
        <section className="neu p-4 flex flex-col gap-3 min-h-0 order-2 lg:order-1" aria-label="Places">
          <input className="neu-input" type="search" placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t("search")} />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category filter">
            <Chip pressed={category === "all"} onClick={() => setCategory("all")}>{t("all")}</Chip>
            {Object.keys(CATEGORY).map((c) => (
              <Chip key={c} pressed={category === c} onClick={() => setCategory(c)}>{cat(c).emoji} {cat(c).label}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
            {statusOpts.map((o) => <Chip key={o.key} pressed={status === o.key} onClick={() => setStatus(o.key)}>{o.label}</Chip>)}
          </div>
          <ul className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1 pb-2 min-h-[200px]">
            {loading && <li><Spinner label="Loading places…" /></li>}
            {!loading && filtered.length === 0 && <li className="text-muted p-2">{t("empty")}</li>}
            {filtered.map((p) => (
              <li key={p.id}>
                <button onClick={() => setSelectedId(p.id)} aria-pressed={p.id === selectedId}
                  className={`w-full text-left p-3 ${p.id === selectedId ? "neu-in-sm" : "neu-sm"} flex gap-3 items-center`}>
                  <span className="text-2xl" aria-hidden>{cat(p.category).emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{name(p)}</span>
                    <span className="block text-xs text-muted truncate">{p.district} · {cat(p.category).label}</span>
                  </span>
                  <span className="text-sm shrink-0" aria-label={p.status}>
                    {p.status === "visited" ? "✅" : p.status === "wishlist" ? "⭐" : p.must_visit ? "✨" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* map */}
        <section className="relative neu overflow-hidden h-[60vh] lg:h-auto order-1 lg:order-2" aria-label="Map">
          <div className="absolute inset-2 rounded-[18px] overflow-hidden neu-in">
            <MapView places={filtered} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          {selected && (
            <div className="absolute z-[500] left-3 right-3 bottom-3 md:left-auto md:right-4 md:top-4 md:bottom-4 md:w-[340px] max-h-[75%] md:max-h-none">
              <PlaceDrawer place={selected} onClose={() => setSelectedId(null)} onUpdate={update} />
            </div>
          )}
        </section>
      </div>
      <p className="text-xs text-muted mt-3">{t("advisory")}</p>
    </>
  );
}
