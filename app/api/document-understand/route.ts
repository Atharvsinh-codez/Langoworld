import { NextRequest, NextResponse } from "next/server"
import { getNextApiKey } from "@/lib/api-key-rotation"
import { queuedRequest, ApiError } from "@/lib/request-queue"
import { generateSummaryId, saveSummary, type VideoSummaryData } from "@/lib/summary-store"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const maxDuration = 120

const GEMINI_MODEL = "gemini-2.5-flash"

// ─── Call Gemini (queued + retry-aware) ───
async function callGemini(systemInstruction: string, prompt: string, label: string = "doc-gemini"): Promise<string> {
    return queuedRequest(async (attempt) => {
        const apiKey = getNextApiKey()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 120000)

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: systemInstruction }] },
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { maxOutputTokens: 8000, temperature: 0.7 },
                    }),
                    signal: controller.signal,
                }
            )
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
            if (error.name === "AbortError") throw new ApiError("Gemini request timed out", undefined, apiKey)
            if (error instanceof ApiError) throw error
            throw new ApiError(error.message, error.status, apiKey)
        }
    }, label)
}

// ─── Call Gemini with image (queued + retry-aware) ───
async function callGeminiWithImage(systemInstruction: string, imageUrl: string, textPrompt: string): Promise<string> {
    return queuedRequest(async (attempt) => {
        const apiKey = getNextApiKey()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 120000)

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: systemInstruction }] },
                        contents: [{
                            parts: [
                                {
                                    fileData: {
                                        mimeType: "image/jpeg",
                                        fileUri: imageUrl,
                                    }
                                },
                                { text: textPrompt }
                            ]
                        }],
                        generationConfig: { maxOutputTokens: 8000, temperature: 0.7 },
                    }),
                    signal: controller.signal,
                }
            )
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
            if (error.name === "AbortError") throw new ApiError("Gemini request timed out", undefined, apiKey)
            if (error instanceof ApiError) throw error
            throw new ApiError(error.message, error.status, apiKey)
        }
    }, "doc-image-analysis")
}

// ─── Parse JSON safely ───
function parseJSON(raw: string): any {
    let cleaned = raw.trim()
    // Remove markdown code fences
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
    }
    try {
        return JSON.parse(cleaned)
    } catch {
        // Try to extract JSON object
        const match = cleaned.match(/\{[\s\S]*\}/)
        if (match) {
            try { return JSON.parse(match[0]) } catch { }
        }
        return { summary: cleaned, keyPoints: [], explanation: "", extractedText: "" }
    }
}

