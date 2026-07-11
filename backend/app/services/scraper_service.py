"""
Web scraper service.

Fetches and cleans full page content from URLs returned by web_search_service.
Tavily's own snippet is often short — this pulls the fuller page text so the
RAG chain has more to work with, but keeps a hard length cap so we don't
blow up the LLM context window with one giant page.
"""
import asyncio
import logging

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("pixora.scraper")

MAX_CHARS_PER_PAGE = 6000
REQUEST_TIMEOUT = 10.0
MAX_CONCURRENT_SCRAPES = 5

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
    )
}

# Tags that never contain useful body content — strip before extracting text.
_NOISE_TAGS = ["script", "style", "nav", "footer", "header", "form", "noscript", "svg"]


def _clean_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(_NOISE_TAGS):
        tag.decompose()

    text = soup.get_text(separator=" ", strip=True)
    text = " ".join(text.split())  # collapse whitespace
    return text[:MAX_CHARS_PER_PAGE]


async def scrape_url(url: str) -> str:
    """Fetches a URL and returns cleaned, plain-text page content. Returns "" on failure."""
    try:
        async with httpx.AsyncClient(
            headers=_HEADERS, timeout=REQUEST_TIMEOUT, follow_redirects=True
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            return _clean_html(response.text)
    except Exception as e:
        logger.warning("Failed to scrape %s: %s", url, e)
        return ""


async def scrape_urls(urls: list[str]) -> dict[str, str]:
    """Scrapes multiple URLs concurrently (bounded). Returns {url: cleaned_text}."""
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_SCRAPES)

    async def _bounded_scrape(url: str) -> tuple[str, str]:
        async with semaphore:
            return url, await scrape_url(url)

    results = await asyncio.gather(*[_bounded_scrape(u) for u in urls])
    return {url: text for url, text in results}