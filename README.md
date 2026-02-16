<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gemini-2.5--flash-4285F4?logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/lingo.dev-0.115-6C5CE7?logo=translate" alt="lingo.dev" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Cloudflare%20R2-Storage-F38020?logo=cloudflare" alt="R2" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

# 🌍 LangoWorld — AI-Powered Video Intelligence & Translation Platform

> **Summarize any video. Translate to 25+ languages. Listen with AI voice. All from one beautiful canvas.**

LangoWorld transforms any **YouTube video**, **uploaded video file**, or **document** into a structured, multilingual learning experience. Paste a YouTube link, drag-and-drop a file, or type text to translate → get an AI-generated summary, timestamped key points, **Gemini TTS audio narration**, and **instant translation into 25+ languages** — all from a sleek, interactive React Flow canvas workspace with persistent history.

---

## 🎬 What Can You Do?

```
📺 Paste a YouTube URL    → AI summary + key points + chapters + TTS narration
📤 Upload any video       → Gemini video analysis + cloud storage on R2
📄 Upload a document      → AI document understanding + summary
🌐 Translate text         → Pick multiple languages → see results on canvas
🔊 Read Aloud             → Gemini TTS with R2 caching (instant replay)
📜 Translation History    → Persisted to Supabase → survives page reloads
```

---

## ✨ Features at a Glance

