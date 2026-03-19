"""Scheduler — runs news collection and processing on a timed interval."""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from services.news_fetcher import run_collection_cycle
from services.pipeline import run_processing_pipeline
from config import settings

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def scheduled_fetch_and_process():
    """Scheduled job: fetch new articles then process them."""
    logger.info("Starting scheduled fetch and process cycle...")
    session = SessionLocal()
    try:
        # Step 1: Fetch new articles
        fetch_log = run_collection_cycle(session, settings)
        logger.info(
            f"Fetch complete: {fetch_log.articles_fetched} articles, "
            f"{fetch_log.errors_count} errors"
        )

        # Step 2: Process all raw articles
        run_processing_pipeline(session)

    except Exception as e:
        logger.error(f"Scheduled cycle failed: {e}")
    finally:
        session.close()


def start_scheduler():
    """Start the background scheduler."""
    scheduler.add_job(
        scheduled_fetch_and_process,
        "interval",
        hours=settings.fetch_interval_hours,
        id="news_fetch_cycle",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        f"Scheduler started — running every {settings.fetch_interval_hours} hours"
    )


def stop_scheduler():
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")
