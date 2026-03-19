# VeriSight - Hackathon Presentation Guide

Congratulations on reaching the presentation stage! This document contains everything you need to know to run the servers and field technical questions from the judges about how VeriSight's AI algorithms work.

---

## 🚀 How to Run the Application Locally

You will need two separate terminal windows to run the frontend and backend.

### 1. Start the Backend API (FastAPI)
The backend requires Python and a local installation of Ollama.
1. Ensure Ollama is running and has the `qwen2.5` model downloaded (`ollama pull qwen2.5`).
2. Open a terminal and navigate to the backend folder:
   ```powershell
   cd c:\Farzi\Hackathon_Jims\backend
   ```
3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
4. Start the server on port 8000:
   ```powershell
   python -m uvicorn main:app --reload --port 8000
   ```
   *(The API will now be live at `http://localhost:8000`)*

### 2. Start the Frontend (React + Vite)
1. Open a new terminal and navigate to the frontend folder:
   ```powershell
   cd c:\Farzi\Hackathon_Jims\frontend\GenNews-main\genNews
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
3. Open your browser and go to `http://localhost:5173`.


---

## 🧠 How the AI & Credibility Scoring Works

When a judge asks **"How do you actually calculate the credibility score?"**, you can explain that VeriSight uses a robust, **multi-stage AI pipeline** rather than relying on a single black-box LLM prompt. 

Here is the exact algorithmic flow executed in `router_articles.py`:

### Stage 1: Linguistic Fake News Detection (Misinformation Risk Score)
Before we use any heavy LLMs, the raw text is passed through our custom **NLP Fake News Detector** (`services/fake_news_detector.py`).
* **What it does:** It looks for sensationalist language, emotional manipulation, lack of citations, and known misinformation patterns.
* **The Exact Math:** The final `risk_score` is a weighted algorithm:
  * `Sensationalism Score (40% weight)`: Counts clickbait phrases (e.g., "shocking", "bombshell"), excessive capitalization (>30% of words), excessive exclamation marks (>2%), and flags articles under 50 words.
  * `Citation Score (35% weight)`: Scans for journalistic attribution (e.g., "officials said", "according to", "reported by"). Having 3+ sources = 0.0 risk. No sources = 0.5+ risk.
  * `Consistency Score (25% weight)`: Checks for contradictory language or vague hedging.
* **The Result:** It outputs a raw `risk_score` from `0.0` (totally safe) to `1.0` (highly suspicious). Articles with a score > `0.7` are immediately flagged as **"High Risk"**.

### Stage 2: Semantic Clustering (The "Coverage Map")
VeriSight doesn't just read an article in isolation; it cross-references it against the entire database.
* **What it does:** We use a local embedding model (`all-MiniLM-L6-v2`) to convert the article text into a 384-dimensional semantic vector.
* **The Math:** We calculate the **cosine similarity** between the new article and recent articles in the DB. If the similarity is `>= 0.75`, the articles are grouped into a **Story Cluster**.
* **Why this matters for credibility:** If a breaking story is *only* reported by an obscure blog and no major outlets (0 matching sources), its credibility takes a massive hit. If the story is clustered alongside Reuters, BBC, and AP, its credibility score is boosted.

### Stage 3: Deep Context Analysis (Ollama + Qwen2.5)
We then feed the article text into our local, privacy-first LLM (Qwen) with a strict prompt structure.
* **What it does:** It performs a qualitative audit, specifically designed to output structured JSON data containing:
  1. The top 5 factual claims made (Factual Extraction).
  2. The emotional Tone (e.g., authoritative, alarmist, neutral).
  3. Bias Indicators (e.g., "omission of opposing viewpoints", "loaded language").
  4. The overarching Framing summary.

### Stage 4: The Final Verdict Algorithm
The frontend displays a dynamic **Credibility Score** (out of 100%) alongside a **Verdict** (e.g., *Likely Credible*, *Needs Verification*, *Potentially Unreliable*). 

