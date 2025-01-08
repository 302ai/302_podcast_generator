import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Stepper } from '@/app/hooks/use-stepper'
import { usePodcastInfoStore } from '@/app/stores/use-podcast-info-store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { save } from '@/lib/db'
import { logger } from '@/lib/logger'
import { emitter, type ProgressEvent } from '@/lib/mitt'
import { cn } from '@/lib/utils'
import { useMemoizedFn } from 'ahooks'
import ky from 'ky'
import { motion, AnimatePresence } from 'framer-motion'
import { createShare } from '@/app/actions/database'
import StarfieldBackground from '@/app/components/starfield-background'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  Plus,
  RotateCcw,
  Share,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useCopyToClipboard } from 'usehooks-ts'
import MP3Player from '../mp3-player'
import store from 'store2'

export const podcast = store.namespace('podcast')

export const PodcastGenerationPanel = ({
  stepper,
  handleSubmitTask,
  setTaskId,
}: {
  stepper: Stepper
  handleSubmitTask: () => void
  setTaskId: (taskId: string | null) => void
}) => {
  const { t } = useClientTranslation()
  const { mp3, setMp3 } = usePodcastInfoStore((state) => ({
    mp3: state.mp3,
    setMp3: state.setMp3,
  }))
  const { title, setTitle } = usePodcastInfoStore((state) => ({
    title: state.title,
    setTitle: state.setTitle,
  }))
  const { reset } = usePodcastInfoStore((state) => ({
    reset: state.reset,
  }))
  const [progress, setProgress] = useState(0)
  const [description, setDescription] = useState('')
  const isDone = useMemo(() => mp3 !== '', [mp3])
  const progressResolve = useMemoizedFn(async (event: ProgressEvent) => {
    setProgress(event.progress)
    setDescription(event.description)
    if (event.progress === 100) {
      setMp3(event.content)
      setTitle(event.title)
      podcast.remove('generating')
      podcast.set('taskId', null)
      await save({
        title: event.title,
        mp3: event.content,
      })
      setTaskId(null)
      podcast.set('taskId', null)
      podcast.set('generating', false)
    }
  })
  useEffect(() => {
    emitter.off('ProgressEvent')
    emitter.on('ProgressEvent', progressResolve)
  }, [progressResolve])

  const [isDownloading, setIsDownloading] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  useEffect(() => {
    if (mp3 && !isAudioReady) {
      const audio = new Audio(mp3)

      const handleLoaded = () => {
        if (audio.duration > 0) {
          setIsAudioReady(true)
        }
      }

      const handleError = (e: ErrorEvent) => {
        logger.error('Error loading audio:', e)
        setTimeout(() => {
          audio.load()
        }, 1000)
      }

      audio.addEventListener('loadedmetadata', handleLoaded)
      audio.addEventListener('error', handleError)

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoaded)
        audio.removeEventListener('error', handleError)
        audio.src = ''
      }
    }
  }, [mp3, isAudioReady])

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const response = await ky.get(mp3)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${title}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(t('home:step.podcast-generation.success-download'))
    } catch (error) {
      logger.error('Error downloading podcast:', error)
      toast.error(t('home:step.podcast-generation.error-download'))
    } finally {
      setIsDownloading(false)
    }
  }

  const handleReset = () => {
    reset()
    stepper.goTo('assets-selection')
  }

  const handleRegenerate = () => {
    setProgress(0)
    setDescription('')
    handleSubmitTask()
  }

  const { dialogueItems, useSpeakerName, speakerNames } = usePodcastInfoStore(
    (state) => ({
      dialogueItems: state.dialogueItems,
      useSpeakerName: state.useSpeakerName,
      speakerNames: state.speakerNames,
    })
  )

  const [isShareCreating, setIsShareCreating] = useState(false)
  const [isOpenShareCopyDialog, setIsOpenShareCopyDialog] = useState(false)

  const [copiedText, copy] = useCopyToClipboard()
  const handleCopy = (text: string) => {
    copy(text)
      .then(() => {
        toast.success(t('home:step.podcast-generation.success-share'))
      })
      .catch(() => {
        toast.error(t('extras:copyFailed'))
        setIsOpenShareCopyDialog(true)
      })
  }

  const { locale } = useParams()

  const handleShare = async () => {
    setIsShareCreating(true)
    let res
    try {
      res = await createShare({
        title,
        dialogues: dialogueItems,
        mp3Url: mp3,
        useSpeakerName,
        names: speakerNames,
      })
      handleCopy(`${window.location.origin}/${locale}/share/${res.id}`)
    } catch (error) {
      logger.error('Error sharing podcast:', error)
      toast.error(t('home:step.podcast-generation.error-share'))
    } finally {
      setIsShareCreating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='flex flex-1 flex-col gap-8 p-6 max-w-5xl mx-auto w-full'
    >
      <div className='relative overflow-hidden bg-gradient-to-br from-background/98 via-background/99 to-background/98 rounded-3xl p-8 shadow-lg border'>
        <div className="absolute inset-0">
          <StarfieldBackground />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.02] opacity-100" />
        </div>

        <div className="relative">
          <Dialog
            open={isOpenShareCopyDialog}
            onOpenChange={setIsOpenShareCopyDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t('home:step.podcast-generation.share-copy-dialog-title')}
                </DialogTitle>
                <DialogDescription>
                  {t('home:step.podcast-generation.share-copy-dialog-description')}
                </DialogDescription>
              </DialogHeader>
              <Input
                value={copiedText ?? ''}
                onChange={() => {}}
                className='w-full'
              />
            </DialogContent>
          </Dialog>

          <AnimatePresence mode='wait'>
            {isDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className='flex flex-col items-center gap-8'
              >
                <motion.div
                  className='flex items-center gap-3'
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <div className='flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500/90 to-green-600/90 shadow-lg'>
                    <Check className='h-5 w-5 text-white' />
                  </div>
                  <h2 className='text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground/90 to-foreground/80'>
                    {t('home:step.podcast-generation.done')}
                  </h2>
                </motion.div>

                <div className='w-full max-w-[680px] mx-auto'>
                  <MP3Player audioSrc={mp3} title={title} />
                </div>

                <div className='flex flex-col w-full max-w-[680px] gap-6'>
                  <div className='flex flex-wrap items-center justify-center gap-3'>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='ghost'
                          className='flex items-center gap-2 transition-all hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400'
                        >
                          <ArrowLeft className='h-4 w-4' />
                          {t('home:step.prev')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t('home:step.podcast-generation.confirm-go-back-title')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('home:step.podcast-generation.confirm-go-back-description')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t('home:step.podcast-generation.confirm-go-back-cancel')}
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={() => stepper.prev()}>
                            {t('home:step.podcast-generation.confirm-go-back-continue')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      variant='ghost'
                      className='flex items-center gap-2 transition-all hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400'
                      onClick={handleReset}
                    >
                      <Plus className='h-4 w-4' />
                      {t('home:step.podcast-generation.make-another')}
                    </Button>
                  </div>

                  <Separator className='bg-purple-500/10' />

                  <div className='flex flex-wrap items-center justify-center gap-3'>
                    <Button
                      variant='ghost'
                      className='flex items-center gap-2 transition-all hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400'
                      onClick={handleRegenerate}
                    >
                      <RotateCcw className='h-4 w-4' />
                      {t('home:step.podcast-generation.regenerate')}
                    </Button>

                    <Button
                      onClick={handleDownload}
                      disabled={isDownloading || !isAudioReady}
                      className={cn(
                        'flex items-center gap-2 transition-all',
                        'bg-gradient-to-r from-purple-600/90 to-purple-700/90',
                        'hover:from-purple-600/80 hover:to-purple-700/80',
                        'hover:scale-105 hover:shadow-lg',
                        'disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none'
                      )}
                    >
                      {isDownloading ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : isAudioReady ? (
                        <Download className='h-4 w-4' />
                      ) : (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      )}
                      {t('home:step.podcast-generation.download')}
                    </Button>

                    <Button
                      className={cn(
                        'flex items-center gap-2 transition-all',
                        'bg-gradient-to-r from-purple-600/90 to-purple-700/90',
                        'hover:from-purple-600/80 hover:to-purple-700/80',
                        'hover:scale-105 hover:shadow-lg',
                        'disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none'
                      )}
                      onClick={handleShare}
                      disabled={isShareCreating}
                    >
                      {isShareCreating ? (
                        <Loader2 className='size-4 animate-spin' />
                      ) : (
                        <Share className='size-4' />
                      )}
                      {t('home:step.podcast-generation.share')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className='flex flex-col items-center gap-8 py-12'
              >
                <h2 className='text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground/90 to-foreground/80'>
                  {t('home:step.podcast-generation.generating_title')}
                </h2>
                <div className='w-full max-w-md'>
                  <Progress
                    value={progress}
                    className={cn(
                      'h-2 bg-purple-200/20 dark:bg-purple-900/20',
                      '[&>div]:bg-gradient-to-r [&>div]:from-purple-600/90 [&>div]:to-purple-700/90',
                      progress < 100 && 'animate-pulse'
                    )}
                  />
                </div>
                <p className='text-center text-sm text-muted-foreground max-w-lg'>
                  {description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
