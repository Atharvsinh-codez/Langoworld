"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Play, Pause, ChevronDown, ChevronUp, Clock, Sparkles, BookOpen, Mic, Globe, X, Languages, Download, Eye, EyeOff, Volume2, Loader2, Check, Film } from "lucide-react"
import type { VideoSummaryData } from "@/lib/summary-store"
import { createClient } from "@/lib/supabase-browser"
import { useLingo, LANGUAGES } from "@/lib/lingo"

// ─── Typewriter Text Component ───

function TypewriterText({ text, isAnimating, className }: { text: string; isAnimating: boolean; className?: string }) {
    const [displayText, setDisplayText] = useState(text)
    const [isTyping, setIsTyping] = useState(false)
    const prevTextRef = useRef(text)

    useEffect(() => {
        if (text === prevTextRef.current) { setDisplayText(text); return }
        prevTextRef.current = text
        if (!isAnimating) { setDisplayText(text); return }

        setIsTyping(true)
        setDisplayText("")
        let index = 0
        const speed = Math.max(6, Math.min(25, 1800 / text.length))
        const interval = setInterval(() => {
            index++
            setDisplayText(text.slice(0, index))
            if (index >= text.length) { clearInterval(interval); setIsTyping(false) }
        }, speed)
        return () => clearInterval(interval)
    }, [text, isAnimating])

    return (
        <span className={className}>
            {displayText}
            {isTyping && <span className="inline-block w-[2px] h-[1em] bg-orange-500 ml-0.5 animate-blink align-text-bottom rounded-sm" />}
        </span>
    )
}

// ─── Gemini TTS helper ───

let currentAudioRef: HTMLAudioElement | null = null

async function playTextWithGeminiTTS(
    text: string,
    language: string,
    onStart?: () => void,
    onEnd?: () => void,
    meta?: { pageId?: string; pageTitle?: string; section?: string },
): Promise<void> {
    if (currentAudioRef) {
        currentAudioRef.pause()
        currentAudioRef.src = ""
        currentAudioRef = null
    }

    try {
        const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text,
                language,
                pageId: meta?.pageId,
                pageTitle: meta?.pageTitle,
                section: meta?.section,
            }),
        })

        if (!res.ok) throw new Error("TTS generation failed")

        const data = await res.json()
        if (!data.audioUrl) throw new Error("No audio URL returned")

        const audio = new Audio(data.audioUrl)
        currentAudioRef = audio
        audio.onended = () => { currentAudioRef = null; onEnd?.() }
        audio.onerror = () => { currentAudioRef = null; onEnd?.() }
        await audio.play()
        onStart?.()  // Called AFTER audio starts playing
    } catch (err) {
        console.error("[TTS] Playback error:", err)
        onEnd?.()
    }
}

function stopCurrentAudio() {
    if (currentAudioRef) {
        currentAudioRef.pause()
        currentAudioRef.src = ""
        currentAudioRef = null
    }
}

// ─── Word Selection Popup (Translation + TTS) ───

