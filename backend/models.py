"""SQLAlchemy ORM models for GenNews."""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, Boolean, JSON, LargeBinary, ForeignKey
)
from sqlalchemy.orm import relationship
from database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    url = Column(String(1000), unique=True, nullable=False)
    author = Column(String(200), nullable=True)
    publisher_name = Column(String(200), nullable=False)
    image_url = Column(String(1000), nullable=True)  # article thumbnail/hero image
    published_at = Column(DateTime, nullable=True)
    original_text = Column(Text, nullable=True)
    cleaned_text = Column(Text, nullable=True)
    keywords = Column(JSON, nullable=True)  # list[str]

    # AI analysis results
    category = Column(JSON, nullable=True)  # {category: str, confidence: float, is_uncertain: bool}
    misinfo_risk_score = Column(Float, nullable=True)
    misinfo_indicators = Column(JSON, nullable=True)  # list[str]
    is_high_risk = Column(Boolean, default=False)
    llm_analysis = Column(JSON, nullable=True)  # {claims, framing, tone, bias_indicators}

    # Embedding for similarity
    embedding = Column(LargeBinary, nullable=True)

    # Clustering
    cluster_id = Column(Integer, ForeignKey("story_clusters.id"), nullable=True)
    is_original_source = Column(Boolean, default=False)

    # Status tracking
    status = Column(String(50), default="raw")  # raw, preprocessed, analyzed, clustered, error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    # Relationships
    cluster = relationship("StoryCluster", back_populates="articles")


class StoryCluster(Base):
    __tablename__ = "story_clusters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=True)
    summary = Column(Text, nullable=True)
    credibility_score = Column(Float, nullable=True)
    risk_indicators = Column(JSON, nullable=True)  # list[{type: str, description: str}]
    original_source_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    articles = relationship("Article", back_populates="cluster")


class Publisher(Base):
    __tablename__ = "publishers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), unique=True, nullable=False)
    reputation_score = Column(Float, default=0.5)
    article_count = Column(Integer, default=0)
    total_misinfo_score = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)


class FetchLog(Base):
    __tablename__ = "fetch_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    articles_fetched = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    status = Column(String(50), default="running")  # running, completed, failed
    error_details = Column(Text, nullable=True)
