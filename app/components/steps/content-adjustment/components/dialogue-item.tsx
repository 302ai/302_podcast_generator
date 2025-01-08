import { usePodcastInfoStore } from '@/app/stores/use-podcast-info-store'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Editor } from '@tiptap/react'
import { GripVertical, Trash2, UserCircle2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Tiptap from '../../../tiptap/Tiptap'
import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { DialogueItemProps } from '../types'

export const DialogueItem: React.FC<DialogueItemProps> = ({
  id,
  content,
  speaker,
  isEditing = false,
  isSelected = false,
  onSelect,
  isSelectionMode = false,
}) => {
  const { t } = useClientTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  } : undefined

  const { speakerNums, setDialogueItems, speakerNames, useSpeakerName } =
    usePodcastInfoStore((state) => ({
      speakerNums: state.speakerNums,
      setDialogueItems: state.setDialogueItems,
      speakerNames: state.speakerNames,
      useSpeakerName: state.useSpeakerName,
    }))

  const handleSpeakerChange = useCallback((value: string) => {
    setDialogueItems((items) => {
      const newItems = [...items]
      const index = newItems.findIndex((item) => item.id === id)
      newItems[index].speaker = parseInt(value)
      return newItems
    })
  }, [id, setDialogueItems])

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
  const [isFocused, setIsFocused] = useState(false)

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
      className={`relative flex shrink-0 items-start gap-4 rounded-xl border bg-card p-4 touch-none will-change-transform
        ${isFocused ? 'ring-2 ring-primary' : ''}
        ${isDragging
          ? 'opacity-50 shadow border-primary/20 cursor-grabbing'
          : isSelected
          ? 'shadow-md border-primary ring-1 ring-primary'
          : 'hover:shadow hover:border-primary/20'
        }
        ${isSelectionMode ? 'cursor-pointer' : ''}`}
        onClick={(e) => {
          if (isSelectionMode && onSelect) {
            e.stopPropagation()
            onSelect(id)
          }
        }}
    >
      <div className='flex shrink-0 items-center gap-3 relative'>
        {isSelectionMode && (
          <div className='absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full'>
            <div
              className={`size-4 rounded border ${
                isSelected
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground'
              }`}
            >
              {isSelected && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-4 text-primary-foreground"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
        )}
        <div className="relative">
          <GripVertical
            className={`shrink-0 text-muted-foreground hover:text-primary ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            size={16}
            {...attributes}
            {...listeners}
          />
        </div>
        <div className='flex shrink-0'>
          <Select
            value={speaker.toString()}
            onValueChange={handleSpeakerChange}
          >
            <SelectTrigger
              className="min-w-32 hover:ring-2 hover:ring-primary/50 group"
              style={{
                backgroundColor: `hsl(${((speaker - 1) * 360) / speakerNums}, 70%, 95%)`,
                color: `hsl(${((speaker - 1) * 360) / speakerNums}, 100%, 30%)`,
              }}
            >
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-current opacity-70 group-hover:opacity-100" />
                <SelectValue>
                  {useSpeakerName
                    ? speakerNames[speaker - 1] || `${t(`home:step.content-adjustment.role`)} ${String.fromCharCode(64 + speaker)}`
                    : t(`home:step.content-adjustment.role`) +
                      ' ' +
                      String.fromCharCode(64 + speaker)}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: speakerNums }, (_, i) => i + 1).map(
                (speaker) => (
                  <SelectItem
                    key={speaker}
                    value={speaker.toString()}
                    className="hover:bg-primary/10"
                  >
                    {useSpeakerName
                      ? speakerNames[speaker - 1] || `${t(`home:step.content-adjustment.role`)} ${String.fromCharCode(64 + speaker)}`
                      : t(`home:step.content-adjustment.role`) +
                        ' ' +
                        String.fromCharCode(64 + speaker)}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        className={`relative min-h-9 flex-1 rounded-lg`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <Tiptap
          setEditor={setEditor}
          content={content}
          onContentChange={handleContentChange}
        />
      </div>
      <div>
        <Button
          variant='ghost'
          size='icon'
          className='size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          onClick={handleDelete}
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}
