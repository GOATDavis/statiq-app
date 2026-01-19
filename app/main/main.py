from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes.dashboard import router as dashboard_router
from app.api.v1.routes.search import router as search_router
from app.api.v1.routes.players import router as players_router
from app.api.v1.routes.games import router as games_router, ml_router
from app.api.v1.routes.scores import router as scores_router
from app.api.v1.routes.playoff_bracket import router as playoff_bracket_router
from app.api.v1.routes.moderation import router as moderation_router

app = FastAPI(title="StatIQ API", version="1.0.0")

# CORS (allows your frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(search_router)
app.include_router(players_router)
app.include_router(games_router)
app.include_router(ml_router)  # ML prediction endpoints (no /api/v1 prefix)
app.include_router(scores_router)
app.include_router(playoff_bracket_router)
app.include_router(moderation_router)

@app.get("/health")
def health():
    return {"status": "ok"}
