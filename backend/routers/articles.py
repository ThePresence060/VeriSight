"""Articles API Router — endpoints for browsing, searching, and analyzing articles."""

import math
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from database import get_db
from models import Article, StoryCluster, Publisher
from schemas import (
    ArticleSummary, ArticleDetail, PaginatedResponse,
    ArticleSubmission, AnalysisResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/articles", tags=["Articles"])


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_article(submission: ArticleSubmission, db: Session = Depends(get_db)):
    """
    Submit an article for credibility analysis.
    
    Send article text and get back:
    - Category classification
    - Misinformation risk score with indicators
    - LLM deep analysis (claims, tone, bias, framing)
    - Cluster match with credibility score
    - Overall verdict
    """
    from services.text_preprocessor import clean_text, extract_keywords
    from services.fake_news_detector import detect_fake_news
    from services.llm_analyzer import analyze_article as llm_analyze
    from services.similarity_engine import (
        generate_article_embedding, embedding_to_bytes, bytes_to_embedding, cosine_similarity,
    )
    from config import settings

    title = submission.title or submission.text[:80] + "..."
    publisher = submission.publisher_name or "User Submitted"
    
    unique_url = submission.url or f"user-submission-{datetime.utcnow().timestamp()}"
    existing = db.query(Article).filter(Article.url == unique_url).first()
    if existing:
        unique_url = f"{unique_url}#{datetime.utcnow().timestamp()}"

    # Save the article to DB
    article = Article(
        title=title,
        url=unique_url,
        publisher_name=publisher,
        published_at=datetime.utcnow(),
        original_text=submission.text,
        status="raw",
    )
    db.add(article)
    db.flush()

    # ── Step 1: Text Preprocessing ──
    cleaned = clean_text(submission.text)
    keywords = extract_keywords(f"{title} {cleaned}")
    article.cleaned_text = cleaned
    article.keywords = keywords

    # ── Step 2: Fake News Detection ──
    misinfo_result = detect_fake_news(cleaned, title)
    article.misinfo_risk_score = misinfo_result["risk_score"]
    article.misinfo_indicators = misinfo_result["indicators"]
    article.is_high_risk = misinfo_result["is_high_risk"]

    # ── Step 3: LLM Analysis (Qwen via Ollama) ──
    llm_result = llm_analyze(title, cleaned)
    article.llm_analysis = llm_result

    # ── Step 4: Category Classification ──
    try:
        from services.category_classifier import classify_article
        cat_result = classify_article(cleaned)
        article.category = cat_result
    except Exception as e:
        logger.warning(f"Category classification skipped: {e}")
        article.category = {"category": "uncategorized", "confidence": 0.0, "is_uncertain": True}

    # ── Step 5: Embedding + Cluster Matching ──
    cluster_id = None
    credibility_score = None
    matching_sources = 0
    risk_indicators = []

    try:
        embedding = generate_article_embedding(title, cleaned)
        article.embedding = embedding_to_bytes(embedding)

        # Find matching cluster by comparing with existing articles
        existing_articles = (
            db.query(Article)
            .filter(Article.embedding.isnot(None), Article.id != article.id)
            .order_by(Article.created_at.desc())
            .limit(500)
            .all()
        )

        best_cluster_id = None
        best_similarity = 0.0

        for existing in existing_articles:
            existing_emb = bytes_to_embedding(existing.embedding)
            sim = cosine_similarity(embedding, existing_emb)
            if sim >= settings.similarity_threshold and sim > best_similarity:
                best_similarity = sim
                best_cluster_id = existing.cluster_id

        if best_cluster_id:
            article.cluster_id = best_cluster_id
            cluster_id = best_cluster_id

            cluster = db.query(StoryCluster).filter(StoryCluster.id == best_cluster_id).first()
            if cluster:
                credibility_score = cluster.credibility_score
                risk_indicators = cluster.risk_indicators or []
                matching_sources = (
                    db.query(func.count(func.distinct(Article.publisher_name)))
                    .filter(Article.cluster_id == best_cluster_id)
                    .scalar()
                ) or 0

    except Exception as e:
        logger.warning(f"Embedding/clustering skipped: {e}")

    # ── Generate Verdict ──
    # Blend regex-based risk_score with LLM's fake_news_likelihood for better detection
    regex_risk = misinfo_result["risk_score"]
    
    # Safely handle None: .get() returns None when key exists with None value
    raw_fake_likelihood = llm_result.get("fake_news_likelihood")
    llm_fake_likelihood = (raw_fake_likelihood if raw_fake_likelihood is not None else 50) / 100.0
    
    # Weighted blend: LLM is more intelligent, give it 60% weight
    risk_score = round(regex_risk * 0.4 + llm_fake_likelihood * 0.6, 4)
    
    # Debug logging — trace what the LLM returned
    logger.info(f"[ANALYZE DEBUG] Article: {title[:60]}")
    logger.info(f"[ANALYZE DEBUG] regex_risk={regex_risk}, llm_fake_raw={raw_fake_likelihood}, blended_risk={risk_score}")
    logger.info(f"[ANALYZE DEBUG] LLM scores: src={llm_result.get('source_credibility_score')}, fact={llm_result.get('factual_accuracy_score')}, obj={llm_result.get('objectivity_score')}, tone={llm_result.get('tone_framing_score')}, bias={llm_result.get('bias_score')}, fake={raw_fake_likelihood}")
    logger.info(f"[ANALYZE DEBUG] LLM tone={llm_result.get('tone')}, claims={len(llm_result.get('claims', []))}, bias_indicators={llm_result.get('bias_indicators', [])}")
    
    # Update the article's misinfo fields with the blended score
    article.misinfo_risk_score = risk_score
    article.is_high_risk = risk_score > 0.6
    
    if risk_score < 0.3 and matching_sources >= 2:
        verdict = "Likely Credible"
        confidence = min(0.9, 0.6 + matching_sources * 0.05 + (1 - risk_score) * 0.2)
    elif risk_score < 0.4:
        verdict = "Likely Credible"
        confidence = 0.6 + (0.4 - risk_score) * 0.3
    elif risk_score < 0.6:
        verdict = "Needs Verification"
        confidence = 0.4 + (0.6 - risk_score) * 0.2
    else:
        verdict = "Potentially Unreliable"
        confidence = 0.6 + (risk_score - 0.6) * 0.5

    confidence = round(min(confidence, 1.0), 2)

    article.status = "analyzed"
    article.processed_at = datetime.utcnow()
    
    # Calculate a fallback credibility score for user submitted articles if no cluster is found
    # This ensures the frontend doesn't show "Pending" when analysis is clearly done.
    if credibility_score is None:
        # High risk = Low credibility
        credibility_score = round(1.0 - risk_score, 2)
    
    db.commit()

    return AnalysisResponse(
        article_id=article.id,
        title=title,
        publisher_name=publisher,
        cleaned_text=cleaned,
        keywords=keywords,
        category=article.category,
        misinfo_risk_score=risk_score,
        misinfo_indicators=misinfo_result["indicators"],
        is_high_risk=article.is_high_risk,
        llm_analysis=llm_result,
        cluster_id=cluster_id,
        credibility_score=credibility_score,
        matching_sources=matching_sources,
        risk_indicators=risk_indicators,
        verdict=verdict,
        confidence=confidence,
    )


@router.get("", response_model=PaginatedResponse)
def list_articles(
    category: Optional[str] = Query(None, description="Filter by category"),
    publisher: Optional[str] = Query(None, description="Filter by publisher name"),
    search: Optional[str] = Query(None, description="Search in title and text"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    credibility_min: Optional[float] = Query(None, ge=0, le=1),
    credibility_max: Optional[float] = Query(None, ge=0, le=1),
    is_high_risk: Optional[bool] = Query(None, description="Filter high risk articles"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List articles with filtering, searching, and pagination."""
    query = db.query(Article).order_by(Article.created_at.desc())

    if publisher:
        query = query.filter(Article.publisher_name.ilike(f"%{publisher}%"))

    if search:
        query = query.filter(
            or_(
                Article.title.ilike(f"%{search}%"),
                Article.cleaned_text.ilike(f"%{search}%"),
            )
        )

    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Article.published_at >= dt_from)
        except ValueError:
            raise HTTPException(400, "Invalid date_from format. Use YYYY-MM-DD.")

    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d")
            query = query.filter(Article.published_at <= dt_to)
        except ValueError:
            raise HTTPException(400, "Invalid date_to format. Use YYYY-MM-DD.")

    if is_high_risk is not None:
        query = query.filter(Article.is_high_risk == is_high_risk)

    if category:
        # Filter JSON type using sqlite json_extract
        query = query.filter(func.json_extract(Article.category, '$.category') == category.lower())

    total = query.count()

    offset = (page - 1) * page_size
    articles = query.offset(offset).limit(page_size).all()

    items = []
    for article in articles:
        cred_score = None
        if article.cluster_id:
            cluster = db.query(StoryCluster).filter(StoryCluster.id == article.cluster_id).first()
            cred_score = cluster.credibility_score if cluster else None

        if credibility_min is not None and (cred_score is None or cred_score < credibility_min):
            continue
        if credibility_max is not None and (cred_score is None or cred_score > credibility_max):
            continue

        items.append(ArticleSummary(
            id=article.id, title=article.title, url=article.url,
            publisher_name=article.publisher_name, image_url=article.image_url,
            published_at=article.published_at,
            category=article.category, misinfo_risk_score=article.misinfo_risk_score,
            is_high_risk=article.is_high_risk, cluster_id=article.cluster_id,
            credibility_score=cred_score, status=article.status,
        ))

    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{article_id}", response_model=ArticleDetail)
def get_article(article_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific article."""
    article = db.query(Article).filter(Article.id == article_id).first()

    if not article:
        raise HTTPException(404, f"Article with id {article_id} not found")

    # Get credibility score (from cluster or calculated risk)
    credibility_score = None
    if article.cluster_id:
        cluster = db.query(StoryCluster).filter(StoryCluster.id == article.cluster_id).first()
        credibility_score = cluster.credibility_score if cluster else None
    
    if credibility_score is None and article.misinfo_risk_score is not None:
        credibility_score = round(1.0 - article.misinfo_risk_score, 2)

    return ArticleDetail(
        id=article.id, title=article.title, url=article.url, author=article.author,
        publisher_name=article.publisher_name, image_url=article.image_url,
        published_at=article.published_at,
        original_text=article.original_text, cleaned_text=article.cleaned_text,
        keywords=article.keywords, category=article.category,
        misinfo_risk_score=article.misinfo_risk_score,
        misinfo_indicators=article.misinfo_indicators,
        is_high_risk=article.is_high_risk, llm_analysis=article.llm_analysis,
        cluster_id=article.cluster_id, is_original_source=article.is_original_source,
        credibility_score=credibility_score,
        status=article.status, created_at=article.created_at,
        processed_at=article.processed_at,
    )
