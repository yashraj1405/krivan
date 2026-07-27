from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.models.base import Base
from app.routers.v1 import api_router
from app.middleware.logging import LoggingMiddleware
from app.exceptions.handler import register_exception_handlers
from app.services.auth import AuthService



app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API services supporting Fertilizer Product Traceability and QR Verification.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

from fastapi.staticfiles import StaticFiles

# Custom Logging Middleware
app.add_middleware(LoggingMiddleware)

# Mount static folder for QR images hosting
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup CORS Policies
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register exceptions handler
register_exception_handlers(app)

# Include APIs
app.include_router(api_router, prefix=settings.API_V1_STR)

# Public verification endpoint (no authentication required)
from app.routers.verification import router as verification_router
app.include_router(verification_router, prefix="/verify", tags=["Public Verification"])


@app.on_event("startup")
def startup_hooks() -> None:
    """
    Execute app startup tasks (e.g. database admin user seeding).
    """
    import logging
    logger = logging.getLogger("APIRequestLogger")
    try:
        # Create database tables if they do not exist
        Base.metadata.create_all(bind=engine)
        
        db = SessionLocal()
        try:
            auth_service = AuthService(db)
            auth_service.seed_superuser_if_not_exists()
        finally:
            db.close()
    except Exception as e:
        logger.warning(
            f"Database initialization deferred. Reason: Connection failed: {str(e)}"
        )


from fastapi.responses import RedirectResponse


@app.get("/", tags=["Root"])
def read_root() -> dict:
    return {
        "project": settings.PROJECT_NAME,
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "online"
    }


@app.get("/docs", include_in_schema=False)
def redirect_to_docs():
    return RedirectResponse(url=f"{settings.API_V1_STR}/docs")


@app.get("/redoc", include_in_schema=False)
def redirect_to_redoc():
    return RedirectResponse(url=f"{settings.API_V1_STR}/redoc")
