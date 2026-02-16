import { NextRequest, NextResponse } from "next/server"
import { getNextApiKey } from "@/lib/api-key-rotation"
import { queuedRequest, ApiError } from "@/lib/request-queue"
import { generateSummaryId, saveSummary, type VideoSummaryData } from "@/lib/summary-store"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const maxDuration = 120

const GEMINI_MODEL = "gemini-2.5-flash"

// ─── Call Gemini (queued + retry-aware) ───
async function callGemini(systemInstruction: string, prompt: string, label: string = "gemini"): Promise<string> {
    return queuedRequest(async (attempt) => {
        const apiKey = getNextApiKey()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 120000)

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemInstruction }] },
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 8000, temperature: 0.7 },
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
                throw new ApiError("Gemini request timed out (120s)", undefined, apiKey)
            }
            if (error instanceof ApiError) throw error
            throw new ApiError(error.message, error.status, apiKey)
        }
    }, label)
}

// ─── Call Gemini with video file (queued + retry-aware) ───
async function callGeminiWithVideo(systemInstruction: string, videoUrl: string, textPrompt: string): Promise<string> {
    return queuedRequest(async (attempt) => {
        const apiKey = getNextApiKey()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 180000)

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemInstruction }] },
                    contents: [{
                        parts: [
                            {
                                fileData: {
                                    mimeType: "video/mp4",
                                    fileUri: videoUrl,
                                },
                            },
                            { text: textPrompt },
                        ],
                    }],
                    generationConfig: { maxOutputTokens: 8000, temperature: 0.7 },
                }),
                signal: controller.signal,
            })

            clearTimeout(timeout)

            if (!res.ok) {
                const err = await res.text()
                throw new ApiError(`Gemini video ${res.status}: ${err.substring(0, 200)}`, res.status, apiKey)
            }

            const data = await res.json()
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (!content) throw new ApiError("Gemini returned empty response for video", undefined, apiKey)

            return { result: content, apiKey }
        } catch (error: any) {
            clearTimeout(timeout)
            if (error.name === "AbortError") {
                throw new ApiError("Gemini video request timed out (180s)", undefined, apiKey)
            }
            if (error instanceof ApiError) throw error
            throw new ApiError(error.message, error.status, apiKey)
        }
    }, "video-analysis")
}

// ─── Parse JSON ───
function parseJSON(raw: string): any {
    let cleaned = raw.trim()
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
        cleaned = fenceMatch[1].trim()
    } else {
        const objMatch = cleaned.match(/(\{[\s\S]*\})/)
        if (objMatch) cleaned = objMatch[1].trim()
    }

    try { return JSON.parse(cleaned) } catch { }

    cleaned = cleaned
        .replace(/,\s*([\]}])/g, "$1")
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
        .replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n")

    try { return JSON.parse(cleaned) } catch (e) {
        console.error("[Video] JSON parse failed. First 500 chars:", cleaned.slice(0, 500))
        throw new Error("Could not parse Gemini response as JSON")
    }
}