// ─── Main Route ───
export async function POST(request: NextRequest) {
    try {
        const { docUrl, fileName, fileType } = await request.json()

        if (!docUrl || typeof docUrl !== "string") {
            return NextResponse.json({ error: "Document URL is required" }, { status: 400 })
        }

        try {
            getNextApiKey()
        } catch {
            return NextResponse.json({ error: "No Google API keys configured" }, { status: 500 })
        }

        const docName = fileName || "Document"
        const isImage = (fileType || "").startsWith("image/")
        const isPDF = (fileType || "") === "application/pdf"
        const isText = (fileType || "").startsWith("text/")

        console.log(`[DocAnalysis] Analyzing: ${docName} (${fileType})`)

        let rawResult: string
        let extractedText = ""

        if (isImage) {
            // ── Image analysis: use Gemini vision ──
            console.log(`[DocAnalysis] Using Gemini vision for image...`)
            try {
                rawResult = await callGeminiWithImage(
                    `You are an expert document and image analyst. Analyze this image thoroughly.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "2-3 paragraph comprehensive description of what the image contains",
  "keyPoints": [{ "timestamp": "—", "point": "key observation or detail in the image" }],
  "explanation": "3-5 paragraph detailed analysis: context, meaning, notable elements",
  "extractedText": "Any text visible in the image (OCR). If no text, write 'No text detected.'"
}

Rules:
- 5-10 key points about the image content
- Explanation should be insightful and engaging
- Extract ALL visible text from the image
- Everything in English`,
                    docUrl,
                    `Analyze this image "${docName}". Describe its contents, extract any text, and provide detailed analysis.`
                )
            } catch (imgError: any) {
                console.log(`[DocAnalysis] Vision failed, falling back to text analysis: ${imgError.message}`)
                rawResult = await callGemini(
                    `You are a document analyst. The user uploaded an image file that could not be directly analyzed. Based on the filename, provide a helpful analysis.

Return ONLY valid JSON:
{
  "summary": "Analysis based on the image filename and context",
  "keyPoints": [{ "timestamp": "—", "point": "observation" }],
  "explanation": "What this image likely contains based on the filename",
  "extractedText": "Image could not be processed for text extraction."
}`,
                    `Image file: ${docName}\nURL: ${docUrl}`,
                    "doc-image-fallback"
                )
            }
        } else if (isText) {
            // ── Text/Markdown: fetch content and analyze ──
            console.log(`[DocAnalysis] Fetching text content...`)
            try {
                const textRes = await fetch(docUrl)
                extractedText = await textRes.text()
                console.log(`[DocAnalysis] Got ${extractedText.length} chars of text`)
            } catch (e: any) {
                console.log(`[DocAnalysis] Failed to fetch text: ${e.message}`)
            }

            const textSnippet = extractedText.substring(0, 30000) // Gemini context limit
            rawResult = await callGemini(
                `You are an expert document analyst. Analyze the following text document thoroughly.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "2-3 paragraph comprehensive summary of the document",
  "keyPoints": [{ "timestamp": "—", "point": "key insight or topic from the document" }],
  "explanation": "3-5 paragraph detailed analysis as if explaining to a student",
  "extractedText": "The original text (pass through as-is)"
}

Rules:
- 5-10 key points covering the main topics
- Explanation should be engaging and educational
- Identify the document type, purpose, and key themes
- Everything in English`,
                `Document: "${docName}"\n\nContent:\n${textSnippet}`,
                "doc-text-analysis"
            )
        } else if (isPDF) {
            // ── PDF: analyze via Gemini (with URL, or title-based fallback) ──
            console.log(`[DocAnalysis] Analyzing PDF...`)
            try {
                rawResult = await callGeminiWithImage(
                    `You are an expert PDF document analyst. Analyze this PDF document thoroughly.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "2-3 paragraph comprehensive summary of the PDF",
  "keyPoints": [{ "timestamp": "—", "point": "key finding or section highlight" }],
  "explanation": "3-5 paragraph detailed analysis as a knowledgeable tutor",
  "extractedText": "Extracted text content from the PDF"
}

Rules:
- 5-10 key points covering major sections
- Explanation: educational, like teaching someone
- Extract all text visible in the PDF
- Everything in English`,
                    docUrl,
                    `Analyze this PDF document "${docName}". Extract text, summarize, and provide detailed analysis.`
                )
            } catch (pdfError: any) {
                console.log(`[DocAnalysis] PDF vision failed, falling back: ${pdfError.message}`)
                rawResult = await callGemini(
                    `You are a document analyst. A PDF was uploaded but could not be directly analyzed. Based on the filename, provide a helpful analysis framework.

Return ONLY valid JSON:
{
  "summary": "Analysis based on the PDF filename",
  "keyPoints": [{ "timestamp": "—", "point": "expected content" }],
  "explanation": "What this document likely covers",
  "extractedText": "PDF text extraction was not available."
}`,
                    `PDF file: ${docName}\nURL: ${docUrl}`,
                    "doc-pdf-fallback"
                )
            }
        } else {
            return NextResponse.json({ error: `Unsupported document type: ${fileType}` }, { status: 400 })
        }

        const result = parseJSON(rawResult)
        extractedText = result.extractedText || extractedText || ""

        // Generate TTS-friendly summary
        console.log(`[DocAnalysis] Generating TTS summary...`)
        let ttsSummary = ""
        try {
            ttsSummary = await callGemini(
                `You are a friendly explainer. Rewrite the following summary as if you're casually explaining it to a friend over coffee. Make it perfect for text-to-speech: conversational, clear, no jargon, no bullet points. Use natural pauses. Keep it under 500 words. Write in English.`,
                result.summary || "This document contains interesting content.",
                "doc-tts"
            )
        } catch (e: any) {
            console.log(`[DocAnalysis] ⚠ TTS summary failed: ${e.message}`)
            ttsSummary = result.summary || ""
        }

        // Save summary
        const summaryId = generateSummaryId()
        const summaryData: VideoSummaryData = {
            id: summaryId,
            videoId: summaryId,
            videoUrl: docUrl,
            videoTitle: docName,
            channel: "Document",
            summary: result.summary || "",
            transcript: extractedText,
            keyPoints: (result.keyPoints || []).map((kp: any) => ({
                timestamp: kp.timestamp || "—",
                point: kp.point || "",
            })),
            explanation: result.explanation || "",
            ttsSummary,
            chapters: [],
            createdAt: new Date().toISOString(),
        }
        saveSummary(summaryData)
        console.log(`[DocAnalysis] ✅ Saved summary: ${summaryId}`)

        return NextResponse.json({
            summary: result.summary || "",
            keyPoints: summaryData.keyPoints,
            explanation: result.explanation || "",
            extractedText,
            ttsSummary,
            summaryPageId: summaryId,
            summaryPageUrl: `/docs/summary/${summaryId}`,
            videoTitle: docName,
            channel: "Document",
            source: "document",
            fileType,
        })

    } catch (error: any) {
        console.error("[DocAnalysis] ❌ Error:", error.message)
        return NextResponse.json({ error: error.message || "Failed to analyze document" }, { status: 500 })
    }
}
