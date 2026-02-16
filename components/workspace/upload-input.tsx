"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Handle, Position } from "@xyflow/react"

// ─── Upload Trigger Button (just the icon) ───
export function UploadInput({ data }: { data: any }) {
    return (
        <div className="relative flex items-center justify-center">
            <Handle type="source" position={Position.Right} className="!bg-orange-400 !border-orange-500 !w-3 !h-3" />
            <Handle type="target" position={Position.Left} className="!bg-transparent !border-none" />

            <motion.button
                layout
                onClick={() => data?.onTogglePanel?.()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative group w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700 z-20 outline-none hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors"
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.4961 1.75008C16.3835 1.75008 17.58 1.73198 18.6201 2.25203C19.6602 2.77213 20.3636 3.74011 21.4961 5.25008L22.0957 6.04988C22.1009 6.05685 22.1054 6.06429 22.1104 6.07137C22.1148 6.07774 22.1188 6.08439 22.1231 6.0909C22.1437 6.1225 22.1614 6.15512 22.1768 6.18856C22.1891 6.21557 22.1979 6.24392 22.207 6.27254C22.2135 6.29279 22.2209 6.31253 22.2256 6.33309C22.2344 6.37185 22.2406 6.41144 22.2432 6.45223C22.2436 6.45842 22.2439 6.46459 22.2441 6.47078C22.2445 6.48052 22.2461 6.49025 22.2461 6.50008V13.5001C22.2461 15.3645 22.2475 16.8385 22.0928 17.9894C21.9351 19.1617 21.6028 20.1102 20.8545 20.8585C20.1062 21.6068 19.1577 21.9391 17.9854 22.0968C16.8345 22.2515 15.3605 22.2501 13.4961 22.2501H10.4961C8.63167 22.2501 7.15768 22.2515 6.00683 22.0968C4.83453 21.9391 3.886 21.6068 3.13769 20.8585C2.38938 20.1102 2.05705 19.1617 1.89941 17.9894C1.74468 16.8385 1.74609 15.3645 1.74609 13.5001V6.50008C1.74609 6.49026 1.74669 6.48051 1.74707 6.47078C1.7473 6.46459 1.74765 6.45842 1.74804 6.45223C1.75061 6.41149 1.75681 6.3718 1.76562 6.33309C1.77083 6.31024 1.77872 6.28815 1.78613 6.2657C1.79418 6.24129 1.8011 6.21667 1.81152 6.19344C1.82733 6.15822 1.84648 6.12411 1.86816 6.0909C1.87241 6.08439 1.87641 6.07773 1.88086 6.07137C1.88586 6.06419 1.89119 6.05694 1.89648 6.04988L2.49609 5.25008C3.62855 3.74013 4.33196 2.77209 5.37207 2.25203C6.41216 1.73208 7.60867 1.75008 9.49609 1.75008H14.4961ZM3.24609 13.5001C3.24609 15.4069 3.24759 16.7615 3.38574 17.7892C3.521 18.7953 3.77503 19.3747 4.19824 19.798C4.62145 20.2212 5.20094 20.4752 6.20703 20.6105C7.23468 20.7486 8.58933 20.7501 10.4961 20.7501H13.4961C15.4029 20.7501 16.7575 20.7486 17.7852 20.6105C18.7913 20.4752 19.3707 20.2212 19.794 19.798C20.2172 19.3747 20.4712 18.7953 20.6065 17.7892C20.7446 16.7615 20.7461 15.4069 20.7461 13.5001V7.25008H3.24609V13.5001ZM12.1094 9.75594C12.3685 9.78313 12.591 9.89704 12.7393 9.98641C12.9292 10.1009 13.1185 10.2505 13.2949 10.4063C13.6495 10.7197 14.0248 11.1238 14.3584 11.5079C14.6951 11.8958 15.0052 12.282 15.2295 12.5694C15.3419 12.7135 15.4341 12.8344 15.4981 12.919C15.53 12.9613 15.555 12.9955 15.5723 13.0187C15.5808 13.0301 15.5882 13.0388 15.5928 13.045C15.5948 13.0478 15.5965 13.0502 15.5977 13.0519L15.5996 13.0548V13.0558C15.8449 13.3892 15.7736 13.858 15.4404 14.1036C15.107 14.3491 14.6382 14.2778 14.3926 13.9444L14.3916 13.9435C14.3916 13.9435 14.3886 13.9401 14.3867 13.9376C14.383 13.9325 14.3776 13.9242 14.3701 13.9142C14.3547 13.8934 14.3306 13.8629 14.3008 13.8233C14.2409 13.744 14.1538 13.6292 14.0469 13.4923C13.8325 13.2175 13.5404 12.8538 13.2266 12.4923C13.0662 12.3076 12.9038 12.1268 12.7461 11.962V17.5001C12.7461 17.9142 12.4101 18.2499 11.9961 18.2501C11.5819 18.2501 11.2461 17.9143 11.2461 17.5001V11.962C11.0884 12.1268 10.926 12.3076 10.7656 12.4923C10.4518 12.8537 10.1598 13.2175 9.94531 13.4923C9.83845 13.6292 9.75132 13.744 9.6914 13.8233C9.66158 13.8628 9.63755 13.8934 9.62207 13.9142C9.6146 13.9242 9.60924 13.9325 9.60547 13.9376C9.60367 13.94 9.60058 13.9435 9.60058 13.9435L9.59961 13.9444C9.35406 14.2778 8.88526 14.3489 8.55175 14.1036C8.21826 13.858 8.14702 13.3893 8.39257 13.0558L8.99609 13.5001L8.39257 13.0548L8.39453 13.0528C8.39574 13.0511 8.39723 13.048 8.39941 13.045C8.40402 13.0388 8.41143 13.03 8.41992 13.0187C8.43719 12.9955 8.46221 12.9613 8.49414 12.919C8.55809 12.8344 8.65037 12.7143 8.76269 12.5704C8.98707 12.2829 9.29592 11.8959 9.63281 11.5079C9.96649 11.1236 10.3425 10.7198 10.6973 10.4063C10.8737 10.2505 11.063 10.1009 11.2529 9.98641C11.4225 9.88425 11.6886 9.75008 11.9961 9.75008L12.1094 9.75594ZM9.49609 3.25008C7.4586 3.25008 6.69185 3.26864 6.04297 3.59285C5.45028 3.8892 5.00448 4.4189 4 5.75008H19.9912C18.987 4.41919 18.5418 3.88919 17.9492 3.59285C17.3003 3.26854 16.5336 3.25008 14.4961 3.25008H9.49609Z" fill="currentColor" className="text-zinc-700 dark:text-zinc-300" />
                </svg>

                {/* Label */}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Upload
                </span>
            </motion.button>
        </div>
    )
}

// ─── Upload Panel Node (drop zone — separate node) ───
export function UploadPanel({ data }: { data: any }) {
    const [isDragging, setIsDragging] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [uploadPhase, setUploadPhase] = React.useState<"idle" | "uploading" | "analyzing" | "done">("idle")
    const [uploadProgress, setUploadProgress] = React.useState(0)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"]

    const handleFile = async (selectedFile: File) => {
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            return
        }
        if (selectedFile.size > 500 * 1024 * 1024) {
            return
        }

        setFile(selectedFile)
        setUploadPhase("uploading")
        setUploadProgress(0)

        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 2, 45))
            }, 200)

            if (data?.onUploadVideo) {
                await data.onUploadVideo(selectedFile, (phase: string, progress: number) => {
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

    const phaseLabel = {
        idle: "Drop a video file",
        uploading: "Uploading to CDN...",
        analyzing: "AI is analyzing...",
        done: "Done!",
    }

    return (
        <div
            className="w-[260px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-orange-200/80 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-500/5 dark:shadow-black/40 overflow-hidden animate-[nodePopIn_0.3s_ease-out]"
            style={{ transformOrigin: "left center" }}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
        >
            <Handle type="target" position={Position.Left} className="!bg-orange-400 !border-orange-500 !w-3 !h-3" />

            {/* Header */}
            <div className="px-4 py-3 border-b border-orange-100 dark:border-orange-500/20 flex items-center gap-2 bg-orange-50/80 dark:bg-orange-500/5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M14.4961 1.75008C16.3835 1.75008 17.58 1.73198 18.6201 2.25203C19.6602 2.77213 20.3636 3.74011 21.4961 5.25008L22.0957 6.04988C22.1009 6.05685 22.1054 6.06429 22.1104 6.07137C22.1148 6.07774 22.1188 6.08439 22.1231 6.0909C22.1437 6.1225 22.1614 6.15512 22.1768 6.18856C22.1891 6.21557 22.1979 6.24392 22.207 6.27254C22.2135 6.29279 22.2209 6.31253 22.2256 6.33309C22.2344 6.37185 22.2406 6.41144 22.2432 6.45223C22.2436 6.45842 22.2439 6.46459 22.2441 6.47078C22.2445 6.48052 22.2461 6.49025 22.2461 6.50008V13.5001C22.2461 15.3645 22.2475 16.8385 22.0928 17.9894C21.9351 19.1617 21.6028 20.1102 20.8545 20.8585C20.1062 21.6068 19.1577 21.9391 17.9854 22.0968C16.8345 22.2515 15.3605 22.2501 13.4961 22.2501H10.4961C8.63167 22.2501 7.15768 22.2515 6.00683 22.0968C4.83453 21.9391 3.886 21.6068 3.13769 20.8585C2.38938 20.1102 2.05705 19.1617 1.89941 17.9894C1.74468 16.8385 1.74609 15.3645 1.74609 13.5001V6.50008C1.74609 6.49026 1.74669 6.48051 1.74707 6.47078C1.7473 6.46459 1.74765 6.45842 1.74804 6.45223C1.75061 6.41149 1.75681 6.3718 1.76562 6.33309C1.77083 6.31024 1.77872 6.28815 1.78613 6.2657C1.79418 6.24129 1.8011 6.21667 1.81152 6.19344C1.82733 6.15822 1.84648 6.12411 1.86816 6.0909C1.87241 6.08439 1.87641 6.07773 1.88086 6.07137C1.88586 6.06419 1.89119 6.05694 1.89648 6.04988L2.49609 5.25008C3.62855 3.74013 4.33196 2.77209 5.37207 2.25203C6.41216 1.73208 7.60867 1.75008 9.49609 1.75008H14.4961Z" fill="currentColor" className="text-orange-500" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Upload Video</h3>
                    <p className="text-[10px] text-zinc-400 font-medium">AI‑powered analysis</p>
                </div>
                {/* X close button — disabled during upload/analyze */}
                <button
                    onClick={() => data?.onClose?.()}
                    disabled={uploadPhase === "uploading" || uploadPhase === "analyzing"}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${uploadPhase === "uploading" || uploadPhase === "analyzing"
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-orange-100 dark:hover:bg-orange-500/20 text-zinc-400 hover:text-orange-500 cursor-pointer"
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
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
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
                            ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-500/5"
                            }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-orange-500">
                                <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 12 12)" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-medium text-foreground">
                                {isDragging ? "Drop here!" : "Drop video or click"}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">MP4, WebM, MOV, AVI — max 500MB</p>
                        </div>
                    </div>
                )}

                {/* Progress state */}
                {(uploadPhase !== "idle" || file) && (
                    <div className="flex flex-col gap-2.5">
                        {file && (
                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-orange-500 shrink-0">
                                    <rect x="2" y="4" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
                                    <path d="M10 8.5L15 11L10 13.5V8.5Z" fill="currentColor" />
                                </svg>
                                <span className="text-xs text-foreground truncate flex-1">{file.name}</span>
                                <span className="text-[10px] text-zinc-400">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                            </div>
                        )}

                        {/* Progress bar */}
                        <div className="relative w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${uploadPhase === "done"
                                    ? "bg-green-500"
                                    : "bg-gradient-to-r from-orange-500 to-amber-400"
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
                                <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
