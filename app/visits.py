"""Per-user visited/wishlist state, ratings, stats and badges (SQLite)."""
from __future__ import annotations

import time

from .db import db
from .geo import haversine_km
from .places import CATEGORIES, DIVISIONS, HISTORY_CATEGORIES, PLACES, PlaceInfo
from .schemas import Badge, NearbyPlace, PlaceOut, UserPlaceUpdate, UserStats
from .tools.registry import today_dhaka


def to_out(p: PlaceInfo, entry: dict | None = None) -> PlaceOut:
    e = entry or {}
    return PlaceOut(id=p.id, name=p.name, name_bn=p.name_bn, category=p.category, division=p.division,
                    district=p.district, lat=p.lat, lon=p.lon, description=p.description, best_season=p.best_season,
                    unesco=p.unesco, must_visit=p.must_visit, status=e.get("status", "none"),
                    visited_on=e.get("visited_on"), rating=e.get("rating"), note=e.get("note") or "")


def entries(user_id: str) -> dict[str, dict]:
    with db() as c:
        rows = c.execute("SELECT place_id, status, visited_on, rating, note FROM user_places WHERE user_id=?",
                         (user_id,)).fetchall()
    return {r["place_id"]: dict(r) for r in rows}


def set_entry(user_id: str, place_id: str, upd: UserPlaceUpdate) -> PlaceOut:
    place = PLACES[place_id]
    with db() as c:
        if upd.status == "none":
            c.execute("DELETE FROM user_places WHERE user_id=? AND place_id=?", (user_id, place_id))
        else:
            visited_on = (upd.visited_on or today_dhaka()).isoformat() if upd.status == "visited" else None
            c.execute("INSERT OR REPLACE INTO user_places(user_id,place_id,status,visited_on,rating,note,updated_at) "
                      "VALUES (?,?,?,?,?,?,?)",
                      (user_id, place_id, upd.status, visited_on, upd.rating, upd.note, time.time()))
    return to_out(place, entries(user_id).get(place_id))


def stats(user_id: str) -> UserStats:
    ent = entries(user_id)
    visited_ids = [pid for pid, e in ent.items() if e["status"] == "visited" and pid in PLACES]
    wishlist = sum(1 for e in ent.values() if e["status"] == "wishlist")
    by_cat = {c: {"visited": 0, "total": 0} for c in CATEGORIES}
    by_div = {d: {"visited": 0, "total": 0} for d in DIVISIONS}
    for p in PLACES.values():
        by_cat[p.category]["total"] += 1
        by_div[p.division]["total"] += 1
        if p.id in visited_ids:
            by_cat[p.category]["visited"] += 1
            by_div[p.division]["visited"] += 1
    divisions_visited = [d for d, v in by_div.items() if v["visited"]]
    ratings = [e["rating"] for e in ent.values() if e.get("rating") and e["status"] == "visited"]
    n = len(visited_ids)
    vp = [PLACES[i] for i in visited_ids]
    history = sum(1 for p in vp if p.category in HISTORY_CATEGORIES)
    coast = sum(1 for p in vp if p.category in ("beach", "island"))
    unesco_total = sum(1 for p in PLACES.values() if p.unesco)
    unesco_seen = sum(1 for p in vp if p.unesco)
    badges = [
        Badge(id="first_step", label="First Step", detail="Mark your first visited place", earned=n >= 1),
        Badge(id="explorer", label="Explorer", detail="Visit 5 places", earned=n >= 5),
        Badge(id="division_hopper", label="Division Hopper", detail="Visit places in 4 divisions", earned=len(divisions_visited) >= 4),
        Badge(id="all_divisions", label="Eight Divisions", detail="Visit a place in all 8 divisions", earned=len(divisions_visited) == len(DIVISIONS)),
        Badge(id="history_buff", label="History Buff", detail="Visit 5 historical, religious or museum places", earned=history >= 5),
        Badge(id="coast_lover", label="Coast Lover", detail="Visit 3 beaches or islands", earned=coast >= 3),
        Badge(id="unesco", label="World Heritage", detail=f"Visit all {unesco_total} UNESCO places", earned=unesco_seen == unesco_total > 0),
    ]
    return UserStats(visited=n, wishlist=wishlist, total_places=len(PLACES),
                     percent_visited=round(100 * n / len(PLACES), 1), divisions_visited=divisions_visited,
                     divisions_total=len(DIVISIONS), by_category=by_cat, by_division=by_div,
                     average_rating=round(sum(ratings) / len(ratings), 2) if ratings else None, badges=badges)


def nearby_unvisited(user_id: str, place_id: str, radius_km: float, limit: int = 8) -> list[NearbyPlace]:
    origin = PLACES[place_id]
    ent = entries(user_id)
    out = []
    for p in PLACES.values():
        if p.id == origin.id or ent.get(p.id, {}).get("status") == "visited":
            continue
        d = haversine_km(origin.lat, origin.lon, p.lat, p.lon)
        if d <= radius_km:
            out.append(NearbyPlace(place=to_out(p, ent.get(p.id)), distance_km=round(d, 1)))
    return sorted(out, key=lambda x: x.distance_km)[:limit]
