import { NextRequest, NextResponse } from "next/server"
import { YoutubeTranscript } from "youtube-transcript"

function extractVideoId(url: string): string | null {
    // Normalize: add https:// if user pasted www.youtube.com or youtube.com without protocol
    let normalized = url.trim()
    if (/^(www\.)?youtu(\.be|be\.com)/i.test(normalized)) {
        normalized = "https://" + normalized
    }
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ]

    for (const pattern of patterns) {
        const match = normalized.match(pattern)
        if (match) return match[1]
    }

    return null
}

function formatTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    return `${m}:${s.toString().padStart(2, "0")}`
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { url } = body

        if (!url || typeof url !== "string") {
            return NextResponse.json(
                { error: "YouTube URL is required" },
                { status: 400 }
            )
        }

        const videoId = extractVideoId(url)
        if (!videoId) {
            return NextResponse.json(
                { error: "Invalid YouTube URL. Please provide a valid YouTube video link." },
                { status: 400 }
            )
        }

        console.log(`[YouTube] Extracting transcript for video: ${videoId}`)

        let transcriptItems: any[] | null = null

        // Try fetching with the full URL first (more reliable)
        const fullUrl = `https://www.youtube.com/watch?v=${videoId}`
        const attemptsLog: string[] = []

        // Attempt 1: Full URL without lang
        try {
            const items = await YoutubeTranscript.fetchTranscript(fullUrl)
            if (items && items.length > 0) {
                transcriptItems = items
                attemptsLog.push("Success: full URL, default lang")
            }
        } catch (e: any) {
            attemptsLog.push(`Full URL default: ${e.message?.substring(0, 80)}`)
        }

        // Attempt 2: Video ID without lang
        if (!transcriptItems) {
            try {
                const items = await YoutubeTranscript.fetchTranscript(videoId)
                if (items && items.length > 0) {
                    transcriptItems = items
                    attemptsLog.push("Success: video ID, default lang")
                }
            } catch (e: any) {
                attemptsLog.push(`Video ID default: ${e.message?.substring(0, 80)}`)
            }
        }

        // Attempt 3: Try specific languages with video ID
        if (!transcriptItems) {
            const langs = ["en", "en-US", "en-GB", "hi", "es", "fr", "de", "ja", "ko", "pt", "ru", "zh"]
            for (const lang of langs) {
                try {
                    const items = await YoutubeTranscript.fetchTranscript(videoId, { lang })
                    if (items && items.length > 0) {
                        transcriptItems = items
                        attemptsLog.push(`Success: video ID, lang=${lang}`)
                        break
                    }
                } catch (e: any) {
                    // continue
                }
            }
        }

        console.log(`[YouTube] Attempts: ${attemptsLog.join(" | ")}`)

        // If no captions found, return success with empty transcript
        if (!transcriptItems || transcriptItems.length === 0) {
            console.log(`[YouTube] No captions found for ${videoId} — AI will analyze without transcript`)
            return NextResponse.json({
                videoId,
                segments: [],
                fullText: "",
                timestampedText: "",
                totalSegments: 0,
                totalWords: 0,
                hasTranscript: false,
            })
        }

        // Build timestamped segments
        const segments = transcriptItems.map((item) => ({
            text: item.text
                .replace(/&amp;/g, "&")
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/\n/g, " ")
                .trim(),
            timestamp: formatTimestamp(item.offset / 1000),
            offsetSeconds: Math.floor(item.offset / 1000),
            duration: Math.floor(item.duration / 1000),
        }))

        const fullText = segments.map((s) => s.text).join(" ")
        const timestampedText = segments.map((s) => `[${s.timestamp}] ${s.text}`).join("\n")

        console.log(`[YouTube] ✅ Extracted ${segments.length} segments, ${fullText.split(" ").length} words`)

        return NextResponse.json({
            videoId,
            segments,
            fullText,
            timestampedText,
            totalSegments: segments.length,
            totalWords: fullText.split(/\s+/).length,
            hasTranscript: true,
        })
    } catch (error: any) {
        console.error("[YouTube] Transcript extraction error:", error)
        // Don't fail — return empty so AI can still analyze
        return NextResponse.json({
            videoId: "",
            segments: [],
            fullText: "",
            timestampedText: "",
            totalSegments: 0,
            totalWords: 0,
            hasTranscript: false,
        })
    }
}
