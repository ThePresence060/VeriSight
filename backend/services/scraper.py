"""Scraper Service — fetches full article content from URLs."""

import logging
import httpx
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

def fetch_full_content(url: str) -> str:
    """
    Attempt to fetch and extract the main article text from a URL.
    This is a basic heuristic-based scraper.
    """
    if not url:
        return ""

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        with httpx.Client(timeout=10, follow_redirects=True, headers=headers) as client:
            resp = client.get(url)
            resp.raise_for_status()
            html = resp.text

        soup = BeautifulSoup(html, "html.parser")

        # 1. Remove script, style, nav, footer tags
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # 2. Try common content containers
        content = None
        # Common class names for article content
        containers = soup.find_all(class_=re.compile(r"article-body|post-content|entry-content|main-content|story-body", re.I))
        if containers:
            content = " ".join([c.get_text(separator=" ", strip=True) for c in containers])
        else:
            # Fallback to <article> tag
            article_tag = soup.find("article")
            if article_tag:
                content = article_tag.get_text(separator=" ", strip=True)
            else:
                # Last resort: body text
                content = soup.body.get_text(separator=" ", strip=True) if soup.body else ""

        # 3. Clean up
        content = re.sub(r"\s+", " ", content).strip()
        
        # If the content is too short (likely failed to find container), return empty
        if len(content) < 200:
            return ""

        return content

    except Exception as e:
        logger.error(f"Failed to scrape {url}: {e}")
        return ""