function WordTranslationPopup({
    selectedText,
    anchorPos,
    onClose,
    onReplace,
}: {
    selectedText: string
    anchorPos: { x: number; y: number }
    onClose: () => void
    onReplace: (original: string, translated: string) => void
}) {
    const [translatedText, setTranslatedText] = useState("")
    const [isTranslating, setIsTranslating] = useState(false)
    const [selectedLang, setSelectedLang] = useState("")
    const [showLangPicker, setShowLangPicker] = useState(false)
    const [isPlayingTTS, setIsPlayingTTS] = useState(false)
    const [isLoadingTTS, setIsLoadingTTS] = useState(false)
    const [isPlayingTranslatedTTS, setIsPlayingTranslatedTTS] = useState(false)
    const [isLoadingTranslatedTTS, setIsLoadingTranslatedTTS] = useState(false)
    const [replaced, setReplaced] = useState(false)
    const popupRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const [mode, setMode] = useState<"actions" | "translate" | "translated">("actions")

    // Compute position near cursor, clamped to viewport
    useEffect(() => {
        const w = 320
        const h = 400
        let x = anchorPos.x - w / 2
        let y = anchorPos.y + 12
        x = Math.max(12, Math.min(x, window.innerWidth - w - 12))
        y = Math.max(12, Math.min(y, window.innerHeight - h - 12))
        if (y < anchorPos.y + 40 && anchorPos.y - h - 12 > 0) {
            y = anchorPos.y - h - 12
        }
        setPos({ x, y })
    }, [anchorPos])

    // Cleanup audio on unmount
    useEffect(() => () => stopCurrentAudio(), [])

    const handleTranslate = async (langCode: string) => {
        setSelectedLang(langCode)
        setMode("translated")
        setIsTranslating(true)
        setTranslatedText("")
        setReplaced(false)
        try {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: selectedText, targetLocale: langCode, sourceLocale: "en" }),
            })
            if (!res.ok) throw new Error("Translation failed")
            const data = await res.json()
            const result = data.translated || selectedText
            setTranslatedText(result)
        } catch {
            setTranslatedText("Translation failed")
        } finally {
            setIsTranslating(false)
        }
    }

    const handleApplyTranslation = () => {
        if (translatedText && translatedText !== selectedText && translatedText !== "Translation failed") {
            onReplace(selectedText, translatedText)
            setReplaced(true)
        }
    }

    const handlePlayOriginalTTS = () => {
        if (isPlayingTTS) {
            stopCurrentAudio()
            setIsPlayingTTS(false)
            setIsLoadingTTS(false)
            return
        }
        if (isLoadingTTS) return
        setIsLoadingTTS(true)
        playTextWithGeminiTTS(
            selectedText,
            "en",
            () => { setIsLoadingTTS(false); setIsPlayingTTS(true) },
            () => { setIsPlayingTTS(false); setIsLoadingTTS(false) },
            { section: "word-selection" },
        )
    }

    const handlePlayTranslatedTTS = () => {
        if (isPlayingTranslatedTTS) {
            stopCurrentAudio()
            setIsPlayingTranslatedTTS(false)
            setIsLoadingTranslatedTTS(false)
            return
        }
        if (isLoadingTranslatedTTS) return
        setIsLoadingTranslatedTTS(true)
        playTextWithGeminiTTS(
            translatedText,
            selectedLang || "en",
            () => { setIsLoadingTranslatedTTS(false); setIsPlayingTranslatedTTS(true) },
            () => { setIsPlayingTranslatedTTS(false); setIsLoadingTranslatedTTS(false) },
            { section: "word-translation" },
        )
    }

    // ─── Drag-to-move ───
    const [isDragging, setIsDragging] = useState(false)
    const dragOffset = useRef({ x: 0, y: 0 })

    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    }

    useEffect(() => {
        if (!isDragging) return
        const handleMove = (e: MouseEvent) => {
            setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
        }
        const handleUp = () => setIsDragging(false)
        document.addEventListener("mousemove", handleMove)
        document.addEventListener("mouseup", handleUp)
        return () => { document.removeEventListener("mousemove", handleMove); document.removeEventListener("mouseup", handleUp) }
    }, [isDragging])

    const langName = LANGUAGES.find(l => l.code === selectedLang)?.name || selectedLang

    return (
        <div
            ref={popupRef}
            data-word-popup
            className="fixed z-[100]"
            style={{
                left: pos.x,
                top: pos.y,
                animation: isDragging ? "none" : "popupIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
        >
            <div className="w-[320px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-black/15 dark:shadow-black/50 overflow-hidden">
                {/* Header — drag handle */}
                <div
                    onMouseDown={handleDragStart}
                    className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between select-none"
                    style={{ cursor: isDragging ? "grabbing" : "grab" }}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-foreground">LangoWorld</span>
                    </div>
                    <button onClick={() => { stopCurrentAudio(); onClose() }} className="text-zinc-400 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Selected Text */}
                <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <p className="text-xs text-foreground font-medium line-clamp-2">&ldquo;{selectedText}&rdquo;</p>
                </div>

                {/* ─── ACTION BUTTONS (initial mode) ─── */}
                {mode === "actions" && (
                    <div className="px-4 py-4 space-y-2">
                        {/* Read Aloud button */}
                        <button
                            onClick={handlePlayOriginalTTS}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isPlayingTTS
                                ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400"
                                : isLoadingTTS
                                    ? "bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 animate-pulse cursor-wait"
                                    : "bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20"
                                }`}
                        >
                            {isLoadingTTS ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                            ) : isPlayingTTS ? (
                                <><Pause className="w-4 h-4" /> Stop Reading</>
                            ) : (
                                <><Volume2 className="w-4 h-4" /> Read Aloud</>
                            )}
                        </button>

                        {/* Translate button */}
                        <button
                            onClick={() => { setMode("translate"); setShowLangPicker(true) }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
                        >
                            <Languages className="w-4 h-4" /> Translate & Replace
                        </button>
                    </div>
                )}

                {/* ─── LANGUAGE PICKER ─── */}
                {mode === "translate" && showLangPicker && (
                    <div className="px-3 py-3 max-h-[260px] overflow-y-auto">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium px-2 mb-2">Translate to</p>
                        <div className="grid grid-cols-3 gap-1">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleTranslate(lang.code)}
                                    className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 text-foreground/80 hover:text-orange-600 dark:hover:text-orange-400 transition-all"
                                >
                                    <span>{lang.flag}</span>
                                    <span className="truncate">{lang.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── TRANSLATION RESULT ─── */}
                {mode === "translated" && (
                    <div className="px-4 py-4">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                            {isTranslating ? "Translating..." : langName}
                        </p>
                        {isTranslating ? (
                            <div className="relative h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 rounded-full animate-shimmer" />
                            </div>
                        ) : (
                            <>
                                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400 leading-relaxed mb-3">{translatedText}</p>

                                {translatedText && translatedText !== "Translation failed" && (
                                    <div className="flex gap-2">
                                        {/* Apply & Replace */}
                                        {!replaced ? (
                                            <button
                                                onClick={handleApplyTranslation}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Apply & Replace
                                            </button>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                                <Check className="w-3.5 h-3.5" /> Replaced ✓
                                            </div>
                                        )}

                                        {/* TTS the translation */}
                                        <button
                                            onClick={handlePlayTranslatedTTS}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${isPlayingTranslatedTTS
                                                ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30"
                                                : isLoadingTranslatedTTS
                                                    ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 animate-pulse cursor-wait"
                                                    : "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 hover:bg-orange-100"
                                                }`}
                                        >
                                            {isLoadingTranslatedTTS ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPlayingTranslatedTTS ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                            {isLoadingTranslatedTTS ? "Loading..." : isPlayingTranslatedTTS ? "Stop" : "Listen"}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            onClick={() => { setMode("translate"); setShowLangPicker(true); setTranslatedText(""); setSelectedLang(""); setReplaced(false) }}
                            className="mt-3 text-[11px] text-zinc-400 hover:text-foreground transition-colors"
                        >
                            ← Other languages
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Inline Selection Shimmer ───

function InlineShimmer({ rect }: { rect: DOMRect }) {
    return (
        <div className="fixed z-50 pointer-events-none" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
            <div className="w-full h-full rounded-md border-2 border-orange-400/50 bg-orange-400/8 animate-pulse" />
        </div>
    )
}

// ─── Main Page ───

export default function VideoSummaryPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const { locale, t } = useLingo()

    const [data, setData] = useState<VideoSummaryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [transcriptExpanded, setTranscriptExpanded] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
    const ttsLockRef = useRef(false)

    // Stop TTS audio when navigating away from the page
    useEffect(() => {
        return () => {
            stopCurrentAudio()
            ttsLockRef.current = false
        }
    }, [])

    // Full page translation
    const [pageLang, setPageLang] = useState(locale || "en")
    const [isPageTranslating, setIsPageTranslating] = useState(false)
    const [translatedData, setTranslatedData] = useState<Record<string, any> | null>(null)
    const [showLangMenu, setShowLangMenu] = useState(false)
    const [isTextAnimating, setIsTextAnimating] = useState(false)
    const langMenuRef = useRef<HTMLDivElement>(null)
    const [autoTranslatePending, setAutoTranslatePending] = useState(false)

    // Transcript translation
    const [transcriptLang, setTranscriptLang] = useState("en")
    const [isTranscriptTranslating, setIsTranscriptTranslating] = useState(false)
    const [translatedTranscript, setTranslatedTranscript] = useState("")
    const [showTranscriptLangMenu, setShowTranscriptLangMenu] = useState(false)
    const [isTranscriptAnimating, setIsTranscriptAnimating] = useState(false)
    const transcriptLangMenuRef = useRef<HTMLDivElement>(null)

    // Word selection
    const [selectedWord, setSelectedWord] = useState("")
    const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
    const [showWordPopup, setShowWordPopup] = useState(false)

    // Inline replacements
    const [inlineReplacements, setInlineReplacements] = useState<Array<{ original: string; translated: string }>>([])

    const originalDataRef = useRef<VideoSummaryData | null>(null)

    // View Original toggle
    const [showOriginal, setShowOriginal] = useState(false)
    const hasAnyTranslation = !!(translatedData || translatedTranscript || inlineReplacements.length > 0)

    // Persist translations to Supabase
    const persistTranslations = useCallback(async (updates?: {
        pageData?: Record<string, any> | null;
        pageLangCode?: string;
        transcript?: string;
        transcriptLangCode?: string;
        replacements?: Array<{ original: string; translated: string }>;
    }) => {
        const supabase = createClient()
        const langCode = updates?.pageLangCode || pageLang
        if (langCode === "en") return

        const translationPayload = {
            summary_id: id,
            language: langCode,
            translated_data: {
                translatedData: updates?.pageData !== undefined ? updates.pageData : translatedData,
                pageLang: langCode,
                translatedTranscript: updates?.transcript !== undefined ? updates.transcript : translatedTranscript,
                transcriptLang: updates?.transcriptLangCode !== undefined ? updates.transcriptLangCode : transcriptLang,
                inlineReplacements: updates?.replacements !== undefined ? updates.replacements : inlineReplacements,
            },
            translated_transcript: updates?.transcript !== undefined ? updates.transcript : translatedTranscript,
        }

        await supabase.from("translations").upsert(translationPayload, {
            onConflict: "summary_id,language",
        })
    }, [id, translatedData, pageLang, translatedTranscript, transcriptLang, inlineReplacements])

    useEffect(() => {
        async function load() {
            const supabase = createClient()

            const { data: row, error: fetchError } = await supabase
                .from("summaries")
                .select("*")
                .eq("id", id)
                .single()

            if (fetchError || !row) {
                // Fallback to API route (for in-memory summaries)
                try {
                    const res = await fetch(`/api/yt-summary/${id}`)
                    if (!res.ok) throw new Error("not found")
                    const json = await res.json()
                    setData(json)
                    originalDataRef.current = JSON.parse(JSON.stringify(json))
                } catch {
                    setError("Summary not found or has expired.")
                } finally {
                    setLoading(false)
                }
                return
            }

            const parsed: VideoSummaryData = {
                id: row.id,
                videoId: "",
                videoUrl: row.video_url,
                videoTitle: row.video_title,
                channel: row.channel,
                summary: row.summary,
                transcript: row.transcript,
                keyPoints: row.key_points || [],
                explanation: row.explanation,
                ttsSummary: row.tts_summary,
                chapters: row.chapters || [],
                createdAt: row.created_at,
            }
            setData(parsed)
            originalDataRef.current = JSON.parse(JSON.stringify(parsed))
            setLoading(false)

            // Restore persisted translations
            const { data: translations } = await supabase
                .from("translations")
                .select("*")
                .eq("summary_id", id)
                .order("created_at", { ascending: false })
                .limit(1)

            if (translations && translations.length > 0) {
                const t = translations[0].translated_data as any
                if (t) {
                    if (t.translatedData) setTranslatedData(t.translatedData)
                    if (t.pageLang) setPageLang(t.pageLang)
                    if (t.translatedTranscript) setTranslatedTranscript(t.translatedTranscript)
                    if (t.transcriptLang) setTranscriptLang(t.transcriptLang)
                    if (t.inlineReplacements?.length) setInlineReplacements(t.inlineReplacements)
                }
            } else if (locale && locale !== "en") {
                setAutoTranslatePending(true)
            }
        }
        load()
    }, [id])

    // Close menus on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setShowLangMenu(false)
            if (transcriptLangMenuRef.current && !transcriptLangMenuRef.current.contains(e.target as Node)) setShowTranscriptLangMenu(false)
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    // Word selection listener
    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.closest("[data-word-popup]")) return

            const selection = window.getSelection()
            const text = selection?.toString().trim()
            if (text && text.length > 0 && text.length < 500) {
                const range = selection?.getRangeAt(0)
                if (range) {
                    const rect = range.getBoundingClientRect()
                    setSelectedWord(text)
                    setSelectionRect(rect)
                    setCursorPos({ x: rect.left + rect.width / 2, y: rect.bottom })
                    setShowWordPopup(true)
                }
            }
        }
        document.addEventListener("mouseup", handleMouseUp)
        return () => document.removeEventListener("mouseup", handleMouseUp)
    }, [])

    // Full page translation
    const handlePageTranslation = useCallback(async (langCode: string) => {
        setShowLangMenu(false)
        if (langCode === "en" && originalDataRef.current) {
            setIsTextAnimating(true)
            setTranslatedData(null)
            setPageLang("en")
            persistTranslations({ pageData: null, pageLangCode: "en" })
            setTimeout(() => setIsTextAnimating(false), 1500)
            return
        }
        if (!data) return
        setIsPageTranslating(true)
        setPageLang(langCode)
        try {
            const textsToTranslate = [
                data.summary || "",
                data.explanation || "",
                data.ttsSummary || "",
                ...(data.keyPoints || []).map(kp => kp.point),
            ]
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texts: textsToTranslate, targetLocale: langCode, sourceLocale: "en" }),
            })
            if (!res.ok) throw new Error("Translation failed")
            const result = await res.json()
            const translated = result.translated || textsToTranslate
            const kpCount = (data.keyPoints || []).length
            const translatedKP = translated.slice(3, 3 + kpCount)
            setIsTextAnimating(true)
            const newTranslatedData = {
                summary: translated[0],
                explanation: translated[1],
                ttsSummary: translated[2],
                keyPoints: (data.keyPoints || []).map((kp: any, i: number) => ({ ...kp, point: translatedKP[i] || kp.point })),
            }
            setTranslatedData(newTranslatedData)
            persistTranslations({ pageData: newTranslatedData, pageLangCode: langCode })
            setTimeout(() => setIsTextAnimating(false), 3000)
        } catch (e) {
            console.error("Page translation failed:", e)
            setPageLang("en")
        } finally {
            setIsPageTranslating(false)
        }
    }, [data])

    // Auto-translate when data loads and global locale is non-English
    useEffect(() => {
        if (autoTranslatePending && data && locale && locale !== "en") {
            setAutoTranslatePending(false)
            handlePageTranslation(locale)
        }
    }, [autoTranslatePending, data])

    // Transcript translation
    const handleTranscriptTranslation = useCallback(async (langCode: string) => {
        setShowTranscriptLangMenu(false)
        if (langCode === "en") {
            setIsTranscriptAnimating(true)
            setTranslatedTranscript("")
            setTranscriptLang("en")
            persistTranslations({ transcript: "", transcriptLangCode: "en" })
            setTimeout(() => setIsTranscriptAnimating(false), 1500)
            return
        }
        if (!data?.transcript) return
        setIsTranscriptTranslating(true)
        setTranscriptLang(langCode)
        try {
            const text = data.transcript
            const chunkSize = 3000
            const chunks: string[] = []
            for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize))
            const translatedChunks: string[] = []
            for (const chunk of chunks) {
                const res = await fetch("/api/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: chunk, targetLocale: langCode, sourceLocale: "en" }),
                })
                if (!res.ok) throw new Error("Translation failed")
                const result = await res.json()
                translatedChunks.push(result.translated || chunk)
            }
            setIsTranscriptAnimating(true)
            const joinedTranscript = translatedChunks.join("")
            setTranslatedTranscript(joinedTranscript)
            persistTranslations({ transcript: joinedTranscript, transcriptLangCode: langCode })
            setTimeout(() => setIsTranscriptAnimating(false), 3000)
        } catch (e) {
            console.error("Transcript translation failed:", e)
            setTranscriptLang("en")
        } finally {
            setIsTranscriptTranslating(false)
        }
    }, [data])

    // TTS (with ref lock to prevent double-click)
    const handleTTS = useCallback(() => {
        const text = translatedData?.ttsSummary || data?.ttsSummary
        if (!text) return
        if (isSpeaking || ttsLockRef.current) {
            stopCurrentAudio()
            setIsSpeaking(false)
            setIsGeneratingTTS(false)
            ttsLockRef.current = false
            return
        }
        ttsLockRef.current = true
        setIsGeneratingTTS(true)
        const lang = pageLang || "en"
        playTextWithGeminiTTS(
            text,
            lang,
            () => { setIsGeneratingTTS(false); setIsSpeaking(true) },
            () => { setIsSpeaking(false); setIsGeneratingTTS(false); ttsLockRef.current = false },
            { pageId: id, pageTitle: data?.videoTitle, section: "tts-summary" },
        )
    }, [data, translatedData, isSpeaking, pageLang])

    // Download as markdown
    const handleDownload = () => {
        if (!data) return
        const summary = translatedData?.summary || data.summary || ""
        const explanation = translatedData?.explanation || data.explanation || ""
        const tts = translatedData?.ttsSummary || data.ttsSummary || ""
        const kps = (translatedData?.keyPoints || data.keyPoints || [])
            .map((kp: any) => `- **${kp.timestamp}** — ${kp.point}`)
            .join("\n")
        const transcript = translatedTranscript || data.transcript || ""

        const md = `# ${data.videoTitle}\n\n**Source:** Uploaded Video\n**Created:** ${new Date(data.createdAt).toLocaleDateString()}\n\n---\n\n## Summary\n\n${summary}\n\n## Key Points\n\n${kps}\n\n## AI Explanation\n\n${explanation}\n\n## TTS Summary\n\n${tts}\n\n## Full Transcript\n\n${transcript}\n`

        const blob = new Blob([md], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${data.videoTitle?.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase() || "summary"}.md`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Apply inline word replacements
    const applyReplacements = useCallback((text: string): string => {
        let result = text
        for (const { original, translated } of inlineReplacements) result = result.split(original).join(translated)
        return result
    }, [inlineReplacements])

    const handleWordReplace = useCallback((original: string, translated: string) => {
        setInlineReplacements(prev => {
            const updated = [...prev, { original, translated }]
            persistTranslations({ replacements: updated })
            return updated
        })
    }, [persistTranslations])

    // Resolved display data
    const orig = originalDataRef.current
    const rawSummary = showOriginal ? (orig?.summary || "") : (translatedData?.summary || data?.summary || "")
    const rawExplanation = showOriginal ? (orig?.explanation || "") : (translatedData?.explanation || data?.explanation || "")
    const rawTTS = showOriginal ? (orig?.ttsSummary || "") : (translatedData?.ttsSummary || data?.ttsSummary || "")
    const rawKeyPoints = showOriginal ? (orig?.keyPoints || []) : (translatedData?.keyPoints || data?.keyPoints || [])
    const displaySummary = showOriginal ? rawSummary : applyReplacements(rawSummary)
    const displayExplanation = showOriginal ? rawExplanation : applyReplacements(rawExplanation)
    const displayTTS = showOriginal ? rawTTS : applyReplacements(rawTTS)
    const displayKeyPoints = showOriginal ? rawKeyPoints : rawKeyPoints.map((kp: any) => ({ ...kp, point: applyReplacements(kp.point) }))
    const displayTranscript = showOriginal ? (orig?.transcript || "") : applyReplacements(translatedTranscript || data?.transcript || "")
    const currentTranscriptLang = LANGUAGES.find(l => l.code === transcriptLang)

    // Check if this is an uploaded video (has R2 CDN URL)
    const isUploadedVideo = data?.videoUrl?.includes("r2.dev") || data?.channel === "Uploaded"

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm">Loading video summary...</p>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-4">{error || "Summary not found"}</p>
                    <button onClick={() => router.push("/workspace")} className="text-orange-500 hover:underline">← Back to Workspace</button>
                </div>
            </div>
        )
    }

    const currentLang = LANGUAGES.find(l => l.code === pageLang)

    return (
        <div className="min-h-screen bg-background">
            {/* Global Styles */}
            <style jsx global>{`
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .animate-shimmer { animation: shimmer 1.5s ease-in-out infinite; }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                .animate-blink { animation: blink 0.7s ease-in-out infinite; }
                @keyframes popupIn { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>

            {/* Translation Loading Overlay */}
            {(isPageTranslating || isTranscriptTranslating) && (
                <div className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
                        style={{ animation: "popupIn 0.25s ease forwards" }}>
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-2 border-zinc-200 dark:border-zinc-700" />
                            <div className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            {isTranscriptTranslating ? "Translating transcript..." : "Translating page..."}
                        </p>
                        <p className="text-xs text-zinc-400">
                            To {LANGUAGES.find(l => l.code === (isTranscriptTranslating ? transcriptLang : pageLang))?.name}
                        </p>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <header className="sticky top-0 z-50 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
                    <button onClick={() => router.push("/workspace")} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Workspace
                    </button>

                    {/* View Original toggle */}
                    {hasAnyTranslation && (
                        <button
                            onClick={() => setShowOriginal(!showOriginal)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${showOriginal
                                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-foreground/70"
                                }`}
                        >
                            {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showOriginal ? "Viewing Original" : "View Original"}
                        </button>
                    )}
                    <span className="text-zinc-300 dark:text-zinc-700">/</span>
                    <span className="text-sm text-zinc-500 truncate flex-1">{data.videoTitle}</span>

                    {/* Download */}
                    <button onClick={handleDownload} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-foreground" title="Download as Markdown">
                        <Download className="w-3.5 h-3.5 text-zinc-500" />
                    </button>

                    {/* Language Switcher */}
                    <div className="relative" ref={langMenuRef}>
                        <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-foreground">
                            <Globe className="w-3.5 h-3.5 text-orange-500" />
                            <span>{currentLang?.flag} {currentLang?.name || "English"}</span>
                            <ChevronDown className="w-3 h-3 text-zinc-400" />
                        </button>
                        {showLangMenu && (
                            <div className="absolute right-0 top-full mt-2 w-[280px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-2 max-h-[400px] overflow-y-auto z-[70]" style={{ animation: "popupIn 0.15s ease forwards" }}>
                                <p className="px-2 py-1 text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Translate page (excl. transcript)</p>
                                <div className="grid grid-cols-2 gap-1 mt-1">
                                    {LANGUAGES.map((lang) => (
                                        <button key={lang.code} onClick={() => handlePageTranslation(lang.code)}
                                            className={`flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg transition-all ${pageLang === lang.code ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-foreground/80"}`}>
                                            <span>{lang.flag}</span>
                                            <span className="truncate">{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Video Title */}
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight mb-4">{data.videoTitle}</h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 mb-6">
                    <span className="flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-orange-500" />
                        Uploaded Video
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span>{new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    {pageLang !== "en" && (
                        <>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="text-orange-500 text-xs font-medium bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">{currentLang?.flag} {currentLang?.name}</span>
                        </>
                    )}
                </div>

                {/* ─── Video Player ─── */}
                {isUploadedVideo && data.videoUrl && (
                    <section className="mb-10">
                        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg bg-black">
                            <video
                                controls
                                className="w-full max-h-[500px]"
                                src={data.videoUrl}
                                preload="metadata"
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </section>
                )}

                {/* ─── Summary ─── */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-orange-500" />
                        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Summary</h2>
                    </div>
                    <p className="text-foreground/80 text-lg leading-relaxed whitespace-pre-line">
                        <TypewriterText text={displaySummary} isAnimating={isTextAnimating} />
                    </p>
                </section>

                {/* ─── Key Points ─── */}
                {displayKeyPoints.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-orange-400" />
                            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Key Points</h2>
                        </div>
                        <div className="space-y-3">
                            {displayKeyPoints.map((kp: any, i: number) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="font-mono text-sm text-orange-500 mt-0.5 shrink-0 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded">{kp.timestamp}</span>
                                    <span className="text-foreground/70 leading-relaxed">
                                        <TypewriterText text={kp.point} isAnimating={isTextAnimating} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ─── Full Transcript ─── */}
                {data.transcript && (
                    <section className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5 text-zinc-500" />
                            <button onClick={() => setTranscriptExpanded(!transcriptExpanded)} className="flex items-center gap-2 flex-1 text-left">
                                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Full Transcript</h2>
                                <span className="text-xs text-zinc-400 ml-1">({data.transcript.split(/\s+/).length.toLocaleString()} words)</span>
                                <div className="ml-auto text-zinc-400">
                                    {transcriptExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </button>
                            {/* Transcript-only translate */}
                            <div className="relative" ref={transcriptLangMenuRef}>
                                <button onClick={() => setShowTranscriptLangMenu(!showTranscriptLangMenu)} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-foreground">
                                    <Globe className="w-3 h-3 text-orange-500" />
                                    <span>{currentTranscriptLang?.flag} {currentTranscriptLang?.name || "English"}</span>
                                </button>
                                {showTranscriptLangMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-[260px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-2 max-h-[320px] overflow-y-auto z-[70]" style={{ animation: "popupIn 0.15s ease forwards" }}>
                                        <p className="px-2 py-1 text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Translate transcript</p>
                                        <div className="grid grid-cols-2 gap-1 mt-1">
                                            {LANGUAGES.map((lang) => (
                                                <button key={lang.code} onClick={() => handleTranscriptTranslation(lang.code)}
                                                    className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-all ${transcriptLang === lang.code ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-foreground/80"}`}>
                                                    <span>{lang.flag}</span>
                                                    <span className="truncate">{lang.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {transcriptExpanded ? (
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-800/50">
                                <p className="text-foreground/70 leading-loose whitespace-pre-line text-sm">
                                    <TypewriterText text={displayTranscript} isAnimating={isTranscriptAnimating} />
                                </p>
                            </div>
                        ) : (
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-800/50 relative overflow-hidden cursor-pointer" onClick={() => setTranscriptExpanded(true)}>
                                <p className="text-foreground/70 leading-loose text-sm line-clamp-4">{displayTranscript}</p>
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-50 dark:from-zinc-900/80 to-transparent flex items-end justify-center pb-2">
                                    <span className="text-xs text-zinc-400">Click to expand</span>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ─── TTS Summary ─── */}
                {displayTTS && (
                    <section className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <Mic className="w-5 h-5 text-orange-500" />
                            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">TTS Summary</h2>
                            <span className="text-[10px] text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full ml-2 uppercase font-medium">AI Rewritten</span>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50/50 to-zinc-50 dark:from-orange-500/5 dark:to-zinc-900/50 rounded-xl p-6 border border-orange-100 dark:border-orange-500/10">
                            <p className="text-foreground/80 leading-relaxed whitespace-pre-line mb-6">
                                <TypewriterText text={displayTTS} isAnimating={isTextAnimating} />
                            </p>
                            <button onClick={handleTTS}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${isSpeaking ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20" : isGeneratingTTS ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 cursor-wait" : "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"}`}>
                                {isGeneratingTTS ? (
                                    <>
                                        <span className="inline-flex items-center gap-[3px] h-4">
                                            {[0, 1, 2, 3, 4].map(i => (
                                                <span key={i} className="w-[3px] rounded-full bg-white" style={{
                                                    height: '100%',
                                                    animation: `tts-bar 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                                                }} />
                                            ))}
                                        </span>
                                        Generating...
                                        <style>{`@keyframes tts-bar { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }`}</style>
                                    </>
                                ) : isSpeaking ? <><Pause className="w-4 h-4" />Stop Reading</> : <><Play className="w-4 h-4" />Read Aloud</>}
                            </button>
                        </div>
                    </section>
                )}

                {/* ─── AI Explanation ─── */}
                <section className="mb-16">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">AI Explanation</h2>
                    </div>
                    <div className="text-foreground/80 leading-relaxed whitespace-pre-line">
                        <TypewriterText text={displayExplanation} isAnimating={isTextAnimating} />
                    </div>
                </section>
            </main>

            {/* Word Selection Translation Popup */}
            {showWordPopup && selectedWord && (
                <WordTranslationPopup
                    selectedText={selectedWord}
                    anchorPos={cursorPos}
                    onReplace={handleWordReplace}
                    onClose={() => { setShowWordPopup(false); setSelectedWord(""); setSelectionRect(null) }}
                />
            )}
        </div>
    )
}
