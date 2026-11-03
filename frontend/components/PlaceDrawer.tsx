"use client";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import type { Place, UserPlaceUpdate } from "@/lib/types";
import StatusControls from "./StatusControls";

export default function PlaceDrawer({ place, onClose, onUpdate }:
  { place: Place; onClose: () => void; onUpdate: (id: string, b: UserPlaceUpdate) => Promise<void> }) {
  const { t, name, cat, lang } = useApp();
  const c = cat(place.category);
  return (
    <aside className="neu p-4 space-y-3 max-h-full overflow-y-auto" aria-label={name(place)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold leading-tight">{name(place)}</h2>
          <p className="text-sm text-muted">{lang === "bn" ? place.name : place.name_bn}</p>
        </div>
        <button className="neu-btn !px-3 !py-1" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="badge">{c.emoji} {c.label}</span>
        <span className="badge">📍 {place.district}, {place.division}</span>
        {place.must_visit && <span className="badge" style={{ color: "var(--caution)" }}>⭐ {t("mustVisit")}</span>}
        {place.unesco && <span className="badge" style={{ color: "var(--accent)" }}>🌐 {t("unesco")}</span>}
      </div>
      <p className="text-sm leading-relaxed">{place.description}</p>
      {place.best_season && <p className="text-sm"><span className="text-muted">{t("bestSeason")}: </span>{place.best_season}</p>}
      <StatusControls place={place} onUpdate={(b) => onUpdate(place.id, b)} />
      <Link href={`/place/${place.id}`} className="neu-btn neu-btn-primary block text-center">🌦️ {t("bestDays")}</Link>
    </aside>
  );
}
