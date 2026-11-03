from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from .. import visits
from ..compare import compare_places
from ..context import AppContext
from ..places import CATEGORIES, DIVISIONS, PLACES
from ..schemas import CompareRequest, CompareResponse, NearbyPlace, PlaceOut, UserPlaceUpdate, UserStats
from .routes import get_ctx

router = APIRouter()


def _place(place_id: str):
    if place_id not in PLACES:
        raise HTTPException(404, "Unknown place")
    return PLACES[place_id]


@router.get("/places/meta")
async def places_meta():
    return {"categories": list(CATEGORIES), "divisions": list(DIVISIONS), "total": len(PLACES)}


@router.get("/places", response_model=list[PlaceOut])
async def list_places(category: Optional[str] = None, division: Optional[str] = None, q: Optional[str] = None,
                      must_visit: Optional[bool] = None, status: Optional[str] = None,
                      user_id: Optional[str] = Query(None, max_length=64)):
    ent = visits.entries(user_id) if user_id else {}
    needle = (q or "").strip().lower()
    out = []
    for p in PLACES.values():
        if category and p.category != category:
            continue
        if division and p.division != division:
            continue
        if must_visit is not None and p.must_visit != must_visit:
            continue
        if needle and needle not in p.name.lower() and needle not in p.name_bn and needle not in p.district.lower():
            continue
        item = visits.to_out(p, ent.get(p.id))
        if status and item.status != status:
            continue
        out.append(item)
    return out


@router.get("/places/{place_id}", response_model=PlaceOut)
async def get_place(place_id: str, user_id: Optional[str] = None):
    p = _place(place_id)
    return visits.to_out(p, visits.entries(user_id).get(place_id) if user_id else None)


@router.get("/places/{place_id}/nearby", response_model=list[NearbyPlace])
async def nearby(place_id: str, user_id: str = "default", radius_km: float = Query(120, gt=0, le=500)):
    _place(place_id)
    return visits.nearby_unvisited(user_id, place_id, radius_km)


@router.put("/users/{user_id}/places/{place_id}", response_model=PlaceOut)
async def update_user_place(user_id: str, place_id: str, body: UserPlaceUpdate):
    _place(place_id)
    if len(user_id) > 64:
        raise HTTPException(422, "user_id too long")
    return visits.set_entry(user_id, place_id, body)


@router.get("/users/{user_id}/stats", response_model=UserStats)
async def user_stats(user_id: str):
    return visits.stats(user_id)


@router.post("/compare", response_model=CompareResponse)
async def compare(body: CompareRequest, ctx: AppContext = Depends(get_ctx)):
    try:
        return await compare_places(ctx, body)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
