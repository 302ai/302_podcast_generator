import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { usePodcastInfoStore } from '@/app/stores/use-podcast-info-store'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { isString } from 'radash'
import { dialogueKy } from '@/lib/api/api'
import { logger } from '@/lib/logger'
import { AudioSelect } from './components/audio-select'
import { CustomSpeakerDialog } from './components/custom-speaker-dialog'
import { BGMSettings } from './components/bgm-settings'
import { NavigationButtons } from './components/navigation-buttons'
import { AudioSettingsPanelProps } from './types'
import { motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn",
      when: "afterChildren"
    }
  }
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
}

export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({
  stepper,
  customModels,
  setCustomModels,
  handleSubmitTask,
}) => {
  const { t } = useClientTranslation()
  const {
    dialogueItems,
    remoteProviderWithSpeakers,
    speakers,
    setSpeakers,
    setRemoteProviderWithSpeakers,
    contentLang,
  } = usePodcastInfoStore((state) => ({
    dialogueItems: state.dialogueItems,
    remoteProviderWithSpeakers: state.remoteProviderWithSpeakers,
    speakers: state.speakers,
    setSpeakers: state.setSpeakers,
    setRemoteProviderWithSpeakers: state.setRemoteProviderWithSpeakers,
    contentLang: state.lang,
  }))

  const [customSpeakerDialogOpen, setCustomSpeakerDialogOpen] = useState(false)

  useEffect(() => {
    dialogueKy
      .get('voice/model', {
        searchParams: {
          lang: contentLang,
        },
      })
      .json<Record<string, any>>()
      .then((res) => {
        setRemoteProviderWithSpeakers((prev) => ({
          ...prev,
          ...res,
        }))
      })
      .catch((err) => {
        if (isString(err.message) && err.message.includes('Network')) {
          logger.error(err)
          toast.error(t('home:step.audio-settings.network_error'))
        } else {
          toast.error(t('home:step.audio-settings.remote_provider_error'))
        }
        stepper.prev()
      })
  }, [setRemoteProviderWithSpeakers, t, stepper, contentLang])

  const realSpeakerNums = useMemo(() => {
    return new Set(dialogueItems.map((item) => item.speaker)).size
  }, [dialogueItems])

  useEffect(() => {
    if (speakers.length !== realSpeakerNums) {
      setSpeakers(
        Array.from({ length: realSpeakerNums }, (_, i) => ({
          id: i + 1,
          provider: 'doubao',
          speaker: 'zh_female_shuangkuaisisi_moon_bigtts',
          speed: 1,
        }))
      )
    }
  }, [speakers, realSpeakerNums, setSpeakers, remoteProviderWithSpeakers])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className='flex flex-1 flex-col gap-8 p-6 max-w-5xl mx-auto w-full'
    >
      {/* Main Content Container */}
      <div className='space-y-8 bg-card rounded-xl p-6 shadow-sm border'>
        {/* Speaker Settings Section */}
        <motion.section variants={sectionVariants} className='space-y-6'>
          <div className='flex flex-col gap-2'>
            <h2 className='text-xl font-semibold tracking-tight'>
              {t('home:step.audio-settings.speaker_settings')}
            </h2>
            <div className='flex items-center justify-between'>
              <p className='text-sm text-muted-foreground'>
                {t('home:step.audio-settings.custom_speaker_tip')}
              </p>
              <CustomSpeakerDialog
                open={customSpeakerDialogOpen}
                onOpenChange={setCustomSpeakerDialogOpen}
                customModels={customModels}
                setCustomModels={setCustomModels}
              />
            </div>
          </div>
          <div className='grid gap-6'>
            {Array.from({ length: realSpeakerNums }, (_, i) => i + 1).map((id) => (
              <AudioSelect key={id} id={id} />
            ))}
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* BGM Settings Section */}
        <motion.section variants={sectionVariants}>
          <BGMSettings />
        </motion.section>
      </div>

      {/* Navigation Buttons */}
      <motion.section variants={sectionVariants} className='sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 border-t'>
        <div className='max-w-5xl mx-auto'>
          <NavigationButtons
            stepper={stepper}
            handleSubmitTask={handleSubmitTask}
          />
        </div>
      </motion.section>
    </motion.div>
  )
}
