// ─── Per-Device User ID (15-char alphanumeric) ───
// Stored in localStorage so each device gets a unique, persistent identity.

const STORAGE_KEY = "lw-user-id"
const ID_LENGTH = 15

/**
 * Generate a cryptographically random 15-character alphanumeric ID.
 */
export function generateUserId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let id = ""
    const array = new Uint8Array(ID_LENGTH)

    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(array)
    } else {
        for (let i = 0; i < ID_LENGTH; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }
    }

    for (let i = 0; i < ID_LENGTH; i++) {
        id += chars[array[i] % chars.length]
    }

    return id
}

/**
 * Get the current device's user ID from localStorage.
 * If none exists, generate a new one and persist it.
 */
export function getUserId(): string {
    if (typeof window === "undefined") return ""

    let id = localStorage.getItem(STORAGE_KEY)
    if (!id || id.length !== ID_LENGTH) {
        id = generateUserId()
        localStorage.setItem(STORAGE_KEY, id)
    }
    return id
}
