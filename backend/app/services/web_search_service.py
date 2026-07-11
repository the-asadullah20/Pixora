"""
Web search service (Internet Search mode) using Tavily.

Given a text query (the image description from vision_service), this fetches
live web results — articles, docs, product pages, etc. — ranked by relevance.
Raw content from each result is handed off to scraper_service for deeper
extraction when needed.
"""
import logging
from typing import Any

from tavily import TavilyClient

from app.core.config import get_settings

logger = logging.getLogger("pixora.web_search")

_client: TavilyClient | None = None


def _get_client() -> TavilyClient:
    global _client
    if _client is not None:
        return _client
    settings = get_settings()
    if not settings.TAVILY_API_KEY:
        raise RuntimeError("TAVILY_API_KEY is not set in .env")
    _client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    return _client


def search_web(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    """
    Runs a web search and returns a list of results:
    [{title, url, content, score}, ...]
    `content` here is Tavily's own short extracted snippet; for full-page
    scraping, pass the returned URLs to scraper_service.
    """
    client = _get_client()
    response = client.search(
        query=query,
        search_depth="advanced",
        max_results=max_results,
        include_answer=False,
        include_raw_content=False,
    )

    results = []
    for item in response.get("results", []):
        results.append(
            {
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "score": item.get("score", 0.0),
            }
        )
    return results