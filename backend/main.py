import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from routers.zones import router as zones_router
from routers.records import router as records_router

from database import Base, SessionLocal, engine
from models import User  # noqa: F401 – import so Base.metadata sees it
import models  # noqa: F401 – ensure all models are registered
from security import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables and seed the admin user."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Seed a test user if the table is empty
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin = User(
                username="admin",
                password_hash=hash_password("admin123"),
            )
            db.add(admin)
            db.commit()
            print("✅ Seeded admin user (username: admin, password: admin123)")
        else:
            print("ℹ️  Admin user already exists, skipping seed.")
    finally:
        db.close()

    yield  # App runs here


app = FastAPI(
    title="Route53 Clone API",
    description="A functional clone of the AWS Route53 backend API",
    version="0.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the frontend to make credentialed requests
# ---------------------------------------------------------------------------
_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in _cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(zones_router)
app.include_router(records_router)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
