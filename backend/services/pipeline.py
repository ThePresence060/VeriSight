"""Processing Pipeline — orchestrates the full article analysis flow."""

import logging
from datetime import datetime
from sqlalchemy.orm import Session
from models import Article
from services.text_preprocessor import preprocess_article
from services.category_classifier import classify_article
from services.fake_news_detector import detect_fake_news
from services.llm_analyzer import analyze_article
from services.similarity_engine import generate_article_embedding, embedding_to_bytes
from services.news_clusterer import cluster_articles
from services.credibility_engine import (
    update_publisher_reputation,
    calculate_credibility_score,
    generate_risk_indicators,
)
from services.scraper import fetch_full_content

logger = logging.getLogger(__name__)


def process_article(session: Session, article: Article) -> bool:
    """
    Run the full AI pipeline on a single article.
    Steps: preprocess → classify → detect misinfo → LLM analyze → embed
    """
    try:
        # Step 1: Text Preprocessing
        if not preprocess_article(article):
            logger.warning(f"Preprocessing failed for article {article.id}")
            return False

        text = article.cleaned_text or article.original_text or ""
        title = article.title or ""

        # Step 1.5: If text looks like a NewsAPI snippet, try to fetch full content
        if "[+" in text and article.url:
            logger.info(f"Snippet detected for {article.id}, attempting full scrape...")
            full_text = fetch_full_content(article.url)
            if full_text and len(full_text) > len(text):
                article.original_text = full_text
                article.cleaned_text = None # Force re-preprocess
                preprocess_article(article)
                text = article.cleaned_text or article.original_text or ""

        # Step 2: Category Classification
        try:
            cat_result = classify_article(text)
            article.category = cat_result
        except Exception as e:
            logger.error(f"Classification failed for article {article.id}: {e}")
            article.category = {"category": "uncategorized", "confidence": 0.0, "is_uncertain": True}

        # Step 3: Fake News Detection
        try:
            misinfo_result = detect_fake_news(text, title)
            article.misinfo_risk_score = misinfo_result["risk_score"]
            article.misinfo_indicators = misinfo_result["indicators"]
            article.is_high_risk = misinfo_result["is_high_risk"]
        except Exception as e:
            logger.error(f"Fake news detection failed for article {article.id}: {e}")

        # Step 4: LLM Analysis
        try:
            llm_result = analyze_article(title, text)
            article.llm_analysis = llm_result
        except Exception as e:
            logger.error(f"LLM analysis failed for article {article.id}: {e}")
            article.llm_analysis = {
                "claims": [],
                "framing": "Analysis failed",
                "tone": "unknown",
                "bias_indicators": [],
            }

        # Step 5: Generate Embedding
        try:
            embedding = generate_article_embedding(title, text)
            article.embedding = embedding_to_bytes(embedding)
        except Exception as e:
            logger.error(f"Embedding generation failed for article {article.id}: {e}")

        article.status = "analyzed"
        article.processed_at = datetime.utcnow()
        return True

    except Exception as e:
        logger.error(f"Pipeline failed for article {article.id}: {e}")
        article.status = "error"
        article.error_message = str(e)
        return False


def run_processing_pipeline(session: Session):
    """
    Process all unprocessed articles through the full pipeline.
    Steps: individual processing → clustering → credibility scoring
    """
    raw_articles = (
        session.query(Article)
        .filter(Article.status == "raw")
        .order_by(Article.created_at.asc())
        .all()
    )

    if not raw_articles:
        logger.info("No articles to process.")
        return

    logger.info(f"Processing {len(raw_articles)} articles...")

    # Step 1-5: Process each article individually
    processed_articles = []
    
    # Process in chunks to allow clustering and commits during long runs
    CHUNK_SIZE = 20
    for i in range(0, len(raw_articles), CHUNK_SIZE):
        chunk = raw_articles[i:i + CHUNK_SIZE]
        chunk_processed = []
        
        for article in chunk:
            logger.info(f"Processing article {len(processed_articles)+1}/{len(raw_articles)}: {article.title[:50]}...")
            if process_article(session, article):
                chunk_processed.append(article)
                processed_articles.append(article)
            session.commit()
            
        if chunk_processed:
            # Step 6: Cluster the new batch
            try:
                logger.info(f"Clustering batch of {len(chunk_processed)} articles...")
                updated_clusters = cluster_articles(session, chunk_processed)
                logger.info(f"Batch clustering updated {len(updated_clusters)} clusters")

                # Step 7: Calculate scores for updated clusters
                for cluster in updated_clusters:
                    calculate_credibility_score(session, cluster)
                    generate_risk_indicators(session, cluster)

                # Update publisher reputations
                publisher_names = set(a.publisher_name for a in chunk_processed)
                for name in publisher_names:
                    update_publisher_reputation(session, name)
                
                # Mark articles as fully processed
                for article in chunk_processed:
                    if article.cluster_id:
                        article.status = "clustered"
                    else:
                        article.status = "analyzed"
                
                session.commit()
            except Exception as e:
                logger.error(f"Batch clustering/scoring failed: {e}")
                session.rollback()

    logger.info(f"Successfully processed {len(processed_articles)}/{len(raw_articles)} articles")
    logger.info(f"Processing pipeline completed for {len(processed_articles)} articles.")
