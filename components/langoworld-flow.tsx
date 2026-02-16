"use client"

import React, { useCallback, useMemo, useEffect, useState } from "react"
import { useLingo } from "@/lib/lingo"
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  NodeTypes,
  BackgroundVariant,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { YoutubeInput } from "@/components/workspace/youtube-input"
import { UploadInput, UploadPanel } from "@/components/workspace/upload-input"
import { DocumentInput, DocumentPanel } from "@/components/workspace/document-input"
import { TranslationInput } from "@/components/workspace/translation-input"
import { TranslationPanel } from "@/components/workspace/translation-panel"
import { Brain, Sparkles, ExternalLink, CheckCircle2, Link2, Pencil, Check, AlertCircle, Clock, Video, Film, History, Download, Loader2, Trash2, Languages, Copy, Volume2 } from "lucide-react"
import Link from "next/link"
import type { HistoryEntry } from "@/lib/history-store"
import { createClient } from "@/lib/supabase-browser"
import { LANGUAGES } from "@/lib/lingo"

// ─── Types ───

interface VideoSummary {
  summary: string
  keyPoints: Array<{ timestamp: string; point: string }>
  explanation: string
}

interface FeatureResult {
  summary: VideoSummary | null
  pageId: string | null
  pageUrl: string | null
  title: string | null
}

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

interface TranslationHistoryGroup {
  dbId: string
  results: TranslationResult[]
  createdAt: string
}

interface WorkspaceFlowProps {
  isLoading: boolean
  uploadLoading?: boolean
  docLoading?: boolean
  translationLoading?: boolean
  onYoutubeSubmit?: (url: string) => Promise<void>
  onVideoUpload?: (file: File, onProgress: (phase: string, progress: number) => void) => Promise<void>
  onDocumentUpload?: (file: File, onProgress: (phase: string, progress: number) => void) => Promise<void>
  onTranslate?: (text: string, sourceLang: string, targetLangs: string[]) => Promise<void>
  ytResult?: FeatureResult
  uploadResult?: FeatureResult
  docResult?: FeatureResult
  translationResults?: TranslationResult[]
  translationHistory?: TranslationHistoryGroup[]
  onClearTranslationHistory?: (index: number) => void
  onClearTranslationResults?: () => void
  history?: HistoryEntry[]
  onDeleteHistory?: (entryId: string) => void
}

// ─── Helper: format "time ago" ───

function formatTimeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

// ─── History Node (canvas-based) ───

// ─── History Node (canvas-based) ───

