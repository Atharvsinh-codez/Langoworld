"use client"

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase-browser"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Mail, Lock, Eye, EyeOff, Github, Loader2 } from "lucide-react"

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [mounted, setMounted] = useState(false)
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [focusedField, setFocusedField] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
        const err = searchParams.get("error")
        if (err) setError("Authentication failed. Please try again.")
    }, [searchParams])

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error

                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("username")
                        .eq("id", user.id)
                        .single()
                    router.push(!profile ? "/username" : "/workspace")
                }
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                setSuccess("Check your email for a confirmation link!")
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const handleOAuth = async (provider: "google" | "github") => {
        setError(null)
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) setError(error.message)
    }

    return (
        <div className="min-h-screen bg-[#FAFAF9] overflow-hidden selection:bg-orange-100 selection:text-orange-900 flex">

            <style jsx global>{`
                @keyframes float-orb-1 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(15px, -20px); }
                    66% { transform: translate(-10px, -10px); }
                }
                @keyframes float-orb-2 {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-20px, -15px); }
                }
                @keyframes float-orb-3 {
                    0%, 100% { transform: translate(0, 0); }
                    40% { transform: translate(10px, 15px); }
                    80% { transform: translate(-15px, 5px); }
                }
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-up { animation: fade-up 0.7s ease-out forwards; }
                .delay-1 { animation-delay: 0.1s; opacity: 0; }
                .delay-2 { animation-delay: 0.2s; opacity: 0; }
                .delay-3 { animation-delay: 0.3s; opacity: 0; }
                .delay-4 { animation-delay: 0.4s; opacity: 0; }
            `}</style>

            {/* ── Sunrise gradient — same as landing page ── */}
            <div className="absolute inset-x-0 top-0 h-full pointer-events-none z-0">
                <div
                    className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[100%] blur-[100px] transition-all duration-[2000ms] ease-out"
                    style={{
                        background: "radial-gradient(ellipse at top, #F97316 0%, #FFEDD5 25%, #DBEAFE 45%, transparent 70%)",
                        opacity: mounted ? 0.8 : 0,
                    }}
                />
            </div>

            {/* ── Floating Orbs ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Warm orange orb */}
                <div
                    className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-25"
                    style={{
                        background: "radial-gradient(circle, #F97316 0%, #FDBA74 40%, transparent 70%)",
                        top: "10%",
                        right: "15%",
                        animation: "float-orb-1 10s ease-in-out infinite",
                    }}
                />
                {/* Soft peach orb */}
                <div
                    className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-20"
                    style={{
                        background: "radial-gradient(circle, #FFEDD5 0%, #FED7AA 40%, transparent 70%)",
                        bottom: "15%",
                        left: "10%",
                        animation: "float-orb-2 12s ease-in-out infinite",
                    }}
                />
                {/* Subtle blue wash (matching landing's DBEAFE) */}
                <div
                    className="absolute w-[350px] h-[350px] rounded-full blur-[110px] opacity-15"
                    style={{
                        background: "radial-gradient(circle, #DBEAFE 0%, #BFDBFE 40%, transparent 70%)",
                        bottom: "5%",
                        right: "5%",
                        animation: "float-orb-3 14s ease-in-out infinite",
                    }}
                />
            </div>

            {/* ── Dot grid — same as landing page ── */}
            <div
                className="absolute inset-0 pointer-events-none z-0 opacity-[0.25]"
                style={{
                    backgroundImage: `radial-gradient(#A1A1AA 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)'
                }}
            />

            {/* ── Left Panel — Branding (desktop) ── */}
            <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center p-12">
                <div
                    className="relative z-10 max-w-md"
                    style={{
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {/* Branding */}
                    <div className="mb-10">
                        <h1 className="font-[family-name:var(--font-inter)] text-6xl font-black tracking-tighter leading-[0.9] mb-2">
                            <span className="text-zinc-900">LangoWorld</span>
                        </h1>
                        <h2
                            className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tighter leading-[0.9]"
                            style={{
                                WebkitTextStroke: '1.5px #71717A',
                                color: 'transparent',
                            }}
                        >
                            Global Voice
                        </h2>
                    </div>

                    <p className="font-[family-name:var(--font-inter)] text-lg text-zinc-500 leading-relaxed mb-8">
                        Empower your communication with real-time translation and AI dubbing that fuels global reach and unstoppable connection.
                    </p>

                    {/* Feature pills — warm palette */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            "AI Summaries",
                            "25+ Languages",
                            "Smart Transcripts",
                            "Key Points",
                        ].map((label) => (
                            <span
                                key={label}
                                className="px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/60 rounded-full text-xs font-semibold text-zinc-600 shadow-sm"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Panel — Login Form ── */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
                <div className={`w-full max-w-[420px] ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>

                    {/* Mobile branding */}
                    <div className="lg:hidden text-center mb-8 animate-fade-up delay-1">
                        <h1 className="font-[family-name:var(--font-inter)] text-3xl font-black tracking-tighter mb-1 text-zinc-900">
                            LangoWorld
                        </h1>
                        <p
                            className="font-[family-name:var(--font-inter)] text-lg font-black tracking-tighter"
                            style={{ WebkitTextStroke: '1px #71717A', color: 'transparent' }}
                        >
                            Global Voice
                        </p>
                    </div>

                    {/* Card header */}
                    <div className="mb-6 animate-fade-up delay-2">
                        <h2 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-zinc-900 mb-1">
                            {isLogin ? "Welcome back" : "Create account"}
                        </h2>
                        <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-400">
                            {isLogin ? "Sign in to your account to continue" : "Start your language learning journey"}
                        </p>
                    </div>

                    {/* Glass Card */}
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[28px] shadow-2xl shadow-orange-900/[0.06] p-7 animate-fade-up delay-3">

                        {/* Error / Success */}
                        {error && (
                            <div className="mb-5 p-3.5 bg-red-50/80 border border-red-100 rounded-2xl text-sm text-red-600 font-medium flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-5 p-3.5 bg-emerald-50/80 border border-emerald-100 rounded-2xl text-sm text-emerald-600 font-medium flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                {success}
                            </div>
                        )}

                        {/* OAuth Buttons */}
                        <div className="space-y-2.5 mb-6">
                            <button
                                onClick={() => handleOAuth("google")}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-zinc-200/80 rounded-2xl hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-200/30 transition-all duration-300 group active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="font-[family-name:var(--font-inter)] text-sm font-semibold text-zinc-700">
                                    Continue with Google
                                </span>
                            </button>

                            <button
                                onClick={() => handleOAuth("github")}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-zinc-900 rounded-2xl hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 transition-all duration-300 group active:scale-[0.98]"
                            >
                                <Github className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
                                <span className="font-[family-name:var(--font-inter)] text-sm font-semibold text-white">
                                    Continue with GitHub
                                </span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
                            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-[0.12em]">or</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-[0.1em]">
                                    Email
                                </label>
                                <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-orange-400/20 shadow-lg shadow-orange-400/5' : ''}`}>
                                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-orange-500' : 'text-zinc-300'}`} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/60 border border-zinc-200/60 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-orange-300 transition-all font-[family-name:var(--font-inter)]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-[0.1em]">
                                    Password
                                </label>
                                <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-orange-400/20 shadow-lg shadow-orange-400/5' : ''}`}>
                                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'password' ? 'text-orange-500' : 'text-zinc-300'}`} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full pl-11 pr-12 py-3.5 bg-white/60 border border-zinc-200/60 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-orange-300 transition-all font-[family-name:var(--font-inter)]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit — dark, matching landing page CTA */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-[family-name:var(--font-inter)] text-sm font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-zinc-900/20 hover:shadow-2xl hover:shadow-zinc-900/25 active:scale-[0.98] mt-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? "Sign In" : "Create Account"}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Toggle Login/Signup */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null) }}
                                className="font-[family-name:var(--font-inter)] text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                {isLogin ? (
                                    <>Don&apos;t have an account?{" "}<span className="font-bold text-zinc-900">Sign up</span></>
                                ) : (
                                    <>Already have an account?{" "}<span className="font-bold text-zinc-900">Sign in</span></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[11px] text-zinc-300 mt-5 font-[family-name:var(--font-inter)] animate-fade-up delay-4">
                        By continuing, you agree to LangoWorld&apos;s terms of service.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
