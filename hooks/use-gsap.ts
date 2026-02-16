import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger)
}

export function useGsap(
    effect: (ctx: gsap.Context) => void | (() => void),
    scope?: React.RefObject<Element | null>,
    deps: React.DependencyList = []
) {
    const context = useRef<gsap.Context | null>(null)

    useLayoutEffect(() => {
        context.current?.revert()

        const ctx = gsap.context(effect, scope)
        context.current = ctx

        return () => {
            ctx.revert()
        }
    }, deps)

    return context
}
