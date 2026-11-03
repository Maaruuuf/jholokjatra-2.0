"""Rank several places for the same dates using the deterministic scoring (no LLM, so it is cheap and fast)."""
from __future__ import annotations

import asyncio
import datetime as dt

from .context import AppContext
from .data import gather_data
from .destinations import resolve
from .memory.prefs import load_prefs
from .schemas import CompareRequest, CompareResponse, CompareRow, Verdict
from .scoring import assess_all, pick_best, scales_from
from .tools.registry import today_dhaka


async def compare_places(ctx: AppContext, req: CompareRequest) -> CompareResponse:
    today = today_dhaka()
    start = max(req.start_date or today, today)
    end = min(req.end_date or start + dt.timedelta(days=6), today + dt.timedelta(days=15))
    if start > end:
        raise ValueError("Dates are outside the 16-day forecast window (today to +15 days).")
    days = [start + dt.timedelta(n) for n in range((end - start).days + 1)]
    prefs = load_prefs(req.user_id)
    if req.risk_tolerance:
        prefs.risk_tolerance = req.risk_tolerance
    scales = scales_from(prefs)
    sem = asyncio.Semaphore(3)  # be polite to the free APIs

    async def one(pid: str) -> CompareRow:
        dest = resolve(pid)
        if not dest:
            return CompareRow(place_id=pid, name=pid, error="unknown place")
        try:
            async with sem:
                bundle = await gather_data(ctx.http, dest, start, end, today)
        except Exception as exc:  # noqa: BLE001  one failing place must not sink the comparison
            return CompareRow(place_id=pid, name=dest.name, error=f"{type(exc).__name__}: {str(exc)[:100]}")
        verdicts = assess_all(days, bundle, scales)
        best, _ = pick_best(verdicts, 1)
        worst = next((r for v in verdicts if v.verdict == Verdict.AVOID for r in v.reasons[:1]), None)
        return CompareRow(
            place_id=pid, name=dest.name, best_day=best[0] if best else None,
            go_days=sum(v.verdict == Verdict.GO for v in verdicts),
            caution_days=sum(v.verdict == Verdict.CAUTION for v in verdicts),
            avoid_days=sum(v.verdict == Verdict.AVOID for v in verdicts),
            average_score=round(sum(v.score for v in verdicts) / len(verdicts), 1),
            top_risk=worst.message if worst else "")

    rows = await asyncio.gather(*(one(p) for p in req.places))
    rows.sort(key=lambda r: (r.error is not None, -r.go_days, -r.average_score))
    return CompareResponse(start_date=start, end_date=end, ranking=rows)
