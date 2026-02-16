// ─── Cloudflare R2 Client (S3-compatible) ───
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "obsidianui"
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-affb2190b74549c4a9fde667b3cb7485.r2.dev"

// S3-compatible client for Cloudflare R2
const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
})

/**
 * Upload a file buffer to R2.
 * @returns The public URL of the uploaded file.
 */
export async function uploadToR2(
    fileBuffer: Buffer | Uint8Array,
    key: string,
    contentType: string
): Promise<string> {
    await s3Client.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
        })
    )

    return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Generate a presigned PUT URL for direct browser-to-R2 upload.
 * This avoids Next.js body size limits by letting the client upload directly.
 */
export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600 // 1 hour
): Promise<{ uploadUrl: string; publicUrl: string }> {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })
    const publicUrl = `${R2_PUBLIC_URL}/${key}`

    return { uploadUrl, publicUrl }
}

/**
 * Delete a file from R2 by key.
 */
export async function deleteFromR2(key: string): Promise<void> {
    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        })
    )
}

/**
 * Generate a storage key for uploaded videos.
 */
export function getVideoKey(userId: string, summaryId: string, filename: string): string {
    const ext = filename.split(".").pop() || "mp4"
    const safeFilename = filename
        .replace(/[^a-zA-Z0-9.-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase()
    return `langoworld/Videos/${userId}/${summaryId}/${safeFilename}`
}

/**
 * Generate a storage key for uploaded documents (PDF, images, TXT, MD).
 * Stored at: obsidianui/langoworld/uploads/{userId}/{docId}/{filename}
 */
export function getDocumentKey(userId: string, docId: string, filename: string): string {
    const safeFilename = filename
        .replace(/[^a-zA-Z0-9.-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase()
    return `langoworld/uploads/${userId}/${docId}/${safeFilename}`
}

/**
 * Generate a storage key for TTS audio files.
 * Stored at: obsidianui/langoworld/audios/{textHash}-{language}.wav
 * Uses deterministic keys so the same text+language always maps to the same file.
 */
export function getAudioKey(textHash: string, language: string): string {
    return `langoworld/audios/${textHash}-${language}.wav`
}

/**
 * Check if an object exists in R2 by key (HEAD request — no download).
 * Returns the public URL if exists, null otherwise.
 */
export async function checkR2ObjectExists(key: string): Promise<string | null> {
    try {
        await s3Client.send(
            new HeadObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
            })
        )
        return `${R2_PUBLIC_URL}/${key}`
    } catch (error: any) {
        // NotFound or NoSuchKey means the object doesn't exist
        if (error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) {
            return null
        }
        // Log unexpected errors but don't throw — treat as cache miss
        console.warn("[R2] HEAD check error:", error?.name || error)
        return null
    }
}
