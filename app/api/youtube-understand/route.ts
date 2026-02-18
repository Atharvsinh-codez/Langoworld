import { NextRequest, NextResponse } from "next/server"
import { saveSummary, generateSummaryId, type VideoSummaryData } from "@/lib/summary-store"
import { getNextApiKey } from "@/lib/api-key-rotation"
import { queuedRequest, ApiError } from "@/lib/request-queue"

// Force dynamic rendering (disable Next.js fetch caching)
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

// ─── Config ───

const GEMINI_MODEL = "gemini-2.5-flash"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const MAESTRA_URL = "https://website-tools-dot-maestro-218920.uk.r.appspot.com/getYoutubeCaptions"

// ─── Extract Video ID ───

function getVideoId(url: string): string | null {
    // Normalize: add https:// if user pasted www.youtube.com or youtube.com without protocol
    let normalized = url.trim()
    if (/^(www\.)?youtu(\.be|be\.com)/i.test(normalized)) {
        normalized = "https://" + normalized
    }
    const pattern = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([0-9A-Za-z_-]{11})/
    const match = normalized.match(pattern)
    return match ? match[1] : null
}

// ─── Normalize URL ───

function normalizeYouTubeUrl(url: string): string {
    const videoId = getVideoId(url)
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url
}

// ─── Method 1: Maestra.ai API ───

async function getTranscriptMaestra(url: string): Promise<string> {
    console.log(`[YT] Method 1: Maestra.ai...`)

    const res = await fetch(MAESTRA_URL, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "origin": "https://maestra.ai",
            "referer": "https://maestra.ai/",
            "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
        },
        body: JSON.stringify({ videoUrl: url }),
    })

    if (!res.ok) throw new Error(`Maestra ${res.status}`)

    const raw = await res.text()
    if (!raw || raw.length < 30) throw new Error("Maestra empty response")

    const data = JSON.parse(raw)

    if (!data.selectedCaptions) throw new Error("No selectedCaptions in response")

    const transcript = parseWebVTT(data.selectedCaptions)
    if (!transcript || transcript.length < 30) throw new Error("Empty after WebVTT parse")

    console.log(`[YT] ✅ Maestra: ${transcript.length} chars (${data.defaultLanguage || "auto"})`)
    return transcript
}

// ─── Method 2: YouTube page scraping (direct caption tracks) ───

async function getTranscriptYouTubeDirect(url: string): Promise<string> {
    console.log(`[YT] Method 2: YouTube direct scraping...`)

    const pageRes = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
            "Cookie": "CONSENT=YES+cb",
        },
    })

    if (!pageRes.ok) throw new Error(`YouTube page ${pageRes.status}`)

    const html = await pageRes.text()

    // Extract captions JSON from page
    const captionsMatch = html.match(/"captions":(.*?),"videoDetails/s)
    if (!captionsMatch) throw new Error("No captions block in page")

    const captions = JSON.parse(captionsMatch[1])
    const tracks = captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (!tracks || tracks.length === 0) throw new Error("No caption tracks")

    console.log(`[YT]   Found ${tracks.length} tracks: ${tracks.map((t: any) => t.languageCode).join(", ")}`)

    // Pick best track
    const preferred = ["en", "en-US", "hi", "hi-IN"]
    let selected = null
    for (const lang of preferred) {
        selected = tracks.find((t: any) => t.languageCode === lang)
        if (selected) break
    }
    if (!selected) selected = tracks[0]

    // Fetch the caption track using same cookies
    let trackUrl = selected.baseUrl
    if (!trackUrl) throw new Error("No baseUrl")

    // Try JSON3 format
    trackUrl += (trackUrl.includes("?") ? "&" : "?") + "fmt=json3"

    const trackRes = await fetch(trackUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Cookie": "CONSENT=YES+cb",
        },
    })

    if (!trackRes.ok) throw new Error(`Track fetch ${trackRes.status}`)

    const trackText = await trackRes.text()
    if (!trackText || trackText.length < 10) throw new Error("Empty track response")

    // Parse JSON3
    const data = JSON.parse(trackText)
    const events = data.events || []
    const segments: string[] = []

    for (const event of events) {
        const segs = event.segs || []
        const parts = segs.map((s: any) => (s.utf8 || "").trim()).filter((t: string) => t && t !== "\n")
        if (parts.length) segments.push(parts.join(" "))
    }

    const transcript = segments.join(" ")
    if (!transcript || transcript.length < 30) throw new Error("JSON3 transcript empty")

    console.log(`[YT] ✅ YouTube direct: ${transcript.length} chars (${selected.languageCode})`)
    return transcript
}

