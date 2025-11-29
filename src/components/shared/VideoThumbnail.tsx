import { useState } from 'react';
import { mergeName as cn } from "../../lib/utils"
import { Play } from "lucide-react"
import { useSignedUrls } from '../../hooks/useSignedUrls';

const SELECTED_COLORS = {
  primary: "#6d5de7", // Film strip background
  lighter: "#8b7fec", // Film strip holes
  ring: "#6d5de7", // Selection ring around image
  badge: "#6d5de7", // Checkmark badge background
}

interface VideoThumbnailProps {
  // Direct URL (for edited images, external URLs)
  src?: string;
  // Storage path (for media assets that need signed URLs)
  storagePath?: string;
  alt?: string
  width?: number
  height?: number
  className?: string
  selected?: boolean
  // Optional: bucket override (defaults to 'user-uploads')
  bucket?: string;
}

export function VideoThumbnail({
  src,
  storagePath,
  alt = "Video thumbnail",
  width = 320,
  height = 180,
  className,
  selected = false,
  bucket = 'user-uploads',
}: VideoThumbnailProps) {
  const { useSignedUrl } = useSignedUrls();
  const [imageLoadError, setImageLoadError] = useState(false);

  // Always call the hook at the top level to follow rules of hooks
  const signedUrlQuery = useSignedUrl(bucket, storagePath || '');

  const filmHoleCount = Math.max(3, Math.floor(height / 32))

  // Determine the image source
  let imageSrc = src || "/placeholder.svg";

  // Handle pre-computed URLs first (edited images, external URLs)
  if (src) {
    // Use the provided src
  } else if (storagePath) {
    // Handle storage paths that need signed URLs
    if (signedUrlQuery.isLoading) {
      return (
        <div className={cn("relative inline-flex items-stretch group", className)} style={{ width, height }}>
          {/* Left film strip */}
          <div
            className="w-5 flex flex-col justify-evenly items-center py-2 rounded-l-sm shrink-0"
            style={{ backgroundColor: selected ? SELECTED_COLORS.primary : "#18181b" }}
          >
            {Array.from({ length: filmHoleCount }).map((_, i) => (
              <div
                key={`left-${i}`}
                className="w-2.5 h-3 rounded-sm"
                style={{ backgroundColor: selected ? SELECTED_COLORS.lighter : "#3f3f46" }}
              />
            ))}
          </div>

          {/* Loading state */}
          <div className="relative flex-1 overflow-hidden bg-zinc-800 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>

          {/* Right film strip */}
          <div
            className="w-5 flex flex-col justify-evenly items-center py-2 rounded-r-sm shrink-0"
            style={{ backgroundColor: selected ? SELECTED_COLORS.primary : "#18181b" }}
          >
            {Array.from({ length: filmHoleCount }).map((_, i) => (
              <div
                key={`right-${i}`}
                className="w-2.5 h-3 rounded-sm"
                style={{ backgroundColor: selected ? SELECTED_COLORS.lighter : "#3f3f46" }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (signedUrlQuery.data && !imageLoadError) {
      imageSrc = signedUrlQuery.data;
    }
  }

  return (
    <div className={cn("relative inline-flex items-stretch group", className)} style={{ width, height }}>
      {/* Left film strip */}
      <div
        className="w-5 flex flex-col justify-evenly items-center py-2 rounded-l-sm shrink-0 transition-colors"
        style={{ backgroundColor: selected ? SELECTED_COLORS.primary : "#18181b" }}
      >
        {Array.from({ length: filmHoleCount }).map((_, i) => (
          <div
            key={`left-${i}`}
            className="w-2.5 h-3 rounded-sm"
            style={{ backgroundColor: selected ? SELECTED_COLORS.lighter : "#3f3f46" }}
          />
        ))}
      </div>

      {/* Main thumbnail area */}
      <div
        className="relative flex-1 overflow-hidden bg-zinc-800"
        style={selected ? { boxShadow: `inset 0 0 0 2px ${SELECTED_COLORS.ring}` } : undefined}
      >
        <img
          src={imageSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:blur-sm group-hover:scale-105"
          onError={() => setImageLoadError(true)}
          onLoad={() => setImageLoadError(false)}
        />
        <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/40" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all duration-300 group-hover:bg-black/60 group-hover:scale-110">
            <Play className="w-4 h-4 text-white/70 fill-white/70 ml-0.5" />
          </div>
        </div>

        {/* Subtle film grain texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {selected && (
          <div
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: SELECTED_COLORS.badge }}
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Right film strip */}
      <div
        className="w-5 flex flex-col justify-evenly items-center py-2 rounded-r-sm shrink-0 transition-colors"
        style={{ backgroundColor: selected ? SELECTED_COLORS.primary : "#18181b" }}
      >
        {Array.from({ length: filmHoleCount }).map((_, i) => (
          <div
            key={`right-${i}`}
            className="w-2.5 h-3 rounded-sm"
            style={{ backgroundColor: selected ? SELECTED_COLORS.lighter : "#3f3f46" }}
          />
        ))}
      </div>
    </div>
  )
}