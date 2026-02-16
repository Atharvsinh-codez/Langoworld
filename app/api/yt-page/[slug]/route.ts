import { NextRequest, NextResponse } from "next/server"
import { getSummaryBySlug } from "@/lib/summary-store"
import { createClient } from "@/lib/supabase-server"

// GET /api/yt-page/[slug] — resolve a custom slug to summary data
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params

    // Try in-memory store first (fastest)
    const memData = getSummaryBySlug(slug)
    if (memData) {
        return NextResponse.json(memData)
    }

    // Fallback: check Supabase custom_slug column
    try {
        const supabase = await createClient()
        const { data } = await supabase
            .from("summaries")
            .select("*")
            .eq("custom_slug", slug)
            .single()

        if (data) {
            return NextResponse.json({
                id: data.id,
                videoTitle: data.video_title,
                channel: data.channel,
                summary: data.summary,
                keyPoints: data.key_points,
                explanation: data.explanation,
                ttsSummary: data.tts_summary,
                transcript: data.transcript,
                chapters: data.chapters,
                source: data.source,
            })
        }
    } catch (e) {
        // Supabase error, fall through to 404
    }

    return NextResponse.json({ error: "Page not found" }, { status: 404 })
}
