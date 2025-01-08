import { AudioSettingsPanel as AudioSettingsPanelComponent } from './audio-settings'
import type { AudioSettingsPanelProps } from './audio-settings/types'

export const AudioSettingsPanel = (props: AudioSettingsPanelProps) => {
  return <AudioSettingsPanelComponent {...props} />
}
