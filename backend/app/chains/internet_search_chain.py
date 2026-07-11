"""
Internet Search chain.

Flow:
  1. Vision: analyze the uploaded image -> rich text description
  2. Tavily: web search using that description as the query
  3. Scraper: pull fuller page content for the top results (Tavily's own
     snippet is often too short for a good answer)
  4. Return (description, sources) — same shape as picture_search_chain,
     so the endpoint can call rag_service.generate_answer_stream() the
     same way regardless of which mode was used.
"""
import logging
from typing import Any

from app.services import scraper_service, vision_service, web_search_service

logger = logging.getLogger("pixora.chains.internet_search")

# How many top results get a full-page scrape (rest just use Tavily's snippet,
# to keep latency reasonable — scraping every result would be slow).
SCRAPE_TOP_N = 3


async def search_by_image(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    max_results: int = 5,
) -> tuple[str, list[dict[str, Any]]]:
    """
    Runs the Internet Search retrieval pipeline.
    Returns (image_description, sources) ready for rag_service.
    """
    description = await vision_service.analyze_image(image_bytes, mime_type)
    logger.info("Image analyzed: %s", description[:120])

    web_results = web_search_service.search_web(description, max_results=max_results)

    # Scrape full content for the top few results to enrich the context.
    urls_to_scrape = [r["url"] for r in web_results[:SCRAPE_TOP_N] if r["url"]]
    scraped = await scraper_service.scrape_urls(urls_to_scrape) if urls_to_scrape else {}

    sources = []
    for result in web_results:
        full_text = scraped.get(result["url"], "")
        # Prefer the full scrape if it's meaningfully longer than Tavily's snippet.
        content = full_text if len(full_text) > len(result["content"]) else result["content"]
        sources.append(
            {
                "source": result["url"] or result["title"],
                "content": content,
                "score": result["score"],
            }
        )

    return description, sources