"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Globe, Languages, Sparkles, Mic } from "lucide-react"

export default function AboutPage() {
    const [mounted, setMounted] = useState(false)
    const pillarsRef = useRef<HTMLDivElement>(null)
    const ctaRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)

        let ctx: any

        const init = async () => {
            const gsap = (await import("gsap")).default
            const { ScrollTrigger } = await import("gsap/ScrollTrigger")
            gsap.registerPlugin(ScrollTrigger)

            ctx = gsap.context(() => {
                // ── Hero staggered reveal ──
                const heroTl = gsap.timeline({ delay: 0.1 })

                gsap.set(".hero-reveal", { y: 50, opacity: 0 })
                gsap.set(".hero-divider-line", { scaleX: 0 })

                heroTl
                    .to(".hero-reveal", {
                        y: 0,
                        opacity: 1,
                        duration: 0.9,
                        stagger: 0.12,
                        ease: "power3.out",
                    })
                    .to(".hero-divider-line", {
                        scaleX: 1,
                        duration: 1,
                        ease: "expo.inOut",
                    }, "-=0.6")

                // ── Pillar cards scroll reveal ──
                if (pillarsRef.current) {
                    gsap.fromTo(
                        pillarsRef.current.querySelectorAll(".pillar-card"),
                        { y: 50, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.7,
                            stagger: 0.12,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: pillarsRef.current,
                                start: "top 78%",
                                toggleActions: "play none none reverse",
                            },
                        }
                    )
                }

                // ── CTA fade-in ──
                if (ctaRef.current) {
                    gsap.fromTo(
                        ctaRef.current,
                        { y: 30, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.8,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: ctaRef.current,
                                start: "top 85%",
                                toggleActions: "play none none reverse",
                            },
                        }
                    )
                }
            })
        }

        init()
        return () => ctx?.revert?.()
    }, [])

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-zinc-900 overflow-x-hidden">

            {/* ── Fixed Logo ── */}
            <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
                <Link href="/">
                    <div className="bg-white/70 backdrop-blur-md rounded-xl p-1.5 shadow-sm border border-white/50 hover:shadow-md transition-shadow duration-300">
                        <img src="/logo-lw.png" alt="LangoWorld" width={36} height={36} className="rounded-lg" />
                    </div>
                </Link>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 1 — HERO
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
                {/* Dot pattern background */}
                <div
                    className="absolute inset-0 pointer-events-none z-0 opacity-[0.3]"
                    style={{
                        backgroundImage: 'radial-gradient(#A1A1AA 0.8px, transparent 0.8px)',
                        backgroundSize: '28px 28px',
                        maskImage: 'linear-gradient(to bottom, transparent 5%, black 25%, black 75%, transparent 95%)',
                    }}
                />

                <div className="relative z-10 text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <div className="hero-reveal inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-zinc-200 shadow-sm mb-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="font-[family-name:var(--font-inter)] text-[11px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                            About LangoWorld
                        </span>
                    </div>

                    {/* Headline — Line 1 */}
                    <h1 className="hero-reveal font-[family-name:var(--font-inter)] text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black text-zinc-900 tracking-[-0.04em] leading-[0.9] mb-3">
                        THE PLATFORM
                    </h1>

                    {/* Divider with icon */}
                    <div className="hero-reveal flex items-center justify-center w-full max-w-md mx-auto gap-4 my-4">
                        <div className="hero-divider-line h-[1.5px] bg-gradient-to-l from-zinc-400 to-transparent w-full origin-right" />
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div className="hero-divider-line h-[1.5px] bg-gradient-to-r from-zinc-400 to-transparent w-full origin-left" />
                    </div>

                    {/* Headline — Line 2 (outlined / low-opacity) */}
                    <h1
                        className="hero-reveal font-[family-name:var(--font-inter)] text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-[-0.04em] leading-[0.9] mb-12"
                        style={{ WebkitTextStroke: '1.5px #A1A1AA', color: 'transparent' }}
                    >
                        FOR GLOBAL VOICE
                    </h1>

                    {/* Description */}
                    <p className="hero-reveal font-[family-name:var(--font-inter)] text-base sm:text-lg text-zinc-500 font-medium leading-relaxed max-w-xl mx-auto mb-10 tracking-tight">
                        We build the infrastructure for seamless multilingual communication —
                        AI translation, intelligent video summaries, and natural voice synthesis, all in one platform.
                    </p>

                    {/* CTA Button */}
                    <div className="hero-reveal">
                        <Link
                            href="/workspace"
                            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-zinc-900 text-white font-[family-name:var(--font-inter)] font-bold text-sm tracking-tight hover:bg-zinc-800 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-900/15"
                        >
                            Launch Workspace
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 2 — CORE TECHNOLOGY (Three Pillars)
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-28 sm:py-36 px-6 bg-white border-y border-zinc-100">
                <div className="max-w-[1120px] mx-auto">
                    {/* Section header */}
                    <div className="max-w-2xl mb-16 sm:mb-20">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="h-px w-8 bg-blue-500" />
                            <span className="font-[family-name:var(--font-inter)] text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em]">
                                Core Technology
                            </span>
                        </div>
                        <h2 className="font-[family-name:var(--font-inter)] text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-zinc-900 tracking-tight leading-[1.12] mb-5">
                            Three pillars of<br />
                            <span className="text-zinc-400">intelligent voice</span>
                        </h2>
                        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                    </div>

                    {/* Pillar Cards */}
                    <div ref={pillarsRef} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Pillar 1 — Translation */}
                        <div className="pillar-card group flex flex-col justify-between p-8 rounded-2xl bg-[#FAFAF9] border border-zinc-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/[0.04] transition-all duration-500 hover:-translate-y-1">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        <Languages className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.15em] font-[family-name:var(--font-inter)]">
                                        Layer 1
                                    </span>
                                </div>
                                <h3 className="font-[family-name:var(--font-inter)] text-lg font-bold text-zinc-900 mb-3 tracking-tight leading-snug">
                                    Context-Aware Translation
                                </h3>
                                <p className="font-[family-name:var(--font-inter)] text-zinc-500 text-[13px] sm:text-sm leading-relaxed font-medium">
                                    Unlike word-by-word translators, our AI understands full context, idioms,
                                    and cultural nuance. Every translation preserves the original meaning and
                                    tone across 25+ languages.
                                </p>
                            </div>
                            <div className="mt-8 pt-4 border-t border-zinc-100 flex justify-between items-center">
                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.12em]">Accuracy</span>
                                <span className="text-sm font-bold text-zinc-900 font-[family-name:var(--font-inter)]">98.7%</span>
                            </div>
                        </div>

                        {/* Pillar 2 — YouTube Intelligence */}
                        <div className="pillar-card group flex flex-col justify-between p-8 rounded-2xl bg-[#FAFAF9] border border-zinc-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/[0.04] transition-all duration-500 hover:-translate-y-1">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-[0.15em] font-[family-name:var(--font-inter)]">
                                        Layer 2
                                    </span>
                                </div>
                                <h3 className="font-[family-name:var(--font-inter)] text-lg font-bold text-zinc-900 mb-3 tracking-tight leading-snug">
                                    YouTube Intelligence
                                </h3>
                                <p className="font-[family-name:var(--font-inter)] text-zinc-500 text-[13px] sm:text-sm leading-relaxed font-medium">
                                    Our AI doesn&apos;t just transcribe — it understands. Key points, timestamps,
                                    and structured summaries are extracted from any video, giving you hours
                                    of content in minutes.
                                </p>
                            </div>
                            <div className="mt-8 pt-4 border-t border-zinc-100 flex justify-between items-center">
                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.12em]">Speed</span>
                                <span className="text-sm font-bold text-zinc-900 font-[family-name:var(--font-inter)]">&lt; 10s</span>
                            </div>
                        </div>

                        {/* Pillar 3 — Neural TTS */}
                        <div className="pillar-card group flex flex-col justify-between p-8 rounded-2xl bg-[#FAFAF9] border border-zinc-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/[0.04] transition-all duration-500 hover:-translate-y-1">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        <Mic className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.15em] font-[family-name:var(--font-inter)]">
                                        Layer 3
                                    </span>
                                </div>
                                <h3 className="font-[family-name:var(--font-inter)] text-lg font-bold text-zinc-900 mb-3 tracking-tight leading-snug">
                                    Neural TTS Engine
                                </h3>
                                <p className="font-[family-name:var(--font-inter)] text-zinc-500 text-[13px] sm:text-sm leading-relaxed font-medium">
                                    Powered by Gemini, our text-to-speech engine produces natural, expressive
                                    voices. Audio is generated in real-time, cached at the edge via Cloudflare
                                    R2, and streamed instantly.
                                </p>
                            </div>
                            <div className="mt-8 pt-4 border-t border-zinc-100 flex justify-between items-center">
                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.12em]">Latency</span>
                                <span className="text-sm font-bold text-zinc-900 font-[family-name:var(--font-inter)]">0ms added</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 3 — FINAL CTA
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative py-28 sm:py-36 px-6 bg-white border-t border-zinc-100 overflow-hidden">
                {/* Large faded background text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                    <div className="animate-[ticker_25s_linear_infinite] whitespace-nowrap text-[12vh] sm:text-[16vh] font-[family-name:var(--font-inter)] font-black text-zinc-900 opacity-[0.025] tracking-tighter">
                        TRANSLATE · SPEAK · LEARN · TRANSLATE · SPEAK · LEARN · TRANSLATE · SPEAK · LEARN&nbsp;
                    </div>
                </div>

                <div ref={ctaRef} className="relative z-10 text-center max-w-3xl mx-auto">
                    <h2 className="font-[family-name:var(--font-inter)] text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black text-zinc-900 tracking-[-0.03em] leading-[1.1] mb-6">
                        Start communicating<br />
                        <span className="text-zinc-400">without barriers</span>
                    </h2>
                    <p className="font-[family-name:var(--font-inter)] text-zinc-500 text-base sm:text-lg font-medium mb-10 max-w-lg mx-auto leading-relaxed">
                        Join thousands of users who are already breaking language barriers
                        with AI-powered translation and voice.
                    </p>
                    <Link
                        href="/workspace"
                        className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-zinc-900 text-white font-[family-name:var(--font-inter)] font-bold text-sm tracking-tight hover:bg-zinc-800 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-900/15"
                    >
                        Launch Workspace
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                    </Link>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-zinc-100 py-10 px-6 bg-[#FAFAF9]">
                <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/logo-lw.png" alt="LangoWorld" width={28} height={28} className="rounded-md" />
                        <span className="font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-900 tracking-tight">
                            LangoWorld
                        </span>
                    </div>
                    <p className="font-[family-name:var(--font-inter)] text-sm font-medium text-zinc-400">
                        © {new Date().getFullYear()} LangoWorld. All rights reserved.
                    </p>
                    <Link href="/" className="font-[family-name:var(--font-inter)] text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </footer>
        </div>
    )
}
