import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';

config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '200mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const OLLAMA_MODEL = 'qwen2.5vl:7b';
const OLLAMA_BASE_URL = 'http://localhost:11434/v1';

// Unified vision call — abstracts Anthropic SDK vs Ollama OpenAI-compat API.
async function callVision(provider, contentBlocks, prompt, maxTokens) {
  if (provider === 'ollama') {
    const openaiContent = contentBlocks.map((block) => {
      if (block.type === 'text') return { type: 'text', text: block.text };
      return {
        type: 'image_url',
        image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` },
      };
    });
    openaiContent.push({ type: 'text', text: prompt });

    const res = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: openaiContent }],
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
  }

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: [...contentBlocks, { type: 'text', text: prompt }] }],
  });
  return response.content[0].text.trim();
}

app.post('/api/analyze', upload.array('images', 200), async (req, res) => {
  try {
    const files = req.files;
    const mood = req.body.mood || '';
    const targetCount = Math.min(parseInt(req.body.count) || 20, 20);
    const provider = req.body.provider === 'ollama' ? 'ollama' : 'anthropic';

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded.' });
    }

    if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
    }

    // Local models have tiny context windows — use a much smaller batch size
    const BATCH_SIZE = provider === 'ollama' ? 3 : 40;
    const scores = new Array(files.length).fill(0);

    const batches = [];
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      batches.push({ start: i, files: files.slice(i, i + BATCH_SIZE) });
    }

    for (const batch of batches) {
      const contentBlocks = [];
      batch.files.forEach((file, idx) => {
        const globalIdx = batch.start + idx;
        contentBlocks.push({ type: 'text', text: `[Image ${globalIdx}]` });
        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.mimetype || 'image/jpeg',
            data: file.buffer.toString('base64'),
          },
        });
      });

      const batchPrompt = `You are an expert Instagram curator and photographer. Analyze the images above (labeled [Image 0], [Image 1], etc. with global indices starting at ${batch.start}).

${mood ? `The user's desired mood / theme for the post: "${mood}"` : 'No specific mood provided — judge purely on photo quality and aesthetic.'}

For EACH image, assign a score from 1–10 based on:
- Technical quality (sharpness, exposure, focus)
- Composition and framing
- Aesthetic appeal and Instagram-worthiness
- ${mood ? 'Relevance to the stated mood/theme' : 'General visual storytelling strength'}

Return ONLY a JSON array of objects, no explanation, no markdown fences:
[{"index": <global_index>, "score": <1-10>, "reason": "<one sentence>"},...]`;

      const raw = await callVision(provider, contentBlocks, batchPrompt, 4096);
      const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
      const batchScores = JSON.parse(jsonStr);
      for (const item of batchScores) {
        if (item.index >= 0 && item.index < files.length) {
          scores[item.index] = item.score;
        }
      }
    }

    const ranked = scores
      .map((score, index) => ({ index, score }))
      .sort((a, b) => b.score - a.score);

    const maxPool = provider === 'ollama' ? 3 : 40;
    const poolSize = Math.min(ranked.length, Math.max(targetCount * 3, targetCount + 5), maxPool);
    const pool = ranked.slice(0, poolSize);

    const poolContentBlocks = [];
    pool.forEach(({ index, score }, pos) => {
      const file = files[index];
      poolContentBlocks.push({
        type: 'text',
        text: `[Candidate ${pos} | original_index:${index} | score:${score.toFixed(1)}]`,
      });
      poolContentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.mimetype || 'image/jpeg',
          data: file.buffer.toString('base64'),
        },
      });
    });

    const diversityPrompt = `You are an expert Instagram curator. From the ${pool.length} candidate photos above (labeled [Candidate 0 … ${pool.length - 1}]), select exactly ${targetCount} for an Instagram carousel post.

${mood ? `Post mood / theme: "${mood}"` : 'No specific mood — prioritise quality and variety.'}

STRICT RULES — you must follow all of these:
1. NEVER select two photos that look nearly identical or are clearly taken within seconds of each other (burst shots, slight pan/zoom, same scene same angle).
2. If you see a group of near-duplicate shots (like multiple sunset photos from the same spot), pick ONLY the single best one from that group.
3. Maximise visual variety across the final set: mix of subjects, angles, distances, and moments.
4. Within those diversity constraints, prefer higher-scored candidates.
5. Return EXACTLY ${targetCount} indices (or fewer only if the pool itself has fewer unique visuals).

Return ONLY a JSON array of the chosen original_index values in the order they should appear in the carousel, no explanation, no markdown fences:
[<original_index>, <original_index>, ...]`;

    const diversityRaw = await callVision(provider, poolContentBlocks, diversityPrompt, 512);
    const chosenIndices = JSON.parse(
      diversityRaw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')
    );

    const poolIndexSet = new Set(pool.map((p) => p.index));
    const selectedIndices = chosenIndices
      .filter((i) => Number.isInteger(i) && poolIndexSet.has(i))
      .slice(0, targetCount);

    const selected = selectedIndices.map((index) => ({ index, score: scores[index] }));

    const selectedContentBlocks = [];
    selected.forEach(({ index }, pos) => {
      const file = files[index];
      selectedContentBlocks.push({ type: 'text', text: `[Selected Photo ${pos + 1}]` });
      selectedContentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.mimetype || 'image/jpeg',
          data: file.buffer.toString('base64'),
        },
      });
    });

    const captionSongPrompt = `You are a creative Instagram content strategist. I've selected ${selected.length} photos for an Instagram carousel post.

${mood ? `Post mood / theme: "${mood}"` : 'No specific mood — derive the vibe from the photos.'}

Generate:
1. Three distinct Instagram captions (vary the tone: one heartfelt, one punchy/witty, one poetic). Each caption should include relevant emojis and 5–8 hashtags.
2. Five song recommendations that perfectly match the vibe of this post (include artist name and a brief reason why it fits).

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "captions": [
    {"tone": "heartfelt", "text": "..."},
    {"tone": "witty", "text": "..."},
    {"tone": "poetic", "text": "..."}
  ],
  "songs": [
    {"title": "...", "artist": "...", "reason": "..."},
    ...
  ]
}`;

    const captionRaw = await callVision(provider, selectedContentBlocks, captionSongPrompt, 2048);
    const { captions, songs } = JSON.parse(
      captionRaw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')
    );

    res.json({ selectedIndices, scores: scores.map((score, index) => ({ index, score })), captions, songs });
  } catch (err) {
    console.error('Error in /api/analyze:', err);

    const msg = err.message || '';
    let friendly = msg;

    if (msg.includes('credit balance is too low') || (err.status === 400 && msg.includes('credit'))) {
      friendly = 'Your Anthropic API credit balance is too low. Add credits at console.anthropic.com/settings/billing.';
    } else if (err.status === 401 || msg.includes('invalid x-api-key') || msg.includes('Invalid API')) {
      friendly = 'Invalid API key. Check that ANTHROPIC_API_KEY in your .env file is correct.';
    } else if (err.status === 429) {
      friendly = 'Rate limited by Anthropic API. Wait a moment and try again.';
    } else if (err.status === 529 || msg.includes('overloaded')) {
      friendly = 'Anthropic API is temporarily overloaded. Try again in a few seconds.';
    } else if (msg.includes('Ollama error') || msg.includes('ECONNREFUSED')) {
      friendly = 'Could not reach Ollama. Make sure it is running: run "ollama serve" in a terminal.';
    }

    res.status(500).json({ error: friendly });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`TopFrame server running on http://localhost:${PORT}`);
  });
}

export default app;