// ─── Main Route ───
export async function POST(request: NextRequest) {
    try {
        const { videoUrl, videoTitle, fileName } = await request.json()

        if (!videoUrl || typeof videoUrl !== "string") {
            return NextResponse.json({ error: "Video URL is required" }, { status: 400 })
        }

        try {
            getNextApiKey()
        } catch {
            return NextResponse.json({ error: "No Google API keys configured" }, { status: 500 })
        }

        console.log(`[Video] Analyzing: ${videoTitle || fileName || "Uploaded Video"}`)

        // Step 1: Try Gemini video analysis (direct video URL)
        let rawResult: string
        let transcript = ""
        let usedVideoAnalysis = false

        try {
            console.log(`[Video] Attempting Gemini video analysis via URL...`)
            rawResult = await callGeminiWithVideo(
                `You are an expert video analyst. Watch this video carefully and analyze its content.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "2-3 paragraph comprehensive summary of the video content",
  "keyPoints": [{ "timestamp": "0:00", "point": "description of what happens" }],
  "explanation": "3-5 paragraph conversational explanation as a personal tutor",
  "chapters": [{ "content": "detailed content for this section", "startTime": "0:00" }],
  "transcript": "Full transcription of all spoken words in the video"
}

Rules:
- 5-10 key points with accurate timestamps
- 3-5 chapters with detailed content
- Explanation: engaging, like a tutor teaching someone
- Transcript: include all spoken dialogue/narration
- If audio is in Hindi or another language, provide English translation
- Everything in English`,
                videoUrl,
                `Analyze this video titled "${videoTitle || fileName || 'Uploaded Video'}". Provide a comprehensive analysis with summary, key points with timestamps, chapters, and full transcript.`
            )
            usedVideoAnalysis = true
            console.log(`[Video] ✅ Got ${rawResult.length} chars from Gemini video analysis`)
        } catch (videoError: any) {
            console.log(`[Video] Video analysis failed: ${videoError.message}`)
            console.log(`[Video] Falling back to title-based analysis...`)

            rawResult = await callGemini(
                `You are a video content analyst. Based on the video title and any available information, provide a helpful analysis framework.

Return ONLY valid JSON:
{
  "summary": "Analysis based on the video title and context",
  "keyPoints": [{ "timestamp": "0:00", "point": "expected content point" }],
  "explanation": "Helpful explanation of what this video likely covers",
  "chapters": [{ "content": "chapter content", "startTime": "0:00" }],
  "transcript": "Transcript unavailable — video was analyzed by title only."
}`,
                `Video Title: ${videoTitle || fileName || "Uploaded Video"}\nVideo URL: ${videoUrl}\n\nProvide an analysis framework for this video.`,
                "video-fallback"
            )
            console.log(`[Video] ✅ Got fallback analysis (${rawResult.length} chars)`)
        }

        const result = parseJSON(rawResult)
        transcript = result.transcript || transcript || ""

        // Step 2: Generate TTS-friendly summary
        console.log(`[Video] Generating TTS summary...`)
        let ttsSummary = ""
        try {
            ttsSummary = await callGemini(
                `You are a friendly explainer. Rewrite the following summary as if you're casually explaining it to a friend over coffee. Make it perfect for text-to-speech: conversational, clear, no jargon, no bullet points. Use natural pauses and transitions. Keep it under 500 words. Write in English.`,
                result.summary || "This video explores interesting content.",
                "video-tts"
            )
            console.log(`[Video] ✅ TTS summary: ${ttsSummary.length} chars`)
        } catch (e: any) {
            console.log(`[Video] ⚠ TTS summary failed: ${e.message}`)
            ttsSummary = result.summary || ""
        }

        // Build chapters
        const chaptersData = (result.chapters || []).map((ch: any, i: number) => ({
            id: `vid-ch-${i + 1}-${Date.now()}`,
            title: `Part ${i + 1}`,
            content: `<p>${(ch.content || "").replace(/\n/g, "</p><p>")}</p>`,
            textContent: ch.content || "",
            wordCount: (ch.content || "").split(/\s+/).length,
            startTime: ch.startTime || "0:00",
        }))

        // Step 3: Save summary
        const summaryId = generateSummaryId()
        const summaryData: VideoSummaryData = {
            id: summaryId,
            videoId: summaryId,
            videoUrl,
            videoTitle: videoTitle || fileName || "Uploaded Video",
            channel: "Uploaded",
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
        console.log(`[Video] ✅ Saved summary: ${summaryId}`)

        const response = {
            summary: result.summary || "",
            keyPoints: summaryData.keyPoints,
            explanation: result.explanation || "",
            chapters: chaptersData,
            transcript,
            ttsSummary,
            summaryPageId: summaryId,
            summaryPageUrl: `/video/summary/${summaryId}`,
            videoTitle: videoTitle || fileName || "Uploaded Video",
            channel: "Uploaded",
            source: "upload",
            videoAnalyzed: usedVideoAnalysis,
        }

        console.log(`[Video] ✅ Done`)
        return NextResponse.json(response)

    } catch (error: any) {
        console.error("[Video] ❌ Error:", error.message)
        return NextResponse.json({ error: error.message || "Failed to analyze video" }, { status: 500 })
    }
}
