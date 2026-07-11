# Pixora Backend

FastAPI + LangChain backend for Pixora — an image-to-search multimodal RAG platform.

## Stack
- **FastAPI** — API framework
- **LangChain** — AI pipeline orchestration
- **Google Gemini Vision** — image understanding & embeddings
- **Pinecone** — vector database
- **Firebase Admin** — auth verification
- **uv** — dependency management
- **Railway** — deployment

## Project Structure
```
app/
├── main.py                  # FastAPI entrypoint
├── core/                    # config, security, logging
├── api/v1/                  # routers & endpoints (auth, search, upload, health)
├── services/                # Gemini vision, embeddings, Pinecone, web search, scraper, RAG
├── models/                  # Pydantic schemas
├── chains/                  # LangChain pipelines (picture search / internet search)
└── utils/                   # firebase helpers, image utils
```
This is currently a **skeleton** — endpoints and services are stubbed with TODOs.
Logic will be filled in incrementally.

## Local setup
```bash
# install uv if you don't have it
curl -LsSf https://astral.sh/uv/install.sh | sh

# install deps + create venv
uv sync

# copy env template and fill in keys
cp .env.example .env

# run the dev server
uv run uvicorn app.main:app --reload
```

Visit `http://localhost:8000/health` to confirm it's running.

## Docker
```bash
docker build -t pixora-backend .
docker run -p 8000:8000 --env-file .env pixora-backend
```

## Deploy to Railway
1. Push this repo to GitHub.
2. Create a new Railway project → Deploy from GitHub repo.
3. Railway will detect the `Dockerfile` automatically (config in `railway.json`).
4. Add all variables from `.env.example` under Railway → Variables.
5. Set `ALLOWED_ORIGINS` to your Vercel frontend URL once deployed.

## Environment Variables
See `.env.example` for the full list (Gemini, Pinecone, Firebase, Tavily).
