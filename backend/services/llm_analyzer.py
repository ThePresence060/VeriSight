"""LLM Analyzer — deep content analysis using Qwen via Ollama."""

import json
import re
import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)

ANALYSIS_PROMPT = """Analyze the following news article and provide a structured JSON response with these fields:

1. "claims": A list of the key factual claims made in the article (max 5 claims).
2. "framing": A one-sentence description of how the article frames the story (e.g., "The article frames the policy change as a positive step for economic growth").
3. "tone": The emotional tone of the article. Choose one from this spectrum: "neutral", "positive", "negative", "alarmist", "celebratory", "critical", "sympathetic", "sarcastic", "authoritative", "urgent".
4. "bias_indicators": A list of specific bias indicators found (e.g., "loaded language", "omission of opposing viewpoint", "appeal to emotion", "sensationalism", "political leaning"). Be specific. Return an empty list if truly no bias is detected.
5. "source_credibility_score": An integer from 0 to 100 estimating how credible the sources cited in this article appear (100 = highly credible sources, 0 = no credible sources).
6. "factual_accuracy_score": An integer from 0 to 100 estimating how factually accurate the claims in this article are likely to be (100 = all claims appear verifiable and accurate, 0 = claims are demonstrably false or unverifiable).
7. "objectivity_score": An integer from 0 to 100 measuring how objective the writing is (100 = perfectly neutral and balanced, 0 = extremely biased or one-sided).
8. "tone_framing_score": An integer from 0 to 100 measuring how neutral the tone and framing are (100 = completely neutral reporting, 0 = highly manipulative or sensational).
9. "bias_score": An integer from 0 to 100 measuring how free from bias the article is (100 = no detectable bias, 0 = extreme bias throughout).
10. "fake_news_likelihood": An integer from 0 to 100 estimating how likely this article is fake or misleading news (0 = definitely real/credible news, 100 = almost certainly fake/fabricated). Consider: Are claims verifiable? Are sources real? Is the language manipulative? Does it contain known misinformation patterns?

IMPORTANT SCORING GUIDELINES:
- Be discriminating. Do NOT give every article similar scores. A well-sourced Reuters report should score very differently from a conspiracy blog post.
- If the article contains obviously false claims, unverifiable sources, or known misinformation, give LOW scores for accuracy and credibility, and a HIGH fake_news_likelihood.
- If the article cites official sources, uses neutral language, and makes verifiable claims, give HIGH scores.

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanation.

Article Title: {title}

Article Text: {text}
"""


def analyze_article(title: str, text: str) -> dict:
    """
    Analyze an article using Qwen via Ollama (synchronous).
    """
    if not text or len(text.strip()) < 30:
        return _fallback_response("Insufficient text")

    truncated_text = text[:2000]
    prompt = ANALYSIS_PROMPT.format(title=title, text=truncated_text)

    try:
        with httpx.Client(timeout=settings.llm_timeout_seconds) as client:
            response = client.post(
                f"{settings.ollama_base_url}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 800,
                        "top_p": 0.9,
                    },
                },
            )
            response.raise_for_status()

        result_text = response.json().get("response", "")
        logger.info(f"[LLM RAW] First 500 chars: {result_text[:500]}")
        parsed = _parse_llm_response(result_text)
        logger.info(f"[LLM PARSED] scores: src={parsed.get('source_credibility_score')}, fact={parsed.get('factual_accuracy_score')}, obj={parsed.get('objectivity_score')}, tone_score={parsed.get('tone_framing_score')}, bias={parsed.get('bias_score')}, fake={parsed.get('fake_news_likelihood')}")
        return parsed

    except httpx.TimeoutException:
        logger.warning(f"LLM analysis timed out after {settings.llm_timeout_seconds}s")
        return _fallback_response("Analysis timed out")

    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama. Is it running?")
        return _fallback_response("Ollama connection failed")

    except Exception as e:
        logger.error(f"LLM analysis failed: {e}")
        return _fallback_response(str(e))


def _parse_llm_response(response_text: str) -> dict:
    """Parse the LLM response into structured data."""
    # Try direct JSON parse
    try:
        data = json.loads(response_text.strip())
        return _validate_analysis(data)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON from markdown code blocks
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response_text, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group(1))
            return _validate_analysis(data)
        except json.JSONDecodeError:
            pass

    # Try to find JSON object in text
    json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group(0))
            return _validate_analysis(data)
        except json.JSONDecodeError:
            pass

    logger.warning(f"Could not parse LLM response as JSON: {response_text[:200]}")
    return _fallback_response("Could not parse LLM response")


def _clamp_score(value, default=None) -> int | None:
    """Clamp a score value to 0-100 range."""
    try:
        score = int(value)
        return max(0, min(100, score))
    except (TypeError, ValueError):
        return default


def _validate_analysis(data: dict) -> dict:
    """Validate and normalize the analysis dictionary."""
    return {
        "claims": data.get("claims", [])[:5] if isinstance(data.get("claims"), list) else [],
        "framing": str(data.get("framing", ""))[:500],
        "tone": str(data.get("tone", "unknown")),
        "bias_indicators": (
            data.get("bias_indicators", [])
            if isinstance(data.get("bias_indicators"), list)
            else []
        ),
        "source_credibility_score": _clamp_score(data.get("source_credibility_score")),
        "factual_accuracy_score": _clamp_score(data.get("factual_accuracy_score")),
        "objectivity_score": _clamp_score(data.get("objectivity_score")),
        "tone_framing_score": _clamp_score(data.get("tone_framing_score")),
        "bias_score": _clamp_score(data.get("bias_score")),
        "fake_news_likelihood": _clamp_score(data.get("fake_news_likelihood")),
    }


def _fallback_response(reason: str) -> dict:
    """Return a fallback response when analysis fails."""
    return {
        "claims": [],
        "framing": f"Analysis unavailable: {reason}",
        "tone": "unknown",
        "bias_indicators": [],
        "source_credibility_score": None,
        "factual_accuracy_score": None,
        "objectivity_score": None,
        "tone_framing_score": None,
        "bias_score": None,
        "fake_news_likelihood": None,
    }


def check_ollama_status() -> bool:
    """Check if Ollama is running and the model is available."""
    try:
        with httpx.Client(timeout=5) as client:
            resp = client.get(f"{settings.ollama_base_url}/api/tags")
            resp.raise_for_status()
            models = resp.json().get("models", [])
            model_names = [m.get("name", "").split(":")[0] for m in models]
            return settings.ollama_model in model_names
    except Exception:
        return False
