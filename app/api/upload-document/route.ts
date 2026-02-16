import { NextRequest, NextResponse } from "next/server"
import { uploadToR2, getDocumentKey } from "@/lib/r2-client"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const ALLOWED_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "text/plain",
    "text/markdown",
    "text/x-markdown",
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Upload document to R2 — raw binary body, metadata in headers.
 * Supports PDF, images, TXT, and MD files.
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("x-file-type") || request.headers.get("content-type") || ""
        const fileName = decodeURIComponent(request.headers.get("x-file-name") || "document")
        const userId = request.headers.get("x-user-id")
        const docId = request.headers.get("x-doc-id")

        if (!userId || !docId) {
            return NextResponse.json({ error: "x-user-id and x-doc-id headers are required" }, { status: 400 })
        }

        // Normalize content type for matching
        const baseType = contentType.split(";")[0].trim().toLowerCase()
        const isAllowed = ALLOWED_TYPES.includes(baseType) || baseType.startsWith("image/")

        if (!isAllowed) {
            return NextResponse.json(
                { error: `Unsupported file type: ${contentType}. Allowed: PDF, PNG, JPG, TXT, MD` },
                { status: 400 }
            )
        }

        console.log(`[DocUpload] Reading raw body for ${fileName}...`)

        const arrayBuffer = await request.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (buffer.length === 0) {
            return NextResponse.json({ error: "Empty file body" }, { status: 400 })
        }

        if (buffer.length > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Max: 50MB` },
                { status: 400 }
            )
        }

        console.log(`[DocUpload] Uploading ${fileName} (${(buffer.length / 1024 / 1024).toFixed(1)}MB) to R2...`)

        const key = getDocumentKey(userId, docId, fileName)
        const docUrl = await uploadToR2(buffer, key, contentType)

        console.log(`[DocUpload] ✅ Uploaded: ${docUrl}`)

        return NextResponse.json({
            docUrl,
            docKey: key,
            fileName,
            fileSize: buffer.length,
            fileType: baseType,
        })
    } catch (error: any) {
        console.error("[DocUpload] ❌ Error:", error.message)
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
    }
}
