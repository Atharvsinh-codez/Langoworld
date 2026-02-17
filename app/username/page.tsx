"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"
import { Check, X, Loader2, AtSign, ArrowRight } from "lucide-react"

export default function UsernamePage() {
    const router = useRouter()
    const supabase = createClient()

    const [mounted, setMounted] = useState(false)
    const [username, setUsername] = useState("")
    const [checking, setChecking] = useState(false)
    const [available, setAvailable] = useState<boolean | null>(null)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const [focused, setFocused] = useState(false)

    useEffect(() => {
        setMounted(true)
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) { router.push("/login"); return }
            setUser(user)
            supabase.from("profiles").select("username").eq("id", user.id).single()
                .then(({ data }) => { if (data?.username) router.push("/workspace") })
        })
    }, [])

    const checkUsername = useCallback(async (value: string) => {
        const cleaned = value.trim().toLowerCase()
        if (cleaned.length < 3) { setAvailable(null); setValidationError(cleaned.length > 0 ? "At least 3 characters" : null); return }
        if (!/^[a-z0-9_]{3,20}$/.test(cleaned)) { setAvailable(null); setValidationError("Only lowercase letters, numbers, and underscores"); return }
        setValidationError(null)
        setChecking(true)
        try {
            const res = await fetch("/api/username/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: cleaned }) })
            const data = await res.json()
            if (data.error) { setValidationError(data.error); setAvailable(null) }
            else { setAvailable(data.available); if (!data.available) setValidationError("This username is taken") }
        } catch { setValidationError("Could not check availability") }
        finally { setChecking(false) }
    }, [])

    useEffect(() => {
        if (!username) { setAvailable(null); setValidationError(null); return }
        const timer = setTimeout(() => checkUsername(username), 400)
        return () => clearTimeout(timer)
    }, [username, checkUsername])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!available || !user) return
        setSaving(true); setError(null)
        try {
            const cleaned = username.trim().toLowerCase()
            const { error } = await supabase.from("profiles").insert({
                id: user.id, username: cleaned,
                display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || cleaned,
                avatar_url: user.user_metadata?.avatar_url || null,
            })
            if (error) {
                if (error.code === "23505") { setError("This username was just taken! Try another."); setAvailable(false) }
                else throw error
                return
            }
            router.push("/workspace")
        } catch (err: any) { setError(err.message || "Failed to save username") }
        finally { setSaving(false) }
    }

    const borderColor = validationError
        ? 'border-red-300 ring-2 ring-red-500/10'
        : available
            ? 'border-emerald-300 ring-2 ring-emerald-500/10'
            : focused
                ? 'border-orange-300 ring-2 ring-orange-400/20'
                : 'border-zinc-200/60'

    return (
        <div className="min-h-screen bg-[#FAFAF9] overflow-hidden selection:bg-orange-100 selection:text-orange-900 flex">

            <style dangerouslySetInnerHTML={{
                __html: `
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
            ` }} />

            {/* ── Sunrise gradient — same as login page ── */}
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
                {/* Subtle blue wash */}
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

            {/* ── Dot grid — same as login page ── */}
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
                        You&apos;re almost there! Pick a unique username that will be your identity across the LangoWorld platform.
                    </p>

                    {/* Feature pills — warm palette */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            "Unique Identity",
                            "Your Profile",
                            "Personalized",
                            "One-time Setup",
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

            {/* ── Right Panel — Username Form ── */}
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
                            Choose your username
                        </h2>
                        <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-400">
                            Pick a unique identity for your account
                        </p>
                    </div>

                    {/* Glass Card */}
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[28px] shadow-2xl shadow-orange-900/[0.06] p-7 animate-fade-up delay-3">

                        {/* Error */}
                        {error && (
                            <div className="mb-5 p-3.5 bg-red-50/80 border border-red-100 rounded-2xl text-sm text-red-600 font-medium flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                {error}
                            </div>
                        )}

                        {/* Username Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-[0.1em]">
                                    Username
                                </label>
                                <div className={`relative rounded-2xl transition-all duration-300 ${borderColor}`}>
                                    <AtSign className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${available ? 'text-emerald-500' : validationError ? 'text-red-400' : focused ? 'text-orange-500' : 'text-zinc-300'}`} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                        placeholder="your_username"
                                        required
                                        maxLength={20}
                                        minLength={3}
                                        className="w-full pl-11 pr-12 py-3.5 bg-white/60 border border-zinc-200/60 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-orange-300 transition-all font-[family-name:var(--font-inter)] font-mono tracking-wide"
                                    />
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                        {checking && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />}
                                        {!checking && available === true && (
                                            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                        {!checking && available === false && (
                                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md shadow-red-500/30">
                                                <X className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Validation message */}
                                <div className="mt-2 min-h-[20px]">
                                    {validationError && <p className="text-xs text-red-500 font-semibold">{validationError}</p>}
                                    {available && !validationError && <p className="text-xs text-emerald-500 font-semibold">✓ Username is available!</p>}
                                </div>
                            </div>

                            {/* Rules pills */}
                            <div className="flex gap-2 text-[11px] text-zinc-300 font-medium">
                                {["3-20 chars", "a-z, 0-9, _", "Must be unique"].map((rule) => (
                                    <span key={rule} className="px-2.5 py-1 bg-zinc-100/60 rounded-lg">{rule}</span>
                                ))}
                            </div>

                            {/* Submit — dark, matching login page CTA */}
                            <button
                                type="submit"
                                disabled={!available || saving}
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-[family-name:var(--font-inter)] text-sm font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-zinc-900/20 hover:shadow-2xl hover:shadow-zinc-900/25 active:scale-[0.98] mt-2"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Continue to Workspace
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[11px] text-zinc-300 mt-5 font-[family-name:var(--font-inter)] animate-fade-up delay-4">
                        This username cannot be changed later.
                    </p>
                </div>
            </div>
        </div>
    )
}
