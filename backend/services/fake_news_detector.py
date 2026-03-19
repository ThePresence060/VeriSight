"""Fake News Detector — analyzes articles for misinformation indicators."""

import re
import logging

logger = logging.getLogger(__name__)

# Clickbait / sensational patterns
CLICKBAIT_PATTERNS = [
    r"\byou won't believe\b",
    r"\bshocking\b",
    r"\bbreaking\b",
    r"\bexclusive\b",
    r"\burgent\b",
    r"\bbombshell\b",
    r"\bexposed\b",
    r"\bsecret\b",
    r"\bthey don't want you to know\b",
    r"\bwake up\b",
    r"\bshare before.*deleted\b",
    r"\bmust see\b",
    r"\bunbelievable\b",
    r"\bjaw.?dropping\b",
    r"\bmind.?blowing\b",
]

# Source credibility indicators
SOURCE_INDICATORS = [
    r"according to",
    r"officials said",
    r"spokesperson",
    r"statement from",
    r"confirmed by",
    r"reported by",
    r"cited by",
    r'\".*\".*said',
    r"research published",
    r"study shows",
    r"data from",
]


def _sensationalism_score(text: str) -> tuple[float, list[str]]:
    """Score text for sensationalism (0.0 to 1.0)."""
    indicators = []
    score = 0.0

    if not text:
        return 0.0, []

    text_lower = text.lower()

    # Check for clickbait patterns
    clickbait_count = 0
    for pattern in CLICKBAIT_PATTERNS:
        if re.search(pattern, text_lower):
            clickbait_count += 1
            indicators.append(f"Clickbait pattern: '{pattern.strip()}'")

    if clickbait_count > 0:
        score += min(clickbait_count * 0.15, 0.4)

    # Excessive capital letters (more than 20% of alphabetic chars)
    alpha_chars = [c for c in text if c.isalpha()]
    if alpha_chars:
        caps_ratio = sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
        if caps_ratio > 0.3:
            score += 0.2
            indicators.append(f"Excessive capitalization ({caps_ratio:.0%})")

    # Excessive exclamation marks
    exclaim_count = text.count("!")
    word_count = len(text.split())
    if word_count > 0 and exclaim_count / word_count > 0.02:
        score += 0.15
        indicators.append(f"Excessive exclamation marks ({exclaim_count})")

    # Very short content (under 100 words is suspicious for a news article)
    if word_count < 50:
        score += 0.1
        indicators.append("Very short article content")

    return min(score, 1.0), indicators


def _source_citation_score(text: str) -> tuple[float, list[str]]:
    """Score how well the article cites sources (0.0 = well-cited, 1.0 = no citations)."""
    indicators = []

    if not text:
        return 0.5, ["No text to analyze"]

    text_lower = text.lower()
    source_matches = 0

    for pattern in SOURCE_INDICATORS:
        if re.search(pattern, text_lower):
            source_matches += 1

    # More source citations = lower risk
    if source_matches >= 3:
        return 0.0, []
    elif source_matches >= 1:
        return 0.2, []
    else:
        indicators.append("No source citations detected")
        return 0.5, indicators


def _logical_consistency_score(text: str) -> tuple[float, list[str]]:
    """Basic check for logical consistency indicators."""
    indicators = []
    score = 0.0

    if not text:
        return 0.0, []

    text_lower = text.lower()

    # Check for contradictory language patterns
    contradiction_patterns = [
        (r"however.*but.*although", "Multiple hedging/contradictions detected"),
        (r"some say.*others claim", "Vague attribution to unnamed sources"),
    ]

    for pattern, desc in contradiction_patterns:
        if re.search(pattern, text_lower):
            score += 0.15
            indicators.append(desc)

    return min(score, 1.0), indicators


def detect_fake_news(text: str, title: str = "") -> dict:
    """
    Analyze article for misinformation indicators.
    
    Returns:
        {
            "risk_score": float (0.0 - 1.0),
            "indicators": list[str],
            "is_high_risk": bool
        }
    """
    full_text = f"{title} {text}" if title else text

    sensational_score, sensational_indicators = _sensationalism_score(full_text)
    citation_score, citation_indicators = _source_citation_score(text)
    consistency_score, consistency_indicators = _logical_consistency_score(text)

    # Weighted combination
    risk_score = (
        sensational_score * 0.4
        + citation_score * 0.35
        + consistency_score * 0.25
    )
    risk_score = round(min(risk_score, 1.0), 4)

    all_indicators = sensational_indicators + citation_indicators + consistency_indicators
    is_high_risk = risk_score > 0.7

    if is_high_risk:
        all_indicators.insert(0, "HIGH RISK: Article shows multiple misinformation indicators")

    return {
        "risk_score": risk_score,
        "indicators": all_indicators,
        "is_high_risk": is_high_risk,
    }
