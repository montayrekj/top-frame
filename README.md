# TopFrame

An Instagram post curator that uses AI vision to pick the best photos from your uploads, then generates captions and song recommendations.

## What it does

1. Upload any number of photos
2. Describe a mood or pick a preset
3. AI scores and selects the best shots, avoiding near-duplicates
4. Get three caption options (heartfelt / witty / poetic) and five song picks

## Tech stack

- **Frontend** — React + Vite
- **Backend** — Node.js + Express
- **AI** — Claude Haiku (cloud) or Ollama `qwen2.5vl:7b` (local), switchable via a toggle in the UI

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your Anthropic API key** (only needed for Claude Haiku mode)
   ```bash
   cp .env.example .env
   # edit .env and set ANTHROPIC_API_KEY
   ```

3. **Install Ollama** (only needed for local mode)

   Download and install the [Ollama macOS app](https://ollama.com/download/mac), then pull the model:
   ```bash
   ollama pull qwen2.5vl:7b
   ```

4. **Run**
   ```bash
   npm run dev
   ```

   This starts the Express server (port 3001), Vite dev server (port 5173), and opens the Ollama app.

## Notes

- Images are resized to 1024px on the longest side before upload to keep payloads small
- Claude Haiku processes up to 40 images per batch; Ollama is capped at 3 per batch due to context window limits
- Theme (light/dark) and provider preference are saved in `localStorage`
