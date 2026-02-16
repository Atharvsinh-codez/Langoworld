import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { renameSummary } from "@/lib/summary-store"

export async function POST(request: NextRequest) {
    try {
        const { id, slug } = await request.json()

        if (!id || !slug) {
            return NextResponse.json({ error: "id and slug are required" }, { status: 400 })
        }

        // Clean slug
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
        if (!cleanSlug || cleanSlug.length < 2) {
            return NextResponse.json({ error: "Slug too short (min 2 chars)" }, { status: 400 })
        }
        if (cleanSlug.length > 60) {
            return NextResponse.json({ error: "Slug too long (max 60 chars)" }, { status: 400 })
        }

        // Check Supabase first — verify the summary exists
        const supabase = await createClient()

        const { data: existing } = await supabase
            .from("summaries")
            .select("id, custom_slug")
            .eq("id", id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: "Summary not found" }, { status: 404 })
        }

        // Check uniqueness — no other summary should have this slug
        const { data: conflict } = await supabase
            .from("summaries")
            .select("id")
            .eq("custom_slug", cleanSlug)
            .neq("id", id)
            .single()

        if (conflict) {
            return NextResponse.json({ error: "This URL is already taken" }, { status: 400 })
        }

        // Update in Supabase
        const { error: updateError } = await supabase
            .from("summaries")
            .update({ custom_slug: cleanSlug })
            .eq("id", id)

        if (updateError) {
            console.error("[Rename] Supabase update error:", updateError)
            return NextResponse.json({ error: "Failed to save custom URL" }, { status: 500 })
        }

        // Also update in-memory store (best-effort)
        try { renameSummary(id, cleanSlug) } catch { }

        return NextResponse.json({ success: true, slug: cleanSlug })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Rename failed" }, { status: 500 })
    }
}
