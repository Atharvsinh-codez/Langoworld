// ─── R2 Audio Storage Manager ───
// All TTS audio is permanently cached on Cloudflare R2 CDN
// Path: obsidianui/langoworld/audios/{textHash}-{language}.wav

import { uploadToR2, getAudioKey, checkR2ObjectExists } from "./r2-client"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"

// Server-side Supabase client (uses service role for server operations)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface AudioCacheEntry {
  id: string
  textHash: string
  language: string
  textPreview: string
  r2Url: string
  r2Key: string
  pageId: string | null
  pageTitle: string | null
  section: string | null
  fileSize: number
  createdAt: string
}

export interface StoreAudioOptions {
  text: string
  language: string
  audioBuffer: Buffer
  mimeType?: string
  pageId?: string
  pageTitle?: string
  section?: string   // e.g. "summary", "key-point-3", "word-selection", "tts-summary"
}

export interface StoredAudioResult {
  url: string
  textHash: string
  language: string
  cached: boolean
  fileSize?: number
}

/**
 * Compute a deterministic SHA-256 hash of the text content.
 * This ensures the same text always maps to the same R2 key.
 */
export function computeTextHash(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex").substring(0, 32)
}

/**
 * Look up cached audio in Supabase's audio_cache table.
 * Returns the R2 CDN URL if found, null otherwise.
 */
export async function getCachedAudio(
  textHash: string,
  language: string
): Promise<StoredAudioResult | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from("audio_cache")
    .select("r2_url, file_size")
    .eq("text_hash", textHash)
    .eq("language", language)
    .limit(1)
    .single()

  if (error || !data) {
    // DB miss — also try HEAD check on R2 (in case DB row was lost)
    const key = getAudioKey(textHash, language)
    const existingUrl = await checkR2ObjectExists(key)
    if (existingUrl) {
      console.log(`[Audio Cache] Found in R2 but missing from DB, reinserting: ${key}`)
      // Reinsert the DB row
      await supabase.from("audio_cache").upsert({
        text_hash: textHash,
        language,
        text_preview: "(recovered from R2)",
        r2_url: existingUrl,
        r2_key: key,
      }, { onConflict: "text_hash,language" })

      return { url: existingUrl, textHash, language, cached: true }
    }
    return null
  }

  return {
    url: data.r2_url,
    textHash,
    language,
    cached: true,
    fileSize: data.file_size,
  }
}

/**
 * Store generated audio to R2 CDN and record metadata in Supabase.
 */
export async function storeAudioToR2(options: StoreAudioOptions): Promise<StoredAudioResult> {
  const {
    text,
    language,
    audioBuffer,
    mimeType = "audio/wav",
    pageId,
    pageTitle,
    section,
  } = options

  const textHash = computeTextHash(text)
  const key = getAudioKey(textHash, language)

  // Double-check: might have been stored between our initial check and now
  const existing = await getCachedAudio(textHash, language)
  if (existing) {
    console.log(`[Audio Cache] Race condition avoided — already cached: ${existing.url}`)
    return existing
  }

  // Upload to R2
  console.log(`[Audio Cache] Uploading to R2: ${key} (${audioBuffer.length} bytes)`)
  const r2Url = await uploadToR2(audioBuffer, key, mimeType)

  // Insert metadata into Supabase
  const supabase = getSupabaseAdmin()
  const textPreview = text.substring(0, 200)

  const { error: insertError } = await supabase
    .from("audio_cache")
    .upsert({
      text_hash: textHash,
      language,
      text_preview: textPreview,
      r2_url: r2Url,
      r2_key: key,
      page_id: pageId || null,
      page_title: pageTitle || null,
      section: section || null,
      file_size: audioBuffer.length,
    }, { onConflict: "text_hash,language" })

  if (insertError) {
    console.error("[Audio Cache] Failed to insert metadata:", insertError)
    // Don't throw — audio is already in R2, just metadata failed
  } else {
    console.log(`[Audio Cache] Metadata saved for ${textHash}-${language}`)
  }

  return {
    url: r2Url,
    textHash,
    language,
    cached: false,
    fileSize: audioBuffer.length,
  }
}