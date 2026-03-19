"""Central configuration for the GenNews backend."""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        # News API
        self.news_api_key: str = os.getenv("NEWS_API_KEY", "")

        # Ollama LLM settings
        self.ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.ollama_model: str = os.getenv("OLLAMA_MODEL", "qwen2.5")

        # Database
        self.database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./gennews.db")

        # Scheduler
        self.fetch_interval_hours: int = int(os.getenv("FETCH_INTERVAL_HOURS", "12"))

        # RSS Feeds
        raw_feeds = os.getenv(
            "RSS_FEEDS",
            "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml,"
            "https://feeds.bbci.co.uk/news/rss.xml,"
            "https://rss.cnn.com/rss/edition.rss",
        )
        self.rss_feeds: list[str] = [f.strip() for f in raw_feeds.split(",") if f.strip()]

        # AI Processing
        self.similarity_threshold: float = 0.75
        self.misinfo_high_risk_threshold: float = 0.7
        self.category_confidence_threshold: float = 0.6
        self.publisher_initial_reputation: float = 0.5
        self.single_source_penalty: float = 0.7
        self.llm_timeout_seconds: int = 90

        # Embedding model
        self.embedding_model_name: str = "all-MiniLM-L6-v2"


settings = Settings()
