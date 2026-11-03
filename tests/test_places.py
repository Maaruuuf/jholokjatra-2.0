
import httpx

from app.destinations import DESTINATIONS, resolve
from app.main import app
from app.pipeline import run_plan
from app.places import CATEGORIES, DIVISIONS, PLACES
from app.schemas import PlanRequest


def test_place_data_integrity():
    assert len(PLACES) >= 30
    for p in PLACES.values():
        assert p.category in CATEGORIES and p.division in DIVISIONS, p.id
        assert 20.5 <= p.lat <= 26.7 and 88.0 <= p.lon <= 92.7, f"{p.id} outside Bangladesh"
        assert p.description and p.name_bn, p.id
    assert set(DIVISIONS) == {p.division for p in PLACES.values()}, "every division should have a place"
    assert set(DESTINATIONS) <= set(PLACES), "registry destinations must also be on the map"


def test_resolve_finds_places():
    assert resolve("lalbagh_fort").key == "lalbagh_fort"
    assert resolve("I want to see Paharpur Buddhist Vihara").key == "paharpur"
    assert resolve("শাহজালাল মাজার").key == "shah_jalal_dargah"


async def test_plan_works_for_a_curated_place(ctx):
    res = await run_plan(ctx, PlanRequest(destination="lalbagh_fort"))
    assert res.destination_key == "lalbagh_fort" and res.days


async def _client(ctx):
    app.state.ctx = ctx
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t")


async def test_places_api_filters_and_visit_flow(ctx):
    async with await _client(ctx) as c:
        allp = (await c.get("/places", params={"user_id": "u1"})).json()
        assert len(allp) == len(PLACES) and all(p["status"] == "none" for p in allp)
        hist = (await c.get("/places", params={"category": "historical"})).json()
        assert hist and all(p["category"] == "historical" for p in hist)
        assert (await c.get("/places", params={"q": "লালবাগ"})).json()[0]["id"] == "lalbagh_fort"

        r = await c.put("/users/u1/places/lalbagh_fort", json={"status": "visited", "rating": 5, "note": "great"})
        assert r.status_code == 200 and r.json()["status"] == "visited" and r.json()["visited_on"]
        await c.put("/users/u1/places/sajek", json={"status": "wishlist"})
        assert (await c.get("/places", params={"user_id": "u1", "status": "visited"})).json()[0]["id"] == "lalbagh_fort"
        # another user is unaffected
        assert (await c.get("/places/lalbagh_fort", params={"user_id": "u2"})).json()["status"] == "none"

        s = (await c.get("/users/u1/stats")).json()
        assert s["visited"] == 1 and s["wishlist"] == 1 and s["divisions_visited"] == ["Dhaka"]
        assert s["average_rating"] == 5 and any(b["id"] == "first_step" and b["earned"] for b in s["badges"])

        # un-mark
        await c.put("/users/u1/places/lalbagh_fort", json={"status": "none"})
        assert (await c.get("/users/u1/stats")).json()["visited"] == 0

        # validation
        assert (await c.put("/users/u1/places/lalbagh_fort", json={"status": "visited", "rating": 9})).status_code == 422
        assert (await c.put("/users/u1/places/nowhere", json={"status": "visited"})).status_code == 404


async def test_nearby_excludes_visited(ctx):
    async with await _client(ctx) as c:
        base = (await c.get("/places/lalbagh_fort/nearby", params={"user_id": "n1", "radius_km": 30})).json()
        ids = [x["place"]["id"] for x in base]
        assert "ahsan_manzil" in ids and "lalbagh_fort" not in ids
        await c.put("/users/n1/places/ahsan_manzil", json={"status": "visited"})
        after = [x["place"]["id"] for x in (await c.get("/places/lalbagh_fort/nearby", params={"user_id": "n1", "radius_km": 30})).json()]
        assert "ahsan_manzil" not in after


async def test_compare_ranks_places(ctx, world):
    world.storm_offset = None
    async with await _client(ctx) as c:
        r = await c.post("/compare", json={"places": ["sajek", "lalbagh_fort", "nowhere"]})
        assert r.status_code == 200
        rows = r.json()["ranking"]
        assert rows[-1]["error"] == "unknown place"
        assert rows[0]["go_days"] == 7 and rows[0]["best_day"]
        assert (await c.post("/compare", json={"places": ["sajek"]})).status_code == 422  # need >= 2
        past = await c.post("/compare", json={"places": ["sajek", "kuakata"], "start_date": "2020-01-01", "end_date": "2020-01-02"})
        assert past.status_code == 422


async def test_cors_allows_nextjs_origin(ctx):
    async with await _client(ctx) as c:
        r = await c.options("/places", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"})
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
