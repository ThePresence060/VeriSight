from database import SessionLocal
from services.pipeline import run_processing_pipeline
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run():
    session = SessionLocal()
    try:
        logger.info("Starting manual pipeline run...")
        run_processing_pipeline(session)
        logger.info("Manual pipeline run finished.")
    except Exception as e:
        logger.error(f"Pipeline run failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    run()