This final score is an algorithmic synthesis calculated on the backend (`router_articles.py`):
1. **Isolated Articles (User Posts without matches):** `Credibility Score = 1.0 - Misinformation_Risk_Score`.
2. **Clustered Articles (Aggregated News):** The algorithm applies a mathematical formula that rewards *consensus*. 
   * **Verdict Thresholds:** 
      * Risk < 0.3 AND >= 2 matching sources = **"Likely Credible"**
      * Risk < 0.7 = **"Needs Verification"**
      * Risk >= 0.7 = **"Potentially Unreliable"**
   * **Confidence Score Math** for "Likely Credible": Base 0.6 + (`matching_sources * 0.05`) + (`(1.0 - risk_score) * 0.2`). Capped at 90%.
   * **Example:** A slightly biased article will still receive a "Likely Credible" pass if 5 other verified publishers are reporting the exact same semantic facts in that cluster.

---

## 📡 How the "Fetch News" Button Works

When you click the **"Fetch News"** icon in the sidebar (or when the automated background scheduler runs), it triggers the comprehensive **News Aggregation Pipeline**. 

When a judge asks **"Where do you get your data from?"**, you can walk them through this 3-step fetching process (`services/pipeline.py`):

1. **Multi-Source Aggregation (The Inputs):**
   * The system simultaneously queries **NewsAPI** (via `newsapi.org`) to pull top trending global headlines.
   * It also parses **RSS Feeds** from verified major publishers (e.g., New York Times, BBC, CNN) configured in `config.py`.
   * This guarantees a high-volume, diverse stream of raw news links.

2. **Web Scraping & Extraction (The Content):**
   * API results usually only provide snippets. To do real AI analysis, we need the full text.
   * The backend takes every discovered URL and runs it through `newspaper3k` (a Python library).
   * It attempts to bypass paywalls, strip away ads and HTML formatting, and extract the pure, raw article text and the main image URL.

### 3. Batched AI Processing (The Pipeline):
   * Once the raw text is scraped, it doesn't just sit in the database.
   * The backend instantly queues the new article into the same rigorous **4-Stage AI Pipeline** mentioned above (fake news detection -> embedding/clustering -> LLM framing analysis -> credibility scoring).
   * **The Result:** By the time the frontend refreshes, the raw news links have been transformed into fully verified, clustered Story Cards with interactive credibility scorecards.

---

## 📈 How to Fetch MORE Articles
If the judges ask how to scale the app to thousands of articles, or if you want to pull more data right now, here is exactly how to do it in your codebase:

**1. Add More News Sources (Publishers):**
Open `backend/config.py` (Line 27) and find the `RSS_FEEDS` block. You can add as many valid `.xml` or `.rss` links as you want to the list. For example:
```python
"RSS_FEEDS",
"https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml,"
"https://feeds.bbci.co.uk/news/rss.xml,"
"https://rss.cnn.com/rss/edition.rss,"
"https://feeds.foxnews.com/foxnews/latest," # <-- Added Fox News
"https://www.aljazeera.com/xml/rss/all.xml"  # <-- Added Al Jazeera
```

**2. Increase the NewsAPI Request Limit:**
Open `backend/services/pipeline.py` and find the `_fetch_from_news_api()` function (around Line 50). Change the `pageSize` parameter to pull up to 100 articles per request (the NewsAPI max):
```python
response = client.get(
    "https://newsapi.org/v2/top-headlines",
    params={
        "language": "en",
        "pageSize": 100, # <-- Increased from 20 to 100
        "apiKey": settings.news_api_key
    }
)
```

*(Note: Adding too many articles at once might take several minutes to process when you click "Fetch News" since your local AI models have to read, embed, and analyze every single one!)*

---

## 💡 Key Selling Points for the Judges

1. **Fully Local & Free:** The entire AI pipeline (Qwen via Ollama and sentence-transformers) runs entirely locally. Zero API costs, zero data privacy risks.
2. **Beyond LLMs:** Emphasize that you don't just "ask ChatGPT if it's true." You use **vector embeddings and semantic clustering** to objectively verify if a story is corroborated by multiple platforms.
3. **Transparent Scoring:** Explain that your 5-Factor UI (Source Credibility, Objectivity, Tone, Bias, Fact Consistency) directly maps to stages in your backend pipeline.
4. **Interactive Dashboard:** Point out how the site operates both as a global news aggregator (showing trending coverage maps) AND as a personal verification utility where users can submit their own sketchy links.

Good luck with your presentation! You've built an incredible, technically complex platform.
