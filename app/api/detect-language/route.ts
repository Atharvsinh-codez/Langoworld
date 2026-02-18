import { NextRequest, NextResponse } from "next/server"

const PYTHON_SERVER = process.env.TUBEINSIGHT_URL || "http://localhost:5123"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { text } = body

        if (!text || typeof text !== "string" || text.trim().length < 2) {
            return NextResponse.json({ code: "en", confidence: 0 })
        }

        const response = await fetch(`${PYTHON_SERVER}/api/detect-language`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text.trim() }),
            signal: AbortSignal.timeout(5000),
        })

        if (!response.ok) {
            console.warn("[detect-language] Python server error:", response.status)
            return NextResponse.json({ code: "en", confidence: 0 })
        }

        const data = await response.json()
        return NextResponse.json({
            code: data.code || "en",
            confidence: data.confidence ?? 0,
        })
    } catch (error) {
        console.warn("[detect-language] Fallback to English:", error)
        return NextResponse.json({ code: "en", confidence: 0 })
    }
}
