"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface NeumorphismButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
}

export function NeumorphismButton({ className, children, ...props }: NeumorphismButtonProps) {
    return (
        <button
            className={cn(
                "relative group px-10 py-5 rounded-full transition-all duration-300 ease-out",
                "bg-gradient-to-br from-[#ff810a] to-[#e65c00]", // Orange Gradient
                // 3D Shadows
                "shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.2)]",
                "hover:shadow-[12px_12px_24px_rgba(0,0,0,0.5),-6px_-6px_16px_rgba(255,255,255,0.3)]",
                "hover:scale-105",
                // Active State (Pressed)
                "active:scale-95",
                "active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]",
                className
            )}
            {...props}
        >
            <span className="relative z-10 font-bold text-white tracking-wider text-xl font-cabinet-grotesk">
                {children}
            </span>

            {/* Shine/Gloss effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none" />
        </button>
    )
}
