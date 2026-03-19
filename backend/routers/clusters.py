"""Clusters API Router — endpoints for story clusters with coverage/narrative data."""

import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import Article, StoryCluster, Publisher
from schemas import ClusterSummary, ClusterDetail, ArticleSummary, PaginatedResponse

router = APIRouter(prefix="/api/clusters", tags=["Story Clusters"])


@router.get("", response_model=PaginatedResponse)
def list_clusters(
    credibility_min: Optional[float] = Query(None, ge=0, le=1),
    credibility_max: Optional[float] = Query(None, ge=0, le=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List story clusters with credibility filtering and pagination."""
    query = db.query(StoryCluster).order_by(StoryCluster.updated_at.desc())

    if credibility_min is not None:
        query = query.filter(StoryCluster.credibility_score >= credibility_min)
    if credibility_max is not None:
        query = query.filter(StoryCluster.credibility_score <= credibility_max)

    total = query.count()
    offset = (page - 1) * page_size
    clusters = query.offset(offset).limit(page_size).all()

    items = []
    for cluster in clusters:
        article_count = db.query(func.count(Article.id)).filter(Article.cluster_id == cluster.id).scalar() or 0
        source_count = db.query(func.count(func.distinct(Article.publisher_name))).filter(Article.cluster_id == cluster.id).scalar() or 0

        items.append(ClusterSummary(
            id=cluster.id,
            title=cluster.title,
            credibility_score=cluster.credibility_score,
            risk_indicators=cluster.risk_indicators,
            article_count=article_count,
            source_count=source_count,
            original_source_id=cluster.original_source_id,
            created_at=cluster.created_at,
            updated_at=cluster.updated_at,
        ))

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{cluster_id}", response_model=ClusterDetail)
def get_cluster(cluster_id: int, db: Session = Depends(get_db)):
    """Get detailed cluster info including coverage map and narrative differences."""
    cluster = db.query(StoryCluster).filter(StoryCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(404, f"Cluster with id {cluster_id} not found")

    articles = (
        db.query(Article)
        .filter(Article.cluster_id == cluster_id)
        .order_by(Article.published_at.asc())
        .all()
    )

    article_summaries = [
        ArticleSummary(
            id=a.id, title=a.title, url=a.url, publisher_name=a.publisher_name,
            published_at=a.published_at, category=a.category,
            misinfo_risk_score=a.misinfo_risk_score, is_high_risk=a.is_high_risk,
            cluster_id=a.cluster_id, credibility_score=cluster.credibility_score,
            status=a.status,
        )
        for a in articles
    ]

    coverage_map = []
    for a in articles:
        publisher = db.query(Publisher).filter(Publisher.name == a.publisher_name).first()
        coverage_map.append({
            "publisher": a.publisher_name,
            "reputation": publisher.reputation_score if publisher else 0.5,
            "is_original": a.is_original_source,
            "article_id": a.id,
            "published_at": a.published_at.isoformat() if a.published_at else None,
        })

    narrative_diffs = []
    for a in articles:
        llm = a.llm_analysis if isinstance(a.llm_analysis, dict) else {}
        narrative_diffs.append({
            "publisher": a.publisher_name,
            "article_id": a.id,
            "claims": llm.get("claims", []),
            "tone": llm.get("tone", "unknown"),
            "framing": llm.get("framing", ""),
            "bias_indicators": llm.get("bias_indicators", []),
        })

    return ClusterDetail(
        id=cluster.id, title=cluster.title, summary=cluster.summary,
        credibility_score=cluster.credibility_score,
        risk_indicators=cluster.risk_indicators,
        original_source_id=cluster.original_source_id,
        articles=article_summaries, coverage_map=coverage_map,
        narrative_differences=narrative_diffs,
        created_at=cluster.created_at, updated_at=cluster.updated_at,
    )