| Feature | Description |
|---------|-------------|
| 🎥 **YouTube Summarizer** | Paste any YouTube URL → AI summary with key points, explanation & chapters |
| 📤 **Video Upload & Analysis** | Upload any video file → CDN storage on Cloudflare R2 → Gemini video analysis |
| 📄 **Document Upload** | Upload PDFs, docs & text files → AI-powered document understanding |
| 🌐 **Translation Panel** | Auto-detect source language (backend AI) → select 1 or multiple targets → see translation cards on canvas |
| 🔊 **Read Aloud (Gemini TTS)** | One-click "Read Aloud" on any translation → Gemini TTS with R2 caching |
| 📜 **Persistent Translation History** | All translations saved to Supabase → survive page reloads |
| 🌍 **25+ Languages via [lingo.dev](https://lingo.dev)** | Full UI translation + inline text translation powered by lingo.dev SDK |
| 📝 **Text Selection Popup** | Select any text → Read Aloud or Translate & Replace inline |
| 📥 **Bulk Download** | Select multiple summaries → download full Markdown exports |
| ⚡ **Parallel Processing** | YouTube, Upload & Translation features run simultaneously |
| 🛡️ **Smart API Key Rotation** | Per-key health tracking, 429 cooldowns, auto-recovery for 100+ concurrent users |
| 🚦 **Request Queue** | Concurrency-limited (5 max) Gemini calls with exponential backoff retry |
| 🔐 **Supabase Auth** | Email/password authentication with user profiles & RLS-protected data |
| ☁️ **Cloud Sync** | All summaries & translations synced to Supabase |
| 🎨 **Interactive Canvas** | React Flow workspace with draggable nodes, animated edges & visual workflow |
| 🌙 **Dark/Light Theme** | Full theme support with smooth transitions |
| 🎙️ **Background TTS** | Inngest-powered async audio generation for chapters |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                     Next.js 16 + React 19                        │
│                                                                  │
│  ┌──────────┐   ┌───────────────┐   ┌──────────────────────┐   │
│  │ Landing   │   │  Workspace    │   │ Summary Page          │   │
│  │ Page      │──▶│  /workspace   │──▶│ /yt/summary/[id]      │   │
│  │ GSAP      │   │  React Flow   │   │ TTS • Translate •     │   │
│  │ Animated  │   │  Canvas       │   │ Download • Popup      │   │
│  └──────────┘   └───────┬───────┘   └───────────┬──────────┘   │
│                          │                        │              │
│         ┌────────────────┴────────────────────────┘              │
│         ▼                                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   API Routes (Next.js)                      │  │
│  │                                                             │  │
│  │  /api/youtube-understand  → Gemini summarization (queued)   │  │
│  │  /api/video-understand    → Gemini video analysis (queued)  │  │
│  │  /api/upload-video        → R2 raw binary upload            │  │
│  │  /api/tts                 → Gemini TTS (sync)               │  │
│  │  /api/tts-async           → Gemini TTS (async via Inngest)  │  │
│  │  /api/translate           → lingo.dev SDK translation       │  │
│  │  /api/detect-language     → Auto-detect (proxies to Python) │  │
│  │  /api/youtube-transcript  → Transcript fetcher              │  │
│  │  /api/yt-summary/[id]     → Summary CRUD                   │  │
│  │  /api/username            → Username management             │  │
│  └────────────────────┬───────────────────────────────────────┘  │
│                        │                                         │
└────────────────────────┼─────────────────────────────────────────┘
                         │
      ┌──────────────────┼──────────────────────────┐
      ▼                  ▼                  ▼       ▼
┌──────────┐  ┌─────────────┐  ┌──────────┐ ┌──────────────┐
│ Python   │  │ Google      │  │ lingo.dev│ │ Cloudflare   │
│ Flask    │  │ Gemini API  │  │ SDK      │ │ R2           │
│ Backend  │  │ AI + TTS    │  │ i18n API │ │ Video CDN    │
│ :5123    │  │ Smart Key   │  └──────────┘ └──────────────┘
│ langdetect│  │ Rotation    │
│(auto lang)│  └─────────────┘       ┌──────────────┐
└──────────┘                          │ Supabase     │
                                      │ Auth + DB    │
                                      │ RLS + Sync   │
                                      └──────────────┘
```

---

## 🌐 How lingo.dev Powers LangoWorld

[**lingo.dev**](https://lingo.dev) is the translation backbone of LangoWorld. It provides **real-time, AI-powered translation** across 25+ languages using its SDK directly on the server.

### Integration Architecture

```
User clicks language → LingoProvider (React Context)
                            │
                    ┌───────┴───────┐
                    ▼               ▼
             Cache Hit?        Cache Miss
             Return cached     Call /api/translate
                               │
                               ▼
                    LingoDotDevEngine (Server)
                    from "lingo.dev/sdk"
                    │
                    ├── localizeText()   → Single string
                    └── localizeObject() → Batch translate
                               │
                               ▼
                    Response cached (multi-layer)
```

### Where lingo.dev Is Used

| Layer | File | How |
|-------|------|-----|
| **Server-side API** | `app/api/translate/route.ts` | Initializes `LingoDotDevEngine` from `lingo.dev/sdk` with API key. Exposes `/api/translate` for both single (`localizeText`) and batch (`localizeObject`) translations |
| **UI Translation Context** | `lib/lingo.tsx` | `LingoProvider` React context wraps the entire app. The `useLingo()` hook provides `t()` function for translating UI keys. Calls `/api/translate` with batch payloads |
| **Translation Caching** | `lib/cache.ts` | Multi-layer caching: in-memory `Map` on server, `localStorage` on client with component hash invalidation. Stale cache used as fallback on API failure |
| **Language Switcher** | `components/language-switcher.tsx` | Dropdown with 25 language options. Sets locale in `LingoProvider`, triggering batch re-translation of all `UI_KEYS` |
| **Inline Text Translation** | Summary page popup | Select any text → "Translate & Replace" sends it through `/api/translate` → lingo.dev → replaces inline |
| **Chapter Translation** | `app/api/translate-chapter/` & `translate-chapters/` | Translates individual or bulk video chapter summaries via lingo.dev |

### Server-Side SDK Setup

```typescript
// app/api/translate/route.ts
import { LingoDotDevEngine } from "lingo.dev/sdk"

const lingoEngine = new LingoDotDevEngine({
  apiKey: process.env.LINGO_API_KEY,
  batchSize: 250,
  idealBatchItemSize: 2500,
})

// Single text
const translated = await lingoEngine.localizeText(text, {
  sourceLocale: "en",
  targetLocale: "hi",  // Hindi
})

// Batch translation (used for UI keys)
const translatedObject = await lingoEngine.localizeObject(textObject, {
  sourceLocale: "en",
  targetLocale: "ja",  // Japanese
})
```

### Client-Side Hook

```tsx
// Any component
import { useLingo } from "@/lib/lingo"

function MyComponent() {
  const { t, locale, setLocale } = useLingo()

  return (
    <div>
      <h1>{t("GET STARTED")}</h1>
      {/* Automatically translated when locale ≠ "en" */}
    </div>
  )
}
```

### Translation Flow in Detail

1. **User selects a language** (e.g., Hindi 🇮🇳) in the `LanguageSwitcher`
2. `LingoProvider` checks **local cache** first (component hash + version tracking)
3. On cache miss, sends **batch request** with all UI keys to `/api/translate`
4. Server-side `LingoDotDevEngine.localizeObject()` translates all keys in one API call
5. Results are **cached at 3 levels**: server memory → client localStorage → React state
6. `t("key")` instantly returns the translated string from React state
7. On API failure, **stale cache is used as fallback** — the app never shows broken translations

---

## 🔄 Full Workflow

### YouTube Summarization

1. **Paste URL** → User enters a YouTube video URL into the workspace input
2. **Transcript Extraction** → Python Flask backend (`yt-feature/server.py`) uses `pytubefix` to extract captions. Falls back to `youtube-transcript` npm package if unavailable
3. **AI Analysis** → Transcript is chunked (if >4000 words) and sent to **Gemini 2.5 Flash** through the concurrency-limited request queue. Generates: summary, key points, explanation, TTS-friendly narration
4. **Cloud Save** → Results saved to Supabase with user association (RLS-protected)
5. **Summary Page** → Unique page at `/yt/summary/[id]` with TTS controls, translation, and download

### Video Upload & Analysis

1. **Upload File** → User drags/drops a video file into the upload panel
2. **CDN Upload** → Raw binary sent to Next.js API → uploaded to **Cloudflare R2** via S3-compatible SDK
3. **AI Video Analysis** → Gemini analyzes the video directly (supports video files as input)
4. **Parallel Processing** → Runs independently from YouTube — both features have separate state and can execute simultaneously

### Translation & Read Aloud (Powered by lingo.dev + Gemini TTS + langdetect)

1. **Open Translation Panel** → Click the translation icon on the canvas
2. **Type or paste text** → Enter any text in the input area
3. **Auto-detect source language** → Backend Python `langdetect` (Google's language detection) identifies the language in real-time with confidence score. Shows animated spinner → language flag + "Auto-detected" / "Best guess" / "Low confidence" badge. If detected source matches target, the target auto-swaps
4. **Select target language(s)** → Single or multi-language mode. Source language is auto-excluded from target options
5. **Get instant translations** → Results appear as beautiful cards on the canvas with language flag, accent color & copy button
6. **Read Aloud** → Click "Read Aloud" on any translation card → Gemini TTS generates audio → cached to R2 for instant replay
7. **Translation History** → Every translation is saved to Supabase → the history node appears near feature buttons by default → moves right when panel opens (with smooth animation)
8. **Persistent** → History survives page reloads — no data loss
9. **UI Translation** → Click language switcher → entire interface translates via lingo.dev SDK
10. **Inline Text Selection** → Select text on summary page → popup with "Translate & Replace"

### TTS Audio Pipeline

```
Click "Read Aloud" → POST /api/tts
                         │
                    ┌─────┴─────┐
                    │  R2 Cache  │── Cache HIT → Return audio URL → Play instantly
                    └─────┬─────┘
                          │ Cache MISS
                          ▼
                    Gemini TTS API
                    (text chunking + retry)
                          │
                          ▼
                    PCM → WAV conversion
                          │
                          ▼
                    Upload to Cloudflare R2
                          │
                          ▼
                    Return audio URL → Play
```

> **Fallback**: If Gemini TTS fails, the system automatically falls back to Web Speech API.

---

## ⚡ Scalability & Parallel Operations

LangoWorld is engineered to handle **100+ concurrent users** with these systems:

### Smart API Key Rotation (`lib/api-key-rotation.ts`)

```
Key Pool ── Key #1 ✅ healthy (0 failures)
          ├─ Key #2 ⏸️ cooldown (429 rate-limited, resets in 45s)
          ├─ Key #3 ✅ healthy (1 failure, auto-resets after 5min)
          ├─ Key #4 ❌ unhealthy (3+ consecutive failures)
          └─ Key #5 ✅ healthy → SELECTED
```

- **Per-key health tracking** — failure counts, cooldown timers, total success rate
- **429 cooldown** — rate-limited keys enter 60-second cooldown, skipped automatically
- **Auto-recovery** — failure count resets after 5 minutes of no failures
- **Fallback** — when all keys are unhealthy, uses least-recently-failed key

### Request Queue (`lib/request-queue.ts`)

```
Incoming requests ──┐
                     ├──▶ [Semaphore: max 5 concurrent]
                     │         │
                     │    ┌────┴────┐
                     │    │ Gemini  │──▶ Success → markKeySuccess()
                     │    │ API     │──▶ 429/5xx → Retry (exp backoff)
                     │    │ Call    │──▶ 4xx     → Fail immediately
                     │    └─────────┘
                     │
                     └──▶ [Queue: waiting for slot]
```

- **Max 5 concurrent** Gemini API calls across all users
- **3 retries** with exponential backoff (1s → 2s → 4s + jitter, max 30s)
- **Smart error classification** — retries transient failures (429, 5xx, timeouts), fails fast on permanent errors (400, 403)

### Parallel Feature Execution

YouTube and Upload features run with **completely independent state**:

```tsx
// Workspace page — separate state objects
const [ytLoading, setYtLoading] = useState(false)
const [ytResult, setYtResult] = useState({...})

const [uploadLoading, setUploadLoading] = useState(false)
const [uploadResult, setUploadResult] = useState({...})

// Both can run simultaneously — no blocking
```

The React Flow canvas renders both result sets simultaneously:
- **YouTube results** → Blue edges, positioned left
- **Upload results** → Orange edges, positioned right

---

## 📁 Project Structure

```
LangoWorld/
└── langoworld/                       # Main Next.js application
    ├── app/
    │   ├── page.tsx                  # Landing page (GSAP animated hero)
    │   ├── login/page.tsx            # Supabase email auth
    │   ├── username/page.tsx         # Username setup after signup
    │   ├── workspace/page.tsx        # React Flow canvas workspace
    │   ├── yt/
    │   │   ├── [slug]/page.tsx       # YouTube video page (custom URLs)
    │   │   └── summary/[id]/page.tsx # Summary detail page
    │   ├── video/                    # Uploaded video summary pages
    │   └── api/
    │       ├── youtube-understand/   # Gemini AI summarization (queued)
    │       ├── video-understand/     # Gemini video analysis (queued)
    │       ├── upload-video/         # Cloudflare R2 upload
    │       ├── youtube-transcript/   # Transcript fetcher
    │       ├── translate/            # lingo.dev SDK translation
    │       ├── detect-language/      # Auto-detect language (proxies to Python langdetect)
    │       ├── tts/                  # Synchronous Gemini TTS
    │       ├── tts-async/            # Async TTS trigger
    │       ├── yt-summary/[id]/      # Summary CRUD API
    │       ├── yt-page/              # YouTube page metadata
    │       ├── username/             # Username management
    │       ├── chapters/             # Chapter generation
    │       ├── summarize-chapters/   # AI chapter summarization
    │       ├── translate-chapter/    # Single chapter translation
    │       ├── translate-chapters/   # Bulk chapter translation
    │       ├── merge-audio/          # Audio file merging
    │       ├── zip-audio/            # Audio zip archive creation
    │       ├── scrape/               # Blog content scraper
    │       ├── jobs/                 # Job status tracking
    │       └── inngest/              # Inngest webhook handler
    │
    ├── components/
    │   ├── langoworld-flow.tsx       # React Flow canvas (nodes + edges)
    │   ├── workspace/
    │   │   ├── youtube-input.tsx     # URL input node
    │   │   ├── upload-input.tsx      # Upload trigger node
    │   │   ├── upload-panel.tsx      # Upload dropzone panel
    │   │   └── translation-panel.tsx # Translation panel (auto-detect + multi-lang)
    │   ├── landing/                  # Landing page sections
    │   ├── language-switcher.tsx     # lingo.dev language selector
    │   ├── theme-toggle.tsx          # Dark/light toggle
    │   ├── chapter-card.tsx          # Chapter display card
    │   ├── loading-screen.tsx        # Loading animation
    │   ├── logo.tsx                  # LangoWorld logo
    │   └── ui/                       # Shadcn UI components (55 files)
    │
    ├── lib/
    │   ├── api-key-rotation.ts       # Smart per-key health rotation
    │   ├── request-queue.ts          # Concurrency queue + retry
    │   ├── lingo.tsx                 # LingoProvider i18n context
    │   ├── cache.ts                  # Multi-layer translation cache
    │   ├── component-tracker.ts      # Component hash tracking
    │   ├── r2-client.ts              # Cloudflare R2 S3 client
    │   ├── summary-store.ts          # Summary data types
    │   ├── history-store.ts          # History management
    │   ├── audio-storage.ts          # Audio file management
    │   ├── supabase-browser.ts       # Supabase client (browser)
    │   ├── supabase-server.ts        # Supabase client (server)
    │   ├── supabase-middleware.ts     # Auth middleware
    │   ├── user-id.ts                # User ID utilities
    │   ├── inngest/
    │   │   ├── client.ts             # Inngest client setup
    │   │   └── functions.ts          # Background TTS function
    │   └── utils.ts                  # General utilities
    │
    ├── config/
    │   └── translation-config.ts     # Translation caching config
    │
    ├── yt-feature/                   # Python Flask backend
    │   ├── server.py                 # Flask API server (:5123) — transcript + language detection
    │   ├── requirements.txt          # Python dependencies (incl. langdetect)
    │   ├── services/
    │   │   ├── youtube.py            # Video ID & metadata
    │   │   ├── transcript.py         # Caption/transcript fetcher
    │   │   └── gemini.py             # Gemini API client
    │   └── utils/                    # Python utilities
    │
    ├── middleware.ts                  # Supabase auth middleware
    ├── supabase-schema.sql           # Database schema + RLS policies
    ├── next.config.ts                # Next.js config (body limits)
    ├── vercel.json                   # Vercel deployment config
    └── .env.local                    # Environment variables
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.0.10 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| Shadcn UI | latest | Component library (55 Radix UI components) |
| React Flow | 12.9.3 | Interactive canvas workspace |
| GSAP | 3.14 | Landing page animations |
| Framer Motion | 12.x | Component animations |
| Three.js | 0.182 | 3D shader backgrounds |
| Lucide React | 0.553 | Icons |
| Sonner | 2.x | Toast notifications |
| next-themes | 0.4.6 | Dark/light theme |

### Backend & APIs

| Technology | Purpose |
|-----------|---------|
| Google Gemini (`gemini-2.5-flash`) | AI summarization, video analysis & TTS |
| [lingo.dev](https://lingo.dev) (`v0.115`) | AI-powered translation — 25+ languages |
| Supabase | Authentication, PostgreSQL database, RLS |
| Cloudflare R2 | Video file CDN storage (S3-compatible) |
| Inngest | Background job processing (async TTS) |
| Flask (Python) | YouTube transcript extraction + language detection backend |
| pytubefix | YouTube video metadata & captions |
| langdetect (Python) | Google's language detection — auto-detect source language for translations |

### Data & Security

| Technology | Purpose |
|-----------|---------|
| Supabase Auth | Email/password login with sessions |
| Row-Level Security | Users can only access their own data |
| Supabase RLS Policies | Enforced on profiles, summaries, translations |
| Smart Key Rotation | Per-key health tracking, cooldowns, failover |
| Request Queue | Rate-limit protection with concurrency control |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (recommended: 20+)
- **Python 3.9+** (for transcript extraction)
- **npm** (or yarn/pnpm)
- **Supabase project** — [Create one here](https://supabase.com)
- **API Keys:**
  - Google Gemini API key(s) — [Get here](https://aistudio.google.com/apikey)
  - lingo.dev API key — [Get here](https://lingo.dev)

### Step 1: Clone & Install

```bash
git clone https://github.com/your-username/LangoWorld.git
cd LangoWorld/langoworld

# Install Node.js dependencies
npm install

# Install Python dependencies
cd yt-feature
pip install -r requirements.txt
cd ..
```

### Step 2: Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in the Supabase dashboard
3. Copy and paste the **entire** contents of `supabase-setup.sql` → Click **Run**
4. That's it! All 5 tables, 14 RLS policies, 7 indexes, and 1 trigger are created
5. Enable **Email/Password** auth in Authentication → Providers

### Step 3: Configure Environment Variables

Create `.env.local` in the `langoworld/` root:

```env
# ── Google Gemini API Keys ──
# Comma-separated for smart rotation (recommended: 3+ keys)
GOOGLE_API_KEYS=key1,key2,key3,key4,key5

# Fallback single key (used if GOOGLE_API_KEYS is not set)
GEMINI_API_KEY=your_single_gemini_api_key

# ── lingo.dev Translation ──
LINGO_API_KEY=your_lingo_dev_api_key

# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# ── Cloudflare R2 (Video Upload) ──
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-r2-public-url.dev

# ── Optional ──
NEXT_PUBLIC_APP_URL=http://localhost:3000
TRANSCRIPT_API_URL=http://localhost:5123
TUBEINSIGHT_URL=http://localhost:5123  # Python backend for language detection
```

Create `.env` in `langoworld/yt-feature/`:

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Step 4: Start All Services

You need **3 terminals** running simultaneously:

**Terminal 1 — Next.js Dev Server:**
```bash
cd langoworld
npm run dev
```
→ Opens on `http://localhost:3000`

**Terminal 2 — Python Flask Backend:**
```bash
cd langoworld/yt-feature
python server.py
```
→ Runs on `http://localhost:5123`

**Terminal 3 — Inngest Dev Server:**
```bash
npx inngest-cli@latest dev
```
→ Runs on `http://localhost:8288` (handles background TTS jobs)

### Step 5: Open the App

Navigate to `http://localhost:3000` → Sign up → Set username → Paste a YouTube URL or upload a video!

---

## 🌐 Supported Languages

| Flag | Language | Code | | Flag | Language | Code |
|------|----------|------|-|------|----------|------|
| 🇬🇧 | English | `en` | | 🇮🇳 | हिन्दी (Hindi) | `hi` |
| 🇪🇸 | Español | `es` | | 🇫🇷 | Français | `fr` |
| 🇩🇪 | Deutsch | `de` | | 🇮🇹 | Italiano | `it` |
| 🇧🇷 | Português | `pt` | | 🇯🇵 | 日本語 | `ja` |
| 🇰🇷 | 한국어 | `ko` | | 🇨🇳 | 中文 | `zh` |
| 🇸🇦 | العربية | `ar` | | 🇷🇺 | Русский | `ru` |
| 🇹🇷 | Türkçe | `tr` | | 🇳🇱 | Nederlands | `nl` |
| 🇸🇪 | Svenska | `sv` | | 🇵🇱 | Polski | `pl` |
| 🇹🇭 | ไทย | `th` | | 🇻🇳 | Tiếng Việt | `vi` |
| 🇮🇩 | Bahasa Indonesia | `id` | | 🇺🇦 | Українська | `uk` |
| 🇧🇩 | বাংলা | `bn` | | 🇮🇳 | தமிழ் (Tamil) | `ta` |
| 🇮🇳 | తెలుగు (Telugu) | `te` | | 🇮🇳 | मराठी (Marathi) | `mr` |
| 🇮🇳 | ગુજરાતી (Gujarati) | `gu` | | | | |

All translations powered by **lingo.dev SDK** (`localizeText` + `localizeObject`).

---

## 📜 API Endpoints

### Next.js API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/youtube-understand` | Summarize YouTube video with Gemini (queued + retry) |
| `POST` | `/api/video-understand` | Analyze uploaded video with Gemini (queued + retry) |
| `POST` | `/api/upload-video` | Upload video to Cloudflare R2 (raw binary) |
| `POST` | `/api/tts` | Generate TTS audio (synchronous) |
| `POST` | `/api/tts-async` | Trigger async TTS generation via Inngest |
| `POST` | `/api/translate` | Translate text via lingo.dev SDK |
| `POST` | `/api/detect-language` | Auto-detect source language (proxies to Python langdetect) |
| `POST` | `/api/youtube-transcript` | Fetch video transcript |
| `GET/POST` | `/api/yt-summary/[id]` | Summary CRUD operations |
| `POST` | `/api/yt-page` | YouTube page metadata |
| `POST` | `/api/username` | Set/check username |
| `POST` | `/api/chapters` | Generate chapters from content |
| `POST` | `/api/summarize-chapters` | AI-summarize chapters |
| `POST` | `/api/translate-chapter` | Translate a single chapter |
| `POST` | `/api/translate-chapters` | Translate multiple chapters (batch) |
| `POST` | `/api/merge-audio` | Merge audio files |
| `POST` | `/api/zip-audio` | Create audio zip archive |
| `GET` | `/api/jobs/[id]` | Check background job status |
| `POST` | `/api/inngest` | Inngest webhook handler |
| `POST` | `/api/scrape` | Blog content scraper |

### Python Flask API (port 5123)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/detect-language` | Auto-detect language using Google's `langdetect` (returns code + confidence) |
| `POST` | `/api/transcript` | Extract YouTube transcript |
| `POST` | `/api/video-info` | Get video metadata |

---

## 🗄️ Database Schema

LangoWorld uses **Supabase PostgreSQL** with Row-Level Security:

| Table | Purpose | Key Columns | RLS |
|-------|---------|-------------|-----|
| `profiles` | User profiles | `username`, `avatar_url`, `display_name` | Users can read all, update own |
| `summaries` | All video summaries (YouTube + uploads) | `video_url`, `video_title`, `summary`, `source` | Full CRUD on own data only |
| `translations` | Cached translations per summary per language | `summary_id`, `language`, `content` | CRUD via summary ownership |
| `translation_history` | Persistent translation history | `source_text`, `source_lang`, `translations` (JSONB) | Users access own data only |

### `translation_history` Table Detail

```sql
CREATE TABLE translation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    source_lang VARCHAR(10) NOT NULL DEFAULT 'en',
    translations JSONB NOT NULL DEFAULT '[]',  -- [{targetLang, translatedText, langName, flag}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Schema files: `supabase-schema.sql` + `supabase/migrations/create_translation_history.sql`

---

## ☁️ Deployment

### Vercel (Recommended for Next.js)

```bash
npm run build   # Verify build passes
vercel deploy   # Deploy to Vercel
```

Set all environment variables in Vercel dashboard.

### Render (Full-Stack)

Deploy both services on [Render](https://render.com):

| Service | Type | Root Directory | Start Command |
|---------|------|----------------|---------------|
| `langoworld` | Node Web Service | `langoworld` | `npm start` |
| `langoworld-transcript-api` | Python Web Service | `langoworld/yt-feature` | `python server.py` |

**Render Deployment Architecture:**

```
                    ┌─────────────────────────┐
                    │      render.com          │
                    │                          │
   ┌────────────────┤                          │
   │ Web Service 1  │  Next.js App (:10000)    │
   │ langoworld     │  + Supabase + R2 + lingo │
   │ (Node)         │                          │
   └────────────────┤                          │
                    │                          │
   ┌────────────────┤                          │
   │ Web Service 2  │  Flask API (:10000)      │
   │ transcript-api │  youtube transcript      │
   │ (Python)       │                          │
   └────────────────┤                          │
                    └──────────┬───────────────┘
                               │
                    ┌──────────┴───────────────┐
                    │   External Services       │
                    │   • Supabase (Auth + DB)  │
                    │   • Cloudflare R2 (CDN)   │
                    │   • Inngest (Background)  │
                    │   • lingo.dev (i18n)      │
                    │   • Google Gemini (AI)    │
                    └──────────────────────────┘
```

> ⚠️ **Note:** Render free tier sleeps after 15 min of inactivity. Use Starter plan ($7/mo) for always-on.

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEYS` | Recommended | Comma-separated Gemini API keys (smart rotation) |
| `GEMINI_API_KEY` | Fallback | Single Gemini API key |
| `LINGO_API_KEY` | **Yes** | lingo.dev translation API key |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon key |
| `R2_ACCOUNT_ID` | For uploads | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | For uploads | R2 access key |
| `R2_SECRET_ACCESS_KEY` | For uploads | R2 secret key |
| `R2_BUCKET_NAME` | For uploads | R2 bucket name |
| `R2_PUBLIC_URL` | For uploads | R2 public URL |
| `NEXT_PUBLIC_APP_URL` | Production | Deployed app URL |
| `TRANSCRIPT_API_URL` | Production | Flask backend URL (for transcript) |
| `TUBEINSIGHT_URL` | Production | Flask backend URL (for language detection) |
| `INNGEST_EVENT_KEY` | Production | Inngest event key |
| `INNGEST_SIGNING_KEY` | Production | Inngest signing key |

---

## 🧪 Build for Production

```bash
cd langoworld
npm run build
npm start
```

Production build enables:
- React Compiler optimization
- Turbopack bundling
- Server-side rendering
- Static page generation

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

## 🙏 Credits

| Technology | What it powers |
|------------|----------------|
| **[lingo.dev](https://lingo.dev)** | AI-powered multilingual translation (25+ languages) |
| **[Google Gemini](https://ai.google.dev)** | AI summarization, video analysis & TTS audio generation |
| **[Supabase](https://supabase.com)** | Authentication, PostgreSQL database & real-time sync |
| **[Cloudflare R2](https://developers.cloudflare.com/r2/)** | Video & audio CDN storage |
| **[Inngest](https://www.inngest.com)** | Background job processing (async TTS) |
| **[Shadcn UI](https://ui.shadcn.com)** | Beautiful, accessible component library |
| **[React Flow](https://reactflow.dev)** | Interactive canvas workspace |
| **[GSAP](https://gsap.com)** | Premium landing page animations |
| **[Framer Motion](https://www.framer.com/motion/)** | Component animations & transitions |
| **[Three.js](https://threejs.org)** | 3D shader backgrounds |
| **pytubefix** | YouTube data extraction |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  <strong>Built with ❤️ by Atharv</strong>
  <br/>
  <sub>Powered by Gemini AI • lingo.dev • Supabase • Cloudflare R2</sub>
</p>
