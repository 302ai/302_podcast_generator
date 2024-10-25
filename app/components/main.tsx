import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { dialogueKy } from '@/lib/api/api'
import { logger } from '@/lib/logger'
import { emitter } from '@/lib/mitt'
import { cn } from '@/lib/utils'
import { events } from 'fetch-event-stream'
import { convert } from 'html-to-text'
import { env } from 'next-runtime-env'
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
import { AssetsSelectionPanel } from './steps/assets-selection-panel'
import { AudioSettingsPanel } from './steps/audio-settings-panel'
import { ContentAdjustmentPanel } from './steps/content-adjustment-panel'
import { PodcastGenerationPanel } from './steps/podcast-generation-panel'

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
    language: state.language,
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

  const handleGenerate = useCallback(async () => {
    let _bgmPrompt = bgmPrompt

    if (!_bgmPrompt || _bgmPrompt === '') {
      _bgmPrompt = t('home:step.audio-settings.bgm_prompt_placeholder')
    }
    setMp3('')
    localStorage.setItem('generating', 'true')
    try {
      const res = await dialogueKy.post('dialogue/generate', {
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

      let abort = new AbortController()

      let apiStream = events(res, abort.signal)

      for await (const event of apiStream) {
        if (event.event === 'error') {
          const j = JSON.parse(event.data || '{}')
          if (typeof j?.error?.err_code !== 'undefined') {
            emitter.emit('ToastError', j.error.err_code)
            abort.abort()
            stepper.goTo('audio-settings')
            break
          } else {
            emitter.emit('ToastError', -10504)
            abort.abort()
            stepper.goTo('audio-settings')
            break
          }
        } else {
          emitter.emit('ProgressEvent', JSON.parse(event.data || '{}'))
        }
      }
    } catch (error) {
      logger.error(error)
      toast.error(t('home:step.audio-settings.network_error'))
      stepper.goTo('audio-settings')
    }
  }, [
    speakers,
    dialogueItems,
    useBgm,
    autoGenBgm,
    bgmPrompt,
    uiLang,
    setMp3,
    stepper,
    bgmVolume,
    t,
  ])

  useEffect(() => {
    const generating = localStorage.getItem('generating')
    if (generating) {
      handleGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
              handleGenerate={handleGenerate}
              customModels={customModels}
              setCustomModels={setCustomModels}
            />
          ),
          'podcast-generation': () => (
            <PodcastGenerationPanel
              stepper={stepper}
              handleGenerate={handleGenerate}
            />
          ),
        })}
      </div>
    </div>
  )
}
