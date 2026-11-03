import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .api.places_routes import router as places_router
from .api.routes import router
from .config import get_settings
from .context import AppContext
from .llm.router import LLMRouter


@asynccontextmanager
async def lifespan(app: FastAPI):
    s = get_settings()
    logging.basicConfig(level=s.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    async with httpx.AsyncClient(headers={"User-Agent": s.http_user_agent}, follow_redirects=True,
                                 limits=httpx.Limits(max_connections=20)) as client:
        app.state.ctx = AppContext(settings=s, http=client, llm=LLMRouter(client, s))
        logging.getLogger("jholokjatra").info("LLM providers active: %s", app.state.ctx.llm.active() or "none")
        yield


app = FastAPI(title="JholokJatra", version=__version__,
              description="Evidence-cited 'best day to go' agent for Bangladesh travel, built on free public APIs.",
              lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_list, allow_methods=["*"], allow_headers=["*"])
app.include_router(router)
app.include_router(places_router)
