import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Button } from '@/components/ui/button'
import { CheckSquare, MessageSquarePlus, Plus, Settings2 } from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { DialogueItem } from './dialogue-item'
import { DialogueSectionProps, NavigationButtonsProps } from '../types'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { BatchOptimizeDialog } from './batch-optimize-dialog'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn"
    }
  }
}

const childVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: "easeOut"
    }
  }
}

export const DialogueSection: React.FC<DialogueSectionProps> = ({
  dialogueItems,
  setDialogueItems,
  addNewDialogue,
  handleDragEnd,
  sensors,
  selectedIds,
  setSelectedIds,
  isSelectionMode,
  setIsSelectionMode,
  handleBatchOptimize,
  isOptimizing,
  optimizationPreviews,
  showBatchDialog,
  setShowBatchDialog,
}) => {
  const { t } = useClientTranslation()

  return (
    <div className='flex w-full max-w-5xl flex-1 flex-col gap-4 overflow-y-auto rounded-xl bg-card p-6 shadow-sm border space-y-4 transition-all duration-300 hover:shadow-md hover:border-primary/20 relative isolate'>
      <motion.div variants={childVariants} className='flex items-center gap-2'>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className='h-4 w-4 text-primary' />
              <div className="flex flex-col">
                <h3 className='font-medium'>
                  {t('home:step.content-adjustment.dialogue_section')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('home:step.content-adjustment.dialogue_section_tip')}
                </p>
              </div>
            </div>
            {dialogueItems.length > 0 && (
              <div className="flex items-center gap-2">
                {isSelectionMode ? (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {t('home:step.content-adjustment.selected_count', { count: selectedIds.length })}
                    </span>
                    {selectedIds.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => setShowBatchDialog(true)}
                      >
                        <Settings2 className="h-4 w-4" />
                        {t('home:step.content-adjustment.batch_actions')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsSelectionMode(false)
                        setSelectedIds([])
                      }}
                    >
                      {t('home:step.content-adjustment.batch_optimize.cancel')}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setIsSelectionMode(true)
                      setSelectedIds([])
                    }}
                  >
                    <CheckSquare className="h-4 w-4" />
                    {t('home:step.content-adjustment.select_dialogues')}
                  </Button>
                )}
              </div>
            )}
          </div>
      </motion.div>

      {dialogueItems.length === 0 ? (
        <div className='flex w-full flex-1 items-center justify-center text-center text-sm text-muted-foreground bg-secondary/30 rounded-lg p-8'>
          {t('home:step.content-adjustment.no_dialogue_text')}
        </div>
      ) : (
        <DndContext
          onDragEnd={handleDragEnd}
          sensors={sensors}
          collisionDetection={closestCenter}
        >
          <SortableContext
            items={dialogueItems}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {dialogueItems.map((item) => (
                <DialogueItem
                  key={item.id}
                  {...item}
                  isEditing={(item as any).isEditing && item.content.length === 0}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.includes(item.id)}
                  onSelect={(id) => {
                    if (selectedIds.includes(id)) {
                      setSelectedIds(selectedIds.filter((i) => i !== id))
                    } else {
                      setSelectedIds([...selectedIds, id])
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {dialogueItems.length > 0 && (
        <Button
          variant='outline'
          onClick={addNewDialogue}
          className='w-full gap-2 transition-all duration-300 hover:bg-primary hover:text-primary-foreground active:scale-[0.98]'
        >
          <Plus className='h-4 w-4' />
          {t('home:step.content-adjustment.add_dialogue')}
        </Button>
      )}

      {showBatchDialog && handleBatchOptimize && (
        <BatchOptimizeDialog
          selectedIds={selectedIds}
          onClose={() => setShowBatchDialog(false)}
          onOptimize={handleBatchOptimize}
          onApply={(previews) => {
            setDialogueItems((prevItems) => {
              const updatedItems = prevItems.map(item => {
                const preview = previews[item.id]
                if (preview?.optimized) {
                  return {
                    ...item,
                    id: `${item.id}-${Date.now()}`,
                    content: preview.optimized
                  }
                }
                return item
              })

              requestAnimationFrame(() => {
                setIsSelectionMode(false)
                setSelectedIds([])
                setShowBatchDialog(false)
              })

              return updatedItems
            })
          }}
          isOptimizing={isOptimizing}
          optimizationPreviews={optimizationPreviews}
        />
      )}
    </div>
  )
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  stepper,
  canNext,
}) => {
  const { t } = useClientTranslation()

  return (
    <motion.div
      layout
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className='w-full max-w-5xl flex justify-end gap-4'
    >
      <motion.div variants={childVariants}>
        <Button
          variant='ghost'
          onClick={() => stepper.prev()}
          className='group relative overflow-hidden transition-all duration-300 hover:bg-secondary/80'
        >
          <span className='relative flex items-center gap-2'>
            {t('home:step.prev')}
          </span>
        </Button>
      </motion.div>
      <motion.div variants={childVariants}>
        <Button
          onClick={() => stepper.next()}
          disabled={!canNext}
          className='group relative overflow-hidden bg-gradient-to-br from-primary to-primary/90 transition-all duration-300 hover:from-primary/95 hover:to-primary disabled:from-gray-400 disabled:to-gray-400/90'
        >
          <span className='relative flex items-center gap-2'>
            {t('home:step.next')}
          </span>
          <span className='absolute inset-0 flex items-center justify-center bg-primary/0 transition-colors duration-300 group-hover:bg-black/5' />
        </Button>
      </motion.div>
    </motion.div>
  )
}
