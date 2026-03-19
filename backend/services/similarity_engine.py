"""Similarity Engine — generates embeddings and calculates article similarity."""

import logging
import numpy as np
from sentence_transformers import SentenceTransformer
from config import settings

logger = logging.getLogger(__name__)

_model = None


def _get_model() -> SentenceTransformer:
    """Lazy load the sentence transformer model."""
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {settings.embedding_model_name}")
        _model = SentenceTransformer(settings.embedding_model_name)
        logger.info("Embedding model loaded.")
    return _model


def generate_embedding(text: str) -> np.ndarray:
    """Generate a sentence embedding for the given text."""
    model = _get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding


def generate_article_embedding(title: str, body: str) -> np.ndarray:
    """
    Generate a combined embedding for an article.
    Title is weighted more heavily (repeated) to emphasize headline similarity.
    """
    combined_text = f"{title}. {title}. {body[:500]}"
    return generate_embedding(combined_text)


def cosine_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """Calculate cosine similarity between two embeddings."""
    if emb1 is None or emb2 is None:
        return 0.0
    norm1 = np.linalg.norm(emb1)
    norm2 = np.linalg.norm(emb2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(emb1, emb2) / (norm1 * norm2))


def embedding_to_bytes(embedding: np.ndarray) -> bytes:
    """Serialize embedding to bytes for database storage."""
    return embedding.astype(np.float32).tobytes()


def bytes_to_embedding(data: bytes) -> np.ndarray:
    """Deserialize embedding from bytes."""
    return np.frombuffer(data, dtype=np.float32)


def calculate_pairwise_similarities(
    articles: list, threshold: float = 0.75
) -> list[tuple[int, int, float]]:
    """
    Calculate pairwise similarity for articles with embeddings.
    Returns list of (article_id_1, article_id_2, similarity_score) for pairs above threshold.
    """
    pairs = []
    for i in range(len(articles)):
        if articles[i].embedding is None:
            continue
        emb_i = bytes_to_embedding(articles[i].embedding)

        for j in range(i + 1, len(articles)):
            if articles[j].embedding is None:
                continue
            emb_j = bytes_to_embedding(articles[j].embedding)

            sim = cosine_similarity(emb_i, emb_j)
            if sim >= threshold:
                pairs.append((articles[i].id, articles[j].id, sim))

    return pairs
