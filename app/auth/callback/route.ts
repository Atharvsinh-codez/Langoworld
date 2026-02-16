import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/workspace"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check if user has a profile (username)
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", user.id)
                    .single()

                // If no profile, redirect to username selection
                if (!profile) {
                    const forwardedHost = request.headers.get("x-forwarded-host")
                    const isLocalEnv = process.env.NODE_ENV === "development"
                    if (isLocalEnv) {
                        return NextResponse.redirect(`${origin}/username`)
                    } else if (forwardedHost) {
                        return NextResponse.redirect(`https://${forwardedHost}/username`)
                    } else {
                        return NextResponse.redirect(`${origin}/username`)
                    }
                }
            }

            const forwardedHost = request.headers.get("x-forwarded-host")
            const isLocalEnv = process.env.NODE_ENV === "development"
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // Return the user to an error page if code exchange fails
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
