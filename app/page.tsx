"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Languages, Mic, BookOpen, Sparkles, ChevronRight } from "lucide-react"

// ─── Decorative Ornament SVG ───

function Ornament({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 200 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 25 C85 10, 65 5, 50 15 C35 25, 45 40, 60 35 C70 32, 72 22, 65 18 C58 14, 50 20, 55 27" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d="M100 25 C115 10, 135 5, 150 15 C165 25, 155 40, 140 35 C130 32, 128 22, 135 18 C142 14, 150 20, 145 27" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
            <circle cx="100" cy="25" r="3" fill="currentColor" opacity="0.4" />
            <path d="M40 20 C30 15, 20 18, 15 25" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M160 20 C170 15, 180 18, 185 25" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
        </svg>
    )
}

// ─── Glassmorphism Button ───

function GlassButton({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return (
        <Link href={href}>
            <button className={`group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full transition-all duration-300 ${className}`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-black/80 to-black/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] group-hover:scale-[1.02] group-hover:bg-black" />
                <div className="absolute inset-[1px] rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-60" />
                <span className="relative z-10 flex items-center gap-2.5 font-[family-name:var(--font-inter)] text-lg font-bold text-white tracking-tight">
                    {children}
                </span>
            </button>
        </Link>
    )
}

// ─── Main Page ───

export default function Home() {
    const [scrollY, setScrollY] = useState(0)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const handleScroll = () => setScrollY(window.scrollY)
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-[#FAFAF9] overflow-hidden selection:bg-orange-100 selection:text-orange-900">

            {/* ══════════════════ HERO ══════════════════ */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-20 pb-32">

                {/* ── TOP GRADIENT — "Sunrise" Style (Orange Top, Blue/White Bottom) ── */}
                <div className="absolute inset-x-0 top-0 h-[85vh] pointer-events-none z-0">
                    {/* Main Orange Burst at Top Center */}
                    <div
                        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] blur-[100px] transition-all duration-[2000ms] ease-out"
                        style={{
                            background: "radial-gradient(ellipse at top, #F97316 0%, #FFEDD5 25%, #DBEAFE 45%, transparent 70%)",
                            transform: mounted
                                ? "translate(-50%, 0%)"
                                : "translate(-50%, -10%)",
                            opacity: mounted ? 0.9 : 0,
                        }}
                    />
                </div>

                {/* ── DOT GRID PATTERN — Efferd style ── */}
                <div
                    className="absolute inset-0 pointer-events-none z-0 opacity-[0.3]"
                    style={{
                        backgroundImage: `radial-gradient(#A1A1AA 1px, transparent 1px)`,
                        backgroundSize: '32px 32px',
                        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
                    }}
                />

                {/* Content Container */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">

                    {/* Top-left Logo */}
                    <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
                        <div className="bg-white/70 backdrop-blur-md rounded-lg p-1.5 shadow-sm border border-white/50">
                            <img
                                src="/logo-lw.png"
                                alt="LangoWorld"
                                width={36}
                                height={36}
                                className="rounded-md"
                            />
                        </div>
                    </div>

                    {/* Pill Badge — "Experience LangoWorld" */}
                    <div
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/60 border border-white/60 backdrop-blur-md shadow-sm transition-all duration-[1000ms] translate-y-4 opacity-0"
                        style={{
                            transform: mounted ? "translateY(0)" : "translateY(20px)",
                            opacity: mounted ? 1 : 0
                        }}
                    >
                        <span className="font-[family-name:var(--font-inter)] text-sm font-bold text-blue-600 tracking-wide uppercase">
                            Experience LangoWorld
                        </span>
                    </div>

                    {/* Headlines — Stacked Solid + Outline */}
                    <div
                        className="flex flex-col items-center transition-all duration-[1200ms] delay-100 translate-y-8 opacity-0"
                        style={{
                            transform: mounted ? "translateY(0)" : "translateY(30px)",
                            opacity: mounted ? 1 : 0
                        }}
                    >
                        {/* Solid Line */}
                        <h1 className="font-[family-name:var(--font-inter)] text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black text-zinc-900 tracking-tighter leading-[0.9]">
                            LangoWorld
                        </h1>

                        {/* Outline Line — "Global Voice" */}
                        <h1
                            className="font-[family-name:var(--font-inter)] text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-[0.9] mt-2 sm:mt-0"
                            style={{
                                WebkitTextStroke: '2px #71717A',
                                color: 'transparent',
                            }}
                        >
                            Global Voice
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <p
                        className="font-[family-name:var(--font-inter)] text-lg sm:text-xl text-zinc-600 font-medium tracking-tight max-w-2xl mx-auto leading-relaxed transition-all duration-[1400ms] delay-200 translate-y-8 opacity-0"
                        style={{
                            transform: mounted ? "translateY(0)" : "translateY(30px)",
                            opacity: mounted ? 1 : 0
                        }}
                    >
                        Empower your communication with real-time translation and AI dubbing that fuels global reach and unstoppable connection.
                    </p>

                    {/* Buttons Row — Single Centered CTA */}
                    <div
                        className="flex justify-center transition-all duration-[1600ms] delay-300 translate-y-8 opacity-0"
                        style={{
                            transform: mounted ? "translateY(0)" : "translateY(30px)",
                            opacity: mounted ? 1 : 0
                        }}
                    >
                        {/* Primary Button — GlassButton (Dark Variant to match screenshot) */}
                        <GlassButton href="/login">
                            Get started <ArrowRight className="w-4 h-4 ml-1" />
                        </GlassButton>
                    </div>

                </div>

            </section>

            {/* ══════════════════ FEATURES ══════════════════ */}
            <section className="relative py-32 px-6 bg-gradient-to-b from-[#FAFAF9] to-white">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-24">
                        <p className="font-[family-name:var(--font-inter)] text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-6">
                            Key Capabilities
                        </p>
                        <h2 className="font-[family-name:var(--font-inter)] text-4xl sm:text-5xl md:text-6xl font-extrabold text-zinc-900 tracking-tight">
                            Powerful features,<br />
                            <span className="text-zinc-400">effortless experience</span>
                        </h2>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            {
                                icon: <Languages className="w-6 h-6" />,
                                title: "AI Translation",
                                description: "Translate content across 25+ languages with context-aware AI that preserves meaning, tone, and nuance.",
                                bg: "bg-blue-50/50",
                                iconColor: "text-blue-600",
                            },
                            {
                                icon: <Sparkles className="w-6 h-6" />,
                                title: "YouTube Summarizer",
                                description: "Paste any YouTube link and get an AI-powered summary with key points, timestamps, and full transcript.",
                                bg: "bg-amber-50/50",
                                iconColor: "text-amber-600",
                            },
                            {
                                icon: <Mic className="w-6 h-6" />,
                                title: "Text-to-Speech",
                                description: "Listen to summaries and translations with natural-sounding AI voices in any supported language.",
                                bg: "bg-emerald-50/50",
                                iconColor: "text-emerald-600",
                            },
                            {
                                icon: <BookOpen className="w-6 h-6" />,
                                title: "Word-Level Learning",
                                description: "Select any word to instantly translate it. Build vocabulary naturally while reading content you love.",
                                bg: "bg-purple-50/50",
                                iconColor: "text-purple-600",
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className={`group p-10 rounded-[2rem] border border-zinc-100 hover:border-zinc-200 bg-white hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-500 hover:-translate-y-1`}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-6`}>
                                    <div className={feature.iconColor}>{feature.icon}</div>
                                </div>
                                <h3 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-zinc-900 mb-4 tracking-tight">
                                    {feature.title}
                                </h3>
                                <p className="font-[family-name:var(--font-inter)] text-zinc-500 leading-relaxed text-[16px] font-medium">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════ CTA SECTION ══════════════════ */}
            <section className="relative py-32 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 to-transparent pointer-events-none" />
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <Ornament className="w-32 h-8 text-zinc-300 mx-auto mb-10 opacity-50" />

                    <h2 className="font-[family-name:var(--font-inter)] text-5xl sm:text-6xl md:text-7xl font-black text-zinc-900 tracking-tighter leading-none mb-8">
                        Start communicating<br />
                        <span className="text-zinc-400 font-extrabold">without barriers</span>
                    </h2>

                    <div className="flex justify-center mt-12">
                        <GlassButton href="/workspace">
                            Launch Workspace <ArrowRight className="w-4 h-4 ml-1" />
                        </GlassButton>
                    </div>
                </div>
            </section>

            {/* ══════════════════ FOOTER ══════════════════ */}
            <footer className="relative border-t border-zinc-100 pt-16 pb-8 px-6 bg-white overflow-hidden">

                {/* ── FOOTER GRADIENT — Sarvam style, animated slide-up ── */}
                <div className="absolute inset-x-0 bottom-0 h-[400px] overflow-hidden pointer-events-none">
                    <div
                        className="absolute left-1/2 w-[120%] h-[100%] transition-all duration-[2500ms] ease-out"
                        style={{
                            transform: mounted
                                ? "translate(-50%, 0%)"
                                : "translate(-50%, 60%)",
                            opacity: mounted ? 1 : 0,
                        }}
                    >
                        {/* Centre orange glow */}
                        <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[35%] h-[100%] blur-[80px] opacity-50"
                            style={{ background: "linear-gradient(0deg, #F5A44C 0%, #F5C78A 30%, transparent 80%)" }}
                        />
                        {/* Left blue wash */}
                        <div
                            className="absolute bottom-[5%] left-[8%] w-[40%] h-[80%] rounded-full blur-[90px] opacity-40"
                            style={{ background: "radial-gradient(circle, #93B5F5 0%, #BDD1FC 40%, transparent 70%)" }}
                        />
                        {/* Right blue wash */}
                        <div
                            className="absolute bottom-[5%] right-[8%] w-[40%] h-[80%] rounded-full blur-[90px] opacity-40"
                            style={{ background: "radial-gradient(circle, #93B5F5 0%, #BDD1FC 40%, transparent 70%)" }}
                        />
                    </div>
                </div>

                {/* Footer Content */}
                <div className="relative z-10 max-w-6xl mx-auto">
                    {/* Top row — brand + link columns */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1">
                            <span className="font-[family-name:var(--font-inter)] text-2xl font-black text-zinc-900 tracking-tighter block mb-2">
                                LangoWorld
                            </span>
                            <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-500 font-medium">
                                AI for everyone starts here
                            </p>
                        </div>

                        {/* Products */}
                        <div>
                            <h4 className="font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Products</h4>
                            <ul className="space-y-3 font-[family-name:var(--font-inter)] text-sm text-zinc-500 font-medium">
                                <li><Link href="/workspace" className="hover:text-zinc-900 transition-colors">Workspace</Link></li>
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">Translation</Link></li>
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">YouTube AI</Link></li>
                            </ul>
                        </div>

                        {/* API */}
                        <div>
                            <h4 className="font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">API</h4>
                            <ul className="space-y-3 font-[family-name:var(--font-inter)] text-sm text-zinc-500 font-medium">
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">Text to Speech</Link></li>
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">Speech to Text</Link></li>
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">API Pricing</Link></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Company</h4>
                            <ul className="space-y-3 font-[family-name:var(--font-inter)] text-sm text-zinc-500 font-medium">
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">About us</Link></li>
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">Terms of Service</Link></li>
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link></li>
                            </ul>
                        </div>

                        {/* Socials */}
                        <div>
                            <h4 className="font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Socials</h4>
                            <ul className="space-y-3 font-[family-name:var(--font-inter)] text-sm text-zinc-500 font-medium">
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">LinkedIn</Link></li>
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">Twitter</Link></li>
                                <li><Link href="#" className="hover:text-zinc-900 transition-colors">YouTube</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom row — copyright */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-200/60">
                        <p className="font-[family-name:var(--font-inter)] text-sm font-medium text-zinc-400">
                            Copyright LangoWorld {new Date().getFullYear()}
                        </p>
                        <p className="font-[family-name:var(--font-inter)] text-sm font-medium text-zinc-400">
                            All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
