import { optimizeDialogues, type DialogueItem } from '@/app/actions/chat'
import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Language, languageList, usePodcastInfoStore } from '@/app/stores/use-podcast-info-store'
import { useUserStore } from '@/app/stores/use-user-store'
import { Separator } from '@/components/ui/separator'
import { ApiError, apiKy } from '@/lib/api/api'
import { logger } from '@/lib/logger'
import { emitter } from '@/lib/mitt'
import {
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { convert } from 'html-to-text'
import { Settings2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import { isEmpty, range } from 'radash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import store from 'store2'
import useSWR from 'swr'
import type { PreviewMap } from './components/batch-optimize-dialog'
import { DialogueSection, NavigationButtons } from './components/dialogue-section'
import { GenerateButton, GenerationModeSwitch, LanguageSelector } from './components/generation-options'
import { AudienceSettings, CustomPromptSection, SpeakerSettings } from './components/settings'
import { BatchOptimizeType, ContentAdjustmentPanelProps, StatusResponse } from './types'
import { env } from 'next-runtime-env'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn",
      when: "afterChildren"
    }
  }
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
}

const dialogue = store.namespace('dialogue')

export const ContentAdjustmentPanel: React.FC<ContentAdjustmentPanelProps> = ({ stepper }) => {
  const { t } = useClientTranslation()
  const [taskId, setTaskId] = useState<string | null>(dialogue.get('taskId'))
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationPreviews, setOptimizationPreviews] = useState<PreviewMap>({})
  const [showBatchDialog, setShowBatchDialog] = useState(false)

  const { lang: uiLang } = useUserStore((state) => ({
    lang: state.language
  }))

  const {
    outputLang,
    setOutputLang,
    speakerNums,
    setSpeakerNums,
    speakerNames,
    setSpeakerNames,
    useSpeakerName,
    setUseSpeakerName,
  } = usePodcastInfoStore((state) => ({
    outputLang: state.lang,
    setOutputLang: state.setLang,
    speakerNums: state.speakerNums,
    setSpeakerNums: state.setSpeakerNums,
    speakerNames: state.speakerNames,
    setSpeakerNames: state.setSpeakerNames,
    useSpeakerName: state.useSpeakerName,
    setUseSpeakerName: state.setUseSpeakerName,
  }))

  const defaultLang = useMemo(() => {
    const lang = languageList.find((lang) => lang === uiLang) || 'en'
    return lang as Language
  }, [uiLang])

  useEffect(() => {
    setOutputLang(defaultLang)
  }, [defaultLang, setOutputLang])

  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  const { isExtract, setIsExtract } = usePodcastInfoStore((state) => ({
    isExtract: state.isExtract,
    setIsExtract: state.setIsExtract,
  }))

  const { genDialogPrompt, setGenDialogPrompt } = usePodcastInfoStore(
    (state) => ({
      genDialogPrompt: state.genDialogPrompt,
      setGenDialogPrompt: state.setGenDialogPrompt,
    })
  )

  const { dialogueItems, setDialogueItems } = usePodcastInfoStore((state) => ({
    dialogueItems: state.dialogueItems,
    setDialogueItems: state.setDialogueItems,
  }))

  const { isLongGenerating, setIsLongGenerating } = usePodcastInfoStore((state) => ({
    isLongGenerating: state.isLongGenerating,
    setIsLongGenerating: state.setIsLongGenerating,
  }))

  const { audienceChoice, setAudienceChoice } = usePodcastInfoStore((state) => ({
    audienceChoice: state.audienceChoice,
    setAudienceChoice: state.setAudienceChoice,
  }))

  useEffect(() => {
    if (taskId) {
      setIsGenerating(true)
    } else {
      setIsGenerating(false)
    }
  }, [taskId])

  useEffect(() => {
    if (isExtract) {
      setUseSpeakerName(false)
      setGenDialogPrompt('')
      setAudienceChoice(0)
      setIsLongGenerating(false)
    }
  }, [isExtract])

  useEffect(() => {
    if (!isLongGenerating && audienceChoice !== 0) {
      setAudienceChoice(0)
    }
  }, [isLongGenerating, audienceChoice])

  useEffect(() => {
    // Clear previews when opening the dialog
    if (showBatchDialog) {
      setOptimizationPreviews({})
    }
  }, [showBatchDialog])

  const validateBeforeSubmit = useCallback((): boolean => {
    if (isExtract && isEmpty(usePodcastInfoStore.getState().resources)) {
      toast.error(t('home:step.content-adjustment.no_resources_error'))
      return false
    }

    if (useSpeakerName && speakerNames.some(name => !name)) {
      toast.error(t('home:step.content-adjustment.speaker_names_required'))
      return false
    }

    return true
  }, [isExtract, useSpeakerName, speakerNames, t])

  const handleBatchOptimize = async (type: BatchOptimizeType, customPrompt?: string) => {
    if (!selectedIds?.length) return

    setIsOptimizing(true)
    try {
      const selectedDialogues = dialogueItems.filter((item: DialogueItem) => selectedIds.includes(item.id))

      // Save original content for comparison
      const previews = selectedDialogues.reduce<PreviewMap>((acc, item) => ({
        ...acc,
        [item.id]: { original: item.content, optimized: '' }
      }), {} as PreviewMap)
      setOptimizationPreviews(previews)

      const result = await optimizeDialogues({
        model: env('NEXT_PUBLIC_DEFAULT_MODEL_NAME') || 'gpt-4o-mini',
        apiKey: env('NEXT_PUBLIC_API_KEY') || '',
        dialogues: selectedDialogues,
        type,
        customPrompt: type === 'custom' ? customPrompt : undefined
      })

      if (!result?.dialogues || !Array.isArray(result.dialogues)) {
        throw new Error('Invalid optimization result format')
      }

      // Validate and filter valid dialogues
      const validDialogues = result.dialogues.filter((item: unknown): item is DialogueItem =>
        item !== null &&
        typeof item === 'object' &&
        'id' in item &&
        'content' in item &&
        'speaker' in item &&
        typeof (item as DialogueItem).id === 'string' &&
        typeof (item as DialogueItem).content === 'string' &&
        typeof (item as DialogueItem).speaker === 'number'
      )

      if (validDialogues.length === 0) {
        throw new Error('No valid dialogues in optimization result')
      }

      // Update previews with optimized content
      const updatedPreviews = validDialogues.reduce((acc: PreviewMap, item: DialogueItem): PreviewMap => ({
        ...acc,
        [item.id]: {
          original: previews[item.id]?.original || item.content,
          optimized: item.content
        }
      }), {} as PreviewMap)
      setOptimizationPreviews(updatedPreviews)

    } catch (error) {
      logger.error(error)
      setOptimizationPreviews({})
      emitter.emit('ToastError', (error as ApiError).error?.err_code ?? 0)
      toast.error(t('home:step.content-adjustment.batch_optimize.error'))
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleSubmitTask = async (): Promise<void> => {
    if (!validateBeforeSubmit()) return

    try {
      const version = audienceChoice !== 0 ? 'v7' : (isLongGenerating ? 'v6' : 'v3')
      const resources = usePodcastInfoStore
        .getState()
        .resources.map((resource) => ({
          type: resource.type === 'search' ? 'text' : resource.type,
          content: resource.type === 'file' ? resource.url : resource.content,
        }))

      const res = await apiKy
        .post('302/podcast/async/text', {
          json: {
            resources,
            speakerNums,
            names: useSpeakerName ? speakerNames : new Array(speakerNums).fill(''),
            lang: outputLang,
            modelName: env('NEXT_PUBLIC_DEFAULT_MODEL_NAME') || 'gpt-4o-mini',
            isExtract,
            customPrompt: genDialogPrompt,
            version,
            audience_choice: audienceChoice,
          },
        })
        .json<{ task_id: string }>()

      setTaskId(res.task_id)
      dialogue.set('taskId', res.task_id)
      toast.success(t('home:step.content-adjustment.submit_task_success'))
    } catch (error) {
      logger.error(error)
      setIsGenerating(false)
      emitter.emit('ToastError', (error as ApiError).error?.err_code ?? 0)
    }
  }

  const statusFetcher = async () => {
    const res = await apiKy
      .get(`302/podcast/async/status/${taskId}`)
      .json<StatusResponse>()
    return res
  }

  useSWR<StatusResponse>(taskId ? ['dialogue', taskId] : null, statusFetcher, {
    refreshInterval: taskId ? 3000 : 0,
    onSuccess: (res) => {
      try {
        if (res?.status === 'success' && res.result) {
          setDialogueItems(
            res.result.contents?.map((item) => ({ ...item, id: nanoid() })) ??
              []
          )
          if (isExtract) {
            const numsInDialogue = Array.from(
              new Set(res.result.contents?.map((item) => item.speaker) ?? [])
            ).length
            if (numsInDialogue !== speakerNums) {
              setSpeakerNums(numsInDialogue)
            }
          }
          setTaskId(null)
          dialogue.set('taskId', null)
          setIsGenerating(false)
          toast.success(
            t('home:step.content-adjustment.generate_dialogue_text_success')
          )
        } else if (res?.status === 'fail') {
          logger.error(res)
          setTaskId(null)
          dialogue.set('taskId', null)
          setIsGenerating(false)
          emitter.emit('ToastError', res.result?.error?.err_code ?? 0)
        }
      } catch (error) {
        logger.error(error)
        toast.error(
          t('home:step.content-adjustment.generate_dialogue_text_error')
        )
        setTaskId(null)
        dialogue.set('taskId', null)
        setIsGenerating(false)
      }
    },
    onError: (error) => {
      logger.error(error)
      toast.error(
        t('home:step.content-adjustment.generate_dialogue_text_error')
      )
      setTaskId(null)
      dialogue.set('taskId', null)
      setIsGenerating(false)
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setDialogueItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [setDialogueItems])

  const canNext = useMemo(() => {
    const nums = Array.from(range(1, speakerNums))
    return (
      dialogueItems.length > 0 &&
      dialogueItems.every(
        (item) =>
          item.speaker &&
          nums.includes(item.speaker) &&
          convert(item.content).length > 0
      )
    )
  }, [dialogueItems, speakerNums])

  const addNewDialogue = () => {
    setDialogueItems((items) => [
      ...items,
      { id: nanoid(), content: '', speaker: 1, isEditing: true },
    ])
  }

  const handleSpeakerNameChange = (index: number, value: string) => {
    setSpeakerNames((prevNames) => {
      const newNames = [...prevNames]
      newNames[index] = value
      return newNames
    })
  }

  useEffect(() => {
    if (useSpeakerName && speakerNums !== speakerNames.length) {
      setSpeakerNames(new Array(speakerNums).fill(''))
    }
  }, [speakerNums, setSpeakerNames, useSpeakerName, speakerNames])

  const handleCancelTask = () => {
    if (!taskId) return

    // 直接重置状态
    setTaskId(null)
    dialogue.set('taskId', null)
    setIsGenerating(false)
    toast.success(t('home:step.content-adjustment.cancel_task_success'))

    apiKy.post(`302/podcast/async/cancel/${taskId}`).catch((error) => {
      logger.error(error)
    })
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className='flex flex-1 flex-col gap-8 p-6 max-w-5xl mx-auto w-full'
    >
      {/* Main Content Container */}
      <div className='space-y-8 bg-card rounded-xl p-6 shadow-sm border'>
        {/* Generation Options Card */}
        <motion.section variants={sectionVariants} className='space-y-6'>
          <div className='flex items-center gap-2'>
            <Settings2 className='h-4 w-4 text-primary' />
            <h2 className='text-xl font-semibold tracking-tight'>
              {t('home:step.content-adjustment.generation_options')}
            </h2>
          </div>

          <div className='grid gap-6 md:grid-cols-2'>
            {/* Left Column - Core Options */}
            <div className='space-y-4'>
              <GenerationModeSwitch
                isExtract={isExtract}
                setIsExtract={setIsExtract}
                isLongGenerating={isLongGenerating}
                setIsLongGenerating={setIsLongGenerating}
                disabled={audienceChoice !== 0}
              />
            </div>

            {/* Right Column - Language & Generate */}
            <div className='space-y-4'>
              <LanguageSelector
                outputLang={outputLang}
                setOutputLang={setOutputLang}
                disabled={isExtract}
              />
              <GenerateButton
                isGenerating={isGenerating}
                dialogueItems={dialogueItems}
                onClick={handleSubmitTask}
                onCancel={handleCancelTask}
              />
            </div>
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* Audience Settings - Only show when appropriate */}
        {isLongGenerating && (
          <>
            <motion.section variants={sectionVariants}>
              <AudienceSettings
                audienceChoice={audienceChoice}
                setAudienceChoice={setAudienceChoice}
              />
            </motion.section>
            <Separator className="my-8" />
          </>
        )}

        {/* Speaker Settings - Only show when not in extract mode */}
        {!isExtract && (
          <motion.section variants={sectionVariants}>
            <SpeakerSettings
              speakerNums={speakerNums}
              setSpeakerNums={setSpeakerNums}
              useSpeakerName={useSpeakerName}
              setUseSpeakerName={setUseSpeakerName}
              speakerNames={speakerNames}
              setSpeakerNames={setSpeakerNames}
              isExtract={isExtract}
              handleSpeakerNameChange={handleSpeakerNameChange}
            />
          </motion.section>
        )}

        {/* Custom Prompt Section - Only show when not in extract mode */}
        {!isExtract && (
          <>
            <Separator className="my-8" />
            <motion.section variants={sectionVariants}>
              <CustomPromptSection
                genDialogPrompt={genDialogPrompt}
                setGenDialogPrompt={setGenDialogPrompt}
              />
            </motion.section>
          </>
        )}
      </div>

      {/* Dialogue Items Section */}
      <motion.section variants={sectionVariants} className='w-full'>
        <DialogueSection
          dialogueItems={dialogueItems}
          setDialogueItems={setDialogueItems}
          addNewDialogue={addNewDialogue}
          handleDragEnd={handleDragEnd}
          sensors={sensors}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          isSelectionMode={isSelectionMode}
          setIsSelectionMode={setIsSelectionMode}
          handleBatchOptimize={handleBatchOptimize}
          isOptimizing={isOptimizing}
          optimizationPreviews={optimizationPreviews || {}}
          showBatchDialog={showBatchDialog}
          setShowBatchDialog={setShowBatchDialog}
        />
      </motion.section>

      {/* Navigation */}
      <motion.section variants={sectionVariants} className='sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 border-t'>
        <div className='max-w-5xl mx-auto'>
          <NavigationButtons
            stepper={stepper}
            canNext={canNext}
          />
        </div>
      </motion.section>
    </motion.div>
  )
}
