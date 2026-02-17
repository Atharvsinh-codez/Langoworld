"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Globe, Languages, Sparkles, Mic, BookOpen, Zap, Shield, Workflow, Radio } from "lucide-react"

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
                const heroTl = gsap.timeline({ delay: 0.05 })

                gsap.set(".hero-reveal", { y: 50, opacity: 0 })
                gsap.set(".hero-divider-line", { scaleX: 0 })

                heroTl
                    .to(".hero-reveal", {
                        y: 0,
                        opacity: 1,
                        duration: 0.5,
                        stagger: 0.08,
                        ease: "power3.out",
                    })
                    .to(".hero-divider-line", {
                        scaleX: 1,
                        duration: 0.6,
                        ease: "expo.inOut",
                    }, "-=0.3")

                // ── Pillar cards scroll reveal ──
                if (pillarsRef.current) {
                    gsap.fromTo(
                        pillarsRef.current.querySelectorAll(".pillar-card"),
                        { y: 50, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.4,
                            stagger: 0.08,
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
                            duration: 0.5,
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
                            href="/login"
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

                    {/* Bento Grid */}
                    <div ref={pillarsRef} className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* ── Pillar 1 — Translation (spans full width) ── */}
                        <div className="pillar-card group md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl bg-[#FAFAF9] border border-zinc-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/[0.04] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                            {/* Left — Content */}
                            <div className="p-8 sm:p-10 flex flex-col justify-center">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        <Languages className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.15em] font-[family-name:var(--font-inter)]">
                                        Layer 1 — Translation Engine
                                    </span>
                                </div>
                                <h3 className="font-[family-name:var(--font-inter)] text-xl sm:text-2xl font-bold text-zinc-900 mb-4 tracking-tight leading-snug">
                                    Context-Aware Translation
                                </h3>
                                <p className="font-[family-name:var(--font-inter)] text-zinc-500 text-[14px] sm:text-[15px] leading-relaxed font-medium mb-6">
                                    Most translators work word-by-word and miss the meaning entirely. LangoWorld&apos;s
                                    translation engine, powered by Lingo.dev, understands full context — idioms, cultural
                                    references, tone, and intent. Whether you&apos;re translating a technical document or a
                                    casual conversation, the output reads like it was written by a native speaker.
                                </p>
                            </div>

                            {/* Right — Feature highlights */}
                            <div className="p-8 sm:p-10 bg-blue-50/40 border-t md:border-t-0 md:border-l border-zinc-100 flex flex-col justify-center">
                                <div className="space-y-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-800 mb-0.5">32+ Languages</h4>
                                            <p className="font-[family-name:var(--font-inter)] text-xs text-zinc-500 leading-relaxed">From Punjabi to Portuguese, Hindi to Czech — with auto-detection powered by our Python backend.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-800 mb-0.5">Meaning Preservation</h4>
                                            <p className="font-[family-name:var(--font-inter)] text-xs text-zinc-500 leading-relaxed">Idioms, slang, and cultural references are adapted — not just translated literally.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-800 mb-0.5">Auto-Detection</h4>
                                            <p className="font-[family-name:var(--font-inter)] text-xs text-zinc-500 leading-relaxed">Backend-powered language detection with confidence scoring — just start typing.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Pillar 2 — YouTube Intelligence ── */}
                        <div className="pillar-card group flex flex-col justify-between p-8 sm:p-10 rounded-2xl bg-[#FAFAF9] border border-zinc-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/[0.04] transition-all duration-500 hover:-translate-y-1">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-[0.15em] font-[family-name:var(--font-inter)]">
                                        Layer 2 — Summarizer
                                    </span>
                                </div>
                                <h3 className="font-[family-name:var(--font-inter)] text-xl font-bold text-zinc-900 mb-4 tracking-tight leading-snug">
                                    YouTube Intelligence
                                </h3>
                                <p className="font-[family-name:var(--font-inter)] text-zinc-500 text-[13px] sm:text-sm leading-relaxed font-medium mb-6">
                                    Paste any YouTube link and get an AI-generated breakdown in seconds. Our Gemini-powered
                                    engine extracts key points, structured summaries, chapter breakdowns, and full
                                    transcripts — turning hours of video content into scannable, searchable intelligence.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600">Structured key points & chapter summaries</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                                            <Workflow className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600">Canvas workspace with visual node workflow</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600">Powered by Google Gemini AI for deep understanding</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Pillar 3 — Neural TTS ── */}
                        <div className="pillar-card group flex flex-col justify-between p-8 sm:p-10 rounded-2xl bg-[#FAFAF9] border border-zinc-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/[0.04] transition-all duration-500 hover:-translate-y-1">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        <Mic className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.15em] font-[family-name:var(--font-inter)]">
                                        Layer 3 — Voice
                                    </span>
                                </div>
                                <h3 className="font-[family-name:var(--font-inter)] text-xl font-bold text-zinc-900 mb-4 tracking-tight leading-snug">
                                    Neural TTS Engine
                                </h3>
                                <p className="font-[family-name:var(--font-inter)] text-zinc-500 text-[13px] sm:text-sm leading-relaxed font-medium mb-6">
                                    Listen to any summary or translation read aloud with natural, expressive voices.
                                    Powered by Gemini&apos;s text-to-speech, audio is generated in real-time and cached
                                    at the edge via Cloudflare R2 — so playback is instant, even on repeat listens.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                            <Radio className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600">Real-time streaming audio generation</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600">Edge-cached via Cloudflare R2 for instant replay</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                            <Globe className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600">Natural, expressive voices across all languages</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative py-28 sm:py-36 px-6 bg-white border-t border-zinc-100 overflow-hidden">
                {/* Decorative dot pattern */}
                <div
                    className="absolute inset-0 pointer-events-none z-0 opacity-[0.2]"
                    style={{
                        backgroundImage: 'radial-gradient(#A1A1AA 0.6px, transparent 0.6px)',
                        backgroundSize: '24px 24px',
                        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
                    }}
                />

                <div className="relative z-10 max-w-3xl mx-auto">
                    {/* Section label */}
                    <div className="flex items-center justify-center gap-2 mb-12">
                        <div className="h-px w-8 bg-zinc-300" />
                        <span className="font-[family-name:var(--font-inter)] text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                            Built by
                        </span>
                        <div className="h-px w-8 bg-zinc-300" />
                    </div>

                    {/* Profile Card */}
                    <div className="relative bg-[#FAFAF9] rounded-3xl border border-zinc-100 p-10 sm:p-14 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)]">

                        {/* Centered content */}
                        <div className="flex flex-col items-center text-center">
                            {/* Avatar with gradient ring */}
                            <div className="relative mb-8">
                                <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-400 to-violet-400 opacity-60 blur-sm" />
                                <img
                                    src="https://pbs.twimg.com/profile_images/2012916804981506048/7wV-fvs3_400x400.jpg"
                                    alt="Atharvsinh Jadav"
                                    width={110}
                                    height={110}
                                    className="relative rounded-2xl border-[3px] border-white shadow-lg object-cover"
                                />
                            </div>

                            {/* Name */}
                            <h3 className="font-[family-name:var(--font-inter)] text-3xl sm:text-4xl font-black text-zinc-900 tracking-[-0.03em] mb-2">
                                Atharvsinh Jadav
                            </h3>

                            {/* Role pills */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                                {["TypeScript", "Next.js", "Full-Stack", "AI / ML", "Web Dev"].map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/60 font-[family-name:var(--font-inter)] text-[11px] font-semibold text-zinc-500 tracking-wide"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Bio */}
                            <p className="font-[family-name:var(--font-inter)] text-[15px] sm:text-base text-zinc-500 leading-[1.8] font-medium max-w-lg mb-10">
                                I build from zero. Whether it&apos;s frontend, backend, full-stack applications,
                                or AI-powered experiences, I work across the entire development lifecycle.
                                From UI/UX to deployment to user feedback — I care less about technology
                                debates and more about delivering results that people love using.
                            </p>

                            {/* X / Twitter Link */}
                            <a
                                href="https://x.com/athrix_codes"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-zinc-900 text-white font-[family-name:var(--font-inter)] text-sm font-bold hover:bg-zinc-800 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-900/15"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                @athrix_codes
                                <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                            </a>
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
                        href="/login"
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
