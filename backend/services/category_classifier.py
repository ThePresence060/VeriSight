"""Category Classifier — assigns topic categories to articles using zero-shot classification."""

import logging
from transformers import pipeline

logger = logging.getLogger(__name__)

# Available categories
CATEGORIES = [
    "politics",
    "technology",
    "health",
    "business",
    "sports",
    "entertainment",
    "science",
    "world news",
]

# Lazy-loaded classifier
_classifier = None


def _get_classifier():
    """Lazy load the zero-shot classification pipeline."""
    global _classifier
    if _classifier is None:
        logger.info("Loading zero-shot classification model...")
        _classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=-1,  # CPU
        )
        logger.info("Classification model loaded.")
    return _classifier


def classify_article(text: str, confidence_threshold: float = 0.6) -> dict:
    """
    Classify article text into one or more categories.
    
    Returns:
        {
            "category": str,
            "confidence": float,
            "is_uncertain": bool,
            "all_scores": dict[str, float]
        }
    """
    if not text or len(text.strip()) < 20:
        return {
            "category": "uncategorized",
            "confidence": 0.0,
            "is_uncertain": True,
            "all_scores": {},
        }

    try:
        classifier = _get_classifier()

        # Truncate text for efficiency (first 512 chars)
        truncated = text[:512]

        result = classifier(truncated, CATEGORIES, multi_label=False)

        top_category = result["labels"][0]
        top_score = result["scores"][0]
        is_uncertain = top_score < confidence_threshold

        all_scores = {
            label: round(score, 4)
            for label, score in zip(result["labels"], result["scores"])
        }

        return {
            "category": top_category,
            "confidence": round(top_score, 4),
            "is_uncertain": is_uncertain,
            "all_scores": all_scores,
        }

    except Exception as e:
        logger.error(f"Classification failed: {e}")
        return {
            "category": "uncategorized",
            "confidence": 0.0,
            "is_uncertain": True,
            "all_scores": {},
        }
