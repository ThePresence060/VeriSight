"""News Fetcher — retrieves articles from RSS feeds and NewsAPI."""

import logging
from datetime import datetime
from typing import Optional
import feedparser
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session
from models import Article, Publisher, FetchLog

logger = logging.getLogger(__name__)


def _extract_image_from_entry(entry) -> Optional[str]:
    """Extract image URL from an RSS feed entry."""
    # 1. Check media:content (common in many feeds)
    media_content = entry.get("media_content", [])
    if media_content and isinstance(media_content, list):
        for media in media_content:
            url = media.get("url", "")
            if url and ("image" in media.get("type", "image") or url.endswith((".jpg", ".jpeg", ".png", ".webp"))):
                return url

    # 2. Check media:thumbnail
    media_thumbnail = entry.get("media_thumbnail", [])
    if media_thumbnail and isinstance(media_thumbnail, list):
        return media_thumbnail[0].get("url", None)

    # 3. Check enclosure (used by many RSS feeds for images)
    enclosures = entry.get("enclosures", [])
    if enclosures:
        for enc in enclosures:
            if "image" in enc.get("type", ""):
                return enc.get("href", enc.get("url", None))

    # 4. Check for image in content/summary HTML
    summary = entry.get("summary", "") or entry.get("description", "")
    if summary and "<img" in summary:
        import re
        match = re.search(r'<img[^>]+src=["\']([^"\'>]+)["\']', summary)
        if match:
            return match.group(1)

    # 5. Check links for image type
    links = entry.get("links", [])
    for link in links:
        if "image" in link.get("type", ""):
            return link.get("href", None)

    return None


def _get_or_create_publisher(session: Session, name: str) -> Publisher:
    """Get existing publisher or create a new one with default reputation."""
    publisher = session.query(Publisher).filter(Publisher.name == name).first()
    if not publisher:
        publisher = Publisher(name=name, reputation_score=0.5, article_count=0)
        session.add(publisher)
        session.flush()
    return publisher


def fetch_rss_feeds(session: Session, feeds: list[str], seen_urls: set[str] = None) -> list[Article]:
    """Fetch articles from configured RSS feeds."""
    if seen_urls is None:
        seen_urls = set()
    articles = []
    for feed_url in feeds:
        try:
            parsed = feedparser.parse(feed_url)
            source_name = parsed.feed.get("title", feed_url.split("/")[2])

            for entry in parsed.entries:
                url = entry.get("link", "")
                if not url:
                    continue

                # Check for duplicates
                if url in seen_urls:
                    continue
                seen_urls.add(url)
                
                existing = session.query(Article).filter(Article.url == url).first()
                if existing:
                    continue

                # Parse publication date
                pub_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        pub_date = datetime(*entry.published_parsed[:6])
                    except Exception:
                        pub_date = datetime.utcnow()

                # Get or create publisher
                _get_or_create_publisher(session, source_name)

                # Extract image from feed entry
                image_url = _extract_image_from_entry(entry)

                article = Article(
                    title=entry.get("title", "Untitled"),
                    url=url,
                    author=entry.get("author", None),
                    publisher_name=source_name,
                    image_url=image_url,
                    published_at=pub_date,
                    original_text=entry.get("summary", entry.get("description", "")),
                    status="raw",
                )
                session.add(article)
                articles.append(article)

            logger.info(f"Fetched {len(parsed.entries)} entries from {feed_url}")

        except Exception as e:
            logger.error(f"Failed to fetch RSS feed {feed_url}: {e}")
            continue

    return articles


def fetch_newsapi(session: Session, api_key: str, query: Optional[str] = None, seen_urls: set[str] = None) -> list[Article]:
    """Fetch articles from NewsAPI."""
    if seen_urls is None:
        seen_urls = set()
    if not api_key or api_key == "your_api_key_here":
        logger.warning("NewsAPI key not configured, skipping.")
        return []

    articles = []
    try:
        params = {
            "apiKey": api_key,
            "language": "en",
            "pageSize": 100,
            "sortBy": "publishedAt",
        }
        if query:
            params["q"] = query
        else:
            params["q"] = "news"

        with httpx.Client(timeout=30) as client:
            resp = client.get("https://newsapi.org/v2/everything", params=params)
            resp.raise_for_status()
            data = resp.json()

        for item in data.get("articles", []):
            url = item.get("url", "")
            if not url:
                continue

            if url in seen_urls:
                continue
            seen_urls.add(url)

            existing = session.query(Article).filter(Article.url == url).first()
            if existing:
                continue

            source_name = item.get("source", {}).get("name", "Unknown")
            _get_or_create_publisher(session, source_name)

            pub_date = None
            if item.get("publishedAt"):
                try:
                    pub_date = datetime.fromisoformat(
                        item["publishedAt"].replace("Z", "+00:00")
                    )
                except Exception:
                    pub_date = datetime.utcnow()

            content = item.get("content", "") or item.get("description", "") or ""

            article = Article(
                title=item.get("title", "Untitled"),
                url=url,
                author=item.get("author"),
                publisher_name=source_name,
                image_url=item.get("urlToImage"),
                published_at=pub_date,
                original_text=content,
                status="raw",
            )
            session.add(article)
            articles.append(article)

        logger.info(f"Fetched {len(articles)} articles from NewsAPI")

    except Exception as e:
        logger.error(f"Failed to fetch from NewsAPI: {e}")

    return articles


def run_collection_cycle(session: Session, settings) -> FetchLog:
    """Run a complete news collection cycle from all sources."""
    fetch_log = FetchLog(started_at=datetime.utcnow(), status="running")
    session.add(fetch_log)
    session.flush()

    total_articles = 0
    total_errors = 0
    seen_urls = set()

    try:
        rss_articles = fetch_rss_feeds(session, settings.rss_feeds, seen_urls)
        total_articles += len(rss_articles)
        session.commit()
    except Exception as e:
        session.rollback()
        total_errors += 1
        logger.error(f"RSS collection error: {e}")

    try:
        api_articles = fetch_newsapi(session, settings.news_api_key, None, seen_urls)
        total_articles += len(api_articles)
        session.commit()
    except Exception as e:
        session.rollback()
        total_errors += 1
        logger.error(f"NewsAPI collection error: {e}")

    fetch_log.completed_at = datetime.utcnow()
    fetch_log.articles_fetched = total_articles
    fetch_log.errors_count = total_errors
    fetch_log.status = "completed" if total_errors == 0 else "completed_with_errors"

    session.commit()
    logger.info(
        f"Collection cycle completed: {total_articles} articles, {total_errors} errors"
    )
    return fetch_log
