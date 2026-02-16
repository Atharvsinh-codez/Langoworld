"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ArrowRight, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Handle, Position } from "@xyflow/react"

export function YoutubeInput({ data }: { data: any }) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [url, setUrl] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url.trim() || isSubmitting) return

        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            if (data?.onSubmitUrl) {
                setIsSubmitting(true)
                try {
                    await data.onSubmitUrl(url)
                    setUrl("")
                    setIsOpen(false)
                } catch (error) {
                    console.error("YouTube submission error:", error)
                } finally {
                    setIsSubmitting(false)
                }
            } else {
                toast.success("YouTube link added! Processing feature coming soon.")
                setUrl("")
                setIsOpen(false)
            }
        } else {
            toast.error("Please enter a valid YouTube URL")
        }
    }

    React.useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    return (
        <div className="relative flex items-center justify-center">
            <Handle type="source" position={Position.Right} className="!bg-transparent !border-none" />

            <AnimatePresence>
                {isOpen && (
                    <motion.form
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 20, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        onSubmit={handleSubmit}
                        className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/40 flex items-center gap-2 w-80 origin-left z-50"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                ref={inputRef}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube Link..."
                                disabled={isSubmitting}
                                className="pl-9 h-10 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 transition-all rounded-xl"
                            />
                        </div>
                        <Button
                            size="icon"
                            type="submit"
                            disabled={isSubmitting}
                            className="h-10 w-10 shrink-0 rounded-xl bg-[#FF0000] hover:bg-[#D90000] text-white shadow-md shadow-red-500/20 border-0"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                        </Button>
                    </motion.form>
                )}
            </AnimatePresence>

            <motion.button
                layout
                onClick={() => !isSubmitting && setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative group w-16 h-16 rounded-full bg-[#FF0000] shadow-[0_8px_32px_rgba(255,0,0,0.3)] flex items-center justify-center border-4 border-white dark:border-zinc-800 z-20 outline-none"
            >
                <AnimatePresence mode="wait">
                    {isSubmitting ? (
                        <motion.div
                            key="loading"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </motion.div>
                    ) : isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-8 h-8 text-white" strokeWidth={3} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="logo"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="flex items-center justify-center w-full h-full"
                        >
                            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    )
}
