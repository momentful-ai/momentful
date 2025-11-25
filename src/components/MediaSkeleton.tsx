import type React from "react"
import { mergeName as cn } from "../lib/utils"
import { useTheme } from "../hooks/useTheme"

interface MediaSkeletonProps {
    /**
     * Width in pixels
     */
    width?: number
    /**
     * Height in pixels
     */
    height?: number
    /**
     * Primary color for the skeleton (default: depends on theme)
     */
    primaryColor?: string
    /**
     * Type of media being loaded
     */
    type?: "image" | "video" | "text"
    /**
     * Additional CSS classes
     */
    className?: string
    /**
     * Corner radius variant
     */
    rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full"
    /**
     * Inline styles
     */
    style?: React.CSSProperties
}

export function MediaSkeleton({
    width,
    height,
    type = "image",
    className,
    rounded = "lg",
    style,
}: MediaSkeletonProps) {
    const { theme } = useTheme()
    const bgColor = theme === 'dark' ? '#454545' : '#dcdcdc'

    const roundedClasses = {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
    }

    const aspectRatio = width && height ? `${width}/${height}` : undefined

    const sizeStyles: React.CSSProperties = {
        ...(aspectRatio && { aspectRatio }),
        width: "100%",
        ...(width && { maxWidth: `${width}px` }),
        ...(height && !aspectRatio && { height: `${height}px` }),
        backgroundColor: bgColor,
        ...style,
    }

    return (
        <div className={cn("relative overflow-hidden", roundedClasses[rounded], className)} style={sizeStyles}>
            {/* Base gradient layer with primary color */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-current via-current/50 to-current"
                style={{ color: bgColor }}
            />

            {/* AI shimmer effect */}
            <div
                className="absolute ai-shimmer"
                style={{
                    width: "300%",
                    height: "300%",
                    top: "-100%",
                    left: "-100%",
                }}
            />

            {/* Video play icon indicator */}
            {type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[20px] border-l-foreground/30 border-y-[12px] border-y-transparent ml-1" />
                    </div>
                </div>
            )}
        </div>
    )
}
