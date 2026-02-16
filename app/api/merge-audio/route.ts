import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { storeAudioToR2 } from "@/lib/audio-storage"

export async function POST(request: NextRequest) {
  try {
    const { audioFiles } = await request.json()

    if (!audioFiles || !Array.isArray(audioFiles) || audioFiles.length === 0) {
      return NextResponse.json({ error: "No audio files provided" }, { status: 400 })
    }

    console.log("[Merge] Merging audio files:", audioFiles)

    // Read all audio files
    const audioBuffers: Buffer[] = []
    for (const fileName of audioFiles) {
      let buffer: Buffer

      // Check if fileName is a URL (R2 CDN or Vercel Blob) or local file
      if (fileName.startsWith('http')) {
        console.log(`[Merge] Fetching from URL: ${fileName}`)
        const response = await fetch(fileName)
        if (!response.ok) {
          console.error(`[Merge] Failed to fetch audio: ${fileName}`)
          return NextResponse.json({ error: `Failed to fetch audio file: ${fileName}` }, { status: 404 })
        }
        const arrayBuffer = await response.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
      } else {
        // Read local file
        const filePath = path.join(process.cwd(), "public", "audio", fileName)

        if (!fs.existsSync(filePath)) {
          return NextResponse.json({ error: `Audio file not found: ${fileName}` }, { status: 404 })
        }
        buffer = fs.readFileSync(filePath)
      }

      audioBuffers.push(buffer)
    }

    // Simple concatenation for WAV files
    let mergedBuffer: Buffer

    if (audioBuffers.length === 1) {
      mergedBuffer = audioBuffers[0]
    } else {
      // Skip the WAV header (44 bytes) for all files except the first
      const firstFile = audioBuffers[0]
      const restFiles = audioBuffers.slice(1).map(buf => buf.slice(44))

      mergedBuffer = Buffer.concat([firstFile, ...restFiles])
    }

    // Store merged file using R2 CDN
    const mergedText = `merged-audio-${Date.now()}-${audioFiles.length}-files`

    const storedAudio = await storeAudioToR2({
      text: mergedText,
      language: "merged",
      audioBuffer: mergedBuffer,
      mimeType: "audio/wav",
      section: "merged-audio",
    })

    console.log(`[Merge] Created merged file: ${storedAudio.url}`)

    return NextResponse.json({
      success: true,
      url: storedAudio.url,
    })
  } catch (error) {
    console.error("[Merge] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to merge audio files" },
      { status: 500 }
    )
  }
}
