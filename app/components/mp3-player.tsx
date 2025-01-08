'use client'

// import { useTranslation } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { Gauge, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StarfieldBackground from './starfield-background'
import { useTranslation } from 'react-i18next'

interface MP3PlayerProps {
  audioSrc: string
  title: string
  initialVolume?: number
  initialSpeed?: number
  loop?: boolean
}

type ControlType = 'volume' | 'speed' | null;

export default function MP3Player({
  audioSrc,
  title,
  initialVolume = 1,
  initialSpeed = 1,
  loop = true,
}: MP3PlayerProps) {
  const { t } = useTranslation('home')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(initialVolume)
  const [speed, setSpeed] = useState(initialSpeed)
  const [activeControl, setActiveControl] = useState<ControlType>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      audioRef.current.volume = volume
      audioRef.current.playbackRate = speed
    }
  }, [volume, speed])

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0]
    setSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.loop = loop
    }
    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [handleTimeUpdate, handleLoadedMetadata, loop])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[680px] mx-auto"
    >
      <audio ref={audioRef} src={audioSrc} />

      {/* Main container */}
      <div className="relative bg-gradient-to-br from-background/98 via-background/99 to-background/98 rounded-3xl border shadow-lg overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <StarfieldBackground />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.02] opacity-100" />
        </div>

        {/* Content wrapper */}
        <div className="relative">
          {/* Title section */}
          <div className="pt-8 px-8 pb-4">
            <h2 className="text-lg font-semibold text-foreground/90 line-clamp-1 text-center">
              {title}
            </h2>
          </div>

          {/* Visualization */}
          <div className="flex justify-center items-end h-24 mb-6 px-8 space-x-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "w-2 rounded-full",
                  isPlaying ? "bg-primary/60" : "bg-primary/30 dark:bg-primary/40"
                )}
                initial={{ height: 12 }}
                animate={{
                  height: isPlaying ? Math.random() * 48 + 12 : 12,
                  opacity: isPlaying ? 0.8 : 0.6
                }}
                transition={{
                  duration: 0.4,
                  repeat: isPlaying ? Infinity : 0,
                  repeatType: "reverse"
                }}
              />
            ))}
          </div>

          {/* Progress section */}
          <div className="px-8 mb-6">
            <div className="relative h-2 bg-purple-200/50 dark:bg-purple-900/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className={cn(
                  "absolute left-0 top-0 h-full bg-gradient-to-r from-purple-600/90 via-violet-600/90 to-purple-600/90 bg-[length:200%_100%]",
                  !isPlaying && "opacity-90"
                )}
                style={{
                  width: `${(currentTime / duration) * 100}%`,
                  animation: isPlaying ? 'gradient 3s linear infinite' : 'none',
                  boxShadow: '0 0 8px rgba(147, 51, 234, 0.3)',
                }}
              />
              <div
                className={cn(
                  "absolute left-0 top-0 h-full",
                  "bg-gradient-to-r from-transparent",
                  "via-purple-400/[0.15] dark:via-purple-200/[0.08]",
                  "to-transparent animate-shine",
                  "pointer-events-none"
                )}
                style={{
                  width: `${(currentTime / duration) * 100}%`,
                }}
              />
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleSeek}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-foreground/70 font-medium tracking-tight">
                {formatTime(currentTime)}
              </span>
              <span className="text-sm text-foreground/70 font-medium tracking-tight">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="px-8 pb-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-12 w-12 rounded-full",
                  "hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400",
                  "transition-colors",
                  activeControl === 'volume' && "bg-purple-500/15 text-purple-600 dark:text-purple-400",
                  volume === 0 && "text-purple-600 dark:text-purple-400"
                )}
                onClick={() => setActiveControl(activeControl === 'volume' ? null : 'volume')}
              >
                <div className="flex items-center justify-center w-full">
                  {volume > 0 ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </div>
              </Button>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={togglePlay}
                  size="lg"
                  className={cn(
                    "h-16 w-16 rounded-full relative",
                    isPlaying
                      ? "bg-primary/90 dark:bg-primary text-primary-foreground hover:bg-primary/80 dark:hover:bg-primary/90"
                      : "bg-primary/80 dark:bg-primary/90 text-primary-foreground hover:bg-primary/70 dark:hover:bg-primary/80",
                    "shadow-lg hover:shadow-xl transition-all duration-300"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.div
                        key="pause"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Pause className="h-7 w-7" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Play className="h-7 w-7 ml-0.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-12 min-w-[3rem] px-3 rounded-full",
                  "hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400",
                  "transition-colors",
                  activeControl === 'speed' && "bg-purple-500/15 text-purple-600 dark:text-purple-400",
                  speed !== 1 && "text-purple-600 dark:text-purple-400"
                )}
                onClick={() => setActiveControl(activeControl === 'speed' ? null : 'speed')}
              >
                <div className="flex items-center justify-center gap-1">
                  <Gauge className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{speed.toFixed(1)}x</span>
                </div>
              </Button>
            </div>

            {/* Expandable controls */}
            <AnimatePresence>
              {activeControl && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 overflow-hidden px-1"
                >
                  {activeControl === 'volume' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground/70">{t('mp3_player.volume')}</span>
                        <span className="text-sm font-medium text-foreground/70">
                          {Math.round(volume * 100)}%
                        </span>
                      </div>
                      <div className="relative group pt-2 pb-3">
                        <Slider
                          value={[volume]}
                          max={1}
                          step={0.01}
                          onValueChange={handleVolumeChange}
                          className={cn(
                            "[&_.relative]:h-1.5",
                            "[&_[role=slider]]:h-4 [&_[role=slider]]:w-4",
                            "[&_[role=slider]]:transition-transform",
                            "[&_[role=slider]]:bg-purple-500",
                            "group-hover:[&_[role=slider]]:scale-110"
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {activeControl === 'speed' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground/70">{t('mp3_player.speed')}</span>
                        <span className="text-sm font-medium text-foreground/70">
                          {speed.toFixed(1)}x
                        </span>
                      </div>
                      <div className="relative group pt-2 pb-3">
                        <Slider
                          value={[speed]}
                          min={0.5}
                          max={2}
                          step={0.1}
                          onValueChange={handleSpeedChange}
                          className={cn(
                            "[&_.relative]:h-1.5",
                            "[&_[role=slider]]:h-4 [&_[role=slider]]:w-4",
                            "[&_[role=slider]]:transition-transform",
                            "[&_[role=slider]]:bg-purple-500",
                            "group-hover:[&_[role=slider]]:scale-110"
                          )}
                        />
                        <div className="flex justify-between mt-1.5 text-[10px] text-foreground/50 font-medium">
                          <span>{t('mp3_player.speed_values.half')}</span>
                          <span>{t('mp3_player.speed_values.normal')}</span>
                          <span>{t('mp3_player.speed_values.one_half')}</span>
                          <span>{t('mp3_player.speed_values.double')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes shine {
          from { transform: translateX(-200%); }
          to { transform: translateX(200%); }
        }

        .animate-shine {
          animation: shine 4s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }
      `}</style>
    </motion.div>
  )
}
