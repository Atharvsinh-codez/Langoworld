"use client"

import { useState, useEffect, useRef, MouseEvent as ReactMouseEvent } from "react"
import Link from "next/link"
import { ArrowRight, Languages, Mic, BookOpen, Sparkles, ChevronRight, Globe, Zap } from "lucide-react"
import { motion, useInView } from "framer-motion"

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

// ─── Floating Logo Component ───

// ─── Floating Logo Component ───

function FloatingLogo({ src, alt, className, delay = 0, glowColor = "shadow-zinc-200/50" }: { src: string; alt: string; className?: string; delay?: number; glowColor?: string }) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: 1,
                y: [0, -15, 0],
            }}
            transition={{
                opacity: { duration: 0.8, delay },
                y: {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay + 1, // Start floating after fade in
                }
            }}
        >
            <div className={`bg-white/80 backdrop-blur-xl border border-white/60 p-4 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-all duration-500 w-full h-full flex items-center justify-center ${glowColor}`}>
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-contain drop-shadow-sm rounded-xl"
                />
            </div>
        </motion.div>
    )
}

// ─── SpotlightCard — Mouse-tracking glow border + 3D tilt ───

function SpotlightCard({
    children,
    className = "",
    innerClassName = "bg-white",
}: {
    children: React.ReactNode;
    className?: string;
    innerClassName?: string;
}) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [opacity, setOpacity] = useState(0)

    const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setOpacity(1)

        // Subtle 3D tilt
        const xPct = (e.clientX - rect.left) / rect.width - 0.5
        const yPct = (e.clientY - rect.top) / rect.height - 0.5
        cardRef.current.style.transform =
            `perspective(1000px) rotateY(${xPct * 4}deg) rotateX(${-yPct * 4}deg) translateY(-2px)`
    }

    const handleMouseLeave = () => {
        setOpacity(0)
        if (cardRef.current) {
            cardRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px)'
        }
    }

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`spotlight-card relative rounded-[1.5rem] overflow-hidden transition-[transform] duration-500 ease-out group ${className}`}
        >
            {/* Spotlight gradient — follows mouse */}
            <div
                className="pointer-events-none absolute -inset-px rounded-[1.5rem] opacity-0 transition-opacity duration-500 z-10"
                style={{
                    opacity,
                    background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(59,130,246,0.15), rgba(251,146,60,0.08), transparent 50%)`,
                }}
            />
            {/* Inner bg to mask out spotlight on content area → shows only on border */}
            <div className={`absolute inset-[1px] rounded-[1.5rem] z-10 ${innerClassName}`} />
            {/* Content */}
            <div className="relative z-20 p-8 sm:p-10 h-full">{children}</div>
        </div>
    )
}

// ─── Features Section — Premium SaaS Grid ───

function FeaturesSection() {
    const gridRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (typeof window === "undefined") return
        let ctx: any

        const init = async () => {
            const gsapMod = await import("gsap")
            const { ScrollTrigger } = await import("gsap/ScrollTrigger")
            gsapMod.default.registerPlugin(ScrollTrigger)

            if (!gridRef.current) return
            const cards = gridRef.current.querySelectorAll(".feature-card")

            ctx = gsapMod.default.context(() => {
                gsapMod.default.fromTo(
                    Array.from(cards),
                    { y: 48, opacity: 0, scale: 0.97 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.65,
                        stagger: 0.09,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: gridRef.current,
                            start: "top 82%",
                            toggleActions: "play none none reverse",
                        },
                    }
                )
            })
        }
        init()

        return () => ctx?.revert?.()
    }, [])

    const features = [
        {
            icon: <Languages className="w-5 h-5" />,
            title: "AI Translation",
            desc: "Context-aware translation across 25+ languages. Preserves meaning, tone, and cultural nuance — not just words.",
            label: "25+ Languages",
            accent: "text-blue-600",
            bg: "bg-blue-50",
            border: "group-hover:border-blue-200",
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: "YouTube Summarizer",
            desc: "Paste any link and get structured summaries with key points, timestamps, and full transcript in seconds.",
            label: "AI-Powered",
            accent: "text-amber-600",
            bg: "bg-amber-50",
            border: "group-hover:border-amber-200",
        },
        {
            icon: <Mic className="w-5 h-5" />,
            title: "Neural Text-to-Speech",
            desc: "Natural, expressive voices powered by Gemini. Audio is generated in real-time and streamed at the edge.",
            label: "Real-time",
            accent: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "group-hover:border-emerald-200",
        },
        {
            icon: <BookOpen className="w-5 h-5" />,
            title: "Word-Level Learning",
            desc: "Tap any word to instantly translate it. Build vocabulary naturally while reading content you love.",
            label: "Instant Lookup",
            accent: "text-violet-600",
            bg: "bg-violet-50",
            border: "group-hover:border-violet-200",
        },
        {
            icon: <Globe className="w-5 h-5" />,
            title: "Smart Context Engine",
            desc: "Understands idioms, slang, and cultural references. Translations adapt to industry, tone, and audience.",
            label: "Context-Aware",
            accent: "text-rose-600",
            bg: "bg-rose-50",
            border: "group-hover:border-rose-200",
        },
    ]

    return (
        <section className="relative py-28 sm:py-36 px-6 bg-[#FAFAF9]">
            {/* Subtle dot pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.35]"
                style={{
                    backgroundImage: 'radial-gradient(#D4D4D8 0.8px, transparent 0.8px)',
                    backgroundSize: '24px 24px',
                    maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
                }}
            />

            <div className="relative max-w-[1120px] mx-auto">
                {/* ── Section Header ── */}
                <div className="max-w-2xl mb-16 sm:mb-20">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="h-px w-8 bg-blue-500" />
                        <span className="font-[family-name:var(--font-inter)] text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em]">
                            Capabilities
                        </span>
                    </div>
                    <h2 className="font-[family-name:var(--font-inter)] text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-zinc-900 tracking-tight leading-[1.15] mb-5">
                        Everything you need to<br />
                        communicate globally
                    </h2>
                    <p className="font-[family-name:var(--font-inter)] text-zinc-500 text-[15px] sm:text-base leading-relaxed font-medium max-w-lg">
                        Five core modules working together — translation, summarization, voice synthesis, learning, and contextual intelligence.
                    </p>
                </div>

                {/* ── Card Grid — 3 columns ── */}
                <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((f, i) => (
                        <Link
                            key={i}
                            href="/login"
                            className={`feature-card group relative flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-white border border-zinc-100 ${f.border} transition-all duration-400 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] cursor-pointer no-underline`}
                        >
                            {/* Icon */}
                            <div>
                                <div className={`w-10 h-10 rounded-xl ${f.bg} ${f.accent} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300`}>
                                    {f.icon}
                                </div>

                                {/* Title */}
                                <h3 className="font-[family-name:var(--font-inter)] text-[17px] font-bold text-zinc-900 tracking-tight mb-2.5 leading-snug">
                                    {f.title}
                                </h3>

                                {/* Description */}
                                <p className="font-[family-name:var(--font-inter)] text-[13px] sm:text-sm text-zinc-500 leading-relaxed font-medium">
                                    {f.desc}
                                </p>
                            </div>

                            {/* Bottom Label */}
                            <div className="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-between">
                                <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${f.accent} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                    {f.label}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all duration-300" />
                            </div>
                        </Link>
                    ))}

                    {/* ── CTA Card — Dark ── */}
                    <Link
                        href="/login"
                        className="feature-card group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all duration-400 ease-out hover:-translate-y-[3px] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] overflow-hidden"
                    >
                        {/* Subtle radial glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center mx-auto mb-5 group-hover:bg-white/[0.12] transition-colors duration-300">
                                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform duration-300" />
                            </div>
                            <span className="font-[family-name:var(--font-inter)] text-lg font-bold text-white tracking-tight block mb-2">
                                Get Started
                            </span>
                            <p className="font-[family-name:var(--font-inter)] text-zinc-500 text-xs font-medium">
                                Free to use · No credit card
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
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

                {/* ── FLOATING LOGOS ── */}
                {mounted && (
                    <>
                        {/* ── Left Side ── */}
                        {/* Gemini - Top Left */}
                        <FloatingLogo
                            src="/logos/gemini.png"
                            alt="Gemini AI"
                            className="absolute top-28 left-[10%] hidden lg:block w-20 h-20"
                            delay={0}
                            glowColor="shadow-blue-500/20"
                        />
                        {/* Lingo.dev - Mid Left */}
                        <FloatingLogo
                            src="/logos/inngest.png"
                            alt="Lingo.dev"
                            className="absolute top-[55%] left-[4%] hidden xl:block w-20 h-20"
                            delay={0.8}
                            glowColor="shadow-indigo-500/20"
                        />
                        {/* YouTube - Bottom Left */}
                        <FloatingLogo
                            src="/logos/youtube.jpg"
                            alt="YouTube"
                            className="absolute bottom-32 left-[12%] hidden lg:block w-16 h-16"
                            delay={1.5}
                            glowColor="shadow-red-500/20"
                        />

                        {/* ── Right Side ── */}
                        {/* Supabase - Top Right (Prominent) */}
                        <FloatingLogo
                            src="/logos/supabase-new.jpg"
                            alt="Supabase"
                            className="absolute top-[20%] right-[10%] hidden lg:block w-20 h-20"
                            delay={1}
                            glowColor="shadow-emerald-500/20"
                        />
                        {/* Cloudflare - Bottom Right */}
                        <FloatingLogo
                            src="/logos/cloudflare-new.png"
                            alt="Cloudflare"
                            className="absolute bottom-[20%] right-[8%] hidden lg:block w-18 h-18"
                            delay={2.5}
                            glowColor="shadow-orange-500/20"
                        />
                    </>
                )}

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

                    {/* Buttons Row — Centered CTAs */}
                    <div
                        className="flex items-center justify-center gap-4 transition-all duration-[1600ms] delay-300 translate-y-8 opacity-0"
                        style={{
                            transform: mounted ? "translateY(0)" : "translateY(30px)",
                            opacity: mounted ? 1 : 0
                        }}
                    >
                        {/* Primary Button */}
                        <GlassButton href="/login">
                            Get started <ArrowRight className="w-4 h-4 ml-1" />
                        </GlassButton>

                        {/* Secondary Button — Rounded with Glow */}
                        <Link
                            href="/about"
                            className="group relative px-8 py-4 rounded-full bg-white border border-zinc-200 text-zinc-900 font-[family-name:var(--font-inter)] font-bold text-sm tracking-tight hover:border-zinc-300 transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-lg"
                        >
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400/30 to-indigo-400/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <span className="relative flex items-center gap-2">
                                Our Story <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </span>
                        </Link>
                    </div>

                </div>

            </section>

            {/* ══════════════════ FEATURES — SpotlightCard Bento Grid ══════════════════ */}
            <FeaturesSection />

            {/* ══════════════════ CTA + FOOTER — Combined Section ══════════════════ */}
            <section className="relative pt-32 pb-0 px-6 overflow-hidden">
                {/* Top gradient fade from page */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent pointer-events-none" />

                {/* CTA Content */}
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <Ornament className="w-32 h-8 text-zinc-300 mx-auto mb-10 opacity-50" />

                    <h2 className="font-[family-name:var(--font-inter)] text-5xl sm:text-6xl md:text-7xl font-black text-zinc-900 tracking-tighter leading-none mb-8">
                        Start communicating<br />
                        <span className="text-zinc-400 font-extrabold">without barriers</span>
                    </h2>

                    <div className="flex justify-center mt-12">
                        <GlassButton href="/login">
                            Launch Workspace <ArrowRight className="w-4 h-4 ml-1" />
                        </GlassButton>
                    </div>
                </div>

                {/* ── Footer area — flows naturally from CTA ── */}
                <footer className="relative mt-32 pb-8">

                    {/* ── Footer Gradient — warm sunrise glow ── */}
                    <div className="absolute inset-x-0 bottom-0 h-[500px] overflow-hidden pointer-events-none">
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
                        {/* Subtle divider — thin gradient line instead of hard border */}
                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent mb-16" />

                        {/* Brand + Socials row */}
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-10 mb-16">
                            {/* Brand */}
                            <div>
                                <span className="font-[family-name:var(--font-inter)] text-2xl font-black text-zinc-900 tracking-tighter block mb-2">
                                    LangoWorld
                                </span>
                                <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-500 font-medium">
                                    AI for everyone starts here
                                </p>
                            </div>

                            {/* Socials — horizontal on desktop */}
                            <div>
                                <h4 className="font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Socials</h4>
                                <ul className="flex gap-5 font-[family-name:var(--font-inter)] text-sm text-zinc-500 font-medium">
                                    <li><a href="https://www.athrix.me/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">Portfolio</a></li>
                                    <li><a href="https://github.com/Atharvsinh-codez" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">GitHub</a></li>
                                    <li><a href="https://x.com/athrix_codes" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">X</a></li>
                                </ul>
                            </div>
                        </div>

                        {/* Bottom row — copyright */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-200/30">
                            <p className="font-[family-name:var(--font-inter)] text-sm font-medium text-zinc-400">
                                Copyright LangoWorld {new Date().getFullYear()}
                            </p>
                            <p className="font-[family-name:var(--font-inter)] text-sm font-medium text-zinc-400">
                                All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </section>
        </div>
    )
}
