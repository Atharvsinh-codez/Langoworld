"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"
import { Check, X, Loader2, AtSign, Sparkles, ArrowRight } from "lucide-react"

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

    const borderColor = validationError ? 'border-red-300 ring-red-500/10' : available ? 'border-emerald-300 ring-emerald-500/10' : focused ? 'border-blue-300 ring-blue-500/15' : 'border-zinc-200/60'

    return (
        <div className="min-h-screen bg-[#F8FAFC] overflow-hidden selection:bg-blue-100 selection:text-blue-900 flex items-center justify-center px-6 py-12">

            {/* Background — blue + orange orbs */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-25" style={{ background: "radial-gradient(circle, #3B82F6 0%, #93C5FD 40%, transparent 70%)", top: "-10%", left: "50%", transform: "translateX(-50%)" }} />
                <div className="absolute w-[300px] h-[300px] rounded-full blur-[90px] opacity-20" style={{ background: "radial-gradient(circle, #F97316 0%, #FDBA74 40%, transparent 70%)", bottom: "5%", right: "10%" }} />
            </div>

            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.035]" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)`, backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)' }} />

            <div className="relative z-10 w-full max-w-[440px] transition-all duration-[1000ms] ease-out" style={{ transform: mounted ? "translateY(0) scale(1)" : "translateY(40px) scale(0.97)", opacity: mounted ? 1 : 0 }}>

                {/* Branding */}
                <div className="text-center mb-8">
                    <h1 className="font-[family-name:var(--font-inter)] text-2xl font-black tracking-tight mb-1">
                        <span className="text-zinc-900">Lango</span>
                        <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">World</span>
                    </h1>
                    <span className="font-[family-name:var(--font-inter)] tracking-[0.12em] uppercase font-black text-sm text-zinc-300 block mb-3" style={{ WebkitTextStroke: '1px currentColor', WebkitTextFillColor: 'transparent' }}>Global Voice</span>
                    <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-400">Choose your unique identity</p>
                </div>

                {/* Glass Card */}
                <div className="bg-white/80 backdrop-blur-2xl border border-white/70 rounded-[28px] shadow-2xl shadow-blue-900/[0.05] p-8">

                    {/* Welcome */}
                    <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50/80 to-orange-50/50 border border-blue-100/50 rounded-2xl">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-zinc-800 mb-0.5">Welcome aboard! 🎉</p>
                            <p className="text-[11px] font-medium text-zinc-500">Pick a unique username. This can&apos;t be changed later.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3.5 bg-red-50/80 border border-red-100 rounded-2xl text-sm text-red-600 font-medium flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />{error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[11px] font-bold text-zinc-400 mb-2 uppercase tracking-[0.1em]">Username</label>
                            <div className={`relative rounded-2xl transition-all duration-300 ring-2 ${borderColor}`}>
                                <AtSign className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${available ? 'text-emerald-500' : validationError ? 'text-red-400' : focused ? 'text-blue-500' : 'text-zinc-300'}`} />
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="your_username" required maxLength={20} minLength={3} className="w-full pl-11 pr-12 py-4 bg-zinc-50/60 border-0 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none transition-all font-[family-name:var(--font-inter)] font-mono tracking-wide" />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                    {checking && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />}
                                    {!checking && available === true && <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30"><Check className="w-3.5 h-3.5 text-white" /></div>}
                                    {!checking && available === false && <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md shadow-red-500/30"><X className="w-3.5 h-3.5 text-white" /></div>}
                                </div>
                            </div>
                            <div className="mt-2 min-h-[20px]">
                                {validationError && <p className="text-xs text-red-500 font-semibold">{validationError}</p>}
                                {available && !validationError && <p className="text-xs text-emerald-500 font-semibold">✓ Username is available!</p>}
                            </div>
                        </div>

                        <div className="flex gap-2 text-[11px] text-zinc-300 font-medium">
                            {["3-20 chars", "a-z, 0-9, _", "Must be unique"].map((rule) => (
                                <span key={rule} className="px-2.5 py-1 bg-zinc-100/60 rounded-lg">{rule}</span>
                            ))}
                        </div>

                        <button type="submit" disabled={!available || saving} className="w-full flex items-center justify-center gap-2.5 px-4 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600 text-white rounded-2xl font-[family-name:var(--font-inter)] text-sm font-bold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-blue-700/25 hover:shadow-2xl active:scale-[0.98]">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Continue to Workspace</span><ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
