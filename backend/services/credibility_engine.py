"""Credibility Score Engine — publisher reputation, credibility scoring, and risk indicators."""

import math
import logging
from sqlalchemy import func
from sqlalchemy.orm import Session
from models import Article, StoryCluster, Publisher
from config import settings

logger = logging.getLogger(__name__)


def update_publisher_reputation(session: Session, publisher_name: str):
    """Update publisher reputation based on their recent articles' misinfo scores."""
    publisher = session.query(Publisher).filter(Publisher.name == publisher_name).first()
    if not publisher:
        return

    scores = (
        session.query(Article.misinfo_risk_score)
        .filter(
            Article.publisher_name == publisher_name,
            Article.misinfo_risk_score.isnot(None),
        )
        .order_by(Article.created_at.desc())
        .limit(100)
        .all()
    )
    scores = [s[0] for s in scores]

    if not scores:
        return

    avg_misinfo = sum(scores) / len(scores)
    publisher.reputation_score = round(1.0 - avg_misinfo, 4)

    total_count = (
        session.query(func.count(Article.id))
        .filter(Article.publisher_name == publisher_name)
        .scalar()
    ) or 0
    publisher.article_count = total_count


def calculate_credibility_score(session: Session, cluster: StoryCluster) -> float:
    """
    Calculate credibility score for a story cluster.
    
    Weighted formula:
        - Publisher reputation average: 30%
        - Inverse misinfo risk average: 30%
        - Source diversity factor: 25%
        - Claim consistency: 15%
        - Single-source penalty: multiply by 0.7
    """
    articles = session.query(Article).filter(Article.cluster_id == cluster.id).all()

    if not articles:
        return 0.5

    # Factor 1: Publisher Reputation Average
    publisher_names = set(a.publisher_name for a in articles)
    publishers = (
        session.query(Publisher).filter(Publisher.name.in_(publisher_names)).all()
    )
    pub_scores = {p.name: p.reputation_score for p in publishers}
    avg_reputation = (
        sum(pub_scores.get(name, 0.5) for name in publisher_names) / len(publisher_names)
        if publisher_names
        else 0.5
    )

    # Factor 2: Inverse Misinfo Risk Average
    misinfo_scores = [a.misinfo_risk_score for a in articles if a.misinfo_risk_score is not None]
    avg_misinfo = sum(misinfo_scores) / len(misinfo_scores) if misinfo_scores else 0.5
    inverse_misinfo = 1.0 - avg_misinfo

    # Factor 3: Source Diversity
    num_sources = len(publisher_names)
    diversity_factor = min(1.0, 0.3 + 0.3 * math.log2(max(num_sources, 1)))

    # Factor 4: Claim Consistency
    all_claims = []
    for a in articles:
        if a.llm_analysis and isinstance(a.llm_analysis, dict):
            claims = a.llm_analysis.get("claims", [])
            if isinstance(claims, list):
                all_claims.append(set(str(c).lower() for c in claims))

    consistency = 0.5
    if len(all_claims) >= 2:
        total_sim = 0
        count = 0
        for i in range(len(all_claims)):
            for j in range(i + 1, len(all_claims)):
                if all_claims[i] or all_claims[j]:
                    jaccard = len(all_claims[i] & all_claims[j]) / len(
                        all_claims[i] | all_claims[j]
                    )
                    total_sim += jaccard
                    count += 1
        consistency = total_sim / count if count > 0 else 0.5

    # Weighted Score
    score = (
        avg_reputation * 0.30
        + inverse_misinfo * 0.30
        + diversity_factor * 0.25
        + consistency * 0.15
    )

    # Single-source penalty
    if num_sources == 1:
        score *= settings.single_source_penalty

    score = round(max(0.0, min(1.0, score)), 4)
    cluster.credibility_score = score
    return score


def generate_risk_indicators(session: Session, cluster: StoryCluster) -> list[dict]:
    """Generate risk indicator flags for a story cluster."""
    indicators = []

    articles = session.query(Article).filter(Article.cluster_id == cluster.id).all()
    if not articles:
        return indicators

    publisher_names = set(a.publisher_name for a in articles)

    # Single Source
    if len(publisher_names) == 1:
        indicators.append({
            "type": "Single Source",
            "description": f"Only one publisher ({list(publisher_names)[0]}) is reporting this story. "
            "Stories reported by multiple independent sources are generally more reliable.",
        })

    # Low Publisher Reputation
    publishers = session.query(Publisher).filter(Publisher.name.in_(publisher_names)).all()
    if publishers:
        avg_rep = sum(p.reputation_score for p in publishers) / len(publishers)
        if avg_rep < 0.4:
            indicators.append({
                "type": "Low Publisher Reputation",
                "description": f"The average publisher reputation for this story is {avg_rep:.2f}. "
                "Sources with low reputation scores have historically published less reliable content.",
            })

    # High Misinformation Risk
    high_risk_articles = [
        a for a in articles
        if a.misinfo_risk_score and a.misinfo_risk_score > settings.misinfo_high_risk_threshold
    ]
    if high_risk_articles:
        indicators.append({
            "type": "High Misinformation Risk",
            "description": f"{len(high_risk_articles)} of {len(articles)} articles in this cluster "
            "show high misinformation risk indicators such as sensational language or lack of sources.",
        })

    # Narrative Inconsistency
    tones = set()
    for a in articles:
        if a.llm_analysis and isinstance(a.llm_analysis, dict):
            tone = a.llm_analysis.get("tone")
            if tone and tone != "unknown":
                tones.add(tone)
    if len(tones) >= 3:
        indicators.append({
            "type": "Narrative Inconsistency",
            "description": f"Articles in this cluster show {len(tones)} different emotional tones "
            f"({', '.join(tones)}), suggesting conflicting narratives across sources.",
        })

    cluster.risk_indicators = indicators
    return indicators
