'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Gauge, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface MP3PlayerProps {
  audioSrc: string
  title: string
  initialVolume?: number
  initialSpeed?: number
}

export default function MP3Player({
  audioSrc,
  title,
  initialVolume = 1,
  initialSpeed = 1,
}: MP3PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(initialVolume)
  const [speed, setSpeed] = useState(initialSpeed)
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
    }
    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [handleTimeUpdate, handleLoadedMetadata])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className='w-full max-w-3xl space-y-4 rounded-lg border bg-background p-4'>
      <audio ref={audioRef} src={audioSrc} />

      <h2 className='text-center text-lg font-semibold'>{title}</h2>

      <div className='flex items-center space-x-2'>
        <span className='text-sm'>{formatTime(currentTime)}</span>
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSeek}
          className='flex-grow'
        />
        <span className='text-sm'>{formatTime(duration)}</span>
      </div>

      <div className='flex items-center justify-between gap-2'>
        <div className='flex flex-1 items-center space-x-2'>
          {volume > 0 ? (
            <Volume2 className='h-4 w-4 shrink-0' />
          ) : (
            <VolumeX className='h-4 w-4 shrink-0' />
          )}
          <Slider
            value={[volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className='flex-1 max-w-24'
          />
        </div>

        <Button
          onClick={togglePlay}
          variant='outline'
          size='icon'
          className='shrink-0'
        >
          {isPlaying ? (
            <Pause className='h-4 w-4' />
          ) : (
            <Play className='h-4 w-4' />
          )}
        </Button>

        <div className='flex flex-1 items-center space-x-2 justify-end'>
          <Gauge className='h-4 w-4 shrink-0' />
          <Slider
            value={[speed]}
            min={0.5}
            max={2}
            step={0.1}
            onValueChange={handleSpeedChange}
            className='flex-1 max-w-24'
          />
          <span className='text-sm'>{speed.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  )
}
