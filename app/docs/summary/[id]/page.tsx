"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Play, Pause, ChevronDown, ChevronUp, Clock, Sparkles, BookOpen, Mic, Globe, X, Languages, Download, Eye, EyeOff, Volume2, Loader2, Check, FileText } from "lucide-react"
import type { VideoSummaryData } from "@/lib/summary-store"
import { createClient } from "@/lib/supabase-browser"
import { useLingo, LANGUAGES } from "@/lib/lingo"

// ─── Typewriter Text Component ───

function TypewriterText({ text, isAnimating, className }: { text: string; isAnimating: boolean; className?: string }) {
    const [displayedText, setDisplayedText] = useState("")
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        if (!isAnimating || !text) {
            setDisplayedText(text)
            setIsComplete(true)
            return
        }
        setIsComplete(false)
        setDisplayedText("")
        let idx = 0
        const interval = setInterval(() => {
            idx += 3
            if (idx >= text.length) {
                setDisplayedText(text)
                setIsComplete(true)
                clearInterval(interval)
            } else {
                setDisplayedText(text.slice(0, idx))
            }
        }, 8)
        return () => clearInterval(interval)
    }, [text, isAnimating])

    return (
        <span className={className}>
            {displayedText}
            {isAnimating && !isComplete && (
                <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse align-middle" />
            )}
        </span>
    )
}

