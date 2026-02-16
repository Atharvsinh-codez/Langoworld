// ─── Concurrency-Limited Request Queue with Retry ───
// Ensures max N concurrent Gemini API calls across all users.
// Auto-retries with exponential backoff on transient failures.

import { markKeyFailed, markKeySuccess } from "./api-key-rotation"

const MAX_CONCURRENT = 5         // Max simultaneous Gemini API calls
const MAX_RETRIES = 3            // Max retry attempts per request
const BASE_DELAY_MS = 1000       // Base delay for exponential backoff
const MAX_DELAY_MS = 30_000      // Max delay between retries

let activeRequests = 0
let queuedRequests: Array<{ resolve: () => void }> = []

// ─── Semaphore: wait for a slot ───
async function acquireSlot(): Promise<void> {
    if (activeRequests < MAX_CONCURRENT) {
        activeRequests++
        return
    }

    // Queue up and wait for a slot
    return new Promise<void>((resolve) => {
        queuedRequests.push({ resolve })
    })
}

// ─── Release a slot ───
function releaseSlot() {
    if (queuedRequests.length > 0) {
        const next = queuedRequests.shift()!
        // Don't decrement — the slot transfers to the next request
        next.resolve()
    } else {
        activeRequests--
    }
}

// ─── Classify errors ───
function isRetriable(error: any, statusCode?: number): boolean {
    // Rate limited — always retry (with backoff)
    if (statusCode === 429) return true

    // Server errors — retry
    if (statusCode && statusCode >= 500) return true

    // Network/timeout errors
    if (error?.name === "AbortError") return true
    if (error?.code === "ECONNRESET") return true
    if (error?.code === "ETIMEDOUT") return true
    if (error?.message?.includes("fetch failed")) return true

    // Don't retry client errors (400, 401, 403, 404)
    if (statusCode && statusCode >= 400 && statusCode < 500) return false

    return false
}

// ─── Exponential backoff delay ───
function getBackoffDelay(attempt: number): number {
    const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500
    return Math.min(delay, MAX_DELAY_MS)
}

/**
 * Execute a Gemini API call with concurrency limiting and retry.
 *
 * @param fn  - Async function that makes the API call. Receives the attempt number.
 *              Should return { result, apiKey, statusCode? }
 * @param label - Label for logging (e.g., "video-analysis", "tts-summary")
 */
export async function queuedRequest<T>(
    fn: (attempt: number) => Promise<{ result: T; apiKey: string; statusCode?: number }>,
    label: string = "gemini-request"
): Promise<T> {
    await acquireSlot()
    const queuePos = activeRequests

    console.log(`[Queue] ▶ ${label} started (active: ${activeRequests}/${MAX_CONCURRENT}, queued: ${queuedRequests.length})`)

    try {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const { result, apiKey, statusCode } = await fn(attempt)
                markKeySuccess(apiKey)
                console.log(`[Queue] ✅ ${label} completed (attempt ${attempt + 1})`)
                return result
            } catch (error: any) {
                const statusCode = error.statusCode || error.status
                const apiKey = error.apiKey

                // Mark the key as failed if we have it
                if (apiKey) {
                    markKeyFailed(apiKey, statusCode)
                }

                // Check if we should retry
                if (attempt < MAX_RETRIES && isRetriable(error, statusCode)) {
                    const delay = getBackoffDelay(attempt)
                    console.warn(`[Queue] ⚠ ${label} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${error.message}. Retrying in ${(delay / 1000).toFixed(1)}s...`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }

                // No more retries — throw
                console.error(`[Queue] ❌ ${label} failed permanently after ${attempt + 1} attempts: ${error.message}`)
                throw error
            }
        }

        // Should never reach here
        throw new Error(`${label}: exhausted all retries`)
    } finally {
        releaseSlot()
    }
}

/**
 * Get current queue stats for monitoring.
 */
export function getQueueStats(): { active: number; queued: number; maxConcurrent: number } {
    return {
        active: activeRequests,
        queued: queuedRequests.length,
        maxConcurrent: MAX_CONCURRENT,
    }
}

/**
 * Helper: Create a retriable error with status code and API key info.
 */
export class ApiError extends Error {
    statusCode?: number
    apiKey?: string

    constructor(message: string, statusCode?: number, apiKey?: string) {
        super(message)
        this.name = "ApiError"
        this.statusCode = statusCode
        this.apiKey = apiKey
    }
}
