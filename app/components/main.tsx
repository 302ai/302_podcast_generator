import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiKy } from '@/lib/api/api'
import { logger } from '@/lib/logger'
import { emitter } from '@/lib/mitt'
import { cn } from '@/lib/utils'
import { convert } from 'html-to-text'
import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useClientTranslation } from '../hooks/use-client-translation'
import { steps, useStepper } from '../hooks/use-stepper'
import {
  CustomModel,
  Language,
  usePodcastInfoStore,
} from '../stores/use-podcast-info-store'
import { useUserStore } from '../stores/use-user-store'
import { AssetsSelectionPanel } from './steps/assets-selection'
import { AudioSettingsPanel } from './steps/audio-settings-panel'
import { ContentAdjustmentPanel } from './steps/content-adjustment-panel'
import {
  podcast,
  PodcastGenerationPanel,
} from './steps/podcast-generation-panel'
import useSWR from 'swr'
import { env } from 'next-runtime-env'

export default function Main({ className }: { className?: string }) {
  const { t } = useClientTranslation()
  const stepper = useStepper(usePodcastInfoStore.getState().step)
  const { setStep } = usePodcastInfoStore((state) => ({
    setStep: state.setStep,
  }))
  useEffect(() => {
    setStep(stepper.current.id)
  }, [stepper, setStep])

  const { language: uiLang } = useUserStore((state) => ({
    language: state.language
  }))
  const {
    speakers,
    dialogueItems,
    useBgm,
    autoGenBgm,
    bgmPrompt,
    setMp3,
    resources,
    mp3,
    bgmVolume,
  } = usePodcastInfoStore((state) => ({
    speakers: state.speakers,
    dialogueItems: state.dialogueItems,
    useBgm: state.useBgm,
    autoGenBgm: state.autoGenBgm,
    bgmPrompt: state.bgmPrompt,
    setMp3: state.setMp3,
    resources: state.resources,
    mp3: state.mp3,
    bgmVolume: state.bgmVolume,
  }))

  const [taskId, setTaskId] = useState(podcast.get('taskId'))

  const submitTask = useCallback(async () => {
    let _bgmPrompt = bgmPrompt

    if (!_bgmPrompt || _bgmPrompt === '') {
      _bgmPrompt = t('home:step.audio-settings.bgm_prompt_placeholder')
    }
    setMp3('')
    podcast.set('generating', true)

    try {
      const res = await apiKy
        .post('302/podcast/async/generate', {
          json: {
            speakers,
            contents: dialogueItems.map((item) => ({
              content: convert(item.content),
              speaker: item.speaker,
            })),
            useBgm,
            autoGenBgm,
            bgmPrompt: _bgmPrompt,
            bgmVolume,
            uiLang,
            modelName: env('NEXT_PUBLIC_DEFAULT_MODEL_NAME'),
          },
        })
        .json<{
          task_id: string
        }>()
      setTaskId(res.task_id)
      podcast.set('taskId', res.task_id)
      toast.success(t('home:step.podcast-generation.submit_task_success'))
    } catch (e) {
      logger.error(e)
      // toast.error(t('home:step.podcast-generation.submit_task_error'))
      stepper.goTo('audio-settings')
      podcast.set('taskId', null)
      setTaskId(null)
      podcast.set('generating', false)
    }
  }, [
    stepper,
    speakers,
    dialogueItems,
    useBgm,
    autoGenBgm,
    bgmPrompt,
    uiLang,
    setMp3,
    t,
    bgmVolume,
  ])

  const statusFetcher = async () => {
    const res = await apiKy.get(`302/podcast/async/status/${taskId}`).json<{
      status: string
      result?: {
        progress: number
        description: string
        content: string
        title: string
        error?: {
          err_code: number
          message: string
        }
      }
    }>()
    return res
  }

  useSWR(taskId ? ['dialogue', taskId] : null, statusFetcher, {
    refreshInterval: taskId ? 3000 : 0,
    onSuccess: (res) => {
      if (
        (res?.status === 'success' || res?.status === 'processing') &&
        res.result
      ) {
        emitter.emit('ProgressEvent', res.result)
      } else if (res?.status === 'fail') {
        logger.error(res)
        setTaskId(null)
        podcast.set('taskId', null)
        podcast.set('generating', false)
        emitter.emit('ToastError', res.result?.error?.err_code ?? 0)
        stepper.goTo('audio-settings')
      }
    },
    onError: (error) => {
      logger.error(error)
      podcast.set('generating', false)
      podcast.set('taskId', null)
      setTaskId(null)
      toast.error(t('home:step.podcast-generation.generate_error'))
      stepper.goTo('audio-settings')
    },
  })

  useEffect(() => {
    if (taskId) {
      podcast.set('generating', true)
    } else {
      podcast.set('generating', false)
    }
  }, [taskId])

  const canAccessStep = useCallback(
    (index: number) => {
      let idx = 0
      const hasAudio = mp3
      const hasDialogue = dialogueItems.length > 0
      const hasResources = resources.length > 0

      if (hasAudio && hasDialogue && hasResources) {
        idx = 3
      } else if (hasResources && hasDialogue) {
        idx = 2
      } else if (hasResources) {
        idx = 1
      }

      return index <= idx
    },
    [resources, dialogueItems, mp3]
  )

  const [customModels, setCustomModels] = useState<CustomModel[]>([])

  useEffect(() => {
    const customModelsLocal = localStorage.getItem('customModels')

    if (customModelsLocal) {
      setCustomModels(JSON.parse(customModelsLocal))
    }
  }, [])

  const { setRemoteProviderWithSpeakers } = usePodcastInfoStore((state) => ({
    setRemoteProviderWithSpeakers: state.setRemoteProviderWithSpeakers,
  }))

  useEffect(() => {
    if (customModels.length > 0) {
      localStorage.setItem('customModels', JSON.stringify(customModels))
      setRemoteProviderWithSpeakers((prev) => ({
        ...prev,
        custom: customModels.map((model) => ({
          name: model._id,
          displayName: model.title,
          gender: '',
          sample: {} as Record<Language, string>,
        })),
      }))
    }
  }, [customModels, setRemoteProviderWithSpeakers])

  return (
    <div className={cn('flex h-full flex-col items-center', className)}>
      <nav aria-label='Checkout Steps' className='group my-4 w-full px-4'>
        <ol className='flex items-start justify-between gap-2'>
          {stepper.all.map((step, index, array) => (
            <React.Fragment key={step.id}>
              <li className='flex flex-shrink-0 flex-col items-center gap-1'>
                <Button
                  type='button'
                  role='tab'
                  id={`step-${step.id}`}
                  variant={
                    index <= stepper.current.index ? 'default' : 'secondary'
                  }
                  aria-current={
                    stepper.current.id === step.id ? 'step' : undefined
                  }
                  aria-posinset={index + 1}
                  aria-setsize={steps.length}
                  aria-selected={stepper.current.id === step.id}
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full p-0 md:size-8',
                    canAccessStep(index)
                      ? 'pointer-events-auto'
                      : 'pointer-events-none'
                  )}
                  onClick={() => {
                    if (canAccessStep(index)) {
                      stepper.goTo(step.id)
                    }
                  }}
                >
                  {index + 1}
                </Button>
                <Label
                  className={cn(
                    'pointer-events-none cursor-pointer text-sm font-medium',
                    index <= stepper.current.index
                      ? 'text-primary'
                      : 'text-foreground'
                  )}
                  htmlFor={`step-${step.id}`}
                >
                  {t(step.i18n)}
                </Label>
              </li>
              {index < array.length - 1 && (
                <Separator
                  className={`mt-2 flex-1 transition-all duration-300 md:mt-4 ${
                    index < stepper.current.index
                      ? 'border-primary'
                      : 'border-border'
                  }`}
                  dash
                />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>
      <div className='flex w-full flex-1 flex-col'>
        {stepper.switch({
          'assets-selection': () => <AssetsSelectionPanel stepper={stepper} />,
          'content-adjustment': () => (
            <ContentAdjustmentPanel stepper={stepper} />
          ),
          'audio-settings': () => (
            <AudioSettingsPanel
              stepper={stepper}
              handleSubmitTask={submitTask}
              customModels={customModels}
              setCustomModels={setCustomModels}
            />
          ),
          'podcast-generation': () => (
            <PodcastGenerationPanel
              stepper={stepper}
              handleSubmitTask={submitTask}
              setTaskId={setTaskId}
            />
          ),
        })}
      </div>
    </div>
  )
}
