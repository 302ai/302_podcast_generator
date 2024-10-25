import { defineStepper } from '@stepperize/react'

export const { useStepper, steps } = defineStepper(
  {
    id: 'assets-selection',
    i18n: 'home:stepper.assets_selection',
    description: 'Select your assets',
  },
  {
    id: 'content-adjustment',
    i18n: 'home:stepper.content_adjustment',
    description: 'Adjust your content',
  },
  {
    id: 'audio-settings',
    i18n: 'home:stepper.audio_settings',
    description: 'Set your audio settings',
  },
  {
    id: 'podcast-generation',
    i18n: 'home:stepper.podcast_generation',
    description: 'Generate your podcast',
  }
)

export type Stepper = ReturnType<typeof useStepper>
export type Step = ReturnType<typeof useStepper>['all'][number]['id']
