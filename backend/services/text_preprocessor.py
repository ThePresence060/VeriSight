"""Text Preprocessor — cleans HTML, normalizes text, extracts keywords."""

import re
import logging
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import TfidfVectorizer

logger = logging.getLogger(__name__)

# Shared TF-IDF vectorizer for keyword extraction
_tfidf = TfidfVectorizer(max_features=500, stop_words="english")


def clean_text(html_text: str) -> str:
    """Remove HTML tags, normalize whitespace and encoding."""
    if not html_text:
        return ""

    # Strip HTML
    soup = BeautifulSoup(html_text, "html.parser")
    text = soup.get_text(separator=" ")

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # Remove special characters but keep punctuation
    text = re.sub(r"[^\w\s.,!?;:'\"-]", "", text)

    return text


def extract_keywords(text: str, top_n: int = 15) -> list[str]:
    """Extract top keywords using TF-IDF scoring."""
    if not text or len(text.split()) < 5:
        return []

    try:
        tfidf_matrix = _tfidf.fit_transform([text])
        feature_names = _tfidf.get_feature_names_out()
        scores = tfidf_matrix.toarray()[0]

        # Get top-N keywords by score
        keyword_scores = sorted(
            zip(feature_names, scores), key=lambda x: x[1], reverse=True
        )
        return [kw for kw, score in keyword_scores[:top_n] if score > 0]

    except Exception as e:
        logger.error(f"Keyword extraction failed: {e}")
        return []


def preprocess_article(article) -> bool:
    """
    Clean and extract keywords for an article.
    Returns True if successful, False otherwise.
    Updates the article object in-place.
    """
    try:
        # Clean text
        cleaned = clean_text(article.original_text or "")
        article.cleaned_text = cleaned

        # Also clean title for keyword extraction
        cleaned_title = clean_text(article.title or "")
        full_text = f"{cleaned_title} {cleaned}"

        # Extract keywords
        article.keywords = extract_keywords(full_text)

        article.status = "preprocessed"
        return True

    except Exception as e:
        logger.error(f"Preprocessing failed for article {article.id}: {e}")
        article.status = "error"
        article.error_message = f"Preprocessing error: {str(e)}"
        return False
