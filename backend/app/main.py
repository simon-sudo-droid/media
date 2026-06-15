import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api.routes import ai, auth, challenges, content, dashboard, quizzes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("editmentor")

app = FastAPI(
    title="EditMentor AI API",
    version="1.0.0",
    description="AI-powered platform that helps video editors become world-class.",
)

# When CORS_ORIGINS is "*", allow any origin. The app authenticates with a
# Bearer token (not cookies), so credentials can be disabled — which is what
# the spec requires when using the "*" wildcard.
_allow_all = settings.cors_origins_list == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else settings.cors_origins_list,
    allow_credentials=not _allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Import models so they register with the metadata, then create tables.
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    from app.seed import run_seed

    run_seed()
    logger.info("EditMentor AI API ready. AI provider=%s", settings.AI_PROVIDER)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "ai_provider": settings.AI_PROVIDER}


app.include_router(auth.router)
app.include_router(content.router)
app.include_router(quizzes.router)
app.include_router(challenges.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
