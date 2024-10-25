import useAudioRecorder from '@/app/hooks/use-audio-recorder'
import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Stepper } from '@/app/hooks/use-stepper'
import {
  CustomModel,
  RemoteSpeakers,
  usePodcastInfoStore,
} from '@/app/stores/use-podcast-info-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { apiKy, dialogueKy } from '@/lib/api/api'
import { getAudioDuration } from '@/lib/audio'
import { formatFileSize } from '@/lib/file'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { Loader, Mic, Pause, Play, Volume2 } from 'lucide-react'
import { isString } from 'radash'
import {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'react-hot-toast'

const AudioSelect = ({ id }: { id: number }) => {
  const { t } = useClientTranslation()

  const { remoteProviderWithSpeakers, speakers, setSpeakers, contentLang } =
    usePodcastInfoStore((state) => ({
      remoteProviderWithSpeakers: state.remoteProviderWithSpeakers,
      speakers: state.speakers,
      setSpeakers: state.setSpeakers,
      contentLang: state.lang,
    }))

  const remoteProviders = useMemo(
    () => Object.keys(remoteProviderWithSpeakers),
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
    <div className='flex w-full flex-col items-center gap-1 md:flex-row md:gap-4'>
      <audio ref={audioRef} className='hidden' src={audioSrc}>
        <track kind='captions' />
      </audio>
      <span className='shrink-0'>
        {t(`home:step.content-adjustment.role`)} {String.fromCharCode(64 + id)}
      </span>
      <div className='flex w-full items-center gap-1 md:gap-4'>
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
          <SelectTrigger className='w-24 shrink-0'>
            <SelectValue placeholder={t('home:step.audio-settings.provider')} />
          </SelectTrigger>
          <SelectContent>
            {remoteProviders.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {t(provider)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <SelectTrigger className='w-24 min-w-24 flex-1 md:w-48'>
            <SelectValue placeholder={t('home:step.audio-settings.speaker')} />
          </SelectTrigger>
          <SelectContent>
            {remoteProviderWithSpeakers[speakers[id - 1]?.provider]?.map(
              (speaker) => (
                <SelectItem key={speaker.name} value={speaker.name}>
                  {`${speaker.displayName}${speaker.gender ? ' (' + t(speaker.gender.toLowerCase()) + ')' : ''}`}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
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
          <SelectTrigger className='w-20 shrink-0'>
            <SelectValue placeholder={t('home:step.audio-settings.speed')} />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 7 }, (_, i) => 0.25 * (i + 2)).map(
              (speed) => (
                <SelectItem key={speed} value={speed.toString()}>
                  {`${speed.toFixed(2)}x`}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        {speakers[id - 1]?.provider !== 'custom' && (
          <Button variant='outline' onClick={handlePlay} disabled={!isReady}>
            {isPlaying ? (
              <Pause className='h-4 w-4' />
            ) : (
              <Play className='h-4 w-4' />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export const AudioSettingsPanel = ({
  stepper,
  handleGenerate,
  customModels,
  setCustomModels,
}: {
  stepper: Stepper
  handleGenerate: () => void
  customModels: CustomModel[]
  setCustomModels: (customModels: SetStateAction<CustomModel[]>) => void
}) => {
  const { t } = useClientTranslation()
  const {
    speakerNums,
    remoteProviderWithSpeakers,
    speakers,
    useBgm,
    autoGenBgm,
    bgmPrompt,
    setRemoteProviderWithSpeakers,
    setSpeakers,
    setUseBgm,
    setAutoGenBgm,
    setBgmPrompt,
    dialogueItems,
    contentLang,
    bgmVolume,
    setBgmVolume,
  } = usePodcastInfoStore((state) => ({
    speakerNums: state.speakerNums,
    remoteProviderWithSpeakers: state.remoteProviderWithSpeakers,
    speakers: state.speakers,
    useBgm: state.useBgm,
    autoGenBgm: state.autoGenBgm,
    bgmPrompt: state.bgmPrompt,
    setRemoteProviderWithSpeakers: state.setRemoteProviderWithSpeakers,
    setSpeakers: state.setSpeakers,
    setUseBgm: state.setUseBgm,
    setAutoGenBgm: state.setAutoGenBgm,
    setBgmPrompt: state.setBgmPrompt,
    dialogueItems: state.dialogueItems,
    contentLang: state.lang,
    bgmVolume: state.bgmVolume,
    setBgmVolume: state.setBgmVolume,
  }))
  useEffect(() => {
    dialogueKy
      .get('voice/model', {
        searchParams: {
          lang: contentLang,
        },
      })
      .json<Record<string, RemoteSpeakers>>()
      .then((res) => {
        setRemoteProviderWithSpeakers((prev) => ({
          ...prev,
          ...res,
        }))
      })
      .catch((err) => {
        if (isString(err.message) && err.message.includes('Network')) {
          logger.error(err)
          toast.error(t('home:step.audio-settings.network_error'))
        } else {
          toast.error(t('home:step.audio-settings.remote_provider_error'))
        }
        stepper.prev()
      })
  }, [setRemoteProviderWithSpeakers, t, stepper, contentLang])

  const realSpeakerNums = useMemo(() => {
    return new Set(dialogueItems.map((item) => item.speaker)).size
  }, [dialogueItems])

  useEffect(() => {
    if (speakers.length !== realSpeakerNums) {
      setSpeakers(
        Array.from({ length: realSpeakerNums }, (_, i) => ({
          id: i + 1,
          provider: 'openai',
          speaker: 'alloy',
          speed: 1,
        }))
      )
    }
  }, [speakers, realSpeakerNums, setSpeakers, remoteProviderWithSpeakers])

  const _handleGenerate = useCallback(() => {
    stepper.next()
    handleGenerate()
  }, [handleGenerate, stepper])

  const [open, setOpen] = useState(false)

  const { isRecording, start, stopWithData, recordingDuration } =
    useAudioRecorder(44100)

  const [audioData, setAudioData] = useState<Blob>()
  const [fileInfo, setFileInfo] = useState<{
    name: string
    size: number
    type: string
  }>()

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      try {
        const data = await stopWithData()

        if (!data) {
          toast.error(t('home:step.audio-settings.no_recording_data'))

          return
        }

        try {
          const duration = await getAudioDuration(data)

          if (duration < 10) {
            toast.error(t('home:step.audio-settings.too_short'))

            return
          }
          if (duration > 90) {
            toast.error(t('home:step.audio-settings.too_long'))

            return
          }
        } catch (durationError) {
          toast.error(t('home:step.audio-settings.duration_calculation_failed'))

          return
        }
        toast.success(t('home:step.audio-settings.recording_ended'))

        setAudioData(data)
        setFileInfo({
          name: 'recording.wav',
          size: data.size,
          type: data.type,
        })
      } catch (e) {}
    } else {
      await start()
    }
  }, [isRecording, start, stopWithData, t])

  useEffect(() => {
    if (recordingDuration >= 90000) {
      handleToggleRecording()
    }
  }, [recordingDuration, handleToggleRecording])

  const [title, setTitle] = useState('')

  const handleUploadFile = useCallback(async () => {
    const input = document.createElement('input')

    input.type = 'file'
    input.accept = 'audio/*'
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]

      if (!file) {
        toast.error(t('home:step.audio-settings.no_file'))

        return
      }

      try {
        const duration = await getAudioDuration(file)

        if (duration < 10) {
          toast.error(t('home:step.audio-settings.too_short'))

          return
        }

        if (duration > 90) {
          toast.error(t('home:step.audio-settings.too_long'))

          return
        }
      } catch (durationError) {
        toast.error(t('home:step.audio-settings.duration_calculation_failed'))

        return
      }

      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
      })

      setAudioData(file)
      toast.success(t('home:step.audio-settings.file_selected'))
    }
  }, [t])

  const [isMakingClone, setIsMakingClone] = useState(false)

  const handleMakeClone = useCallback(async () => {
    setIsMakingClone(true)
    if (!audioData) {
      toast.error(t('home:step.audio-settings.no_audio_data'))

      setIsMakingClone(false)

      return
    }

    if (!title) {
      toast.error(t('home:step.audio-settings.no_model_name'))

      setIsMakingClone(false)

      return
    }

    const formData = new FormData()

    formData.append('voices', audioData, 'recording.wav')
    formData.append('visibility', 'unlist')
    formData.append('type', 'tts')
    formData.append('title', title)
    formData.append('train_mode', 'fast')

    try {
      const resp = await apiKy
        .post('fish-audio/model', {
          body: formData,
          timeout: false,
        })
        .json<CustomModel>()

      setCustomModels((prev) => [...(prev || []), resp])

      setTitle('')
      setAudioData(undefined)
      setFileInfo(undefined)

      setIsMakingClone(false)

      toast.success(t('home:step.audio-settings.success_make_clone'))

      setOpen(false)
    } catch (e) {
      setIsMakingClone(false)
    }
  }, [audioData, title, setCustomModels, t])

  return (
    <div className='flex flex-1 flex-col gap-8 p-4'>
      <div className='flex w-full flex-col items-center justify-center gap-4'>
        {Array.from({ length: realSpeakerNums }, (_, i) => i + 1).map((id) => (
          <AudioSelect key={id} id={id} />
        ))}
      </div>
      <div className='flex w-full items-center justify-center gap-2'>
        <span>{t('home:step.audio-settings.custom_speaker_tip')}</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild={true}>
            <Button variant='outline'>
              {t('home:step.audio-settings.custom_speaker')}
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-5xl sm:rounded-none lg:rounded-lg'>
            <DialogHeader>
              <DialogTitle>
                {t('home:step.audio-settings.custom_speaker_modal_title')}
              </DialogTitle>
              <DialogDescription>
                {t('home:step.audio-settings.custom_speaker_modal_description')}
              </DialogDescription>
            </DialogHeader>

            <div className='mt-2 flex w-full flex-col gap-2'>
              <Label htmlFor='custom_speaker_name'>
                {t('home:step.audio-settings.custom_speaker_name_label')}
              </Label>
              <Input
                id='custom_speaker_name'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t(
                  'home:step.audio-settings.custom_speaker_name_placeholder'
                )}
              />
            </div>

            {fileInfo && (
              <div className='flex items-center justify-center gap-2 text-sm'>
                <span>{t('home:step.audio-settings.has_audio')}</span>
                <span>{fileInfo.name}</span>
                <span>{formatFileSize(fileInfo.size)}</span>
              </div>
            )}
            <div className='flex flex-col items-center justify-center gap-2 md:flex-row'>
              <span>{t('home:step.audio-settings.upload_audio_tip')}</span>
              <div className='flex items-center justify-center gap-2'>
                <Button variant='outline' onClick={handleUploadFile}>
                  {t('home:step.audio-settings.select_file')}
                </Button>
                <span>{t('home:step.audio-settings.or')}</span>
                <Button
                  variant='default'
                  className='gap-2'
                  onClick={handleToggleRecording}
                >
                  {isRecording ? (
                    <Loader className='h-4 w-4 animate-spin' />
                  ) : (
                    <Mic className='h-4 w-4' />
                  )}
                  {isRecording
                    ? t('home:step.audio-settings.stopRecord') +
                      ' ' +
                      (recordingDuration / 1000).toFixed(1) +
                      's'
                    : t('home:step.audio-settings.startRecord')}
                </Button>
              </div>
            </div>
            <div className='flex items-center justify-center text-sm text-gray-500'>
              <span className='shrink-0 self-start'>
                {t('home:step.audio-settings.reference_record_text')}
              </span>
              <span className='shrink-0 self-start'>: &nbsp;</span>
              <span className='font-bold'>
                {t('home:step.audio-settings.reference_record_text_example')}
              </span>
            </div>
            <div className='flex justify-end'>
              <Button
                variant='default'
                onClick={handleMakeClone}
                disabled={!audioData || !title || isMakingClone}
              >
                {isMakingClone ? (
                  <Loader className='h-4 w-4 animate-spin' />
                ) : (
                  t('home:step.audio-settings.make_clone')
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className='flex w-full flex-col items-center gap-4'>
        <div className='flex w-full items-center justify-between gap-2'>
          <div className='flex shrink-0 items-center gap-2'>
            <Switch
              id='enable_bgm'
              checked={useBgm}
              onCheckedChange={setUseBgm}
            />
            <Label htmlFor='enable_bgm'>
              {t('home:step.audio-settings.enable_bgm')}
            </Label>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <Volume2 className='h-4 w-4 shrink-0' />
            <span>{t('home:step.audio-settings.gain')}</span>
            <Slider
              className='w-24 shrink-0'
              value={[bgmVolume]}
              onValueChange={([value]) => setBgmVolume(value)}
              min={-20}
              max={20}
            />
            <span>{bgmVolume}</span>
          </div>
        </div>
        <div
          className={cn(
            'flex w-full flex-col gap-2 rounded-md border-2 border-dashed bg-white p-4 dark:bg-background',
            !useBgm && 'hidden'
          )}
        >
          <Label htmlFor='bgm_prompt'>
            {t('home:step.audio-settings.bgm_prompt_label')}
          </Label>
          <Textarea
            id='bgm_prompt'
            value={bgmPrompt}
            onChange={(e) => setBgmPrompt(e.target.value)}
            disabled={!useBgm || autoGenBgm}
            placeholder={t('home:step.audio-settings.bgm_prompt_placeholder')}
          />
          <div className='flex items-center gap-2'>
            <Switch
              id='auto_bgm'
              checked={autoGenBgm}
              onCheckedChange={setAutoGenBgm}
            />
            <Label htmlFor='auto_bgm'>
              {t('home:step.audio-settings.auto_bgm')}
            </Label>
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end gap-4'>
        <Button variant='outline' onClick={() => stepper.prev()}>
          {t('home:step.prev')}
        </Button>
        <Button onClick={_handleGenerate}>
          {t('home:step.audio-settings.generate_btn')}
        </Button>
      </div>
    </div>
  )
}
