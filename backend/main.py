"""GenNews Backend — FastAPI Application Entry Point."""

import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning)

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import articles, clusters, publishers, health
from services.scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("🚀 Starting GenNews Backend...")

    # Initialize database tables
    init_db()
    logger.info("✅ Database initialized")

    # Start the scheduler
    start_scheduler()
    logger.info("✅ Scheduler started")

    yield

    # Shutdown
    stop_scheduler()
    logger.info("🛑 GenNews Backend shut down")


# Create FastAPI app
app = FastAPI(
    title="GenNews API",
    description=(
        "AI-powered news aggregation platform for evaluating story credibility and coverage. "
        "Aggregates news from multiple sources, performs AI analysis, clusters similar stories, "
        "and generates credibility scores with risk indicators."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(articles.router)
app.include_router(clusters.router)
app.include_router(publishers.router)
app.include_router(health.router)


@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "name": "GenNews API",
        "version": "1.0.0",
        "description": "AI-powered news credibility platform",
        "docs": "/docs",
        "endpoints": {
            "articles": "/api/articles",
            "clusters": "/api/clusters",
            "publishers": "/api/publishers",
            "health": "/api/health",
            "stats": "/api/stats",
            "fetch": "POST /api/fetch",
        },
    }
