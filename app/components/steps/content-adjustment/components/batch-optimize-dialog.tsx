import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Send } from 'lucide-react'
import { BatchOptimizeType } from '../types'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import LogoIcon from '@/app/components/icons/logo-icon'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type PreviewItem = {
  original: string
  optimized: string
}

export type PreviewMap = {
  [key: string]: PreviewItem
}

export interface BatchOptimizeProps {
  selectedIds: string[]
  onClose: () => void
  onOptimize: (type: BatchOptimizeType, customPrompt?: string) => Promise<void>
  onApply: (previews: PreviewMap) => void
  isOptimizing: boolean
  optimizationPreviews: PreviewMap
}

export const BatchOptimizeDialog: React.FC<BatchOptimizeProps> = ({
  selectedIds,
  onClose,
  onOptimize,
  onApply,
  isOptimizing,
  optimizationPreviews,
}) => {
  const { t } = useClientTranslation()
  const [editedPreviews, setEditedPreviews] = useState<PreviewMap>({})
  const [customPrompt, setCustomPrompt] = useState('')

  useEffect(() => {
    setEditedPreviews(optimizationPreviews)
  }, [optimizationPreviews])

  const handleOptimize = async (type: BatchOptimizeType) => {
    if (isOptimizing) return
    try {
      await onOptimize(type, type === 'custom' ? customPrompt : undefined)
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const handleContentChange = (id: string, newContent: string) => {
    setEditedPreviews(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        optimized: newContent
      }
    }))
  }

  const handleApply = () => {
    onApply(editedPreviews)
    setEditedPreviews({})
    setCustomPrompt('')
  }

  const handleClose = () => {
    if (isOptimizing) return
    setEditedPreviews({})
    setCustomPrompt('')
    onClose()
  }

  const handleCustomOptimize = async () => {
    if (!customPrompt.trim()) {
      toast.error(t('home:tiptap.empty_input_warning'))
      return
    }
    await handleOptimize('custom')
  }

  const hasOptimizations = optimizationPreviews && Object.keys(optimizationPreviews).length > 0

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{t('home:step.content-adjustment.batch_optimize.title')}</DialogTitle>
          <DialogDescription asChild>
            {isOptimizing ? (
              <span className="flex items-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('home:step.content-adjustment.batch_optimize.loading', { count: selectedIds.length })}</span>
              </span>
            ) : hasOptimizations ? (
              <span>{t('home:step.content-adjustment.batch_optimize.review')}</span>
            ) : (
              <span>{t('home:step.content-adjustment.batch_optimize.select_type', { count: selectedIds.length })}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {!hasOptimizations && (
          <div className='flex flex-col gap-2 p-2'>
            <div className='relative'>
              <div className='absolute left-2 top-1/2 -translate-y-1/2'>
                <LogoIcon className='size-6' />
              </div>
              <Input
                placeholder={t('home:tiptap.input_placeholder')}
                className='h-12 border-primary bg-background pl-10 pr-10 shadow-sm shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-100'
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleCustomOptimize()
                  }
                }}
                disabled={isOptimizing}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='group absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center bg-transparent p-0'
                    onClick={handleCustomOptimize}
                    disabled={isOptimizing}
                  >
                    {isOptimizing ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Send className='size-4 text-primary group-hover:text-primary/80' />
                    )}
                  </button>
                </TooltipTrigger>
                {!customPrompt && <TooltipContent>{t('home:tiptap.empty_input_warning')}</TooltipContent>}
              </Tooltip>
            </div>
            <div>
              <div className='text-xs text-muted-foreground mb-1'>{t('home:tiptap.preset_prompts')}</div>
              <div className='grid grid-cols-2 gap-1'>
                {['concise', 'formal', 'casual', 'grammar', 'typo'].map((type) => (
                  <button
                    key={type}
                    className='text-xs px-2 py-1 rounded border hover:bg-accent text-left'
                    onClick={() => setCustomPrompt(t(`home:tiptap.preset_${type}`))}
                  >
                    {t(`home:tiptap.preset_${type}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {editedPreviews && Object.keys(editedPreviews).length > 0 && (
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4">
              {Object.entries(editedPreviews).map(([id, preview]) => (
                <div key={id} className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">{t('home:step.content-adjustment.batch_optimize.original')}</div>
                      <div className="rounded-md border p-3 text-sm">{preview.original}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">{t('home:step.content-adjustment.batch_optimize.optimized')}</div>
                      {preview.optimized !== undefined ? (
                        <textarea
                          className="w-full min-h-[100px] rounded-md border border-primary bg-primary/5 p-3 text-sm"
                          value={preview.optimized}
                          onChange={(e) => handleContentChange(id, e.target.value)}
                        />
                      ) : (
                        <Skeleton className="h-20 w-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          {!hasOptimizations ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleOptimize('tone_consistency')}
                disabled={isOptimizing}
              >
                {t('home:step.content-adjustment.batch_optimize.tone_consistency')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOptimize('make_concise')}
                disabled={isOptimizing}
              >
                {t('home:step.content-adjustment.batch_optimize.make_concise')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOptimize('fix_all')}
                disabled={isOptimizing}
              >
                {t('home:step.content-adjustment.batch_optimize.fix_all')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                onClick={handleApply}
                disabled={isOptimizing}
              >
                {t('home:step.content-adjustment.batch_optimize.apply')}
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={isOptimizing}
              >
                {t('home:step.content-adjustment.batch_optimize.cancel')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
