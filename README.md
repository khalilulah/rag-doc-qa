# DocQA — AI-Powered RAG Document Q&A

Upload a PDF, ask questions about it, and get answers grounded in the document — with citations back to the exact page they came from.

**Live demo:** https://rag-doc-qa-rust.vercel.app/

---

## Why this project exists

this is a working Retrieval-Augmented Generation (RAG) pipeline: the model never sees the whole document, only the specific chunks retrieved as relevant to the question being asked, and every answer is traceable back to a page number. Building it end-to-end (chunking strategy, vector search, prompt construction, streaming, and real deployment debugging) is what this project is meant to demonstrate.

## How it works

```
Upload flow:
  PDF → extract text (per page) → split into overlapping chunks →
  embed each chunk → store (text + embedding + page number) in Postgres

Query flow:
  Question → embed the question → find the most similar chunks (vector search) →
  build a prompt containing ONLY those chunks → stream an answer from the LLM →
  return the answer + which pages it came from
```

The model is never handed the full document. It's handed a handful of retrieved chunks, and the prompt explicitly instructs it to answer only from that context — this is the actual mechanism that makes the app "grounded" rather than just an LLM with some text pasted above it.

## Stack

- **Frontend:** Next.js (App Router), React, Geist / Geist Mono
- **Backend:** Next.js API routes (Node.js runtime)
- **Database + vector store:** Supabase (Postgres + pgvector)
- **Embeddings:** Google Gemini (`gemini-embedding-001`)
- **Generation:** Groq (`llama-3.3-70b-versatile`), streamed token-by-token
- **PDF extraction:** `unpdf` (serverless-safe PDF.js wrapper)

Every piece of this stack is free-tier — no paid infrastructure required to run it.

## Design decisions worth knowing

**Chunking is per-page, with overlap.** Each chunk is capped at ~800 characters with 150 characters of overlap between consecutive chunks. Per-page chunking means a chunk never spans two pages, which is what makes exact page-number citation possible — the tradeoff is a small loss of continuity right at page breaks, which is the right tradeoff for an app whose whole point is citation accuracy.

**Embeddings are 3072-dimensional, with no vector index.** Gemini's embedding model outputs 3072 dimensions by default. pgvector's HNSW index type has a hard 2000-dimension ceiling, so indexing wasn't an option without reducing dimensionality (which requires manual normalization Gemini doesn't do below 3072 — extra complexity with real risk of silently wrong similarity scores). Instead, `match_chunks` does an exact sequential scan. At this app's scale (one document, a few hundred chunks at a time) that's faster than the overhead an approximate index would add — HNSW exists to solve a problem this app doesn't have yet.

**Documents expire after 2 hours.** There's no login — a session is just a cookie. A scheduled Postgres job (`pg_cron`) deletes any document (and its chunks, via cascade) older than 2 hours, rather than trying to detect when a user's tab closes, which browsers don't reliably report.

**Answers stream token-by-token, not all at once.** `/api/query` opens the retrieval step synchronously (fast — one embedding call, one DB query), then streams the LLM's response as newline-delimited JSON events (`citations` first, then `token` events, then `done`). The frontend reads the response body incrementally rather than waiting for `res.json()`. This is the same mechanism Claude/ChatGPT use, and it noticeably improves perceived latency — the first words appear almost immediately instead of the user waiting for the full answer to generate.

**Citations are returned as structured data, separate from the answer text.** The prompt explicitly instructs the model not to self-cite ("don't mention chunks or pages") — citations are rendered by the frontend from the `citations` array the backend already computed, deduplicated by page. Two sources of the same information (one in prose, one structured) is redundant and worse UX than one clean source.

## A real debugging story (kept in, deliberately)

PDF parsing broke twice during deployment to Vercel, in two different ways, both from the same root cause: `pdf-parse` (which wraps Mozilla's PDF.js) assumes a browser environment. Locally it failed trying to load a Web Worker file; on Vercel it failed with `DOMMatrix is not defined` — a browser-only API PDF.js references internally even for plain text extraction. Rather than patch around it a third time, the fix was switching to `unpdf`, a PDF.js wrapper purpose-built for serverless/edge runtimes with browser globals already mocked out. Recognizing "this is the same class of problem showing up differently" instead of patching symptoms one at a time was a big part of what this project taught.

## Known limitations / honest tradeoffs

- Scanned/image-only PDFs won't extract text (no OCR) — the app will report "no extractable text found."
- Groq's free tier is rate-limited (30 req/min) — fine for demo use, not for concurrent production traffic.
- Supabase's free tier pauses projects after 7 days of inactivity — the first request after a pause will be slow while it wakes up.
- Chunking splits on character count, not sentence boundaries — a reasonable v2 improvement.

## Planned next

- Support uploading additional files mid-conversation, so a session can span more than one document.

## Running it locally

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
```

Run the SQL in `supabase/schema.sql` against your Supabase project, then:

```bash
npm run dev
```
