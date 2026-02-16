import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const { username } = await request.json()

    if (!username || typeof username !== "string") {
        return NextResponse.json({ available: false, error: "Username is required" }, { status: 400 })
    }

    const cleaned = username.trim().toLowerCase()

    // Validate format: 3-20 chars, alphanumeric + underscores only
    if (!/^[a-z0-9_]{3,20}$/.test(cleaned)) {
        return NextResponse.json({
            available: false,
            error: "Username must be 3-20 characters, only lowercase letters, numbers, and underscores"
        })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleaned)
        .maybeSingle()

    if (error) {
        return NextResponse.json({ available: false, error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ available: !data })
}
