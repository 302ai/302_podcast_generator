import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Stepper } from '@/app/hooks/use-stepper'
import { usePodcastInfoStore } from '@/app/stores/use-podcast-info-store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { save } from '@/lib/db'
import { logger } from '@/lib/logger'
import { emitter, ProgressEvent } from '@/lib/mitt'
import { cn } from '@/lib/utils'
import { useMemoizedFn } from 'ahooks'
import ky from 'ky'

import { createShare } from '@/app/actions/database'
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

export const PodcastGenerationPanel = ({
  stepper,
  handleGenerate,
}: {
  stepper: Stepper
  handleGenerate: () => void
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
      localStorage.removeItem('generating')
      await save({
        title: event.title,
        mp3: event.content,
      })
    }
  })
  useEffect(() => {
    emitter.off('ProgressEvent')
    emitter.on('ProgressEvent', progressResolve)
  }, [progressResolve])

  const [isDownloading, setIsDownloading] = useState(false)

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
    handleGenerate()
  }

  const { dialogueItems } = usePodcastInfoStore((state) => ({
    dialogueItems: state.dialogueItems,
  }))

  const [isShareCreating, setIsShareCreating] = useState(false)
  const [isOpenShareCopyDialog, setIsOpenShareCopyDialog] = useState(false)

  const [copiedText, copy] = useCopyToClipboard()
  const handleCopy = (text: string) => {
    console.log('text', text)
    copy(text)
      .then(() => {
        toast.success(t('home:step.podcast-generation.success-share'))
      })
      .catch((error: any) => {
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
    <div
      className={cn(
        'flex w-full flex-col gap-4 rounded-md border-2 border-dashed bg-white p-4 dark:bg-background'
      )}
    >
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
      {isDone ? (
        <div className='flex flex-col items-center gap-4'>
          <h2 className='flex items-center gap-2 text-center text-lg font-medium'>
            <div className='flex size-6 items-center justify-center rounded-full bg-green-500'>
              <Check className='h-4 w-4 text-white' />
            </div>
            {t('home:step.podcast-generation.done')}
          </h2>
          <div className='flex w-full flex-col items-center gap-2'>
            <MP3Player audioSrc={mp3} title={title} />
          </div>
          <div className='flex flex-col items-center gap-2 sm:flex-row sm:items-center'>
            <div className='flex items-center gap-2'>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='outline'
                    className='flex items-center gap-2'
                    onClick={() => {}}
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
                      {t(
                        'home:step.podcast-generation.confirm-go-back-description'
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t('home:step.podcast-generation.confirm-go-back-cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={() => stepper.prev()}>
                      {t(
                        'home:step.podcast-generation.confirm-go-back-continue'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant='outline'
                className='flex items-center gap-2'
                onClick={handleReset}
              >
                <Plus className='h-4 w-4' />
                {t('home:step.podcast-generation.make-another')}
              </Button>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                className='flex items-center gap-2'
                onClick={handleRegenerate}
              >
                <RotateCcw className='h-4 w-4' />
                {t('home:step.podcast-generation.regenerate')}
              </Button>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className='flex items-center gap-2'
              >
                {isDownloading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Download className='h-4 w-4' />
                )}
                {t('home:step.podcast-generation.download')}
              </Button>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='default'
                className='flex items-center gap-2'
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
        </div>
      ) : (
        <>
          <h2 className='text-center text-lg font-medium'>
            {t('home:step.podcast-generation.generating_title')}
          </h2>
          <Progress value={progress} />
          <p className='text-center text-sm text-muted-foreground'>
            {description}
          </p>
        </>
      )}
    </div>
  )
}