// ─── Method 3: Invidious public API ───

async function getTranscriptInvidious(videoId: string): Promise<string> {
    console.log(`[YT] Method 3: Invidious API...`)

    const instances = [
        "https://vid.puffyan.us",
        "https://invidious.fdn.fr",
        "https://invidious.privacyredirect.com",
    ]

    for (const instance of instances) {
        try {
            const res = await fetch(`${instance}/api/v1/captions/${videoId}`, {
                signal: AbortSignal.timeout(10000),
            })

            if (!res.ok) continue

            const data = await res.json()
            const captionList = data.captions || data

            if (!Array.isArray(captionList) || captionList.length === 0) continue

            // Pick best caption
            const preferred = ["en", "hi"]
            let selected = null
            for (const lang of preferred) {
                selected = captionList.find((c: any) => c.language_code === lang || c.languageCode === lang)
                if (selected) break
            }
            if (!selected) selected = captionList[0]

            // Fetch the caption content
            const captionUrl = selected.url?.startsWith("http") ? selected.url : `${instance}${selected.url}`
            const captionRes = await fetch(captionUrl, { signal: AbortSignal.timeout(10000) })
            if (!captionRes.ok) continue

            const captionText = await captionRes.text()

            // Parse XML captions
            const matches = captionText.match(/<text[^>]*>(.*?)<\/text>/gs) || []
            const segments = matches.map((m: string) => {
                return m.replace(/<[^>]+>/g, "")
                    .replace(/&amp;/g, "&").replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                    .replace(/\n/g, " ").trim()
            }).filter(Boolean)

            const transcript = segments.join(" ")
            if (transcript.length > 30) {
                console.log(`[YT] ✅ Invidious (${instance}): ${transcript.length} chars`)
                return transcript
            }
        } catch {
            continue
        }
    }

    throw new Error("All Invidious instances failed")
}

// ─── Multi-method transcript fetcher ───

async function getTranscript(url: string): Promise<{ text: string; lang: string }> {
    const normalUrl = normalizeYouTubeUrl(url)
    const videoId = getVideoId(url) || ""

    const methods = [
        () => getTranscriptMaestra(normalUrl),
        () => getTranscriptYouTubeDirect(normalUrl),
        () => getTranscriptInvidious(videoId),
    ]

    for (const method of methods) {
        try {
            const text = await method()
            return { text, lang: "auto" }
        } catch (e: any) {
            console.log(`[YT]   ↳ Failed: ${e.message}`)
        }
    }

    throw new Error("All transcript methods failed")
}

// ─── Parse WebVTT to plain text ───

function parseWebVTT(vtt: string): string {
    const lines = vtt.split("\n")
    const textLines: string[] = []

    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed.startsWith("WEBVTT")) continue
        if (trimmed.startsWith("Kind:")) continue
        if (trimmed.startsWith("Language:")) continue
        if (trimmed.includes("-->")) continue
        if (/^\d+$/.test(trimmed)) continue
        if (trimmed.startsWith("NOTE")) continue
        if (trimmed.startsWith("align:")) continue

        let clean = trimmed
            .replace(/<\/?c>/g, "")
            .replace(/<[\d:.]+>/g, "")
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim()

        if (clean) textLines.push(clean)
    }

    // Deduplicate consecutive lines
    const deduped: string[] = []
    for (const line of textLines) {
        if (deduped.length === 0 || deduped[deduped.length - 1] !== line) {
            deduped.push(line)
        }
    }

    return deduped.join(" ")
}

// ─── Get Video Info ───

async function getVideoInfo(url: string): Promise<{ title: string; channel: string }> {
    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
        if (res.ok) {
            const data = await res.json()
            return { title: data.title || "Unknown", channel: data.author_name || "Unknown" }
        }
    } catch { }
    return { title: "Unknown", channel: "Unknown" }
}

// ─── Chunk Text ───

function chunkText(text: string, size: number = 4000): string[] {
    const words = text.split(" ")
    const chunks: string[] = []
    for (let i = 0; i < words.length; i += size) {
        chunks.push(words.slice(i, i + size).join(" "))
    }
    return chunks
}

// ─── Gemini API (queued + retry-aware) ───

