"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { History, X, ExternalLink, Trash2, Clock, Video } from "lucide-react"
import Link from "next/link"
import type { HistoryEntry } from "@/lib/history-store"

interface HistorySidebarProps {
    entries: HistoryEntry[]
    onDelete?: (entryId: string) => void
}

export function HistorySidebar({ entries, onDelete }: HistorySidebarProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Toggle Button — Top-Left */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-[60] w-10 h-10 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-lg shadow-black/5 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 transition-all group"
                title="Toggle History"
            >
                <History className="w-4.5 h-4.5 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                {entries.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                        {entries.length > 99 ? "99+" : entries.length}
                    </span>
                )}
            </button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[65]"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: -360, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -360, opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        className="fixed top-0 left-0 bottom-0 w-[340px] z-[70] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-r border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl shadow-black/10 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                    <History className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">History</h2>
                                    <p className="text-[10px] text-zinc-400 font-medium">
                                        {entries.length} {entries.length === 1 ? "summary" : "summaries"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <X className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>

                        {/* Entries List */}
                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                            {entries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-20">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                        <Video className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                                        No summaries yet
                                    </p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
                                        Paste a YouTube link to get started. Your history will appear here.
                                    </p>
                                </div>
                            ) : (
                                entries.map((entry, i) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.2 }}
                                        className="group relative bg-zinc-50/80 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 hover:border-zinc-200 dark:hover:border-zinc-600 rounded-xl p-3.5 transition-all cursor-pointer"
                                    >
                                        <Link href={`/yt/summary/${entry.id}`} className="block">
                                            {/* Title */}
                                            <h4 className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2 pr-6">
                                                {entry.videoTitle || "Untitled Video"}
                                            </h4>

                                            {/* Channel + Time */}
                                            <div className="flex items-center gap-2 mt-2">
                                                {entry.channel && (
                                                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded">
                                                        {entry.channel}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {formatTimeAgo(entry.createdAt)}
                                                </span>
                                            </div>

                                            {/* Summary preview */}
                                            {entry.summary && (
                                                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
                                                    {entry.summary}
                                                </p>
                                            )}
                                        </Link>

                                        {/* Delete button (on hover) */}
                                        {onDelete && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    e.preventDefault()
                                                    onDelete(entry.id)
                                                }}
                                                className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-500/20"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-500" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">
                                History is synced to cloud
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

// ─── Helper: format "time ago" string ───

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
