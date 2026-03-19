import sys
import logging
import traceback
sys.path.append('.')

from database import SessionLocal
from config import settings
from services.news_fetcher import run_collection_cycle

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    with open("traceback_log.txt", "w", encoding="utf-8") as f:
        session = SessionLocal()
        try:
            f.write("Starting synchronized fetch test...\n")
            fetch_log = run_collection_cycle(session, settings)
            f.write(f"Fetch completed: {fetch_log.articles_fetched} articles, {fetch_log.errors_count} errors. Status: {fetch_log.status}\n")
        except Exception as e:
            f.write(f"Exception during fetch: {e}\n")
            f.write(traceback.format_exc())
            f.write("\n")
        finally:
            session.close()
