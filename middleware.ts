import { updateSession } from "@/lib/supabase-middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         * - API routes (they handle their own auth)
         */
        "/((?!_next/static|_next/image|favicon.ico|audio|pg-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
