import { DragEndEvent } from '@dnd-kit/core'
import { SensorDescriptor } from '@dnd-kit/core'
import { Dispatch, SetStateAction } from 'react'
import { PreviewMap } from './components/batch-optimize-dialog'
import type { Language } from '@/app/stores/use-podcast-info-store'

export type DialogueItem = {
  id: string
  content: string
  speaker: number
  isEditing?: boolean
}

export type DialogueItems = DialogueItem[]

export type BatchOptimizeType = 'tone_consistency' | 'make_concise' | 'fix_all' | 'custom'

export interface DialogueSectionProps {
  dialogueItems: DialogueItems
  setDialogueItems: (itemsOrUpdater: DialogueItems | ((items: DialogueItems) => DialogueItems)) => void
  addNewDialogue: () => void
  handleDragEnd: (event: DragEndEvent) => void
  sensors: SensorDescriptor<any>[]
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  isSelectionMode: boolean
  setIsSelectionMode: (mode: boolean) => void
  handleBatchOptimize: (type: BatchOptimizeType, customPrompt?: string) => Promise<void>
  isOptimizing: boolean
  optimizationPreviews: PreviewMap
  showBatchDialog: boolean
  setShowBatchDialog: Dispatch<SetStateAction<boolean>>
}

export interface DialogueItemProps extends DialogueItem {
  isEditing?: boolean
  isSelected?: boolean
  isSelectionMode?: boolean
  onSelect?: (id: string) => void
}

export interface NavigationButtonsProps {
  stepper: {
    next: () => void
    prev: () => void
  }
  canNext: boolean
}

export interface ContentAdjustmentPanelProps {
  stepper: {
    next: () => void
    prev: () => void
  }
}

export interface GenerationModeProps {
  isExtract: boolean
  setIsExtract: (value: boolean) => void
  isLongGenerating: boolean
  setIsLongGenerating: (value: boolean) => void
  disabled?: boolean
}

export interface LanguageSelectorProps {
  outputLang: Language
  setOutputLang: (lang: Language) => void
  disabled?: boolean
}

export interface GenerateButtonProps {
  isGenerating: boolean
  dialogueItems: DialogueItems
  onClick: () => void
  onCancel?: () => void
}

export interface AudienceSettingsProps {
  audienceChoice: number
  setAudienceChoice: (choice: number) => void
}

export interface SpeakerSettingsProps {
  speakerNums: number
  setSpeakerNums: (nums: number) => void
  useSpeakerName: boolean
  setUseSpeakerName: (use: boolean) => void
  speakerNames: string[]
  setSpeakerNames: (names: string[]) => void
  isExtract: boolean
  handleSpeakerNameChange: (index: number, value: string) => void
}

export interface CustomPromptSectionProps {
  genDialogPrompt: string
  setGenDialogPrompt: (prompt: string) => void
}

export interface SwitchItemProps {
  id: string
  label: string
  description: string
  icon: React.ReactElement
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export interface StatusResponse {
  status: 'success' | 'fail'
  result?: {
    contents?: DialogueItem[]
    error?: {
      err_code: number
    }
  }
}
