import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Stepper } from '@/app/hooks/use-stepper'
import {
  DialogueItems,
  DialogueItem as DialogueItemType,
  languageList,
  speakerNumsList,
  usePodcastInfoStore,
} from '@/app/stores/use-podcast-info-store'
import { useUserStore } from '@/app/stores/use-user-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { dialogueKy } from '@/lib/api/api'
import { logger } from '@/lib/logger'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Editor } from '@tiptap/react'
import { convert } from 'html-to-text'
import ISO6391 from 'iso-639-1'
import { Grip, Loader2, Plus, Trash2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import { env } from 'next-runtime-env'
import { range } from 'radash'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Tiptap from '../tiptap/Tiptap'

const DialogueItem = ({
  id,
  content,
  speaker,
  isEditing = false,
}: {
  id: string
  content: string
  speaker: number
  isEditing?: boolean
}) => {
  const { t } = useClientTranslation()
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const { speakerNums, setDialogueItems } = usePodcastInfoStore((state) => ({
    speakerNums: state.speakerNums,
    setDialogueItems: state.setDialogueItems,
  }))

  const handleSpeakerChange = (value: string) => {
    setDialogueItems((items) => {
      const newItems = [...items]
      const index = newItems.findIndex((item) => item.id === id)
      newItems[index].speaker = parseInt(value)
      return newItems
    })
  }

  const handleContentChange = (value: string) => {
    setDialogueItems((items) => {
      const index = items.findIndex((item) => item.id === id)
      items[index].content = value
      return items
    })
  }

  const handleDelete = () => {
    setDialogueItems((items) => items.filter((item) => item.id !== id))
  }

  const [editor, setEditor] = useState<Editor | null>(null)

  useEffect(() => {
    if (editor && isEditing) {
      setTimeout(() => {
        editor.commands.focus()

        editor.commands.setTextSelection(content.length)
      }, 0)
    }
  }, [isEditing, editor, content.length])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex shrink-0 items-start gap-2 rounded border bg-background p-2 hover:bg-secondary'
    >
      <div className='flex shrink-0 items-center gap-2'>
        <Grip
          className='shrink-0 cursor-move focus:outline-none'
          size={16}
          {...attributes}
          {...listeners}
        />
        <div className='flex shrink-0'>
          <Select
            value={speaker.toString()}
            onValueChange={handleSpeakerChange}
          >
            <SelectTrigger
              style={{
                backgroundColor: `hsl(${((speaker - 1) * 360) / speakerNums}, 70%, 80%)`,
                color: `hsl(${((speaker - 1) * 360) / speakerNums}, 100%, 30%)`,
              }}
            >
              <SelectValue placeholder='Speaker' />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: speakerNums }, (_, i) => i + 1).map(
                (speaker) => (
                  <SelectItem key={speaker} value={speaker.toString()}>
                    {t(`home:step.content-adjustment.role`)}{' '}
                    {String.fromCharCode(64 + speaker)}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='min-h-9 flex-1 rounded-md focus-within:ring-2 focus-within:ring-primary'>
        <Tiptap
          setEditor={setEditor}
          content={content}
          onContentChange={handleContentChange}
        />
      </div>
      <div>
        <Button
          variant='outline'
          size='icon'
          className='size-8 p-0 hover:bg-background hover:text-destructive'
          onClick={handleDelete}
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}

export const ContentAdjustmentPanel = ({ stepper }: { stepper: Stepper }) => {
  const { t } = useClientTranslation()

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
  } = usePodcastInfoStore((state) => ({
    outputLang: state.lang,
    setOutputLang: state.setLang,
    speakerNums: state.speakerNums,
    setSpeakerNums: state.setSpeakerNums,
    speakerNames: state.speakerNames,
    setSpeakerNames: state.setSpeakerNames,
  }))

  const defaultLang = useMemo(() => {
    const lang = languageList.find((lang) => lang === uiLang) || 'en'
    return lang
  }, [uiLang])

  useEffect(() => {
    setOutputLang(defaultLang)
  }, [defaultLang, setOutputLang])

  const [isGenerating, setIsGenerating] = useState(false)

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

  const generateDialogueText = async () => {
    setIsGenerating(true)
    const resources = usePodcastInfoStore
      .getState()
      .resources.map((resource) => {
        if (resource.type === 'file') {
          return {
            type: resource.type,
            content: resource.url,
          }
        }
        return {
          type: resource.type,
          content: resource.content,
        }
      })
    try {
      const res = await dialogueKy
        .post('dialogue/text', {
          json: {
            resources,
            speakerNums,
            names: useSpeakerName
              ? speakerNames
              : new Array(speakerNums).fill(''),
            lang: outputLang,
            modelName: env('NEXT_PUBLIC_DEFAULT_MODEL_NAME'),
            isExtract,
            customPrompt: genDialogPrompt,
          },
        })
        .json<{
          contents: DialogueItems
        }>()
      setDialogueItems(res.contents.map((item) => ({ ...item, id: nanoid() })))
      if (isExtract) {
        const numsInDialogue = Array.from(
          new Set(res.contents.map((item) => item.speaker))
        ).length
        if (numsInDialogue !== speakerNums) {
          setSpeakerNums(numsInDialogue)
        }
      }
    } catch (error) {
      logger.error(error)
      toast.error(
        t('home:step.content-adjustment.generate_dialogue_text_error')
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setDialogueItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

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

  const { useSpeakerName, setUseSpeakerName } = usePodcastInfoStore(
    (state) => ({
      useSpeakerName: state.useSpeakerName,
      setUseSpeakerName: state.setUseSpeakerName,
    })
  )

  useEffect(() => {
    if (useSpeakerName && speakerNums !== speakerNames.length) {
      setSpeakerNames(new Array(speakerNums).fill(''))
    }
  }, [speakerNums, setSpeakerNames, useSpeakerName, speakerNames])
  return (
    <div className='flex flex-1 flex-col items-center gap-4 p-4'>
      <div className='flex items-end justify-center gap-4 md:gap-8'>
        <div className='flex w-24 shrink-0 flex-col items-start gap-2 md:w-36'>
          <Label htmlFor='speaker-nums'>
            {t('home:step.content-adjustment.speaker_nums_label')}
          </Label>
          <Select
            value={speakerNums.toString()}
            onValueChange={(value) => setSpeakerNums(parseInt(value))}
            disabled={isExtract}
          >
            <SelectTrigger>
              <SelectValue
                id='speaker-nums'
                placeholder={t(
                  'home:step.content-adjustment.speaker_nums_placeholder'
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {speakerNumsList.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-24 shrink-0 flex-col items-start gap-2 md:w-36'>
          <Label htmlFor='output-language'>
            {t('home:step.content-adjustment.output_language_label')}
          </Label>
          <Select
            value={outputLang}
            onValueChange={setOutputLang}
            disabled={isExtract}
          >
            <SelectTrigger>
              <SelectValue
                id='output-language'
                placeholder={t(
                  'home:step.content-adjustment.output_language_placeholder'
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {languageList.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {ISO6391.getNativeName(lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-2 self-end'>
          <Button
            className='w-24 gap-2'
            onClick={generateDialogueText}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                {t('home:step.content-adjustment.generating_btn')}
              </>
            ) : dialogueItems.length > 0 ? (
              t('home:step.content-adjustment.regenerate_btn')
            ) : (
              t('home:step.content-adjustment.generate_btn')
            )}
          </Button>
        </div>
      </div>
      <div className='flex w-full max-w-[448px] flex-col gap-2'>
        {useSpeakerName &&
          speakerNames.map((name, index) => (
            <div key={index} className='flex w-full flex-col items-start gap-2'>
              <Label htmlFor={`speaker-name-${index}`}>
                {t('home:step.content-adjustment.speaker_name_label')}{' '}
                {String.fromCharCode(64 + index + 1)}
              </Label>
              <Input
                id={`speaker-name-${index}`}
                placeholder={t(
                  'home:step.content-adjustment.speaker_name_placeholder'
                )}
                value={name}
                onChange={(e) => handleSpeakerNameChange(index, e.target.value)}
              />
            </div>
          ))}
      </div>
      {!isExtract && (
        <div className='flex w-full max-w-[448px] flex-col items-start gap-2'>
          <Label htmlFor='custom_prompt'>
            {t('home:step.content-adjustment.custom_prompt')}
          </Label>
          <Textarea
            id='custom_prompt'
            placeholder={t(
              'home:step.content-adjustment.custom_prompt_placeholder'
            )}
            value={genDialogPrompt}
            onChange={(e) => setGenDialogPrompt(e.target.value)}
          />
        </div>
      )}
      <div className='flex items-center justify-center gap-2'>
        <div className='flex items-center justify-center gap-2'>
          <Switch
            id='use-speaker-name'
            checked={useSpeakerName}
            onCheckedChange={setUseSpeakerName}
            disabled={isExtract}
          />
          <Label htmlFor='use-speaker-name'>
            {t('home:step.content-adjustment.use_speaker_name')}
          </Label>
        </div>
        <div className='flex items-center justify-center gap-2'>
          <Switch
            id='extract_dialogue'
            checked={isExtract}
            onCheckedChange={setIsExtract}
          />
          <Label htmlFor='extract_dialogue'>
            {t('home:step.content-adjustment.extract_dialogue')}
          </Label>
        </div>
      </div>
      <div className='text-center text-sm text-muted-foreground'>
        {t('home:step.content-adjustment.regenerate_tip')}
      </div>
      <div className='flex w-full flex-1 flex-col gap-2 overflow-y-auto rounded border p-4'>
        {dialogueItems.length === 0 && (
          <div className='flex w-full flex-1 items-center justify-center text-center text-sm text-muted-foreground'>
            {t('home:step.content-adjustment.no_dialogue_text')}
          </div>
        )}
        <DndContext
          onDragEnd={handleDragEnd}
          sensors={sensors}
          collisionDetection={closestCenter}
        >
          <SortableContext
            items={dialogueItems}
            strategy={verticalListSortingStrategy}
          >
            {dialogueItems.map((item, index) => (
              <DialogueItem
                key={item.id}
                {...item}
                isEditing={
                  (item as DialogueItemType & { isEditing: boolean })
                    .isEditing && convert(item.content).length === 0
                    ? true
                    : false
                }
              />
            ))}
          </SortableContext>
        </DndContext>
        {dialogueItems.length > 0 && (
          <Button variant='outline' onClick={addNewDialogue} className='gap-2'>
            <Plus className='h-4 w-4' />
            {t('home:step.content-adjustment.add_dialogue')}
          </Button>
        )}
      </div>
      <div className='mb-4 flex h-1/2 justify-end gap-2 md:h-auto'>
        <Button variant='outline' onClick={() => stepper.prev()}>
          {t('home:step.prev')}
        </Button>
        <Button onClick={() => stepper.next()} disabled={!canNext}>
          {t('home:step.next')}
        </Button>
      </div>
    </div>
  )
}
