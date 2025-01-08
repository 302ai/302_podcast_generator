import { Resource } from '@/app/stores/use-podcast-info-store'
import { UseTranslationReturnType } from '@/types/auth'

export interface SearchResourcePanelProps {
  onAddResources: (urls: string[]) => Promise<void>
  isLoadingContent?: boolean
  editingResource?: Resource
  onResourceSelect?: (urls: string[], content?: string) => void
}

export interface PreviewDialogProps {
  t: UseTranslationReturnType
}

export interface EditModeProps {
  editingResource: Resource
  onResourceSelect?: (urls: string[], content?: string) => void
  t: UseTranslationReturnType
}

export interface SearchModeProps {
  t: UseTranslationReturnType
}
