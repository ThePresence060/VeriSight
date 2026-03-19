"""News Clusterer — groups similar articles into story clusters."""

import logging
from datetime import datetime
from sqlalchemy.orm import Session
from models import Article, StoryCluster
from services.similarity_engine import (
    bytes_to_embedding,
    cosine_similarity,
    calculate_pairwise_similarities,
)
from config import settings

logger = logging.getLogger(__name__)


def cluster_articles(session: Session, new_articles: list[Article]) -> list[StoryCluster]:
    """
    Cluster new articles with existing clusters or create new ones.
    Uses threshold-based agglomerative approach.
    """
    updated_clusters = []

    # Get existing clusters
    existing_clusters = (
        session.query(StoryCluster)
        .order_by(StoryCluster.created_at.desc())
        .limit(200)
        .all()
    )

    for article in new_articles:
        logger.info(f"Clustering article {article.id}: '{article.title[:40]}' (Has emebdding: {article.embedding is not None})")
        if article.embedding is None:
            continue

        article_emb = bytes_to_embedding(article.embedding)
        logger.info(f"Loaded embedding for article {article.id}, size: {len(article_emb)}")
        best_cluster = None
        best_similarity = 0.0

        for cluster in existing_clusters:
            cluster_articles = (
                session.query(Article)
                .filter(Article.cluster_id == cluster.id, Article.embedding.isnot(None))
                .all()
            )

            if not cluster_articles:
                continue

            similarities = []
            for ca in cluster_articles:
                ca_emb = bytes_to_embedding(ca.embedding)
                sim = cosine_similarity(article_emb, ca_emb)
                similarities.append(sim)

            avg_sim = sum(similarities) / len(similarities)

            if avg_sim >= settings.similarity_threshold and avg_sim > best_similarity:
                best_similarity = avg_sim
                best_cluster = cluster

        if best_cluster:
            article.cluster_id = best_cluster.id
            best_cluster.updated_at = datetime.utcnow()

            # Check for original source (earliest published)
            if article.published_at:
                all_cluster_articles = (
                    session.query(Article)
                    .filter(Article.cluster_id == best_cluster.id)
                    .all()
                )
                dated_articles = [a for a in all_cluster_articles if a.published_at]
                if dated_articles:
                    earliest = min(dated_articles, key=lambda a: a.published_at)
                    for a in all_cluster_articles:
                        a.is_original_source = a.id == earliest.id
                    if article.published_at <= earliest.published_at:
                        article.is_original_source = True
                        best_cluster.original_source_id = article.id

            if best_cluster not in updated_clusters:
                updated_clusters.append(best_cluster)

            logger.info(
                f"Article '{article.title[:50]}' added to cluster {best_cluster.id} "
                f"(similarity: {best_similarity:.2f})"
            )
        else:
            cluster = StoryCluster(
                title=article.title,
                original_source_id=article.id,
            )
            session.add(cluster)
            session.flush()

            article.cluster_id = cluster.id
            article.is_original_source = True
            existing_clusters.append(cluster)
            updated_clusters.append(cluster)

            logger.info(f"Created new cluster {cluster.id} for: '{article.title[:50]}'")

    # Merge unclustered new articles
    unclustered = [a for a in new_articles if a.cluster_id is None and a.embedding is not None]
    if len(unclustered) >= 2:
        pairs = calculate_pairwise_similarities(unclustered, settings.similarity_threshold)

        groups = {}
        for aid1, aid2, sim in pairs:
            g1 = groups.get(aid1, {aid1})
            g2 = groups.get(aid2, {aid2})
            merged = g1 | g2
            for aid in merged:
                groups[aid] = merged

        processed = set()
        for group in groups.values():
            group_key = frozenset(group)
            if group_key in processed:
                continue
            processed.add(group_key)

            group_articles = [a for a in unclustered if a.id in group]
            if len(group_articles) < 2:
                continue

            dated = [a for a in group_articles if a.published_at]
            earliest = min(dated, key=lambda a: a.published_at) if dated else group_articles[0]

            cluster = StoryCluster(
                title=earliest.title,
                original_source_id=earliest.id,
            )
            session.add(cluster)
            session.flush()

            for a in group_articles:
                a.cluster_id = cluster.id
                a.is_original_source = a.id == earliest.id

            existing_clusters.append(cluster)
            updated_clusters.append(cluster)
            logger.info(f"Created merged cluster {cluster.id} with {len(group_articles)} articles")

    return updated_clusters
