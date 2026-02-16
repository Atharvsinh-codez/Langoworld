"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Handle, Position } from "@xyflow/react"

// ─── Document Upload Trigger Button (blue theme) ───
export function DocumentInput({ data }: { data: any }) {
    return (
        <div className="relative flex items-center justify-center">
            <Handle type="source" position={Position.Right} className="!bg-blue-400 !border-blue-500 !w-3 !h-3" />
            <Handle type="target" position={Position.Left} className="!bg-transparent !border-none" />

            <motion.button
                layout
                onClick={() => data?.onTogglePanel?.()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative group w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700 z-20 outline-none hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
            >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500" />
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-blue-400" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-blue-400" />
                    <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" />
                </svg>

                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Documents
                </span>
            </motion.button>
        </div>
    )
}

// ─── Document Upload Panel Node (drop zone) ───
export function DocumentPanel({ data }: { data: any }) {
    const [isDragging, setIsDragging] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [uploadPhase, setUploadPhase] = React.useState<"idle" | "uploading" | "analyzing" | "done">("idle")
    const [uploadProgress, setUploadProgress] = React.useState(0)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".txt", ".md", ".readme"]
    const ALLOWED_TYPES = [
        "application/pdf",
        "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
        "text/plain", "text/markdown", "text/x-markdown",
    ]

    const isAccepted = (f: File) => {
        const ext = "." + f.name.split(".").pop()?.toLowerCase()
        return ALLOWED_TYPES.includes(f.type) || ALLOWED_EXTENSIONS.includes(ext) || f.type.startsWith("image/")
    }

    const handleFile = async (selectedFile: File) => {
        if (!isAccepted(selectedFile)) return
        if (selectedFile.size > 50 * 1024 * 1024) return

        setFile(selectedFile)
        setUploadPhase("uploading")
        setUploadProgress(0)

        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 3, 45))
            }, 150)

            if (data?.onUploadDocument) {
                await data.onUploadDocument(selectedFile, (phase: string, progress: number) => {
                    clearInterval(progressInterval)
                    setUploadPhase(phase as any)
                    setUploadProgress(progress)
                })
                setUploadPhase("done")
                setUploadProgress(100)
            } else {
                clearInterval(progressInterval)
                setUploadPhase("idle")
            }
        } catch {
            setUploadPhase("idle")
            setUploadProgress(0)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) handleFile(droppedFile)
    }

    const getFileIcon = () => {
        if (!file) return null
        const ext = file.name.split(".").pop()?.toLowerCase()
        if (ext === "pdf") return "📄"
        if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) return "🖼️"
        if (["txt", "md", "readme"].includes(ext || "")) return "📝"
        return "📎"
    }

    const phaseLabel = {
        idle: "Drop a document",
        uploading: "Uploading to CDN...",
        analyzing: "AI is analyzing...",
        done: "Done!",
    }

    return (
        <div
            className="w-[260px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-blue-200/80 dark:border-blue-500/30 rounded-2xl shadow-xl shadow-blue-500/5 dark:shadow-black/40 overflow-hidden animate-[nodePopIn_0.3s_ease-out]"
            style={{ transformOrigin: "left center" }}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
        >
            <Handle type="target" position={Position.Left} className="!bg-blue-400 !border-blue-500 !w-3 !h-3" />

            {/* Header */}
            <div className="px-4 py-3 border-b border-blue-100 dark:border-blue-500/20 flex items-center gap-2 bg-blue-50/80 dark:bg-blue-500/5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500" />
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Upload Document</h3>
                    <p className="text-[10px] text-zinc-400 font-medium">PDF · Image · TXT · MD</p>
                </div>
                {/* X close button — disabled during upload/analyze */}
                <button
                    onClick={() => data?.onClose?.()}
                    disabled={uploadPhase === "uploading" || uploadPhase === "analyzing"}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${uploadPhase === "uploading" || uploadPhase === "analyzing"
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-blue-100 dark:hover:bg-blue-500/20 text-zinc-400 hover:text-blue-500 cursor-pointer"
                        }`}
                    title={uploadPhase === "uploading" || uploadPhase === "analyzing" ? "Cannot close while processing" : "Close panel"}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.readme,application/pdf,image/*,text/plain,text/markdown"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                }}
            />

            <div className="p-3">
                {/* Idle drop zone */}
                {uploadPhase === "idle" && !file && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center gap-2.5 py-6 px-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${isDragging
                            ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-500/5"
                            }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                                <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 12 12)" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-medium text-foreground">
                                {isDragging ? "Drop here!" : "Drop file or click"}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">PDF, PNG, JPG, TXT, MD — max 50MB</p>
                        </div>
                    </div>
                )}

                {/* Progress state */}
                {(uploadPhase !== "idle" || file) && (
                    <div className="flex flex-col gap-2.5">
                        {file && (
                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                                <span className="text-base shrink-0">{getFileIcon()}</span>
                                <span className="text-xs text-foreground truncate flex-1">{file.name}</span>
                                <span className="text-[10px] text-zinc-400">
                                    {file.size < 1024 * 1024
                                        ? `${(file.size / 1024).toFixed(0)}KB`
                                        : `${(file.size / 1024 / 1024).toFixed(1)}MB`
                                    }
                                </span>
                            </div>
                        )}

                        {/* Progress bar */}
                        <div className="relative w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${uploadPhase === "done"
                                    ? "bg-green-500"
                                    : "bg-gradient-to-r from-blue-500 to-cyan-400"
                                    }`}
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>

                        {/* Phase label */}
                        <div className="flex items-center justify-center gap-2">
                            {uploadPhase === "done" ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-green-500">
                                    <path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            <span className={`text-xs font-medium ${uploadPhase === "done" ? "text-green-600" : "text-zinc-500"}`}>
                                {phaseLabel[uploadPhase]}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