function HistoryNode({ data }: { data: any }) {
  const { t } = useLingo()
  const { entries = [], onDelete } = data as { entries: HistoryEntry[]; onDelete?: (id: string) => void }
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [customUrlId, setCustomUrlId] = useState<string | null>(null)
  const [customSlug, setCustomSlug] = useState("")
  const [slugStatus, setSlugStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const handleDownload = async (id: string, format: "md" | "txt") => {
    setDownloadingId(id)
    try {
      const supabase = createClient()
      const { data: summaryData } = await supabase
        .from("summaries")
        .select("*")
        .eq("id", id)
        .single()

      if (!summaryData) return

      const { data: translations } = await supabase
        .from("translations")
        .select("translated_data, translated_transcript")
        .eq("summary_id", id)
        .order("created_at", { ascending: false })
        .limit(1)

      const tData = translations?.[0]?.translated_data as any
      const s = tData?.translatedData?.summary || summaryData.summary || ""
      const e = tData?.translatedData?.explanation || summaryData.explanation || ""
      const tts = tData?.translatedData?.ttsSummary || summaryData.tts_summary || ""
      const kps = (tData?.translatedData?.keyPoints || summaryData.key_points || [])
        .map((kp: any) => `- ${kp.timestamp} — ${kp.point}`)
        .join("\n")
      const trans = translations?.[0]?.translated_transcript || summaryData.transcript || ""

      let content: string
      let mimeType: string
      let ext: string

      if (format === "md") {
        content = `# ${summaryData.video_title}\n\n**Channel:** ${summaryData.channel}\n**Video:** ${summaryData.video_url}\n**Created:** ${new Date(summaryData.created_at).toLocaleDateString()}\n\n---\n\n## Summary\n\n${s}\n\n## Key Points\n\n${kps}\n\n## AI Explanation\n\n${e}\n\n## TTS Summary\n\n${tts}\n\n## Full Transcript\n\n${trans}\n`
        mimeType = "text/markdown"
        ext = "md"
      } else {
        content = `${summaryData.video_title}\n\nChannel: ${summaryData.channel}\nVideo: ${summaryData.video_url}\nCreated: ${new Date(summaryData.created_at).toLocaleDateString()}\n\n${"─".repeat(40)}\n\nSummary\n\n${s}\n\nKey Points\n\n${kps}\n\nAI Explanation\n\n${e}\n\nTTS Summary\n\n${tts}\n\nFull Transcript\n\n${trans}\n`
        mimeType = "text/plain"
        ext = "txt"
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${summaryData.video_title?.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase() || "summary"}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download failed", err)
    } finally {
      setDownloadingId(null)
      setExpandedId(null)
    }
  }

  const handleSaveSlug = async (id: string) => {
    if (!customSlug.trim()) return
    setSlugStatus("saving")
    try {
      const supabase = createClient()
      const clean = customSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")

      // Check if slug already taken
      const { data: existing } = await supabase
        .from("summaries")
        .select("id")
        .eq("custom_slug", clean)
        .neq("id", id)
        .limit(1)

      if (existing && existing.length > 0) {
        setSlugStatus("error")
        return
      }

      const { error } = await supabase
        .from("summaries")
        .update({ custom_slug: clean })
        .eq("id", id)

      if (error) throw error
      setSlugStatus("saved")
      setTimeout(() => {
        setCustomUrlId(null)
        setSlugStatus("idle")
        setCustomSlug("")
        setExpandedId(null)
      }, 1200)
    } catch {
      setSlugStatus("error")
    }
  }

  return (
    <div className="w-[300px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/40 overflow-hidden">
      <Handle type="source" position={Position.Right} className="!bg-blue-500 !border-blue-600 !w-3 !h-3" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50/80 dark:bg-zinc-800/30">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
          <History className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{t("History")}</h3>
          <p className="text-[10px] text-zinc-400 font-medium">
            {entries.length} {entries.length === 1 ? t("summary") : t("summaries")}
          </p>
        </div>
      </div>

      {/* Entries List */}
      <div className="max-h-[400px] overflow-y-auto px-2 py-2 space-y-1.5">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <Video className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {t("No summaries yet")}
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="relative">
              <div
                className="group flex gap-2 items-start bg-zinc-50/80 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 hover:border-blue-200 dark:hover:border-zinc-600 rounded-xl p-2.5 transition-all"
              >
                {/* Drag handle / expand toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedId(expandedId === entry.id ? null : entry.id)
                    setCustomUrlId(null)
                    setSlugStatus("idle")
                    setCustomSlug("")
                  }}
                  className={`pt-0.5 flex flex-col items-center gap-[2px] transition-colors ${expandedId === entry.id ? 'text-blue-500' : 'text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400'}`}
                  title="Actions"
                >
                  <span className="text-[10px] leading-none">⋮⋮</span>
                </button>

                <Link
                  href={entry.source === "upload" ? `/video/summary/${entry.id}` : entry.source === "document" ? `/docs/summary/${entry.id}` : `/yt/summary/${entry.id}`}
                  className="block flex-1 min-w-0"
                >
                  {/* Title */}
                  <h4 className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 leading-snug line-clamp-2">
                    {entry.source === "upload" && <Film className="inline w-3 h-3 text-purple-500 mr-1" />}
                    {entry.videoTitle || t("Untitled Video")}
                  </h4>

                  {/* Meta row */}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1.5">
                      {entry.channel && (
                        <span className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded">
                          {entry.channel}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-[9px] text-zinc-400 dark:text-zinc-500">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimeAgo(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* ── Expanded Actions Panel ── */}
              {expandedId === entry.id && (
                <div
                  className="mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 shadow-lg space-y-2"
                  style={{ animation: "popupIn 0.15s ease forwards" }}
                >
                  {customUrlId !== entry.id ? (
                    <>
                      {/* Download Options */}
                      <div className="flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="text-[10px] font-medium text-zinc-500 mr-auto">{t("Download")}</span>
                        <button
                          onClick={() => handleDownload(entry.id, "txt")}
                          disabled={downloadingId === entry.id}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {downloadingId === entry.id ? "..." : ".txt"}
                        </button>
                        <button
                          onClick={() => handleDownload(entry.id, "md")}
                          disabled={downloadingId === entry.id}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {downloadingId === entry.id ? "..." : ".md"}
                        </button>
                      </div>

                      {/* Custom URL */}
                      <button
                        onClick={() => { setCustomUrlId(entry.id); setCustomSlug("") }}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-lg transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        {t("Set custom URL")}
                      </button>

                      {/* Delete */}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm(t("Delete this summary from database? This cannot be undone."))) {
                              onDelete(entry.id)
                              setExpandedId(null)
                            }
                          }}
                          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t("Delete summary")}
                        </button>
                      )}
                    </>
                  ) : (
                    /* Custom URL Input */
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <Link2 className="w-3 h-3" />
                        <span className="font-medium">{t("Custom URL")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0">{entry.source === "upload" ? "/video/" : entry.source === "document" ? "/docs/" : "/yt/"}</span>
                        <input
                          value={customSlug}
                          onChange={(e) => { setCustomSlug(e.target.value); setSlugStatus("idle") }}
                          placeholder="my-summary"
                          className="flex-1 min-w-0 px-2 py-1.5 text-[11px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-foreground placeholder:text-zinc-300"
                        />
                        <button
                          onClick={() => handleSaveSlug(entry.id)}
                          disabled={slugStatus === "saving" || !customSlug.trim()}
                          className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all disabled:opacity-50"
                        >
                          {slugStatus === "saving" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : slugStatus === "saved" ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {slugStatus === "saved" && (
                        <p className="text-[9px] text-emerald-500 font-medium">{t("✓ Custom URL saved!")}</p>
                      )}
                      {slugStatus === "error" && (
                        <p className="text-[9px] text-red-500 font-medium">{t("URL taken or error")}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center">
          {t("Synced to cloud")}
        </p>
      </div>
    </div>
  )
}

// ─── Summary Page Node ───

function SummaryPageNode({ data }: { data: any }) {
  const { t } = useLingo()
  const { videoTitle, summaryPageUrl, summary, theme } = data

  // Theme colors
  const colors = theme === "orange"
    ? { handle: "!bg-orange-500 !border-orange-600", iconBg: "bg-orange-500/10 dark:bg-orange-500/20", icon: "text-orange-500", btn: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 hover:shadow-orange-500/30" }
    : theme === "emerald"
      ? { handle: "!bg-emerald-500 !border-emerald-600", iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20", icon: "text-emerald-500", btn: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 hover:shadow-emerald-500/30" }
      : { handle: "!bg-blue-500 !border-blue-600", iconBg: "bg-blue-500/10 dark:bg-blue-500/20", icon: "text-blue-500", btn: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20 hover:shadow-blue-500/30" }

  return (
    <div className="w-[320px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/40 overflow-hidden">
      <Handle type="target" position={Position.Left} className={`${colors.handle} !w-3 !h-3`} />
      <Handle type="source" position={Position.Right} className={`${colors.handle} !w-3 !h-3`} />

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
            <Brain className={`w-4 h-4 ${colors.icon}`} />
          </div>
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{t("Summary")}</h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full font-medium">
          <CheckCircle2 className="w-3 h-3" />
          {t("Published")}
        </div>
      </div>

      {/* Video Title */}
      <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
          {videoTitle || t("Video Summary")}
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">{summary}</p>
      </div>

      {/* Link */}
      <div className="px-4 py-3">
        <Link
          href={summaryPageUrl || "#"}
          className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 ${colors.btn} text-white rounded-xl text-xs font-semibold transition-all shadow-md hover:shadow-lg`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {t("Open Summary Page")}
        </Link>
      </div>
    </div>
  )
}

// ─── Custom URL Rename Node ───

function RenameNode({ data }: { data: any }) {
  const { t } = useLingo()
  const { summaryPageId, currentSlug, onRename, urlPrefix = "/yt/", theme } = data

  // Theme colors
  const colors = theme === "orange"
    ? { handle: "!bg-orange-500 !border-orange-600", iconBg: "bg-orange-500/10 dark:bg-orange-500/20", icon: "text-orange-500", btn: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20", slug: "text-orange-400" }
    : theme === "emerald"
      ? { handle: "!bg-emerald-500 !border-emerald-600", iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20", icon: "text-emerald-500", btn: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20", slug: "text-emerald-400" }
      : { handle: "!bg-blue-500 !border-blue-600", iconBg: "bg-blue-500/10 dark:bg-blue-500/20", icon: "text-blue-500", btn: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20", slug: "text-blue-400" }
  const [slug, setSlug] = useState(currentSlug || "")
  const [isEditing, setIsEditing] = useState(!currentSlug)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [savedSlug, setSavedSlug] = useState(currentSlug || "")

  const handleSave = async () => {
    if (!slug.trim()) return
    setIsSaving(true)
    setError("")

    try {
      const res = await fetch("/api/yt-summary/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: summaryPageId, slug: slug.trim() }),
      })
      const result = await res.json()

      if (!res.ok) {
        setError(result.error || t("Rename failed"))
        return
      }

      setSavedSlug(slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"))
      setIsEditing(false)
      if (onRename) onRename(slug.trim())
    } catch {
      setError(t("Network error"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-[280px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/40 overflow-hidden">
      <Handle type="target" position={Position.Left} className={`${colors.handle} !w-3 !h-3`} />

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-800/30">
        <div className={`w-7 h-7 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
          <Link2 className={`w-4 h-4 ${colors.icon}`} />
        </div>
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{t("Custom URL")}</h3>
      </div>

      {/* URL Preview */}
      <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-medium mb-2">{t("Page URL")}</p>
        <div className="flex items-center gap-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700">
          <span className="text-zinc-400 dark:text-zinc-500">{urlPrefix}</span>
          {isEditing ? (
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setError("") }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="my-custom-name"
              className="bg-transparent outline-none text-blue-400 flex-1 min-w-0 placeholder:text-zinc-600"
              autoFocus
            />
          ) : (
            <span className={`${colors.slug} font-medium`}>{savedSlug || "..."}</span>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1 mt-2 text-[11px] text-red-500 dark:text-red-400">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={isSaving || !slug.trim()}
            className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 ${colors.btn} text-white rounded-xl text-xs font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:shadow-none`}
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {isSaving ? t("Saving...") : t("Save Custom URL")}
          </button>
        ) : (
          <div className="flex gap-2">
            <Link
              href={`${urlPrefix}${savedSlug}`}
              className={`flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 ${colors.btn} text-white rounded-xl text-xs font-semibold transition-all shadow-md`}
            >
              <ExternalLink className="w-3 h-3" />
              {t("Open")}
            </Link>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl text-xs font-medium transition-all border border-zinc-200 dark:border-zinc-700"
            >
              <Pencil className="w-3 h-3" />
              {t("Edit")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Brand Text Node (large outlined "LangoWorld") ───

function BrandTextNode() {
  return (
    <div className="select-none pointer-events-none" style={{ userSelect: "none" }}>
      <svg
        width="820"
        height="140"
        viewBox="0 0 820 140"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <text
          x="410"
          y="110"
          textAnchor="middle"
          fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
          fontSize="120"
          fontWeight="900"
          letterSpacing="-3"
          fill="none"
          stroke="rgba(0, 0, 0, 0.7)"
          strokeWidth="2"
        >
          LangoWorld
        </text>
      </svg>
    </div>
  )
}

// ─── Translation Result Node ───

function TranslationResultNode({ data }: { data: any }) {
  const [copied, setCopied] = React.useState(false)
  const [speaking, setSpeaking] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(data.translatedText || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [loading, setLoading] = React.useState(false)

  // Locale mapping for Web Speech API fallback
  const getSpeechLocale = (langCode: string): string => {
    const map: Record<string, string> = {
      en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT",
      pt: "pt-PT", nl: "nl-NL", pl: "pl-PL", ru: "ru-RU", ja: "ja-JP",
      ko: "ko-KR", zh: "zh-CN", ar: "ar-SA", hi: "hi-IN", tr: "tr-TR",
      sv: "sv-SE", no: "nb-NO", da: "da-DK", fi: "fi-FI", gu: "gu-IN",
    }
    return map[langCode] || langCode
  }

  // Fallback: use Web Speech API
  const speakWithWebSpeech = (text: string, langCode: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = getSpeechLocale(langCode)
    utterance.rate = 0.9
    utterance.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const match = voices.find(v => v.lang.startsWith(langCode))
    if (match) utterance.voice = match
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (speaking) {
      audioRef.current?.pause()
      audioRef.current = null
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    const textToSpeak = data.translatedText || ""
    if (!textToSpeak.trim()) return

    setLoading(true)
    try {
      // Try Gemini TTS API first
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          language: data.targetLang || "en",
        }),
      })

      if (!res.ok) throw new Error("TTS API error")

      const result = await res.json()
      const audioUrl = result.audioUrl
      if (!audioUrl) throw new Error("No audio URL returned")

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => { setSpeaking(false); audioRef.current = null }
      audio.onerror = () => { setSpeaking(false); audioRef.current = null }

      setSpeaking(true)
      setLoading(false)
      await audio.play()
    } catch (err) {
      console.warn("[TTS] API failed, using Web Speech fallback:", err)
      setLoading(false)
      // Fallback to Web Speech API
      speakWithWebSpeech(textToSpeak, data.targetLang || "en")
    }
  }

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    handleCopy()
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      window.speechSynthesis.cancel()
    }
  }, [])

  // Accent color based on language family
  const getAccentColor = (langCode: string) => {
    const colors: Record<string, string> = {
      es: "#f59e0b", fr: "#3b82f6", de: "#10b981", it: "#ef4444",
      pt: "#8b5cf6", nl: "#f97316", pl: "#ec4899", ru: "#6366f1",
      ja: "#e11d48", ko: "#0ea5e9", zh: "#dc2626", ar: "#059669",
      hi: "#f59e0b", tr: "#ef4444", sv: "#3b82f6", no: "#ef4444",
      da: "#dc2626", fi: "#3b82f6", gu: "#f59e0b",
    }
    return colors[langCode] || "#3b82f6"
  }

  const accent = getAccentColor(data.targetLang)

  return (
    <div
      className="w-[320px] rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40 border border-zinc-200/60 dark:border-zinc-700/60 backdrop-blur-sm"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 100%)`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />

      {/* Colored accent bar */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg"
          style={{ background: `${accent}15`, boxShadow: `0 4px 14px ${accent}20` }}
        >
          {data.flag}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold text-zinc-800 dark:text-zinc-100 truncate">{data.langName}</p>
          <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: accent }}>{data.targetLang}</p>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopyClick}
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 hover:scale-110 active:scale-95"
          title="Copy"
        >
          {copied
            ? <Check className="w-4.5 h-4.5 text-green-500" />
            : <Copy className="w-4.5 h-4.5 text-zinc-400" />
          }
        </button>
      </div>

      {/* Translated text */}
      <div className="px-4 py-3.5 mx-4 mb-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
        <p className="text-[15px] text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-medium">
          {data.translatedText}
        </p>
      </div>

      {/* Source text */}
      <div className="px-5 py-2.5 border-t border-zinc-100/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-800/30">
        <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-0.5">Original</p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 truncate">{data.sourceText}</p>
      </div>

      {/* Read Aloud Button */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={handleSpeak}
          disabled={loading}
          className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.97] relative overflow-hidden disabled:opacity-70 disabled:cursor-wait"
          style={{
            background: (speaking || loading)
              ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
              : `linear-gradient(135deg, ${accent}15, ${accent}08)`,
            color: (speaking || loading) ? "#fff" : accent,
            border: `1.5px solid ${(speaking || loading) ? accent : accent + "30"}`,
            boxShadow: speaking ? `0 4px 20px ${accent}40` : "none",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : speaking ? (
            <>
              {/* Animated sound waves */}
              <div className="flex items-center gap-[3px]">
                <div className="w-[3px] rounded-full animate-pulse" style={{ height: "14px", backgroundColor: "#fff", animationDelay: "0ms", animationDuration: "600ms" }} />
                <div className="w-[3px] rounded-full animate-pulse" style={{ height: "18px", backgroundColor: "#fff", animationDelay: "150ms", animationDuration: "600ms" }} />
                <div className="w-[3px] rounded-full animate-pulse" style={{ height: "12px", backgroundColor: "#fff", animationDelay: "300ms", animationDuration: "600ms" }} />
                <div className="w-[3px] rounded-full animate-pulse" style={{ height: "16px", backgroundColor: "#fff", animationDelay: "450ms", animationDuration: "600ms" }} />
              </div>
              Playing...
            </>
          ) : (
            <>
              <Volume2 className="w-4.5 h-4.5" />
              Read Aloud
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Translation History Node ───

function TranslationHistoryNode({ data }: { data: any }) {
  const entries: TranslationHistoryGroup[] = data.entries || []
  const [expanded, setExpanded] = React.useState<number | null>(null)

  if (entries.length === 0) return null

  return (
    <div
      className="w-[300px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden"
      style={{
        animation: "fadeSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) both",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-blue-50/60 to-white dark:from-blue-950/20 dark:to-zinc-900">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Languages className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Translation History</h3>
          <p className="text-[10px] text-zinc-400">{entries.length} translation{entries.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Entries */}
      <div className="max-h-[350px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
        {entries.map((group, i) => (
          <div key={group.dbId || i} className="px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full text-left"
            >
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                {group.results[0]?.sourceText?.slice(0, 60) || "Translation"}{(group.results[0]?.sourceText?.length || 0) > 60 ? "..." : ""}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {group.results.slice(0, 5).map((r, j) => (
                  <span key={j} className="text-xs">{r.flag}</span>
                ))}
                {group.results.length > 5 && <span className="text-[10px] text-zinc-400">+{group.results.length - 5}</span>}
                <span className="text-[10px] text-zinc-400 ml-auto">{group.createdAt ? formatTimeAgo(group.createdAt) : ""}</span>
              </div>
            </button>

            {expanded === i && (
              <div className="mt-2 space-y-1.5">
                {group.results.map((r, j) => (
                  <div key={j} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{r.flag}</span>
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase">{r.langName}</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{r.translatedText}</p>
                  </div>
                ))}
                <button
                  onClick={() => data.onClear?.(i)}
                  className="text-[10px] text-red-400 hover:text-red-500 font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Node Types ───

const nodeTypes: NodeTypes = {
  youtubeInput: YoutubeInput,
  uploadInput: UploadInput,
  uploadPanel: UploadPanel,
  documentInput: DocumentInput,
  documentPanel: DocumentPanel,
  summaryPage: SummaryPageNode,
  renameNode: RenameNode,
  historyNode: HistoryNode,
  brandText: BrandTextNode,
  translationInput: TranslationInput,
  translationPanel: TranslationPanel,
  translationResult: TranslationResultNode,
  translationHistory: TranslationHistoryNode,
}

const DEFAULT_NODES: Node[] = [
  {
    id: "youtube-trigger",
    type: "youtubeInput",
    position: { x: 0, y: 0 },
    data: { label: "YouTube Input" },
  }
]

// ─── Main Component ───

export function LangoWorldFlow({
  isLoading,
  uploadLoading = false,
  docLoading = false,
  translationLoading = false,
  onYoutubeSubmit,
  onVideoUpload,
  onDocumentUpload,
  onTranslate,
  ytResult,
  uploadResult,
  docResult,
  translationResults = [],
  translationHistory = [],
  onClearTranslationHistory,
  onClearTranslationResults,
  history = [],
  onDeleteHistory,
}: WorkspaceFlowProps) {
  const { t } = useLingo()

  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])
  const [showUploadPanel, setShowUploadPanel] = React.useState(false)
  const [showDocPanel, setShowDocPanel] = React.useState(false)
  const [showTranslationPanel, setShowTranslationPanel] = React.useState(false)

  // Store callbacks in refs so they don't trigger useEffect re-runs
  const onYoutubeSubmitRef = React.useRef(onYoutubeSubmit)
  const onDeleteHistoryRef = React.useRef(onDeleteHistory)
  const onTranslateRef = React.useRef(onTranslate)
  const onClearTranslationHistoryRef = React.useRef(onClearTranslationHistory)
  React.useEffect(() => { onYoutubeSubmitRef.current = onYoutubeSubmit }, [onYoutubeSubmit])
  React.useEffect(() => { onDeleteHistoryRef.current = onDeleteHistory }, [onDeleteHistory])
  React.useEffect(() => { onTranslateRef.current = onTranslate }, [onTranslate])
  React.useEffect(() => { onClearTranslationHistoryRef.current = onClearTranslationHistory }, [onClearTranslationHistory])

  // Store loading states in refs so closures always have the latest value
  const uploadLoadingRef = React.useRef(uploadLoading)
  const docLoadingRef = React.useRef(docLoading)
  const translationLoadingRef = React.useRef(translationLoading)
  React.useEffect(() => { uploadLoadingRef.current = uploadLoading }, [uploadLoading])
  React.useEffect(() => { docLoadingRef.current = docLoading }, [docLoading])
  React.useEffect(() => { translationLoadingRef.current = translationLoading }, [translationLoading])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Build nodes dynamically (supports parallel YT + Upload results)
  // Preserves user-dragged positions by reusing existing node positions
  // Only re-runs when actual DATA changes, not callback references
  useEffect(() => {
    setNodes((prevNodes) => {
      // Build a map of existing node positions so we preserve drag state
      const positionMap = new Map<string, { x: number; y: number }>()
      for (const node of prevNodes) {
        positionMap.set(node.id, node.position)
      }

      // Helper: use existing position if node was already placed, otherwise use default
      const pos = (id: string, defaultPos: { x: number; y: number }) =>
        positionMap.get(id) ?? defaultPos

      const ytNode: Node = {
        id: "youtube-trigger",
        type: "youtubeInput",
        position: pos("youtube-trigger", { x: 0, y: 0 }),
        data: { label: "YouTube Input", onSubmitUrl: onYoutubeSubmitRef.current },
      }

      // ── Brand text node (large outlined "LangoWorld" above triggers) ──
      const brandNode: Node = {
        id: "brand-text",
        type: "brandText",
        position: pos("brand-text", { x: -120, y: -220 }),
        data: {},
        draggable: true,
        selectable: false,
        connectable: false,
      }

      const uploadNode: Node = {
        id: "upload-trigger",
        type: "uploadInput",
        position: pos("upload-trigger", { x: 120, y: 0 }),
        data: {
          label: "Upload Video",
          onTogglePanel: () => {
            // If panel is open and backend is processing, DON'T close it
            setShowUploadPanel(prev => {
              if (prev && uploadLoadingRef.current) return true
              return !prev
            })
          },
        },
      }

      const newNodes: Node[] = [brandNode, ytNode, uploadNode]

      // ── Document trigger node ──
      const docNode: Node = {
        id: "doc-trigger",
        type: "documentInput",
        position: pos("doc-trigger", { x: 240, y: 0 }),
        data: {
          label: "Upload Document",
          onTogglePanel: () => {
            // If panel is open and backend is processing, DON'T close it
            setShowDocPanel(prev => {
              if (prev && docLoadingRef.current) return true
              return !prev
            })
          },
        },
      }
      newNodes.push(docNode)

      // ── Translation trigger node ──
      const translationNode: Node = {
        id: "translation-trigger",
        type: "translationInput",
        position: pos("translation-trigger", { x: 360, y: 0 }),
        data: {
          label: "Translation",
          onTogglePanel: () => {
            setShowTranslationPanel(prev => {
              if (prev && translationLoadingRef.current) return true
              return !prev
            })
          },
        },
        selectable: false,
        focusable: false,
      }
      newNodes.push(translationNode)

      // ── Translation result nodes (fixed 3-column grid below trigger) ──
      // Uses stable index-based IDs (tr-0, tr-1, ...) so positions survive re-renders
      if (translationResults.length > 0) {
        const COLS = 3
        const CARD_W = 320   // horizontal spacing between cards
        const CARD_H = 250   // vertical spacing between rows (more breathing room)
        // Grid origin: well below the panel (panel is at x:440, ~650px tall)
        const GRID_X = 200
        const GRID_Y = showTranslationPanel ? 700 : 200

        translationResults.forEach((result, index) => {
          const col = index % COLS
          const row = Math.floor(index / COLS)
          newNodes.push({
            id: `tr-${index}`,
            type: "translationResult",
            position: pos(`tr-${index}`, {
              x: GRID_X + col * CARD_W,
              y: GRID_Y + row * CARD_H,
            }),
            data: {
              translatedText: result.translatedText,
              sourceText: result.sourceText,
              langName: result.langName,
              flag: result.flag,
              targetLang: result.targetLang,
            },
            draggable: true,
          })
        })
      }

      // ── History Node (left side of canvas) ──
      if (history.length > 0) {
        newNodes.push({
          id: "history-panel",
          type: "historyNode",
          position: pos("history-panel", { x: -380, y: -60 }),
          data: {
            entries: history,
            onDelete: onDeleteHistoryRef.current,
          },
          draggable: true,
        })
      }

      // ── Translation History Node ──
      // Near feature buttons by default, moves right when translation panel is open
      if (translationHistory.length > 0) {
        const historyPos = showTranslationPanel
          ? { x: 1100, y: -40 }   // Far right when panel is open
          : { x: 350, y: 120 }     // Near feature buttons by default
        newNodes.push({
          id: "translation-history",
          type: "translationHistory",
          position: historyPos,
          data: {
            entries: translationHistory,
            onClear: onClearTranslationHistoryRef.current,
          },
          draggable: true,
          style: { transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" },
        })
      }

      // ── YouTube summary nodes (left side) ──
      if (ytResult?.pageId && ytResult?.pageUrl) {
        newNodes.push({
          id: "yt-summary-page",
          type: "summaryPage",
          position: pos("yt-summary-page", { x: -280, y: 120 }),
          data: {
            videoTitle: ytResult.title || "YouTube Summary",
            summaryPageUrl: ytResult.pageUrl,
            summaryPageId: ytResult.pageId,
            summary: ytResult.summary?.summary || "",
          },
        })

        newNodes.push({
          id: "yt-rename-node",
          type: "renameNode",
          position: pos("yt-rename-node", { x: -280, y: 340 }),
          data: {
            summaryPageId: ytResult.pageId,
            currentSlug: "",
            urlPrefix: "/yt/",
            onRename: (newSlug: string) => {
              console.log(`[Workspace] Custom URL set: /yt/${newSlug}`)
            },
          },
        })
      }

      // ── Upload summary nodes (right side — parallel with YT) ──
      if (uploadResult?.pageId && uploadResult?.pageUrl) {
        newNodes.push({
          id: "upload-summary-page",
          type: "summaryPage",
          position: pos("upload-summary-page", { x: 100, y: 350 }),
          data: {
            videoTitle: uploadResult.title || "Uploaded Video Summary",
            summaryPageUrl: uploadResult.pageUrl,
            summaryPageId: uploadResult.pageId,
            summary: uploadResult.summary?.summary || "",
            theme: "orange",
          },
        })

        newNodes.push({
          id: "upload-rename-node",
          type: "renameNode",
          position: pos("upload-rename-node", { x: 100, y: 570 }),
          data: {
            summaryPageId: uploadResult.pageId,
            currentSlug: "",
            urlPrefix: "/video/",
            theme: "orange",
            onRename: (newSlug: string) => {
              console.log(`[Workspace] Custom URL set: /video/${newSlug}`)
            },
          },
        })
      }

      // ── Document summary nodes (far right — parallel with YT & Upload) ──
      if (docResult?.pageId && docResult?.pageUrl) {
        newNodes.push({
          id: "doc-summary-page",
          type: "summaryPage",
          position: pos("doc-summary-page", { x: 480, y: 350 }),
          data: {
            videoTitle: docResult.title || "Document Summary",
            summaryPageUrl: docResult.pageUrl,
            summaryPageId: docResult.pageId,
            summary: docResult.summary?.summary || "",
            theme: "blue",
          },
        })

        newNodes.push({
          id: "doc-rename-node",
          type: "renameNode",
          position: pos("doc-rename-node", { x: 480, y: 570 }),
          data: {
            summaryPageId: docResult.pageId,
            currentSlug: "",
            urlPrefix: "/docs/",
            theme: "blue",
            onRename: (newSlug: string) => {
              console.log(`[Workspace] Custom URL set: /docs/${newSlug}`)
            },
          },
        })
      }

      // Preserve any panel nodes that are managed by separate useEffects
      const panelIds = ["upload-panel", "doc-panel", "translation-panel"]
      const panelNodes = prevNodes.filter(n => panelIds.includes(n.id))

      return [...newNodes, ...panelNodes]
    })
  }, [setNodes, ytResult, uploadResult, docResult, history, translationResults, translationHistory, showTranslationPanel])

  // ── Toggle upload panel node separately (doesn't reset other node positions) ──
  useEffect(() => {
    setNodes(prevNodes => {
      const withoutPanel = prevNodes.filter(n => n.id !== "upload-panel")
      if (showUploadPanel) {
        return [
          ...withoutPanel,
          {
            id: "upload-panel",
            type: "uploadPanel",
            position: { x: 280, y: -40 },
            data: {
              onUploadVideo: onVideoUpload,
              onClose: () => setShowUploadPanel(false),
            },
            draggable: true,
          }
        ]
      }
      return withoutPanel
    })
  }, [showUploadPanel, setNodes, onVideoUpload])

  // ── Toggle document panel node ──
  useEffect(() => {
    setNodes(prevNodes => {
      const withoutPanel = prevNodes.filter(n => n.id !== "doc-panel")
      if (showDocPanel) {
        return [
          ...withoutPanel,
          {
            id: "doc-panel",
            type: "documentPanel",
            position: { x: 400, y: -40 },
            data: {
              onUploadDocument: onDocumentUpload,
              onClose: () => setShowDocPanel(false),
            },
            draggable: true,
          }
        ]
      }
      return withoutPanel
    })
  }, [showDocPanel, setNodes, onDocumentUpload])

  // ── Toggle translation panel node ──
  useEffect(() => {
    setNodes(prevNodes => {
      // Find existing panel position before removing it
      const existingPanel = prevNodes.find(n => n.id === "translation-panel")
      const withoutPanel = prevNodes.filter(n => n.id !== "translation-panel")
      if (showTranslationPanel) {
        return [
          ...withoutPanel,
          {
            id: "translation-panel",
            type: "translationPanel",
            // Reuse existing position if panel was already shown (preserves drag)
            position: existingPanel?.position ?? { x: 600, y: -40 },
            data: {
              onTranslate: onTranslateRef.current,
              onClose: () => setShowTranslationPanel(false),
              isLoading: translationLoading,
            },
            draggable: true,
          }
        ]
      }
      return withoutPanel
    })
  }, [showTranslationPanel, setNodes, translationLoading])

  // Build edges dynamically (supports parallel YT + Upload + Translation)
  useEffect(() => {
    const newEdges: Edge[] = []

    // History → YouTube trigger
    if (history.length > 0) {
      newEdges.push({
        id: "history-to-yt",
        source: "history-panel",
        target: "youtube-trigger",
        type: "smoothstep",
        style: { stroke: "hsl(217, 91%, 60%)", strokeWidth: 1.5, strokeDasharray: "4,4" },
        animated: true,
      })
    }

    // ── YouTube result edges (blue) ──
    if (ytResult?.pageId) {
      newEdges.push({
        id: "yt-to-summary-page",
        source: "youtube-trigger",
        target: "yt-summary-page",
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(217, 91%, 60%)", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(217, 91%, 60%)" },
      })

      newEdges.push({
        id: "yt-summary-to-rename",
        source: "yt-summary-page",
        target: "yt-rename-node",
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(217, 91%, 60%)", strokeWidth: 2, strokeDasharray: "6,3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(217, 91%, 60%)" },
      })
    }

    // ── Upload result edges (orange) ──
    if (uploadResult?.pageId) {
      newEdges.push({
        id: "upload-to-summary-page",
        source: "upload-trigger",
        target: "upload-summary-page",
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(25, 95%, 53%)", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(25, 95%, 53%)" },
      })

      newEdges.push({
        id: "upload-summary-to-rename",
        source: "upload-summary-page",
        target: "upload-rename-node",
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(25, 95%, 53%)", strokeWidth: 2, strokeDasharray: "6,3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(25, 95%, 53%)" },
      })
    }

    // ── Document result edges (blue) ──
    if (docResult?.pageId) {
      newEdges.push({
        id: "doc-to-summary-page",
        source: "doc-trigger",
        target: "doc-summary-page",
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(217, 80%, 55%)", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(217, 80%, 55%)" },
      })

      newEdges.push({
        id: "doc-summary-to-rename",
        source: "doc-summary-page",
        target: "doc-rename-node",
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(217, 80%, 55%)", strokeWidth: 2, strokeDasharray: "6,3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(217, 80%, 55%)" },
      })
    }

    // Upload trigger → Upload panel
    if (showUploadPanel) {
      newEdges.push({
        id: "upload-to-panel",
        source: "upload-trigger",
        target: "upload-panel",
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(25, 95%, 53%)", strokeWidth: 2, strokeDasharray: "6,3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(25, 95%, 53%)" },
      })
    }

    // Doc trigger → Doc panel
    if (showDocPanel) {
      newEdges.push({
        id: "doc-to-panel",
        source: "doc-trigger",
        target: "doc-panel",
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(217, 80%, 55%)", strokeWidth: 2, strokeDasharray: "6,3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(217, 80%, 55%)" },
      })
    }

    // Translation trigger → Translation panel
    if (showTranslationPanel) {
      newEdges.push({
        id: "translation-to-panel",
        source: "translation-trigger",
        target: "translation-panel",
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(217, 91%, 60%)", strokeWidth: 2, strokeDasharray: "6,3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(217, 91%, 60%)" },
      })
    }

    // Translation panel/trigger → result nodes
    if (translationResults.length > 0) {
      translationResults.forEach((_, index) => {
        newEdges.push({
          id: `tr-edge-${index}`,
          source: showTranslationPanel ? "translation-panel" : "translation-trigger",
          sourceHandle: showTranslationPanel ? "translation-out" : "translation-bottom",
          target: `tr-${index}`,
          type: "smoothstep",
          animated: true,
          style: { stroke: "hsl(217, 91%, 60%)", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(217, 91%, 60%)" },
        })
      })
    }

    // Translation trigger → Translation history
    if (translationHistory.length > 0) {
      newEdges.push({
        id: "translation-to-history",
        source: "translation-trigger",
        target: "translation-history",
        type: "smoothstep",
        style: { stroke: "hsl(217, 91%, 60%)", strokeWidth: 1.5, strokeDasharray: "4,4" },
        animated: true,
      })
    }

    setEdges(newEdges)
  }, [setEdges, ytResult, uploadResult, docResult, history, showUploadPanel, showDocPanel, showTranslationPanel, translationResults, translationHistory])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ maxZoom: 1 }}
      minZoom={0.1}
      maxZoom={2}
      className="bg-background"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        className="!bg-background"
      />
      <Controls
        className="!bg-white/10 !backdrop-blur-xl !border-white/20 !rounded-xl !shadow-lg [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button]:!text-foreground [&>button:hover]:!bg-white/10"
      />
    </ReactFlow>
  )
}
