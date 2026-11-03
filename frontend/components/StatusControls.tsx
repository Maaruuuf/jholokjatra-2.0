"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import type { Place, UserPlaceUpdate } from "@/lib/types";
import { Button, Stars } from "./ui";

/** Mark visited / wishlist, rating, date and note for one place. */
export default function StatusControls({ place, onUpdate }: { place: Place; onUpdate: (b: UserPlaceUpdate) => Promise<void> }) {
  const { t } = useApp();
  const [rating, setRating] = useState<number | null>(place.rating);
  const [note, setNote] = useState(place.note);
  const [date, setDate] = useState(place.visited_on ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setRating(place.rating); setNote(place.note); setDate(place.visited_on ?? ""); }, [place.id, place.status, place.rating, place.note, place.visited_on]);

  async function run(b: UserPlaceUpdate) { setBusy(true); try { await onUpdate(b); } finally { setBusy(false); } }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button primary active={place.status === "visited"} disabled={busy} aria-pressed={place.status === "visited"}
          onClick={() => run({ status: "visited", rating, note, visited_on: date || null })}>✓ {t("markVisited")}</Button>
        <Button active={place.status === "wishlist"} disabled={busy} aria-pressed={place.status === "wishlist"}
          onClick={() => run({ status: "wishlist" })}>★ {t("addWishlist")}</Button>
        {place.status !== "none" && <Button disabled={busy} onClick={() => run({ status: "none" })}>{t("clear")}</Button>}
      </div>

      {place.status === "visited" && (
        <div className="neu-in-sm p-3 space-y-3">
          <label className="block text-sm">
            <span className="text-muted">{t("visitedOn")}</span>
            <input type="date" className="neu-input mt-1" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div>
            <p className="text-sm text-muted mb-1">{t("rating")}</p>
            <Stars value={rating} onChange={setRating} />
          </div>
          <label className="block text-sm">
            <span className="text-muted">{t("note")}</span>
            <textarea className="neu-input mt-1" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <Button primary disabled={busy} onClick={() => run({ status: "visited", rating, note, visited_on: date || null })}>{t("save")}</Button>
        </div>
      )}
    </div>
  );
}
