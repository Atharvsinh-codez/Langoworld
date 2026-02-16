import { NextRequest, NextResponse } from "next/server"
import { uploadToR2, getVideoKey } from "@/lib/r2-client"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"]
const MAX_FILE_SIZE = 500 * 1024 * 1024

/**
 * Accepts raw binary body (not FormData) with metadata in headers.
 * This avoids the "Failed to parse body as FormData" issue.
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("x-file-type") || request.headers.get("content-type") || ""
        const fileName = request.headers.get("x-file-name") || "video.mp4"
        const userId = request.headers.get("x-user-id")
        const summaryId = request.headers.get("x-summary-id")

        if (!userId || !summaryId) {
            return NextResponse.json({ error: "x-user-id and x-summary-id headers are required" }, { status: 400 })
        }

        if (!ALLOWED_TYPES.includes(contentType)) {
            return NextResponse.json(
                { error: `Unsupported file type: ${contentType}. Allowed: mp4, webm, mov, avi, mkv` },
                { status: 400 }
            )
        }

        console.log(`[Upload] Reading raw body for ${fileName}...`)

        // Read raw body as ArrayBuffer — no FormData parsing needed
        const arrayBuffer = await request.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (buffer.length === 0) {
            return NextResponse.json({ error: "Empty file body" }, { status: 400 })
        }

        if (buffer.length > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Max: 500MB` },
                { status: 400 }
            )
        }

        console.log(`[Upload] Uploading ${fileName} (${(buffer.length / 1024 / 1024).toFixed(1)}MB) to R2...`)

        // Upload to R2
        const key = getVideoKey(userId, summaryId, fileName)
        const videoUrl = await uploadToR2(buffer, key, contentType)

        console.log(`[Upload] ✅ Uploaded: ${videoUrl}`)

        return NextResponse.json({
            videoUrl,
            videoKey: key,
            fileName,
            fileSize: buffer.length,
        })
    } catch (error: any) {
        console.error("[Upload] ❌ Error:", error.message)
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
    }
}
