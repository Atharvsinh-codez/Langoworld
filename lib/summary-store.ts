// ─── Summary Store (in-memory, server-side) ───
// Summaries are stored in-memory on the server and also returned
// to the client for localStorage persistence.

export interface VideoSummaryData {
    id: string
    videoId: string
    videoUrl: string
    videoTitle: string
    channel: string
    summary: string
    transcript: string
    keyPoints: Array<{ timestamp: string; point: string }>
    explanation: string
    ttsSummary: string
    chapters: Array<{
        id: string
        title: string
        content: string
        textContent: string
        wordCount: number
        startTime: string
    }>
    createdAt: string
    slug?: string // custom URL slug (e.g. "my-video" → /yt/my-video)
}

// Server-side in-memory store (backup)
const store = new Map<string, VideoSummaryData>()
// Slug → ID mapping
const slugMap = new Map<string, string>()

export function saveSummary(data: VideoSummaryData): void {
    store.set(data.id, data)
    if (data.slug) slugMap.set(data.slug, data.id)
    // Keep max 50 summaries
    if (store.size > 50) {
        const oldest = Array.from(store.entries())
            .sort((a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime())
        store.delete(oldest[0][0])
    }
}

export function getSummary(id: string): VideoSummaryData | null {
    return store.get(id) || null
}

export function getSummaryBySlug(slug: string): VideoSummaryData | null {
    const id = slugMap.get(slug)
    if (id) return store.get(id) || null
    return null
}

export function renameSummary(id: string, newSlug: string): { success: boolean; error?: string } {
    const data = store.get(id)
    if (!data) return { success: false, error: "Summary not found" }

    // Validate slug
    const cleanSlug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    if (!cleanSlug || cleanSlug.length < 2) return { success: false, error: "Slug too short (min 2 chars)" }
    if (cleanSlug.length > 60) return { success: false, error: "Slug too long (max 60 chars)" }

    // Check uniqueness
    const existingId = slugMap.get(cleanSlug)
    if (existingId && existingId !== id) return { success: false, error: "This URL is already taken" }

    // Remove old slug if any
    if (data.slug) slugMap.delete(data.slug)

    // Set new slug
    data.slug = cleanSlug
    store.set(id, data)
    slugMap.set(cleanSlug, id)
    return { success: true }
}

export function getAllSummaries(): VideoSummaryData[] {
    return Array.from(store.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function generateSummaryId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    let id = ""
    for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * chars.length)]
    }
    return id
}
