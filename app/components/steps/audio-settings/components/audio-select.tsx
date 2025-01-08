import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { usePodcastInfoStore } from '@/app/stores/use-podcast-info-store'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { logger } from '@/lib/logger'
import { Gauge, Pause, Play, Radio, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Label } from '@/components/ui/label'

interface AudioSelectProps {
  id: number
}

const childVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

export const AudioSelect: React.FC<AudioSelectProps> = ({ id }) => {
  const { t } = useClientTranslation()

  const { remoteProviderWithSpeakers, speakers, setSpeakers, contentLang } =
    usePodcastInfoStore((state) => ({
      remoteProviderWithSpeakers: state.remoteProviderWithSpeakers,
      speakers: state.speakers,
      setSpeakers: state.setSpeakers,
      contentLang: state.lang,
    }))

  const remoteProviders = useMemo(
    () => {
      const providers = Object.keys(remoteProviderWithSpeakers)
      const doubaoIndex = providers.indexOf('doubao')
      if (doubaoIndex > -1) {
        providers.splice(doubaoIndex, 1)
        providers.unshift('doubao')
      }
      return providers
    },
    [remoteProviderWithSpeakers]
  )

  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioSrc, setAudioSrc] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const currentSpeakerRef = useRef<string | null>(null)

  useEffect(() => {
    if (
      !(
        speakers.length > 0 &&
        speakers[id - 1]?.speaker &&
        speakers[id - 1]?.provider &&
        speakers[id - 1]?.provider !== 'custom' &&
        Object.keys(remoteProviderWithSpeakers).length > 0
      )
    ) {
      return
    }
    if (!(speakers[id - 1]?.provider in remoteProviderWithSpeakers)) {
      return
    }

    if (currentSpeakerRef.current === speakers[id - 1].speaker) {
      return
    }

    currentSpeakerRef.current = speakers[id - 1].speaker
    const speaker = speakers[id - 1].speaker
    const provider = speakers[id - 1].provider
    const speakerIdx = remoteProviderWithSpeakers[provider].findIndex(
      (s) => s.name === speaker
    )
    const url =
      remoteProviderWithSpeakers[provider][speakerIdx].sample[contentLang]
    setIsPlaying(false)
    setIsReady(false)
    setAudioSrc('')
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        setAudioSrc(URL.createObjectURL(blob))
        setIsReady(true)
      })
      .catch((err) => {
        logger.error(err)
        toast.error(t('home:step.audio-settings.audio_not_ready'))
      })
  }, [id, remoteProviderWithSpeakers, speakers, contentLang, setIsReady, t])

  const handlePlay = () => {
    if (!audioSrc || !isReady) {
      toast.error(t('home:step.audio-settings.audio_not_ready'))
      return
    }
    const audio = audioRef.current

    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      setIsPlaying(false)
    }

    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <motion.div
      variants={childVariants}
      className='rounded-xl border bg-card p-6 space-y-6 w-full transition-all duration-300 hover:shadow-md hover:border-primary/20'
    >
      <audio ref={audioRef} className='hidden' src={audioSrc}>
        <track kind='captions' />
      </audio>

      {/* Header */}
      <motion.div variants={childVariants} className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <User className='h-4 w-4 text-primary' />
          <h3 className='font-medium'>
            {t(`home:step.content-adjustment.role`)} {String.fromCharCode(64 + id)}
          </h3>
        </div>
        {speakers[id - 1]?.provider !== 'custom' && (
          <Button
            variant='ghost'
            size="sm"
            onClick={handlePlay}
            disabled={!isReady}
            className='transition-all duration-300 hover:bg-primary/10 active:scale-95'
          >
            {isPlaying ? (
              <Pause className='h-4 w-4' />
            ) : (
              <Play className='h-4 w-4' />
            )}
          </Button>
        )}
      </motion.div>

      <motion.div variants={childVariants} className='space-y-6'>
        {/* Provider and Speaker Selection */}
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Provider Selection */}
          <div className='space-y-2.5'>
            <Label className='text-sm flex items-center gap-2'>
              <Radio className='h-3.5 w-3.5 text-muted-foreground' />
              {t('home:step.audio-settings.provider')}
            </Label>
            <Select
              value={speakers[id - 1]?.provider}
              onValueChange={(value) => {
                setSpeakers((speakers) =>
                  speakers.map((s) =>
                    s.id === id
                      ? {
                          ...s,
                          provider: value,
                          speaker: remoteProviderWithSpeakers[value][0].name,
                        }
                      : s
                  )
                )
              }}
            >
              <SelectTrigger className='w-full transition-all duration-300 hover:ring-2 hover:ring-primary/50'>
                <SelectValue placeholder={t('home:step.audio-settings.select_provider')} />
              </SelectTrigger>
              <SelectContent>
                {remoteProviders.map((provider) => (
                  <SelectItem
                    key={provider}
                    value={provider}
                    className='transition-colors duration-200 hover:bg-primary/10'
                  >
                    {t(provider)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speaker Selection */}
          <div className='space-y-2.5'>
            <Label className='text-sm flex items-center gap-2'>
              <User className='h-3.5 w-3.5 text-muted-foreground' />
              {t('home:step.audio-settings.speaker')}
            </Label>
            <Select
              value={
                speakers[id - 1]?.speaker ||
                remoteProviderWithSpeakers[speakers[id - 1]?.provider]?.[0]?.name
              }
              onValueChange={(value) => {
                setSpeakers((speakers) =>
                  speakers.map((s) => (s.id === id ? { ...s, speaker: value } : s))
                )
              }}
            >
              <SelectTrigger className='w-full transition-all duration-300 hover:ring-2 hover:ring-primary/50'>
                <SelectValue placeholder={t('home:step.audio-settings.select_speaker')} />
              </SelectTrigger>
              <SelectContent>
                {remoteProviderWithSpeakers[speakers[id - 1]?.provider]?.map(
                  (speaker) => (
                    <SelectItem
                      key={speaker.name}
                      value={speaker.name}
                      className='transition-colors duration-200 hover:bg-primary/10'
                    >
                      {`${speaker.displayName}${speaker.gender ? ' (' + t(speaker.gender.toLowerCase()) + ')' : ''}`}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Speed Selection */}
        <div className='space-y-2.5'>
          <Label className='text-sm flex items-center gap-2'>
            <Gauge className='h-3.5 w-3.5 text-muted-foreground' />
            {t('home:step.audio-settings.speed')}
          </Label>
          <Select
            value={speakers[id - 1]?.speed.toString()}
            onValueChange={(value) => {
              setSpeakers((speakers) =>
                speakers.map((s) =>
                  s.id === id ? { ...s, speed: parseFloat(value) } : s
                )
              )
            }}
          >
            <SelectTrigger className='w-40 transition-all duration-300 hover:ring-2 hover:ring-primary/50'>
              <SelectValue placeholder={t('home:step.audio-settings.select_speed')} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 7 }, (_, i) => 0.25 * (i + 2)).map(
                (speed) => (
                  <SelectItem
                    key={speed}
                    value={speed.toString()}
                    className='transition-colors duration-200 hover:bg-primary/10'
                  >
                    {`${speed.toFixed(2)}x`}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </motion.div>
  )
}
