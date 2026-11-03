from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import get_settings
from src.models.database import init_db
from src.routes import api

settings = get_settings()

app = FastAPI(
    title="SkolarPulse API",
    description="AI-powered research paper Q&A platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/")
def root():
    return {"message": "SkolarPulse API", "version": "1.0.0", "docs": "/docs"}