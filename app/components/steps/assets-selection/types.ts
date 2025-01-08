import { Resource } from '@/app/stores/use-podcast-info-store'
import { Stepper } from '@/app/hooks/use-stepper'

export interface AssetsSelectionPanelProps {
  stepper: Stepper
}

export interface SortableResourceItemProps {
  id: string
  resource: Resource
  isEditingResource: boolean
  onEdit: (resource: Resource) => void
  onDelete: (id: string) => void
}
