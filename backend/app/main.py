from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routers import admin, auth, wellbeing
from app.core.config import get_settings
from app.database.seed import seed_development_data
from app.database.session import Base, SessionLocal, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    if get_settings().environment == "development":
        with SessionLocal() as db:
            seed_development_data(db)
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0", description="AI-assisted wellbeing and early-support API. It is not a diagnostic service.", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=False, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type"])
app.include_router(auth.router)
app.include_router(wellbeing.router)
app.include_router(admin.router)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=(self)"
    if settings.environment == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.get("/health", tags=["Operations"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "sentinel-api"}


@app.exception_handler(Exception)
async def unhandled_exception(_, __: Exception) -> JSONResponse:
    # Preserve details in server logs in production; clients get no stack trace.
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred"})
