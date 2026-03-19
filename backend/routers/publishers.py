"""Publishers API Router — endpoints for publisher statistics and reputation."""

import math
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import Publisher, Article
from schemas import PublisherSummary, PublisherDetail, ArticleSummary, PaginatedResponse

router = APIRouter(prefix="/api/publishers", tags=["Publishers"])


@router.get("", response_model=PaginatedResponse)
def list_publishers(
    search: str = Query(None, description="Search publisher name"),
    sort_by: str = Query("reputation", description="Sort by: reputation, name, article_count"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all publishers with reputation scores."""
    query = db.query(Publisher)

    if search:
        query = query.filter(Publisher.name.ilike(f"%{search}%"))

    if sort_by == "name":
        query = query.order_by(Publisher.name.asc())
    elif sort_by == "article_count":
        query = query.order_by(Publisher.article_count.desc())
    else:
        query = query.order_by(Publisher.reputation_score.desc())

    total = query.count()
    offset = (page - 1) * page_size
    publishers = query.offset(offset).limit(page_size).all()

    items = [
        PublisherSummary(
            id=p.id, name=p.name,
            reputation_score=p.reputation_score,
            article_count=p.article_count,
        )
        for p in publishers
    ]

    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{publisher_id}", response_model=PublisherDetail)
def get_publisher(publisher_id: int, db: Session = Depends(get_db)):
    """Get detailed publisher information with recent articles."""
    publisher = db.query(Publisher).filter(Publisher.id == publisher_id).first()

    if not publisher:
        raise HTTPException(404, f"Publisher with id {publisher_id} not found")

    recent_articles = (
        db.query(Article)
        .filter(Article.publisher_name == publisher.name)
        .order_by(Article.created_at.desc())
        .limit(10)
        .all()
    )

    article_summaries = [
        ArticleSummary(
            id=a.id, title=a.title, url=a.url,
            publisher_name=a.publisher_name,
            published_at=a.published_at, category=a.category,
            misinfo_risk_score=a.misinfo_risk_score,
            is_high_risk=a.is_high_risk, cluster_id=a.cluster_id,
            credibility_score=None, status=a.status,
        )
        for a in recent_articles
    ]

    return PublisherDetail(
        id=publisher.id, name=publisher.name,
        reputation_score=publisher.reputation_score,
        article_count=publisher.article_count,
        last_updated=publisher.last_updated,
        recent_articles=article_summaries,
    )