async function callGemini(systemInstruction: string, prompt: string, label: string = "yt-gemini", jsonMode: boolean = false): Promise<string> {
    return queuedRequest(async (attempt) => {
        const apiKey = getNextApiKey()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 90000)

        try {
            const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemInstruction }] },
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 8000,
                        temperature: 0.7,
                        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
                    },
                }),
                signal: controller.signal,
            })

            clearTimeout(timeout)

            if (!res.ok) {
                const err = await res.text()
                throw new ApiError(`Gemini ${res.status}: ${err.substring(0, 200)}`, res.status, apiKey)
            }

            const data = await res.json()
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (!content) throw new ApiError("Gemini returned empty response", undefined, apiKey)
            return { result: content, apiKey }
        } catch (error: any) {
            clearTimeout(timeout)
            if (error.name === "AbortError") {
                throw new ApiError("Gemini request timed out (90s)", undefined, apiKey)
            }
            if (error instanceof ApiError) throw error
            throw new ApiError(error.message, error.status, apiKey)
        }
    }, label)
}

// ─── Cache ───

const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000

function getCached(videoId: string): any | null {
    const entry = cache.get(videoId)
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL) { cache.delete(videoId); return null }
    return entry.data
}

function setCache(videoId: string, data: any) {
    cache.set(videoId, { data, timestamp: Date.now() })
    if (cache.size > 100) {
        const now = Date.now()
        for (const [key, val] of cache) {
            if (now - val.timestamp > CACHE_TTL) cache.delete(key)
        }
    }
}

// ─── Parse JSON ───

function parseJSON(raw: string): any {
    // Step 1: Strip markdown code fences if present
    let cleaned = raw.trim()
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
        cleaned = fenceMatch[1].trim()
    }

    // Step 2: Try parsing as-is
    try { return JSON.parse(cleaned) } catch { }

    // Step 3: Extract outermost JSON object using brace matching
    const startIdx = cleaned.indexOf("{")
    if (startIdx !== -1) {
        let depth = 0
        let endIdx = -1
        for (let i = startIdx; i < cleaned.length; i++) {
            if (cleaned[i] === "{") depth++
            else if (cleaned[i] === "}") {
                depth--
                if (depth === 0) { endIdx = i; break }
            }
        }
        if (endIdx !== -1) {
            const extracted = cleaned.substring(startIdx, endIdx + 1)
            try { return JSON.parse(extracted) } catch { }

            // Step 4: Fix common Gemini JSON issues
            const fixed = extracted
                // Remove trailing commas before } or ]
                .replace(/,\s*([\]}])/g, "$1")
                // Remove control characters (except newlines/tabs)
                .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
                // Fix unescaped newlines inside string values
                .replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n")

            try { return JSON.parse(fixed) } catch { }
        }
    }

    // Step 5: Last resort — try original regex approach
    const objMatch = cleaned.match(/(\{[\s\S]*\})/)
    if (objMatch) {
        const fallback = objMatch[1]
            .replace(/,\s*([\]}])/g, "$1")
            .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
        try { return JSON.parse(fallback) } catch { }
    }

    console.error("[YT] JSON parse failed. First 500 chars:", cleaned.slice(0, 500))
    throw new Error("Could not parse Gemini response as JSON")
}

// ─── Main Route ───

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()

        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 })
        }

        try {
            getNextApiKey() // validate keys exist
        } catch {
            return NextResponse.json({ error: "No Google API keys configured" }, { status: 500 })
        }

        // Step 1: Extract video ID
        const videoId = getVideoId(url)
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
        }
        console.log(`[YT] Video ID: ${videoId}`)

        // Check cache
        const cached = getCached(videoId)
        if (cached) {
            console.log(`[YT] ✅ Cache hit`)
            return NextResponse.json({ ...cached, cached: true })
        }

        // Step 2: Fetch transcript (multi-method fallback)
        let transcript: string
        let transcriptLang: string
        try {
            const result = await getTranscript(url)
            transcript = result.text
            transcriptLang = result.lang
        } catch (e: any) {
            console.log(`[YT] ❌ All transcript methods failed: ${e.message}`)
            return NextResponse.json(
                { error: "Could not extract captions for this video. The video may not have captions available." },
                { status: 422 }
            )
        }

        // Step 3: Get video metadata
        const normalUrl = normalizeYouTubeUrl(url)
        const videoInfo = await getVideoInfo(normalUrl)
        console.log(`[YT] "${videoInfo.title}" by ${videoInfo.channel}`)

        // Step 4: Chunk if needed
        const wordCount = transcript.split(/\s+/).length
        console.log(`[YT] Transcript: ${wordCount} words`)

        let finalText = transcript

        if (wordCount > 4000) {
            const chunks = chunkText(transcript, 4000)
            console.log(`[YT] Chunking ${chunks.length} parts...`)

            const summaries: string[] = []
            for (let i = 0; i < chunks.length; i++) {
                console.log(`[YT]   Chunk ${i + 1}/${chunks.length}...`)
                const summary = await callGemini(
                    "Summarize this transcript chunk concisely, preserving key details.",
                    `Chunk ${i + 1} of ${chunks.length}:\n\n${chunks[i]}`
                )
                summaries.push(summary)
            }

            finalText = summaries.join("\n\n")
            console.log(`[YT] ✅ Merged ${chunks.length} chunks`)
        }

        // Step 5: Final analysis with Gemini
        console.log(`[YT] Analyzing with ${GEMINI_MODEL}...`)

        // Estimate video duration from word count (~150 words per minute of speech)
        const estimatedMinutes = Math.round(wordCount / 150)
        const durationStr = estimatedMinutes >= 60
            ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`
            : `${estimatedMinutes} minutes`

        const prompt =
            `Video Info:\nTitle: ${videoInfo.title}\nChannel: ${videoInfo.channel}\nEstimated Duration: ${durationStr}\n\n` +
            `Transcript:\n${finalText.substring(0, 28000)}`

        const rawResult = await callGemini(
            `You are an expert YouTube video analyst. Analyze the transcript and metadata.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "2-3 paragraph comprehensive summary",
  "keyPoints": [{ "timestamp": "M:SS", "point": "description" }],
  "explanation": "3-5 paragraph conversational explanation as a personal tutor",
  "chapters": [{ "content": "detailed content for this section", "startTime": "M:SS" }]
}

