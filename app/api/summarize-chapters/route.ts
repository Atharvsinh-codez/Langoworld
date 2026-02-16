import { NextRequest, NextResponse } from "next/server"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { generateText } from "ai"

interface Chapter {
  id: string
  title: string
  content: string
  textContent: string
  wordCount: number
}

async function summarizeWithAI(text: string, targetChapters: number = 3): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set")
  }

  // Initialize OpenRouter provider
  const provider = openrouter(apiKey, {
    headers: {
      "HTTP-Referer": process.env.OPENROUTER_REFERER_URL || "https://langoworld.app",
      "X-Title": "LangoWorld",
    },
  })

  const models = [
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o-mini",
    "google/gemini-2.0-flash-exp",
  ]

  const prompt = `You are a content summarizer. Your task is to condense the following blog content into exactly ${targetChapters} well-structured chapters.

Requirements:
- Create exactly ${targetChapters} chapters
- Each chapter should be substantial and meaningful
- Preserve the key ideas and main points
- Keep the natural flow and narrative structure
- Each chapter should be roughly equal in length
- Total word count should be under 2000 words

Return the content as ${targetChapters} chapters separated by clear chapter markers. Format:
CHAPTER 1: [Title]
[Content]

CHAPTER 2: [Title]
[Content]

CHAPTER 3: [Title]
[Content]

Content to summarize:
${text}`

  let lastError: Error | null = null

  // Try each model with automatic retry via AI SDK
  for (const modelId of models) {
    try {
      console.log(`[Summarize] Trying model: ${modelId}`)

      const { text: summarizedText } = await generateText({
        model: provider(modelId),
        prompt,
        temperature: 0.7,
        maxTokens: 4000,
      })

      console.log(`[Summarize] Successfully used model: ${modelId}`)
      return summarizedText.trim()
    } catch (error) {
      console.error(`[Summarize] Error with model ${modelId}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`[Summarize] Model ${modelId} failed, trying next...`)
      continue
    }
  }

  if (lastError) {
    throw new Error(`All models failed. Last error: ${lastError.message}`)
  }

  throw new Error("No models available")
}

function parseSummarizedChapters(summarizedText: string): Chapter[] {
  const chapters: Chapter[] = []
  const chapterRegex = /CHAPTER\s+(\d+):\s*(.+?)(?=CHAPTER\s+\d+:|$)/gis

  let match
  let chapterIndex = 1

  while ((match = chapterRegex.exec(summarizedText)) !== null) {
    const title = match[2].split('\n')[0].trim()
    const content = match[2].substring(title.length).trim()
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    const wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length

    if (wordCount > 50) {
      chapters.push({
        id: `chapter-${Date.now()}-${chapterIndex}`,
        title: title || `Chapter ${chapterIndex}`,
        content: `<p>${content.replace(/\n/g, '</p><p>')}</p>`,
        textContent: textContent,
        wordCount: wordCount,
      })
      chapterIndex++
    }
  }

  if (chapters.length === 0) {
    const paragraphs = summarizedText.split(/\n\n+/).filter(p => p.trim().length > 0)
    const chunksPerChapter = Math.ceil(paragraphs.length / 3)

    for (let i = 0; i < 3 && i * chunksPerChapter < paragraphs.length; i++) {
      const start = i * chunksPerChapter
      const end = Math.min(start + chunksPerChapter, paragraphs.length)
      const chapterContent = paragraphs.slice(start, end).join('\n\n')
      const textContent = chapterContent.replace(/<[^>]*>/g, '').trim()
      const wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length
      const title = chapterContent.split('\n')[0].substring(0, 60) || `Chapter ${i + 1}`

      chapters.push({
        id: `chapter-${Date.now()}-${i + 1}`,
        title: title,
        content: `<p>${chapterContent.replace(/\n/g, '</p><p>')}</p>`,
        textContent: textContent,
        wordCount: wordCount,
      })
    }
  }

  return chapters
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chapters, targetChapters = 3 } = body

    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json(
        { error: "Chapters array is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY environment variable is not set" },
        { status: 500 }
      )
    }

    const combinedText = chapters.map(ch => `${ch.title}\n\n${ch.textContent}`).join('\n\n---\n\n')
    const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)

    console.log(`[Summarize] Condensing ${chapters.length} chapters (${totalWords} words) into ${targetChapters} chapters`)

    const summarizedText = await summarizeWithAI(combinedText, targetChapters)
    const summarizedChapters = parseSummarizedChapters(summarizedText)

    const finalWordCount = summarizedChapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    console.log(`[Summarize] Created ${summarizedChapters.length} chapters (${finalWordCount} words)`)

    return NextResponse.json({
      chapters: summarizedChapters,
      totalChapters: summarizedChapters.length,
      totalWords: finalWordCount,
      originalChapters: chapters.length,
      originalWords: totalWords,
    })
  } catch (error) {
    console.error("Summarization error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred while summarizing chapters" },
      { status: 500 }
    )
  }
}
