import type React from "react"

import { useState, useRef, useEffect } from "react"

import { Button } from "./ui/button"

import { Slider } from "./ui/slider"

import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, AlertCircle } from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

interface VideoPlayerProps {

  videoUrl: string

}

export function VideoPlayer({ videoUrl }: VideoPlayerProps) {

  const [isPlaying, setIsPlaying] = useState(false)

  const [currentTime, setCurrentTime] = useState(0)

  const [duration, setDuration] = useState(0)

  const [volume, setVolume] = useState(1)

  const [isMuted, setIsMuted] = useState(false)

  const [isFullscreen, setIsFullscreen] = useState(false)

  const [showControls, setShowControls] = useState(true)

  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  const [isBuffering, setIsBuffering] = useState(false)

  const [hasAudio, setHasAudio] = useState(false)

  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  const [videoError, setVideoError] = useState<string | null>(null)

  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9)

  const videoRef = useRef<HTMLVideoElement>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {

    if (videoUrl) {

      setVideoError(null)

      setIsBuffering(true)

      setIsPlaying(false)

      setCurrentTime(0)

      setDuration(0)

    }

  }, [videoUrl])

  useEffect(() => {

    const video = videoRef.current

    if (!video) return

    const handleLoadedMetadata = () => {

      setDuration(video.duration)

      setIsBuffering(false)

      setVideoError(null)

      const videoWidth = video.videoWidth

      const videoHeight = video.videoHeight

      if (videoWidth && videoHeight) {

        const calculatedRatio = videoWidth / videoHeight

        setAspectRatio(calculatedRatio)

        console.log("[v0] Video dimensions:", videoWidth, "x", videoHeight, "Aspect ratio:", calculatedRatio)

      }

      // Type assertion for browser-specific audio track properties
      const videoWithAudioTracks = video as HTMLVideoElement & {
        audioTracks?: unknown[];
        mozAudioTracks?: unknown[];
        webkitAudioTracks?: unknown[];
      }
      const audioTracks = videoWithAudioTracks.audioTracks || videoWithAudioTracks.mozAudioTracks || videoWithAudioTracks.webkitAudioTracks

      const hasAudioTrack = audioTracks ? audioTracks.length > 0 : true

      setHasAudio(hasAudioTrack)

    }

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)

    const handleEnded = () => setIsPlaying(false)

    const handleWaiting = () => setIsBuffering(true)

    const handleCanPlay = () => setIsBuffering(false)

    const handleError = () => {

      setIsBuffering(false)

      setIsPlaying(false)

      const error = video.error

      if (error) {

        switch (error.code) {

          case error.MEDIA_ERR_ABORTED:

            setVideoError("Video loading was aborted")

            break

          case error.MEDIA_ERR_NETWORK:

            setVideoError("Network error occurred while loading video")

            break

          case error.MEDIA_ERR_DECODE:

            setVideoError("Video format not supported or corrupted")

            break

          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:

            setVideoError("Video URL not accessible or format not supported")

            break

          default:

            setVideoError("An unknown error occurred")

        }

      }

    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)

    video.addEventListener("timeupdate", handleTimeUpdate)

    video.addEventListener("ended", handleEnded)

    video.addEventListener("waiting", handleWaiting)

    video.addEventListener("canplay", handleCanPlay)

    video.addEventListener("error", handleError)

    return () => {

      video.removeEventListener("loadedmetadata", handleLoadedMetadata)

      video.removeEventListener("timeupdate", handleTimeUpdate)

      video.removeEventListener("ended", handleEnded)

      video.removeEventListener("waiting", handleWaiting)

      video.removeEventListener("canplay", handleCanPlay)

      video.removeEventListener("error", handleError)

    }

  }, [videoUrl])

  const togglePlay = () => {

    if (!videoRef.current) return

    if (isPlaying) {

      videoRef.current.pause()

    } else {

      videoRef.current.play()

    }

    setIsPlaying(!isPlaying)

  }

  const handleSeek = (value: number[]) => {

    if (!videoRef.current) return

    const newTime = value[0]

    videoRef.current.currentTime = newTime

    setCurrentTime(newTime)

  }

  const handleVolumeChange = (value: number[]) => {

    if (!videoRef.current) return

    const newVolume = value[0]

    videoRef.current.volume = newVolume

    setVolume(newVolume)

    setIsMuted(newVolume === 0)

  }

  const toggleMute = () => {

    if (!videoRef.current) return

    const newMuted = !isMuted

    videoRef.current.muted = newMuted

    setIsMuted(newMuted)

    if (newMuted) {

      videoRef.current.volume = 0

    } else {

      videoRef.current.volume = volume

    }

  }

  const toggleFullscreen = () => {

    if (!containerRef.current) return

    if (!document.fullscreenElement) {

      containerRef.current.requestFullscreen()

      setIsFullscreen(true)

    } else {

      document.exitFullscreen()

      setIsFullscreen(false)

    }

  }

  const changePlaybackSpeed = (speed: number) => {

    if (!videoRef.current) return

    videoRef.current.playbackRate = speed

    setPlaybackSpeed(speed)

  }

  const formatTime = (time: number) => {

    const minutes = Math.floor(time / 60)

    const seconds = Math.floor(time % 60)

    return `${minutes}:${seconds.toString().padStart(2, "0")}`

  }

  const handleMouseMove = () => {

    setShowControls(true)

    if (controlsTimeoutRef.current) {

      clearTimeout(controlsTimeoutRef.current)

    }

    controlsTimeoutRef.current = setTimeout(() => {

      if (isPlaying) setShowControls(false)

    }, 3000)

  }

  const handleVideoClick = (e: React.MouseEvent) => {

    // Only toggle if clicking on video itself, not on controls

    if (e.target === videoRef.current) {

      togglePlay()

    }

  }

  if (!videoUrl) {

    return null

  }

  return (

    <div

      ref={containerRef}

      className="group relative overflow-hidden rounded-2xl bg-black shadow-2xl mx-auto"

      style={{ maxWidth: "100%", aspectRatio: aspectRatio.toString() }}

      onMouseMove={handleMouseMove}

      onMouseLeave={() => isPlaying && setShowControls(false)}

      onClick={handleVideoClick}

    >

      {/* Video Element */}

      <video ref={videoRef} src={videoUrl || undefined} className="w-full h-full object-contain" preload="metadata" />

      {/* Loading Spinner */}

      {isBuffering && !videoError && (

        <div className="absolute inset-0 flex items-center justify-center bg-black/50">

          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />

        </div>

      )}

      {videoError && (

        <div className="absolute inset-0 flex items-center justify-center bg-black/80">

          <div className="text-center max-w-md px-6">

            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">

              <AlertCircle className="h-10 w-10 text-destructive" />

            </div>

            <h3 className="text-xl font-semibold text-white mb-2">Unable to Play Video</h3>

            <p className="text-white/70 mb-6">{videoError}</p>

            <Button

              onClick={() => {

                setVideoError(null)

              }}

              variant="secondary"

              className="font-semibold"

            >

              Try Another Video

            </Button>

          </div>

        </div>

      )}

      {/* Play Overlay */}

      {!isPlaying && !isBuffering && videoUrl && !videoError && (

        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all">

          <button

            onClick={togglePlay}

            className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 shadow-2xl transition-all hover:scale-110 hover:bg-white/30 opacity-50 shadow-none"

          >

            <Play className="ml-1 h-12 w-12 text-white" />

          </button>

        </div>

      )}

      {/* Custom Controls */}

      {videoUrl && !videoError && (

        <div

          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent px-4 pt-3 pb-2 transition-all duration-300 ${

            showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"

          }`}

          onClick={(e) => e.stopPropagation()}

        >

          {/* Control Buttons */}

          <div className="flex items-center justify-between mb-2">

            <div className="flex items-center gap-2">

              <Button

                variant="ghost"

                size="icon"

                onClick={togglePlay}

                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"

              >

                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}

              </Button>

              <span className="text-xs text-white/90 font-medium min-w-[90px]">

                {formatTime(currentTime)} / {formatTime(duration)}

              </span>

            </div>

            <div className="flex items-center gap-1">

              {/* Volume Control - only show if video has audio */}

              {hasAudio && (

                <div

                  className="flex items-center gap-2"

                  onMouseEnter={() => setShowVolumeSlider(true)}

                  onMouseLeave={() => setShowVolumeSlider(false)}

                >

                  <div

                    className={`overflow-hidden transition-all duration-300 ${

                      showVolumeSlider ? "w-20 opacity-100" : "w-0 opacity-0"

                    }`}

                  >

                    <Slider

                      value={[isMuted ? 0 : volume]}

                      max={1}

                      step={0.01}

                      onValueChange={handleVolumeChange}

                      className="cursor-pointer"

                    />

                  </div>

                  <Button

                    variant="ghost"

                    size="icon"

                    onClick={toggleMute}

                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"

                  >

                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}

                  </Button>

                </div>

              )}

              {/* Playback Speed */}

              <DropdownMenu>

                <DropdownMenuTrigger asChild>

                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white">

                    <Settings className="h-4 w-4" />

                  </Button>

                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-32">

                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Speed</div>

                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (

                    <DropdownMenuItem

                      key={speed}

                      onClick={() => changePlaybackSpeed(speed)}

                      className={playbackSpeed === speed ? "bg-accent" : ""}

                    >

                      {speed}x

                    </DropdownMenuItem>

                  ))}

                </DropdownMenuContent>

              </DropdownMenu>

              {/* Fullscreen */}

              <Button

                variant="ghost"

                size="icon"

                onClick={toggleFullscreen}

                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"

              >

                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}

              </Button>

            </div>

          </div>

          {/* Progress Bar */}

          <div>

            <Slider

              value={[currentTime]}

              max={duration || 100}

              step={0.1}

              onValueChange={handleSeek}

              className="cursor-pointer [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-3"

            />

          </div>

        </div>

      )}

    </div>

  )

}
