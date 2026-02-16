"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"

// This page resolves a custom slug (e.g. /video/my-video) to the actual summary page.
// It checks Supabase for a matching slug and redirects to /video/summary/[id].

export default function VideoCustomSlugPage() {
    const params = useParams()
    const slug = params.slug as string
    const [error, setError] = useState("")

    useEffect(() => {
        async function resolve() {
            try {
                const res = await fetch(`/api/yt-page/${slug}`)
                if (!res.ok) {
                    setError("Page not found")
                    return
                }
                const data = await res.json()
                window.location.href = `/video/summary/${data.id}`
            } catch {
                setError("Page not found")
            }
        }
        resolve()
    }, [slug])

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-2">Page not found</p>
                    <p className="text-zinc-400 text-sm mb-4">No summary exists at /video/{slug}</p>
                    <a href="/workspace" className="text-blue-500 hover:underline text-sm">← Back to Workspace</a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">Loading /video/{slug}...</p>
            </div>
        </div>
    )
}