Rules:
- 5-10 key points with REAL timestamps from the transcript (distribute them across the video duration, NOT all "0:00")
- Estimate timestamps based on position within the transcript (e.g. if a point appears 30% through a 20-min video, timestamp should be around "6:00")
- Use "M:SS" format for videos under 1 hour, "H:MM:SS" for longer videos
- 3-5 chapters with detailed content and accurate startTime timestamps spread across the video
- Explanation: engaging, like a tutor
- If transcript is in Hindi, generate output in English
- Everything in English`,
            prompt,
            "yt-analysis",
            true // JSON mode
        )

        console.log(`[YT] ✅ Got ${rawResult.length} chars from Gemini`)

        const result = parseJSON(rawResult)

        // Step 6: Generate TTS-friendly summary
        console.log(`[YT] Generating TTS summary...`)
        let ttsSummary = ""
        try {
            ttsSummary = await callGemini(
                `You are a friendly explainer. Rewrite the following summary as if you're casually explaining it to a friend over coffee. Make it perfect for text-to-speech: conversational, clear, no jargon, no bullet points. Use natural pauses and transitions. Keep it under 500 words. If the original is in Hindi or another language, write in English.`,
                result.summary || finalText.substring(0, 5000)
            )
            console.log(`[YT] ✅ TTS summary: ${ttsSummary.length} chars`)
        } catch (e: any) {
            console.log(`[YT] ⚠ TTS summary failed: ${e.message}`)
            ttsSummary = result.summary || ""
        }

        // Build chapters
        const chaptersData = (result.chapters || []).map((ch: any, i: number) => ({
            id: `yt-ch-${i + 1}-${Date.now()}`,
            title: `Part ${i + 1}`,
            content: `<p>${(ch.content || "").replace(/\n/g, "</p><p>")}</p>`,
            textContent: ch.content || "",
            wordCount: (ch.content || "").split(/\s+/).length,
            startTime: ch.startTime || "0:00",
        }))

        // Step 7: Save to summary store
        const summaryId = generateSummaryId()
        const summaryData: VideoSummaryData = {
            id: summaryId,
            videoId,
            videoUrl: normalUrl,
            videoTitle: videoInfo.title,
            channel: videoInfo.channel,
            summary: result.summary || "",
            transcript,
            keyPoints: (result.keyPoints || []).map((kp: any) => ({
                timestamp: kp.timestamp || "0:00",
                point: kp.point || "",
            })),
            explanation: result.explanation || "",
            ttsSummary,
            chapters: chaptersData,
            createdAt: new Date().toISOString(),
        }
        saveSummary(summaryData)
        console.log(`[YT] ✅ Saved summary: ${summaryId}`)

        const response = {
            summary: result.summary || "",
            keyPoints: summaryData.keyPoints,
            explanation: result.explanation || "",
            chapters: chaptersData,
            transcript,
            ttsSummary,
            summaryPageId: summaryId,
            summaryPageUrl: `/yt/summary/${summaryId}`,
            videoTitle: videoInfo.title,
            channel: videoInfo.channel,
        }

        setCache(videoId, response)
        console.log(`[YT] ✅ Done & cached`)

        return NextResponse.json(response)

    } catch (error: any) {
        console.error("[YT] ❌ Error:", error.message)
        return NextResponse.json({ error: error.message || "Failed to analyze video" }, { status: 500 })
    }
}
