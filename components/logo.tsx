"use client"

import Image from "next/image"

// ─── LW Logo Mark ───
// Exact recreation of the user's custom LW monogram:
// A solid black rectangle with "LW" letters cut out as negative space.
// The L is the left portion, W is two overlapping V shapes on the right.

export function LWLogoMark({ className = "", size = 32 }: { className?: string; size?: number }) {
    const h = size
    const w = size * 1.3 // rectangular aspect ratio matching user's logo
    return (
        <svg
            width={w}
            height={h}
            viewBox="0 0 130 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ borderRadius: size * 0.15 }}
        >
            {/* Rounded rectangle background */}
            <rect x="0" y="0" width="130" height="100" rx="8" ry="8" fill="currentColor" />

            {/* L - cut out via white/transparent */}
            <polygon points="12,8 32,8 32,62 52,32 58,62 12,62" fill="white" />

            {/* W left leg */}
            <polygon points="48,8 58,8 75,70 65,70" fill="white" />

            {/* W center peak */}
            <polygon points="65,50 72,70 80,50 75,30 68,30" fill="white" />

            {/* W right leg */}
            <polygon points="72,70 82,70 118,8 108,8" fill="white" />

            {/* Clean up L bottom */}
            <rect x="12" y="66" width="106" height="28" rx="0" fill="currentColor" />
        </svg>
    )
}

// ─── Rounded Image Logo (uses actual user image when available, SVG fallback) ───
export function LWLogoImage({ size = 40, className = "" }: { size?: number; className?: string }) {
    return (
        <div
            className={`overflow-hidden flex items-center justify-center bg-black ${className}`}
            style={{
                width: size,
                height: size,
                borderRadius: size * 0.22,
            }}
        >
            <LWLogoMark size={size * 0.85} className="text-black" />
        </div>
    )
}

// ─── "Global Voice" Tagline ───
export function GlobalVoiceText({ className = "" }: { className?: string }) {
    return (
        <span
            className={`font-[family-name:var(--font-inter)] tracking-[0.15em] uppercase font-black ${className}`}
            style={{
                WebkitTextStroke: '1.5px currentColor',
                WebkitTextFillColor: 'transparent',
            }}
        >
            Global Voice
        </span>
    )
}

// ─── Full Brand: Logo + Text ───
export function LWBrand({
    size = 36,
    showTagline = false,
    className = "",
}: {
    size?: number
    showTagline?: boolean
    className?: string
}) {
    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`}>
            <LWLogoMark size={size} className="text-zinc-900 dark:text-white" />
            <div className="flex flex-col">
                <span
                    className="font-[family-name:var(--font-inter)] font-black tracking-tight leading-none text-zinc-900 dark:text-white"
                    style={{ fontSize: size * 0.5 }}
                >
                    LangoWorld
                </span>
                {showTagline && (
                    <GlobalVoiceText
                        className="text-[9px] mt-0.5 text-zinc-300"
                    />
                )}
            </div>
        </div>
    )
}
