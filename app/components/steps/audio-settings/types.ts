import { Stepper } from '@/app/hooks/use-stepper'
import { CustomModel } from '@/app/stores/use-podcast-info-store'

export interface AudioSettingsPanelProps {
  stepper: Stepper
  customModels: CustomModel[]
  setCustomModels: (customModels: React.SetStateAction<CustomModel[]>) => void
  handleSubmitTask: () => void
}

export interface CustomSpeakerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customModels: CustomModel[]
  setCustomModels: (customModels: React.SetStateAction<CustomModel[]>) => void
}

export interface NavigationButtonsProps {
  stepper: Stepper
  handleSubmitTask: () => void
}

export interface AudioSelectProps {
  id: number
}
