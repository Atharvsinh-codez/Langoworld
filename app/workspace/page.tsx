"use client"

import { useState, useCallback, useEffect } from "react"
import { useLingo } from "@/lib/lingo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { LangoWorldFlow } from "@/components/langoworld-flow"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"
import { LogOut, User, Upload } from "lucide-react"
import { generateSummaryId } from "@/lib/summary-store"
import { LANGUAGES } from "@/lib/lingo"

// Translation result type
interface TranslationResult {
    id: string
    sourceText: string
    sourceLang: string
    targetLang: string
    translatedText: string
    langName: string
    flag: string
    timestamp: string
}

// Translation history group (one per translate action)
interface TranslationHistoryGroup {
    dbId: string  // Supabase row ID for deletion
    results: TranslationResult[]
    createdAt: string
}

// Interfaces
interface VideoSummary {
    summary: string
    keyPoints: Array<{ timestamp: string; point: string }>
    explanation: string
}

interface HistoryEntry {
    id: string
    videoUrl: string
    videoTitle: string
    channel: string
    summary: string
    createdAt: string
    slug?: string
}

export default function WorkspacePage() {
    const { t } = useLingo()
    const router = useRouter()
    const supabase = createClient()

    // ── Separate state for YouTube & Upload (allows parallel operation) ──
    const [ytLoading, setYtLoading] = useState(false)
    const [ytResult, setYtResult] = useState<{
        summary: VideoSummary | null
        pageId: string | null
        pageUrl: string | null
        title: string | null
    }>({ summary: null, pageId: null, pageUrl: null, title: null })

    const [uploadLoading, setUploadLoading] = useState(false)
    const [uploadResult, setUploadResult] = useState<{
        summary: VideoSummary | null
        pageId: string | null
        pageUrl: string | null
        title: string | null
    }>({ summary: null, pageId: null, pageUrl: null, title: null })

    const [docLoading, setDocLoading] = useState(false)
    const [docResult, setDocResult] = useState<{
        summary: VideoSummary | null
        pageId: string | null
        pageUrl: string | null
        title: string | null
    }>({ summary: null, pageId: null, pageUrl: null, title: null })

    // Combined loading for the flow component
    const isLoading = ytLoading || uploadLoading || docLoading

    // ── Translation state ──
    const [translationLoading, setTranslationLoading] = useState(false)
    const [translationResults, setTranslationResults] = useState<TranslationResult[]>([])
    const [translationHistory, setTranslationHistory] = useState<TranslationHistoryGroup[]>([])

    // Auth & Profile
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [history, setHistory] = useState<HistoryEntry[]>([])

    // ── Initialize: get user, profile, history from Supabase ──
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }
            setUser(user)

            // Get profile
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            if (!profileData) {
                router.push("/username")
                return
            }
            setProfile(profileData)

            // Load history from Supabase
            await loadHistory(user.id)
            // Load translation history from Supabase
            await loadTranslationHistory(user.id)
        }
        init()
    }, [])

    // ── Load history from Supabase ──
    const loadHistory = async (userId: string) => {
        const { data, error } = await supabase
            .from("summaries")
            .select("id, video_url, video_title, channel, summary, created_at, source")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("[History] Load error:", error)
            return
        }

        const entries: HistoryEntry[] = (data || []).map((row: any) => ({
            id: row.id,
            videoUrl: row.video_url,
            videoTitle: row.video_title,
            channel: row.channel,
            summary: (row.summary || "").slice(0, 200),
            createdAt: row.created_at,
            source: row.source || "youtube",
        }))
        setHistory(entries)
    }
    // ── Load translation history from Supabase ──
    const loadTranslationHistory = async (userId: string) => {
        const { data, error } = await supabase
            .from("translation_history")
            .select("id, source_text, source_lang, translations, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20)

        if (error) {
            console.error("[TranslationHistory] Load error:", error)
            return
        }

        const groups: TranslationHistoryGroup[] = (data || []).map((row: any) => ({
            dbId: row.id,
            createdAt: row.created_at,
            results: (row.translations || []).map((t: any) => ({
                id: `${t.targetLang}-${row.id}`,
                sourceText: row.source_text,
                sourceLang: row.source_lang,
                targetLang: t.targetLang,
                translatedText: t.translatedText,
                langName: t.langName,
                flag: t.flag,
                timestamp: row.created_at,
            })),
        }))
        setTranslationHistory(groups)
    }

    // ─── YouTube Summarizer (independent state) ───
    const handleYoutubeSubmit = useCallback(async (url: string) => {
        if (!user) return
        setYtLoading(true)
        setYtResult({ summary: null, pageId: null, pageUrl: null, title: null })

        try {
            toast.info("Fetching transcript & analyzing with Gemini...")

            const res = await fetch("/api/youtube-understand", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "AI analysis failed")
            }

            const data = await res.json()

            setYtResult({
                summary: {
                    summary: data.summary,
                    keyPoints: data.keyPoints,
                    explanation: data.explanation,
                },
                pageId: data.summaryPageId || null,
                pageUrl: data.summaryPageUrl || null,
                title: data.videoTitle || null,
            })

            // Save to Supabase
            if (data.summaryPageId) {
                const { error: insertError } = await supabase.from("summaries").upsert({
                    id: data.summaryPageId,
                    user_id: user.id,
                    video_url: url,
                    video_title: data.videoTitle || "",
                    channel: data.channel || "",
                    summary: data.summary || "",
                    key_points: data.keyPoints || [],
                    explanation: data.explanation || "",
                    tts_summary: data.ttsSummary || "",
                    transcript: data.transcript || "",
                    chapters: data.chapters || [],
                    source: "youtube",
                    created_at: new Date().toISOString(),
                })

                if (insertError) {
                    console.error("[Supabase] Save error:", insertError)
                    toast.error("Failed to save to cloud")
                } else {
                    await loadHistory(user.id)
                }
            }

            toast.success(`AI generated ${data.keyPoints?.length || 0} key points`)

        } catch (error) {
            console.error("[YT Summarizer] Error:", error)
            const errorMsg = error instanceof Error ? error.message : "Something went wrong"
            toast.error(errorMsg)
        } finally {
            setYtLoading(false)
        }
    }, [user])

    // ─── Video Upload & Analysis (independent state) ───
    const handleVideoUpload = useCallback(async (file: File, onProgress: (phase: string, progress: number) => void) => {
        if (!user) return
        setUploadLoading(true)

        const summaryId = (() => {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
            let id = ""
            for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
            return id
        })()

        try {
            // Phase 1: Upload to R2
            onProgress("uploading", 10)
            toast.info("Uploading video to CDN...")

            const uploadRes = await fetch("/api/upload-video", {
                method: "POST",
                headers: {
                    "Content-Type": file.type,
                    "x-file-name": encodeURIComponent(file.name),
                    "x-file-type": file.type,
                    "x-user-id": user.id,
                    "x-summary-id": summaryId,
                },
                body: file,
            })

            if (!uploadRes.ok) {
                const err = await uploadRes.json()
                throw new Error(err.error || "Upload failed")
            }

            const { videoUrl } = await uploadRes.json()
            onProgress("analyzing", 50)
            toast.info("AI is analyzing your video...")

            // Phase 2: Analyze with Gemini
            const analyzeRes = await fetch("/api/video-understand", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoUrl: videoUrl,
                    videoTitle: file.name.replace(/\.[^.]+$/, ""),
                    fileName: file.name,
                }),
            })

            if (!analyzeRes.ok) {
                const err = await analyzeRes.json()
                throw new Error(err.error || "Analysis failed")
            }

            const data = await analyzeRes.json()
            onProgress("analyzing", 80)

            // Phase 3: Update upload result state (independent from YT)
            setUploadResult({
                summary: {
                    summary: data.summary,
                    keyPoints: data.keyPoints,
                    explanation: data.explanation,
                },
                pageId: data.summaryPageId || null,
                pageUrl: data.summaryPageUrl || null,
                title: data.videoTitle || null,
            })

            // Save to Supabase
            const { error: insertError } = await supabase.from("summaries").upsert({
                id: data.summaryPageId,
                user_id: user.id,
                video_url: videoUrl,
                video_title: data.videoTitle || file.name,
                channel: "Uploaded",
                summary: data.summary || "",
                key_points: data.keyPoints || [],
                explanation: data.explanation || "",
                tts_summary: data.ttsSummary || "",
                transcript: data.transcript || "",
                chapters: data.chapters || [],
                source: "upload",
                video_cdn_url: videoUrl,
                created_at: new Date().toISOString(),
            })

            if (insertError) {
                console.error("[Supabase] Save error:", insertError)
                toast.error("Failed to save to cloud")
            } else {
                await loadHistory(user.id)
            }

            onProgress("done", 100)
            toast.success(`Video analyzed! ${data.keyPoints?.length || 0} key points found`)

        } catch (error: any) {
            console.error("[Video Upload] Error:", error)
            toast.error(error.message || "Video upload failed")
            throw error
        } finally {
            setUploadLoading(false)
        }
    }, [user])

    // ─── Document Upload & Analysis (independent state) ───
    const handleDocumentUpload = useCallback(async (file: File, onProgress: (phase: string, progress: number) => void) => {
        if (!user) return
        setDocLoading(true)

        const docId = (() => {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
            let id = ""
            for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
            return id
        })()

        try {
            // Phase 1: Upload to R2
            onProgress("uploading", 10)
            toast.info("Uploading document...")

            // Browsers report .md files as "" or "application/octet-stream"
            const resolvedType = (() => {
                if (file.type && file.type !== "application/octet-stream") return file.type
                const ext = file.name.split(".").pop()?.toLowerCase()
                if (ext === "md") return "text/markdown"
                if (ext === "txt") return "text/plain"
                return "application/octet-stream"
            })()

            const uploadRes = await fetch("/api/upload-document", {
                method: "POST",
                headers: {
                    "Content-Type": resolvedType,
                    "x-file-name": encodeURIComponent(file.name),
                    "x-file-type": resolvedType,
                    "x-user-id": user.id,
                    "x-doc-id": docId,
                },
                body: file,
            })

            if (!uploadRes.ok) {
                const err = await uploadRes.json()
                throw new Error(err.error || "Upload failed")
            }

            const { docUrl, fileType } = await uploadRes.json()
            onProgress("analyzing", 50)
            toast.info("AI is analyzing your document...")

            // Phase 2: Analyze with Gemini
            const analyzeRes = await fetch("/api/document-understand", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    docUrl,
                    fileName: file.name.replace(/\.[^.]+$/, ""),
                    fileType: fileType || file.type,
                }),
            })

            if (!analyzeRes.ok) {
                const err = await analyzeRes.json()
                throw new Error(err.error || "Analysis failed")
            }

            const data = await analyzeRes.json()
            onProgress("analyzing", 80)

            // Phase 3: Update doc result state (independent from YT/Upload)
            setDocResult({
                summary: {
                    summary: data.summary,
                    keyPoints: data.keyPoints,
                    explanation: data.explanation,
                },
                pageId: data.summaryPageId || null,
                pageUrl: data.summaryPageUrl || null,
                title: data.videoTitle || null,
            })

            // Save to Supabase
            const { error: insertError } = await supabase.from("summaries").upsert({
                id: data.summaryPageId,
                user_id: user.id,
                video_url: docUrl,
                video_title: data.videoTitle || file.name,
                channel: "Document",
                summary: data.summary || "",
                key_points: data.keyPoints || [],
                explanation: data.explanation || "",
                tts_summary: data.ttsSummary || "",
                transcript: data.extractedText || "",
                chapters: [],
                source: "document",
                created_at: new Date().toISOString(),
            })

            if (insertError) {
                console.error("[Supabase] Save error:", insertError)
                toast.error("Failed to save to cloud")
            } else {
                await loadHistory(user.id)
            }

            onProgress("done", 100)
            toast.success(`Document analyzed! ${data.keyPoints?.length || 0} key points found`)

        } catch (error: any) {
            console.error("[Doc Upload] Error:", error)
            toast.error(error.message || "Document upload failed")
            throw error
        } finally {
            setDocLoading(false)
        }
    }, [user])

    // ─── Delete from history ───
    const handleDeleteHistory = useCallback(async (entryId: string) => {
        if (!user) return

        const { error } = await supabase
            .from("summaries")
            .delete()
            .eq("id", entryId)
            .eq("user_id", user.id)

        if (error) {
            toast.error("Failed to delete")
            return
        }

        await loadHistory(user.id)
        toast.success("Removed from history")
    }, [user])

    // ─── Sign Out ───
    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    // ─── Translation Handler (sequential: one language at a time) ───
    const handleTranslate = useCallback(async (text: string, sourceLang: string, targetLangs: string[]) => {
        if (!text.trim() || targetLangs.length === 0) return

        setTranslationLoading(true)
        setTranslationResults([])

        try {
            const allResults: TranslationResult[] = []
            const timestamp = new Date().toISOString()

            // Translate one by one, showing each result as it completes
            for (const targetLang of targetLangs) {
                try {
                    const response = await fetch("/api/translate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            text,
                            targetLocale: targetLang,
                            sourceLocale: sourceLang,
                        }),
                    })

                    if (!response.ok) throw new Error(`Translation to ${targetLang} failed`)

                    const data = await response.json()
                    const langInfo = LANGUAGES.find(l => l.code === targetLang)

                    const result: TranslationResult = {
                        id: `${targetLang}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        sourceText: text,
                        sourceLang,
                        targetLang,
                        translatedText: data.translated || text,
                        langName: langInfo?.name || targetLang,
                        flag: langInfo?.flag || "\ud83c\udf10",
                        timestamp,
                    }

                    allResults.push(result)
                    // Show result immediately on canvas (step by step)
                    setTranslationResults([...allResults])
                } catch (err) {
                    console.warn(`Translation to ${targetLang} failed:`, err)
                }
            }

            if (allResults.length === 0) {
                toast.error("Translation failed")
                return
            }

            // Always add to local history immediately
            const tempId = `temp-${Date.now()}`
            const group: TranslationHistoryGroup = {
                dbId: tempId,
                createdAt: new Date().toISOString(),
                results: allResults,
            }
            setTranslationHistory(prev => [group, ...prev].slice(0, 20))

            // Try to persist to Supabase (works even if table doesn't exist yet — just logs error)
            if (user) {
                try {
                    const { data: inserted, error: insertError } = await supabase
                        .from("translation_history")
                        .insert({
                            user_id: user.id,
                            source_text: text,
                            source_lang: sourceLang,
                            translations: allResults.map(r => ({
                                targetLang: r.targetLang,
                                translatedText: r.translatedText,
                                langName: r.langName,
                                flag: r.flag,
                            })),
                        })
                        .select("id, created_at")
                        .single()

                    if (!insertError && inserted) {
                        // Update local entry with real DB ID for proper deletion
                        setTranslationHistory(prev =>
                            prev.map(g => g.dbId === tempId ? { ...g, dbId: inserted.id, createdAt: inserted.created_at } : g)
                        )
                    } else if (insertError) {
                        console.warn("[TranslationHistory] DB save failed (table may not exist):", insertError.message)
                    }
                } catch (e) {
                    console.warn("[TranslationHistory] DB save skipped:", e)
                }
            }

            toast.success(`Translated to ${allResults.length} language${allResults.length > 1 ? "s" : ""}`)
        } catch (error) {
            console.error("Translation error:", error)
            toast.error("Translation failed")
        } finally {
            setTranslationLoading(false)
        }
    }, [user])

    // ─── Clear Translation History Entry (from Supabase + local) ───
    const handleClearTranslationHistory = useCallback(async (index: number) => {
        const group = translationHistory[index]
        if (group?.dbId) {
            const { error } = await supabase
                .from("translation_history")
                .delete()
                .eq("id", group.dbId)
            if (error) console.error("[TranslationHistory] Delete error:", error)
        }
        setTranslationHistory(prev => prev.filter((_, i) => i !== index))
    }, [translationHistory])

    // ─── Clear Translation Results (when panel reopens) ───
    const handleClearTranslationResults = useCallback(() => {
        setTranslationResults([])
    }, [])

    // ─── Remove a single Translation Result ───
    const handleRemoveTranslationResult = useCallback((index: number) => {
        setTranslationResults(prev => prev.filter((_, i) => i !== index))
    }, [])

    return (
        <>
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2">
                {/* User Info */}
                {profile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-full border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm">
                        {user?.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt={profile.username}
                                className="w-6 h-6 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-blue-500 flex items-center justify-center">
                                <User className="w-3 h-3 text-white" />
                            </div>
                        )}
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            @{profile.username}
                        </span>
                    </div>
                )}
                <button
                    onClick={handleSignOut}
                    className="p-2 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group"
                    title="Sign out"
                >
                    <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-500 transition-colors" />
                </button>
                <ThemeToggle />
                <LanguageSwitcher />
            </div>

            <div className="fixed inset-0 w-screen h-screen bg-background">
                <LangoWorldFlow
                    isLoading={isLoading}
                    uploadLoading={uploadLoading}
                    docLoading={docLoading}
                    translationLoading={translationLoading}
                    onYoutubeSubmit={handleYoutubeSubmit}
                    onVideoUpload={handleVideoUpload}
                    onDocumentUpload={handleDocumentUpload}
                    onTranslate={handleTranslate}
                    ytResult={ytResult}
                    uploadResult={uploadResult}
                    docResult={docResult}
                    translationResults={translationResults}
                    translationHistory={translationHistory}
                    onClearTranslationHistory={handleClearTranslationHistory}
                    onClearTranslationResults={handleClearTranslationResults}
                    onRemoveTranslationResult={handleRemoveTranslationResult}
                    history={history}
                    onDeleteHistory={handleDeleteHistory}
                />
            </div>
        </>
    )
}