// ─── Gemini TTS helper — plays text via /api/tts with R2 CDN caching ───

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

        onStart?.()

        const audio = new Audio(data.audioUrl)
        currentAudioRef = audio
        audio.onended = () => { currentAudioRef = null; onEnd?.() }
        audio.onerror = () => { currentAudioRef = null; onEnd?.() }
        await audio.play()
    } catch (error) {
        console.error("[TTS] Playback error:", error)
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
                        <Sparkles className="w-4 h-4 text-blue-500" />
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
                                    ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse cursor-wait"
                                    : "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
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
                                    className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-foreground/80 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
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
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 rounded-full animate-shimmer" />
                            </div>
                        ) : (
                            <>
                                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 leading-relaxed mb-3">{translatedText}</p>

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
                                                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 animate-pulse cursor-wait"
                                                    : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100"
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

// ─── Main Document Summary Page ───

export default function DocSummaryPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const { locale, t } = useLingo()

    const [data, setData] = useState<VideoSummaryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [extractedTextExpanded, setExtractedTextExpanded] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
    const ttsLockRef = useRef(false)
    const [isTextAnimating, setIsTextAnimating] = useState(false)

    // Stop TTS audio when navigating away
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
    const langMenuRef = useRef<HTMLDivElement>(null)

    // Extracted text translation
    const [extractedTextLang, setExtractedTextLang] = useState("en")
    const [isExtractedTextTranslating, setIsExtractedTextTranslating] = useState(false)
    const [translatedExtractedText, setTranslatedExtractedText] = useState("")
    const [showExtractedTextLangMenu, setShowExtractedTextLangMenu] = useState(false)
    const extractedTextLangMenuRef = useRef<HTMLDivElement>(null)

    // Word selection
    const [selectedWord, setSelectedWord] = useState("")
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
    const [showWordPopup, setShowWordPopup] = useState(false)

    // Inline replacements
    const [inlineReplacements, setInlineReplacements] = useState<Array<{ original: string; translated: string }>>([])

    const originalDataRef = useRef<VideoSummaryData | null>(null)
    const [autoTranslatePending, setAutoTranslatePending] = useState(false)

    // View Original toggle
    const [showOriginal, setShowOriginal] = useState(false)
    const hasAnyTranslation = !!(translatedData || translatedExtractedText || inlineReplacements.length > 0)

    // Helper: apply inline replacements
    const applyReplacements = (text: string) => {
        if (showOriginal) return text
        let result = text
        inlineReplacements.forEach(({ original, translated }) => {
            result = result.replaceAll(original, translated)
        })
        return result
    }

    // Load summary from Supabase
    useEffect(() => {
        async function load() {
            const supabase = createClient()

            const { data: row, error: fetchError } = await supabase
                .from("summaries")
                .select("*")
                .eq("id", id)
                .single()

            if (fetchError || !row) {
                try {
                    const res = await fetch(`/api/yt-summary/${id}`)
                    if (!res.ok) throw new Error("not found")
                    const json = await res.json()
                    setData(json)
                    originalDataRef.current = JSON.parse(JSON.stringify(json))
                } catch {
                    setError("Document summary not found.")
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
                    if (t.translatedExtractedText) setTranslatedExtractedText(t.translatedExtractedText)
                    if (t.extractedTextLang) setExtractedTextLang(t.extractedTextLang)
                    if (t.inlineReplacements?.length) setInlineReplacements(t.inlineReplacements)
                }
            } else if (locale && locale !== "en") {
                // No persisted translation — schedule auto-translate after translatePage is available
                setAutoTranslatePending(true)
            }
        }

        load()
    }, [id])

    // Close menus on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setShowLangMenu(false)
            if (extractedTextLangMenuRef.current && !extractedTextLangMenuRef.current.contains(e.target as Node)) setShowExtractedTextLangMenu(false)
        }
        document.addEventListener("click", handleClick)
        return () => document.removeEventListener("click", handleClick)
    }, [])

    // Text selection → popup
    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            const selection = window.getSelection()
            const text = selection?.toString().trim()
            if (text && text.length > 1 && text.length < 500) {
                setSelectedWord(text)
                setCursorPos({ x: Math.min(e.clientX + 10, window.innerWidth - 340), y: Math.min(e.clientY + 10, window.innerHeight - 200) })
                setShowWordPopup(true)
            }
        }
        document.addEventListener("mouseup", handleMouseUp)
        return () => document.removeEventListener("mouseup", handleMouseUp)
    }, [])

    // ── Page Translation ──
    const translatePage = async (langCode: string) => {
        if (!data || langCode === "en") {

            setTranslatedData(null)
            setPageLang("en")
            return
        }
        setIsPageTranslating(true)
        setPageLang(langCode)
        setShowLangMenu(false)

        try {
            const textsToTranslate = [
                data.summary || "",
                data.explanation || "",
                ...(data.keyPoints || []).map(kp => kp.point),
            ].filter(Boolean)

            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texts: textsToTranslate, targetLocale: langCode, sourceLocale: "en" }),
            })

            if (res.ok) {
                const { translated } = await res.json()
                let idx = 0
                const td: Record<string, any> = {}
                if (data.summary) td.summary = translated[idx++]
                if (data.explanation) td.explanation = translated[idx++]
                td.keyPoints = (data.keyPoints || []).map(kp => ({
                    ...kp,
                    point: translated[idx++] || kp.point,
                }))
                setTranslatedData(td)
                setIsTextAnimating(true)
                setTimeout(() => setIsTextAnimating(false), 3000)

                // Persist
                const supabase = createClient()
                await supabase.from("translations").upsert({
                    summary_id: id,
                    language: langCode,
                    translated_data: { translatedData: td, pageLang: langCode, translatedExtractedText, extractedTextLang, inlineReplacements },
                    translated_transcript: translatedExtractedText,
                }, { onConflict: "summary_id,language" })
            }
        } catch (e) {
            console.error("Translation failed:", e)
        }
        setIsPageTranslating(false)
    }

    // Auto-translate when data loads and global locale is non-English
    useEffect(() => {
        if (autoTranslatePending && data && locale && locale !== "en") {
            setAutoTranslatePending(false)
            translatePage(locale)
        }
    }, [autoTranslatePending, data])

    // ── Extracted Text Translation ──
    const translateExtractedText = async (langCode: string) => {
        if (!data?.transcript || langCode === "en") {
            setTranslatedExtractedText("")
            setExtractedTextLang("en")
            return
        }
        setIsExtractedTextTranslating(true)
        setExtractedTextLang(langCode)
        setShowExtractedTextLangMenu(false)

        try {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: data.transcript.substring(0, 5000), targetLocale: langCode, sourceLocale: "en" }),
            })

            if (res.ok) {
                const { translated } = await res.json()
                setTranslatedExtractedText(translated)
            }
        } catch (e) {
            console.error("Extracted text translation failed:", e)
        }
        setIsExtractedTextTranslating(false)
    }

    // ── TTS (with ref lock to prevent double-click) ──
    const handleTTS = useCallback(() => {
        const text = translatedData?.ttsSummary || data?.ttsSummary || data?.summary || ""
        if (!text) return

        // If already speaking, stop it
        if (isSpeaking) {
            stopCurrentAudio()
            setIsSpeaking(false)
            setIsGeneratingTTS(false)
            ttsLockRef.current = false
            return
        }

        // If already generating (locked), silently ignore rapid clicks
        if (ttsLockRef.current) return

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

    // ── Download ──
    const handleDownload = () => {
        if (!data) return
        const content = `# ${data.videoTitle}\n\n## Summary\n${data.summary}\n\n## Key Points\n${(data.keyPoints || []).map(kp => `- ${kp.point}`).join("\n")}\n\n## Explanation\n${data.explanation}\n\n## Extracted Text\n${data.transcript || "N/A"}\n`
        const blob = new Blob([content], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${data.videoTitle || "document"}-summary.md`
        a.click()
        URL.revokeObjectURL(url)
    }

    // ── Get display values (with translations applied) ──
    const displaySummary = showOriginal ? (originalDataRef.current?.summary || "") : applyReplacements(translatedData?.summary || data?.summary || "")
    const displayExplanation = showOriginal ? (originalDataRef.current?.explanation || "") : applyReplacements(translatedData?.explanation || data?.explanation || "")
    const displayKeyPoints = showOriginal
        ? (originalDataRef.current?.keyPoints || [])
        : (translatedData?.keyPoints || data?.keyPoints || []).map((kp: any) => ({
            ...kp,
            point: applyReplacements(kp.point),
        }))
    const displayTTS = showOriginal ? (originalDataRef.current?.ttsSummary || "") : applyReplacements(translatedData?.ttsSummary || data?.ttsSummary || "")
    const displayExtractedText = showOriginal ? (originalDataRef.current?.transcript || "") : (translatedExtractedText || applyReplacements(data?.transcript || ""))

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-zinc-500 font-medium">Loading document summary...</p>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Not Found</h2>
                    <p className="text-zinc-500">{error || "Document summary not found."}</p>
                    <button onClick={() => router.push("/workspace")} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors">
                        ← Back to Workspace
                    </button>
                </div>
            </div>
        )
    }

    // Detect if this is an image
    const isImage = data.videoUrl && /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(data.videoUrl)

    return (
        <div className="min-h-screen bg-background">
            {/* ── Header ── */}
            <header className="sticky top-0 z-40 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
                    {/* Back */}
                    <button
                        onClick={() => router.push("/workspace")}
                        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-foreground transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("Workspace")}
                    </button>

                    <span className="text-zinc-300 dark:text-zinc-700 shrink-0">/</span>

                    {/* Document title breadcrumb */}
                    <span className="text-sm text-zinc-500 truncate flex-1 min-w-0">{data.videoTitle}</span>

                    {/* View Original toggle */}
                    {hasAnyTranslation && (
                        <button
                            onClick={() => setShowOriginal(!showOriginal)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all shrink-0 ${showOriginal
                                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-foreground/70"
                                }`}
                        >
                            {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showOriginal ? t("Viewing Original") : t("View Original")}
                        </button>
                    )}

                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-foreground shrink-0"
                        title={t("Download as Markdown")}
                    >
                        <Download className="w-3.5 h-3.5 text-zinc-500" />
                    </button>

                    {/* Language Switcher */}
                    <div className="relative shrink-0" ref={langMenuRef}>
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            disabled={isPageTranslating}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-foreground disabled:opacity-50"
                        >
                            {isPageTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <Globe className="w-3.5 h-3.5 text-blue-500" />}
                            <span>{pageLang === "en" ? "English" : LANGUAGES.find(l => l.code === pageLang)?.name}</span>
                            <ChevronDown className="w-3 h-3 text-zinc-400" />
                        </button>
                        {showLangMenu && (
                            <div className="absolute right-0 top-full mt-2 w-[280px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-2 max-h-[400px] overflow-y-auto z-[70]" style={{ animation: "popupIn 0.15s ease forwards" }}>
                                <p className="px-2 py-1 text-[10px] text-zinc-400 uppercase tracking-wider font-medium">{t("Translate page")}</p>
                                <div className="grid grid-cols-2 gap-1 mt-1">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => translatePage(lang.code)}
                                            className={`flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg transition-all ${pageLang === lang.code ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-foreground/80"}`}
                                        >
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

            {/* ── Content ── */}
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Title */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-500">
                        <FileText className="w-4 h-4" />
                        <span>{t("Document Analysis")}</span>
                        <span className="text-zinc-400">•</span>
                        <span className="text-zinc-400">{new Date(data.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{data.videoTitle}</h1>
                </div>

                {/* Image Preview (if image file) */}
                {isImage && (
                    <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg">
                        <img
                            src={data.videoUrl}
                            alt={data.videoTitle}
                            className="w-full max-h-96 object-contain bg-zinc-100 dark:bg-zinc-900"
                        />
                    </div>
                )}

                {/* Summary */}
                <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-blue-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">{t("Summary")}</h2>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{displaySummary}</p>
                </section>

                {/* Key Points */}
                {displayKeyPoints.length > 0 && (
                    <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground">{t("Key Points")}</h2>
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">{displayKeyPoints.length}</span>
                        </div>
                        <ul className="space-y-3">
                            {displayKeyPoints.map((kp: any, i: number) => (
                                <li key={i} className="flex gap-3 items-start">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                        {i + 1}
                                    </span>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{kp.point}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ─── TTS Summary ─── */}
                {displayTTS && (
                    <section className="bg-gradient-to-br from-blue-50/50 to-zinc-50 dark:from-blue-500/5 dark:to-zinc-900/50 rounded-2xl border border-blue-200 dark:border-blue-500/10 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <Mic className="w-4 h-4 text-blue-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground">{t("TTS Summary")}</h2>
                            <span className="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full ml-2 uppercase font-medium">{t("AI Rewritten")}</span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap mb-6">
                            <TypewriterText text={displayTTS} isAnimating={isTextAnimating} />
                        </p>
                        <button onClick={handleTTS}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${isSpeaking ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20" : isGeneratingTTS ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 cursor-wait" : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"}`}>
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
                                    {t("Generating...")}
                                    <style>{`@keyframes tts-bar { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }`}</style>
                                </>
                            ) : isSpeaking ? <><Pause className="w-4 h-4" />{t("Stop Reading")}</> : <><Play className="w-4 h-4" />{t("Read Aloud")}</>}
                        </button>
                    </section>
                )}

                {/* ─── AI Explanation ─── */}
                {displayExplanation && (
                    <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground">{t("AI Explanation")}</h2>
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                            <TypewriterText text={displayExplanation} isAnimating={isTextAnimating} />
                        </div>
                    </section>
                )}

                {/* Extracted Text */}
                {data.transcript && (
                    <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">{t("Extracted Text")}</h2>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Translate extracted text */}
                                <div className="relative" ref={extractedTextLangMenuRef}>
                                    <button
                                        onClick={() => setShowExtractedTextLangMenu(!showExtractedTextLangMenu)}
                                        disabled={isExtractedTextTranslating}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all disabled:opacity-50"
                                    >
                                        {isExtractedTextTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                                        {extractedTextLang === "en" ? t("Translate") : LANGUAGES.find(l => l.code === extractedTextLang)?.flag}
                                    </button>

                                    {showExtractedTextLangMenu && (
                                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 w-48 max-h-48 overflow-auto z-50">
                                            <button onClick={() => translateExtractedText("en")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                                🇬🇧 English
                                            </button>
                                            {LANGUAGES.filter(l => l.code !== "en").map(lang => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => translateExtractedText(lang.code)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                >
                                                    {lang.flag} {lang.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Toggle expand */}
                                <button
                                    onClick={() => setExtractedTextExpanded(!extractedTextExpanded)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                >
                                    {extractedTextExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    {extractedTextExpanded ? t("Collapse") : t("Expand")}
                                </button>
                            </div>
                        </div>

                        <div className={`${extractedTextExpanded ? "" : "max-h-48 overflow-hidden"} relative`}>
                            <pre className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                                {displayExtractedText}
                            </pre>
                            {!extractedTextExpanded && (
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-zinc-900/50 to-transparent pointer-events-none" />
                            )}
                        </div>
                    </section>
                )}
            </main>

            {/* Word Translation Popup */}
            {showWordPopup && selectedWord && (
                <WordTranslationPopup
                    selectedText={selectedWord}
                    anchorPos={cursorPos}
                    onClose={() => { setShowWordPopup(false); setSelectedWord("") }}
                    onReplace={(original, translated) => {
                        setInlineReplacements(prev => [...prev, { original, translated }])
                    }}
                />
            )}
        </div>
    )
}
