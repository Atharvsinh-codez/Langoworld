// ─── History Store (client-side, localStorage) ───
// Per-user history of summarized YouTube videos.

export interface HistoryEntry {
    id: string           // summary page ID
    videoUrl: string
    videoTitle: string
    channel: string
    summary: string      // truncated preview (first 200 chars)
    createdAt: string
    slug?: string
    source?: string      // 'youtube' | 'upload'
}

const MAX_ENTRIES = 100

function storageKey(userId: string): string {
    return `lw-history-${userId}`
}

/**
 * Get all history entries for a user, sorted newest-first.
 */
export function getHistory(userId: string): HistoryEntry[] {
    if (typeof window === "undefined" || !userId) return []

    try {
        const raw = localStorage.getItem(storageKey(userId))
        if (!raw) return []
        const entries: HistoryEntry[] = JSON.parse(raw)
        return entries.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    } catch {
        return []
    }
}

/**
 * Save a new entry to the user's history.
 * De-duplicates by ID. Auto-prunes to MAX_ENTRIES.
 */
export function saveToHistory(userId: string, entry: HistoryEntry): void {
    if (typeof window === "undefined" || !userId) return

    try {
        const entries = getHistory(userId)

        // De-duplicate — update if same ID exists
        const idx = entries.findIndex((e) => e.id === entry.id)
        if (idx !== -1) {
            entries[idx] = entry
        } else {
            entries.unshift(entry)
        }

        // Prune oldest if over limit
        const pruned = entries.slice(0, MAX_ENTRIES)

        localStorage.setItem(storageKey(userId), JSON.stringify(pruned))
    } catch (e) {
        console.warn("[HistoryStore] Failed to save:", e)
    }
}

/**
 * Delete a single entry from history.
 */
export function deleteFromHistory(userId: string, entryId: string): void {
    if (typeof window === "undefined" || !userId) return

    try {
        const entries = getHistory(userId)
        const filtered = entries.filter((e) => e.id !== entryId)
        localStorage.setItem(storageKey(userId), JSON.stringify(filtered))
    } catch (e) {
        console.warn("[HistoryStore] Failed to delete:", e)
    }
}

/**
 * Clear all history for a user.
 */
export function clearHistory(userId: string): void {
    if (typeof window === "undefined" || !userId) return
    localStorage.removeItem(storageKey(userId))
}
