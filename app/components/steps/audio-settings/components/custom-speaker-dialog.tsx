import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { CustomModel } from '@/app/stores/use-podcast-info-store'
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
import { apiKy } from '@/lib/api/api'
import { formatFileSize } from '@/lib/file'
import { getAudioDuration } from '@/lib/audio'
import { FileAudio, Loader, Mic, Upload, PenLine, Info } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CustomSpeakerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customModels: CustomModel[]
  setCustomModels: (customModels: React.SetStateAction<CustomModel[]>) => void
}

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
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

export const CustomSpeakerDialog: React.FC<CustomSpeakerDialogProps> = ({
  open,
  onOpenChange,
  customModels,
  setCustomModels,
}) => {
  const { t } = useClientTranslation()
  const [title, setTitle] = useState('')
  const [audioData, setAudioData] = useState<Blob>()
  const [fileInfo, setFileInfo] = useState<{
    name: string
    size: number
    type: string
  }>()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isMakingClone, setIsMakingClone] = useState(false)

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
      onOpenChange(false)
    } catch (e) {
      setIsMakingClone(false)
      toast.error(t('home:step.audio-settings.clone_failed'))
    }
  }, [audioData, title, setCustomModels, t, onOpenChange])

  // Recording functionality
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

      chunks.current = []
      recorder.ondataavailable = (e) => chunks.current.push(e.data)

      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/wav' })
        try {
          const duration = await getAudioDuration(blob)
          if (duration < 10) {
            toast.error(t('home:step.audio-settings.too_short'))
            return
          }
          if (duration > 90) {
            toast.error(t('home:step.audio-settings.too_long'))
            return
          }

          setAudioData(blob)
          setFileInfo({
            name: 'recording.wav',
            size: blob.size,
            type: blob.type,
          })
          toast.success(t('home:step.audio-settings.recording_ended'))
        } catch (durationError) {
          toast.error(t('home:step.audio-settings.duration_calculation_failed'))
        }
      }

      recorder.start(1000)
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (err) {
      toast.error(t('home:step.audio-settings.recording_failed'))
    }
  }, [t])

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }, [mediaRecorder])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 90000) {
            stopRecording()
            return prev
          }
          return prev + 1000
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, stopRecording])

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      setRecordingDuration(0)
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size="sm"
          className='transition-all duration-300 hover:ring-2 hover:ring-primary/50 hover:bg-primary/5 active:scale-95'
        >
          {t('home:step.audio-settings.custom_speaker')}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl sm:rounded-lg lg:rounded-xl p-6 space-y-6'>
        <DialogHeader className='space-y-3'>
          <DialogTitle className='text-xl font-semibold tracking-tight flex items-center gap-2'>
            {t('home:step.audio-settings.custom_speaker_modal_title')}
          </DialogTitle>
          <DialogDescription className='text-base leading-relaxed flex items-start gap-2'>
            <Info className='h-4 w-4 text-muted-foreground mt-1 flex-shrink-0' />
            {t('home:step.audio-settings.custom_speaker_modal_description')}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className='space-y-6'
        >
          {/* Speaker Name Input */}
          <motion.div variants={itemVariants} className='space-y-3'>
            <Label htmlFor='custom_speaker_name' className='text-sm font-medium flex items-center gap-2'>
              <PenLine className='h-3.5 w-3.5 text-muted-foreground' />
              {t('home:step.audio-settings.custom_speaker_name_label')}
            </Label>
            <Input
              id='custom_speaker_name'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('home:step.audio-settings.custom_speaker_name_placeholder')}
              className='transition-all duration-300 hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary'
            />
          </motion.div>

          {/* File Info */}
          <AnimatePresence mode="wait">
            {fileInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className='rounded-lg bg-secondary/30 p-4 text-sm'
              >
                <div className='flex items-center justify-center gap-3'>
                  <FileAudio className='h-4 w-4 text-primary' />
                  <span className='font-medium'>{fileInfo.name}</span>
                  <span className='text-muted-foreground'>({formatFileSize(fileInfo.size)})</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Controls */}
          <motion.div variants={itemVariants} className='rounded-lg border border-input p-6 space-y-6 transition-all duration-300 hover:border-primary/50 hover:shadow-sm'>
            <div className='text-sm text-center text-muted-foreground'>
              {t('home:step.audio-settings.upload_audio_tip')}
            </div>

            <div className='flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6'>
              <Button
                variant='outline'
                onClick={handleUploadFile}
                className='w-full md:w-auto gap-2 transition-all duration-300 hover:ring-2 hover:ring-primary/50 hover:bg-primary/5 active:scale-95'
              >
                <Upload className='h-4 w-4' />
                {t('home:step.audio-settings.select_file')}
              </Button>
              <span className='text-sm text-muted-foreground font-medium'>{t('home:step.audio-settings.or')}</span>
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                className={cn(
                  'w-full md:w-auto gap-2 transition-all duration-300 active:scale-95',
                  isRecording ? 'hover:bg-destructive/90' : 'hover:bg-primary/90'
                )}
                onClick={handleToggleRecording}
              >
                {isRecording ? (
                  <Loader className='h-4 w-4 animate-spin' />
                ) : (
                  <Mic className='h-4 w-4' />
                )}
                {isRecording
                  ? `${t('home:step.audio-settings.stopRecord')} (${(recordingDuration / 1000).toFixed(1)}s)`
                  : t('home:step.audio-settings.startRecord')}
              </Button>
            </div>
          </motion.div>

          {/* Reference Text */}
          <motion.div variants={itemVariants} className='rounded-lg bg-secondary/30 p-6 space-y-3'>
            <div className='text-sm font-medium text-foreground/80 flex items-center gap-2'>
              <Info className='h-3.5 w-3.5 text-muted-foreground' />
              {t('home:step.audio-settings.reference_record_text')}
            </div>
            <div className='text-sm text-muted-foreground bg-background/50 p-4 rounded-lg'>
              {t('home:step.audio-settings.reference_record_text_example')}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className='flex justify-end pt-2'>
            <Button
              variant='default'
              onClick={handleMakeClone}
              disabled={!audioData || !title || isMakingClone}
              className='min-w-[120px] gap-2 transition-all duration-300 hover:bg-primary/90 disabled:opacity-50'
            >
              {isMakingClone ? (
                <Loader className='h-4 w-4 animate-spin' />
              ) : (
                <PenLine className='h-4 w-4' />
              )}
              {t('home:step.audio-settings.make_clone')}
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
