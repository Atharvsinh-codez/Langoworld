import { NextRequest, NextResponse } from "next/server"
import { getSummary } from "@/lib/summary-store"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!id) {
        return NextResponse.json({ error: "Summary ID is required" }, { status: 400 })
    }

    const summary = getSummary(id)

    if (!summary) {
        return NextResponse.json(
            { error: "Summary not found. It may have expired." },
            { status: 404 }
        )
    }

    return NextResponse.json(summary)
}
