"""Pydantic schemas for API request/response models."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Article Schemas ──────────────────────────────────────────────────────────

class CategoryInfo(BaseModel):
    category: str
    confidence: float
    is_uncertain: bool = False


class LLMAnalysis(BaseModel):
    claims: list[str] = []
    framing: Optional[str] = None
    tone: Optional[str] = None
    bias_indicators: list[str] = []
    source_credibility_score: Optional[int] = None
    factual_accuracy_score: Optional[int] = None
    objectivity_score: Optional[int] = None
    tone_framing_score: Optional[int] = None
    bias_score: Optional[int] = None
    fake_news_likelihood: Optional[int] = None


class ArticleSummary(BaseModel):
    id: int
    title: str
    url: str
    publisher_name: str
    image_url: Optional[str] = None
    published_at: Optional[datetime] = None
    category: Optional[CategoryInfo] = None
    misinfo_risk_score: Optional[float] = None
    is_high_risk: bool = False
    cluster_id: Optional[int] = None
    credibility_score: Optional[float] = None
    status: str

    class Config:
        from_attributes = True


class ArticleDetail(BaseModel):
    id: int
    title: str
    url: str
    author: Optional[str] = None
    publisher_name: str
    image_url: Optional[str] = None
    published_at: Optional[datetime] = None
    original_text: Optional[str] = None
    cleaned_text: Optional[str] = None
    keywords: Optional[list[str]] = None
    category: Optional[CategoryInfo] = None
    misinfo_risk_score: Optional[float] = None
    misinfo_indicators: Optional[list[str]] = None
    is_high_risk: bool = False
    llm_analysis: Optional[LLMAnalysis] = None
    cluster_id: Optional[int] = None
    is_original_source: bool = False
    credibility_score: Optional[float] = None
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Cluster Schemas ──────────────────────────────────────────────────────────

class RiskIndicator(BaseModel):
    type: str
    description: str


class ClusterSummary(BaseModel):
    id: int
    title: Optional[str] = None
    credibility_score: Optional[float] = None
    risk_indicators: Optional[list[RiskIndicator]] = None
    article_count: int = 0
    source_count: int = 0
    original_source_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClusterDetail(BaseModel):
    id: int
    title: Optional[str] = None
    summary: Optional[str] = None
    credibility_score: Optional[float] = None
    risk_indicators: Optional[list[RiskIndicator]] = None
    original_source_id: Optional[int] = None
    articles: list[ArticleSummary] = []
    coverage_map: list[dict] = []   # [{publisher, reputation, is_original, article_id}]
    narrative_differences: list[dict] = []  # [{publisher, claims, tone, bias}]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Publisher Schemas ────────────────────────────────────────────────────────

class PublisherSummary(BaseModel):
    id: int
    name: str
    reputation_score: float
    article_count: int

    class Config:
        from_attributes = True


class PublisherDetail(BaseModel):
    id: int
    name: str
    reputation_score: float
    article_count: int
    last_updated: datetime
    recent_articles: list[ArticleSummary] = []

    class Config:
        from_attributes = True


# ── Submission Schemas ───────────────────────────────────────────────────────

class ArticleSubmission(BaseModel):
    """Submit an article for credibility analysis."""
    url: Optional[str] = None  # URL to scrape article from
    title: Optional[str] = None  # Manual title (if pasting text)
    text: str  # Article text to analyze
    publisher_name: Optional[str] = "User Submitted"


class AnalysisResponse(BaseModel):
    """Full credibility analysis result for a submitted article."""
    article_id: int
    title: str
    publisher_name: str

    # AI Analysis Results
    cleaned_text: str
    keywords: list[str] = []
    category: Optional[dict] = None
    misinfo_risk_score: float
    misinfo_indicators: list[str] = []
    is_high_risk: bool
    llm_analysis: Optional[dict] = None

    # Cluster match (if a related story exists)
    cluster_id: Optional[int] = None
    credibility_score: Optional[float] = None
    matching_sources: int = 0
    risk_indicators: list[dict] = []

    # Verdict
    verdict: str  # "Likely Credible", "Needs Verification", "Potentially Unreliable"
    confidence: float


# ── Common Schemas ───────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


class HealthCheck(BaseModel):
    status: str
    database: str
    ollama: str
    scheduler: str
    last_fetch: Optional[datetime] = None
    total_articles: int = 0
    total_clusters: int = 0


class FetchTriggerResponse(BaseModel):
    message: str
    status: str
