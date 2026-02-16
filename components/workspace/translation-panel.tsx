"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Languages, ChevronDown, Loader2, ArrowRight, X, Check } from "lucide-react"
import { Handle, Position } from "@xyflow/react"
import { LANGUAGES } from "@/lib/lingo"

interface TranslationPanelProps {
    data: {
        onTranslate?: (text: string, sourceLang: string, targetLangs: string[]) => Promise<void>
        onClose?: () => void
        isLoading?: boolean
    }
}

export function TranslationPanel({ data }: TranslationPanelProps) {
    const [text, setText] = React.useState("")
    const [mode, setMode] = React.useState<"single" | "multi">("single")
    const [singleLang, setSingleLang] = React.useState("es")
    const [multiLangs, setMultiLangs] = React.useState<string[]>([])
    const [sourceLang, setSourceLang] = React.useState("en")
    const [showSourceDropdown, setShowSourceDropdown] = React.useState(false)
    const [showTargetDropdown, setShowTargetDropdown] = React.useState(false)
    const isLoading = data?.isLoading || false

    const toggleMultiLang = (code: string) => {
        setMultiLangs(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        )
    }

    const handleTranslate = () => {
        if (!text.trim() || isLoading) return
        const targets = mode === "single" ? [singleLang] : multiLangs
        if (targets.length === 0) return
        data?.onTranslate?.(text, sourceLang, targets)
    }

    const availableTargetLangs = LANGUAGES.filter(l => l.code !== sourceLang)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="relative w-[420px]"
        >
            <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />
            <Handle type="source" position={Position.Bottom} id="translation-out" className="!bg-transparent !border-none" />
            <Handle type="source" position={Position.Right} id="translation-right" className="!bg-transparent !border-none" />

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xl shadow-black/10 dark:shadow-black/40 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-blue-50/80 to-white dark:from-blue-950/30 dark:to-zinc-900">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/25">
                            <Languages className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Translation</h3>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Powered by Lingo.dev</p>
                        </div>
                    </div>
                    <button
                        onClick={() => data?.onClose?.()}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>

                {/* Source language selector */}
                <div className="px-5 pt-4">
                    <div className="relative">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 block">From</label>
                        <button
                            onClick={() => { setShowSourceDropdown(!showSourceDropdown); setShowTargetDropdown(false) }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                        >
                            <span>{LANGUAGES.find(l => l.code === sourceLang)?.flag} {LANGUAGES.find(l => l.code === sourceLang)?.name}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                        </button>
                        {showSourceDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl max-h-[400px] overflow-y-auto"
                                style={{ scrollbarWidth: 'thin' }}
                            >
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { setSourceLang(lang.code); setShowSourceDropdown(false) }}
                                        className={`w-full text-left px-4 py-2.5 text-[14px] flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${sourceLang === lang.code ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-semibold" : "text-zinc-700 dark:text-zinc-300"}`}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="font-medium">{lang.name}</span>
                                        <span className="text-[10px] text-zinc-400 uppercase ml-auto">{lang.code}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Text Input */}
                <div className="px-5 pt-3">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to translate..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 dark:focus:border-blue-600 transition-all"
                    />
                    <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-zinc-400">{text.length} chars</span>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="px-5 pt-2 pb-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setMode("single")}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${mode === "single"
                                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                                }`}
                        >
                            Single Language
                        </button>
                        <button
                            onClick={() => setMode("multi")}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${mode === "multi"
                                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                                }`}
                        >
                            Multi Language
                        </button>
                    </div>
                </div>

                {/* Target Language Selection */}
                <div className="px-5 pb-4">
                    {mode === "single" ? (
                        <div className="relative">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 block">To</label>
                            <button
                                onClick={() => { setShowTargetDropdown(!showTargetDropdown); setShowSourceDropdown(false) }}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                            >
                                <span>{LANGUAGES.find(l => l.code === singleLang)?.flag} {LANGUAGES.find(l => l.code === singleLang)?.name}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            </button>
                            {showTargetDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl max-h-[400px] overflow-y-auto"
                                    style={{ scrollbarWidth: 'thin' }}
                                >
                                    {availableTargetLangs.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { setSingleLang(lang.code); setShowTargetDropdown(false) }}
                                            className={`w-full text-left px-4 py-2.5 text-[14px] flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${singleLang === lang.code ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-semibold" : "text-zinc-700 dark:text-zinc-300"}`}
                                        >
                                            <span className="text-lg">{lang.flag}</span>
                                            <span className="font-medium">{lang.name}</span>
                                            <span className="text-[10px] text-zinc-400 uppercase ml-auto">{lang.code}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 block">
                                To ({multiLangs.length} selected)
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5" style={{ scrollbarWidth: 'thin' }}>
                                {availableTargetLangs.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => toggleMultiLang(lang.code)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${multiLangs.includes(lang.code)
                                            ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                                            : "bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-zinc-200 dark:border-zinc-600"
                                            }`}
                                    >
                                        {multiLangs.includes(lang.code) && <Check className="w-3.5 h-3.5" />}
                                        <span className="text-base">{lang.flag}</span>
                                        <span className="truncate font-medium">{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Translate Button */}
                <div className="px-5 pb-5">
                    <button
                        onClick={handleTranslate}
                        disabled={!text.trim() || isLoading || (mode === "multi" && multiLangs.length === 0)}
                        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${!text.trim() || (mode === "multi" && multiLangs.length === 0)
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                            : isLoading
                                ? "bg-blue-400 text-white cursor-wait animate-pulse"
                                : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Translating...
                            </>
                        ) : (
                            <>
                                <Languages className="w-4 h-4" />
                                Translate
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
