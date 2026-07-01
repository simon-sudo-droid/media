import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import Base, engine
from app.core.ratelimit import limiter
from app.api.routes import admin, ai, auth, challenges, checklists, content, dashboard, quizzes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("editmentor")

app = FastAPI(
    title="EditMentor AI API",
    version="1.0.0",
    description="AI-powered platform that helps video editors become world-class.",
)

# Rate limiting (slowapi): decorated routes are throttled per client IP.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Reject oversized request bodies early (memory-exhaustion DoS guard).
_MAX_BODY_BYTES = 32 * 1024 * 1024  # 32 MB


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    cl = request.headers.get("content-length")
    if cl and cl.isdigit() and int(cl) > _MAX_BODY_BYTES:
        return JSONResponse({"detail": "Request body too large"}, status_code=413)
    return await call_next(request)

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
    # Fail closed: never run in production with the built-in default secret.
    if not settings.DEBUG and settings.JWT_SECRET.startswith("dev-secret"):
        raise RuntimeError(
            "JWT_SECRET is still the insecure default. Set a strong JWT_SECRET "
            "(or DEBUG=true for local development)."
        )

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
app.include_router(checklists.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
