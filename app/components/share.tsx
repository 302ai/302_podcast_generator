'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClientTranslation } from '../hooks/use-client-translation'
import Tiptap from './tiptap/Tiptap'

export const DialogueItem = ({
  id,
  content,
  speaker,
  speakerNums,
}: {
  id: string
  content: string
  speaker: number
  speakerNums: number
}) => {
  const { t } = useClientTranslation()

  return (
    <div className='flex shrink-0 items-start gap-2 rounded border bg-background p-2 hover:bg-secondary'>
      <div className='flex shrink-0 items-center gap-2'>
        <div className='flex shrink-0'>
          <Select value={speaker.toString()} onValueChange={(value) => {}}>
            <SelectTrigger
              style={{
                backgroundColor: `hsl(${((speaker - 1) * 360) / speakerNums}, 70%, 80%)`,
                color: `hsl(${((speaker - 1) * 360) / speakerNums}, 100%, 30%)`,
              }}
            >
              <SelectValue placeholder='Speaker' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={speaker} value={speaker.toString()}>
                {t(`home:step.content-adjustment.role`)}{' '}
                {String.fromCharCode(64 + speaker)}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='min-h-9 flex-1 rounded-md focus-within:ring-2 focus-within:ring-primary'>
        <Tiptap
          content={content}
          onContentChange={(value) => {}}
          editable={false}
        />
      </div>
    </div>
  )
}
