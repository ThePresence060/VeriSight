"""Health Check & Operations Router — system status and manual triggers."""

import logging
from threading import Thread
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import Article, StoryCluster, FetchLog
from services.llm_analyzer import check_ollama_status
from services.scheduler import scheduler
from schemas import HealthCheck, FetchTriggerResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["System"])


@router.get("/health", response_model=HealthCheck)
def health_check(db: Session = Depends(get_db)):
    """Check the health of all system components."""
    db_status = "healthy"
    total_articles = 0
    total_clusters = 0
    try:
        total_articles = db.query(func.count(Article.id)).scalar() or 0
        total_clusters = db.query(func.count(StoryCluster.id)).scalar() or 0
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    ollama_ok = check_ollama_status()
    ollama_status = "healthy" if ollama_ok else "unavailable"

    scheduler_status = "running" if scheduler.running else "stopped"

    last_fetch = None
    try:
        fetch_log = db.query(FetchLog).order_by(FetchLog.completed_at.desc()).first()
        if fetch_log:
            last_fetch = fetch_log.completed_at
    except Exception:
        pass

    return HealthCheck(
        status="healthy" if db_status == "healthy" else "degraded",
        database=db_status,
        ollama=ollama_status,
        scheduler=scheduler_status,
        last_fetch=last_fetch,
        total_articles=total_articles,
        total_clusters=total_clusters,
    )


@router.post("/fetch", response_model=FetchTriggerResponse)
def trigger_fetch():
    """Manually trigger a news fetch and processing cycle."""
    from services.news_fetcher import run_collection_cycle
    from services.pipeline import run_processing_pipeline
    from config import settings

    def _run_cycle():
        session = SessionLocal()
        try:
            run_collection_cycle(session, settings)
            run_processing_pipeline(session)
        except Exception as e:
            logger.error(f"Manual fetch cycle failed: {e}")
        finally:
            session.close()

    thread = Thread(target=_run_cycle, daemon=True)
    thread.start()

    return FetchTriggerResponse(
        message="Fetch and processing cycle started in background.",
        status="started",
    )


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get aggregated platform statistics."""
    total_articles = db.query(func.count(Article.id)).scalar() or 0
    processed = db.query(func.count(Article.id)).filter(Article.status != "raw").scalar() or 0
    errors = db.query(func.count(Article.id)).filter(Article.status == "error").scalar() or 0
    high_risk = db.query(func.count(Article.id)).filter(Article.is_high_risk == True).scalar() or 0
    total_clusters = db.query(func.count(StoryCluster.id)).scalar() or 0

    avg_cred = db.query(func.avg(StoryCluster.credibility_score)).filter(
        StoryCluster.credibility_score.isnot(None)
    ).scalar()

    from models import Publisher
    publisher_count = db.query(func.count(Publisher.id)).scalar() or 0

    recent_fetches = db.query(FetchLog).order_by(FetchLog.started_at.desc()).limit(5).all()
    fetch_list = [
        {
            "id": f.id,
            "started_at": f.started_at.isoformat() if f.started_at else None,
            "completed_at": f.completed_at.isoformat() if f.completed_at else None,
            "articles_fetched": f.articles_fetched,
            "errors_count": f.errors_count,
            "status": f.status,
        }
        for f in recent_fetches
    ]

    return {
        "total_articles": total_articles,
        "processed_articles": processed,
        "error_articles": errors,
        "high_risk_articles": high_risk,
        "total_clusters": total_clusters,
        "average_credibility_score": round(avg_cred, 4) if avg_cred else None,
        "total_publishers": publisher_count,
        "recent_fetch_cycles": fetch_list,
    }
