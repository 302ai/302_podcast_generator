import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { usePodcastInfoStore } from '@/app/stores/use-podcast-info-store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Music2, Gauge, VolumeX, Wand2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const childVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

const contentVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      height: {
        duration: 0.4,
        ease: "easeOut"
      },
      opacity: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        duration: 0.3,
        ease: "easeIn"
      },
      opacity: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  }
}

export const BGMSettings = () => {
  const { t } = useClientTranslation()

  const {
    useBgm,
    autoGenBgm,
    bgmPrompt,
    bgmVolume,
    setUseBgm,
    setAutoGenBgm,
    setBgmPrompt,
    setBgmVolume,
  } = usePodcastInfoStore((state) => ({
    useBgm: state.useBgm,
    autoGenBgm: state.autoGenBgm,
    bgmPrompt: state.bgmPrompt,
    bgmVolume: state.bgmVolume,
    setUseBgm: state.setUseBgm,
    setAutoGenBgm: state.setAutoGenBgm,
    setBgmPrompt: state.setBgmPrompt,
    setBgmVolume: state.setBgmVolume,
  }))

  return (
    <motion.div
      variants={childVariants}
      className='rounded-xl border bg-card p-6 space-y-6 transition-all duration-300 hover:shadow-md hover:border-primary/20'
    >
      {/* Header */}
      <motion.div variants={childVariants} className='flex items-center gap-2'>
        <Music2 className='h-4 w-4 text-primary' />
        <h3 className='font-medium'>
          {t('home:step.audio-settings.bgm_settings')}
        </h3>
      </motion.div>

      <motion.div variants={childVariants} className='space-y-6'>
        <div className='grid gap-6 md:grid-cols-2'>
          {/* BGM Enable Switch */}
          <div className='flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30 transition-colors duration-300 hover:bg-secondary/50'>
            <Label htmlFor='enable_bgm' className='cursor-pointer flex items-center gap-2 text-sm'>
              <Music2 className='h-3.5 w-3.5 text-muted-foreground' />
              {t('home:step.audio-settings.enable_bgm')}
            </Label>
            <Switch
              id='enable_bgm'
              checked={useBgm}
              onCheckedChange={setUseBgm}
              className='transition-all duration-300 hover:ring-2 hover:ring-primary/50 data-[state=checked]:bg-primary'
            />
          </div>

          {/* Gain Control */}
          <div className='flex items-center gap-4 p-3 rounded-lg bg-secondary/30 transition-colors duration-300 hover:bg-secondary/50'>
            <Gauge className='h-4 w-4 shrink-0 text-muted-foreground' />
            <div className='flex items-center gap-3 flex-1'>
              <div className='flex flex-col gap-1.5 flex-1'>
                <span className='text-xs text-muted-foreground'>{t('home:step.audio-settings.gain')}</span>
                <Slider
                  className='flex-1'
                  value={[bgmVolume]}
                  onValueChange={([value]) => setBgmVolume(value)}
                  min={-20}
                  max={20}
                  step={1}
                />
              </div>
              <span className='w-8 text-right font-medium text-sm'>{bgmVolume > 0 ? '+' : ''}{bgmVolume}</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {useBgm && (
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className='space-y-6'
            >
              {/* Auto BGM Switch */}
              <div className='flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30 transition-colors duration-300 hover:bg-secondary/50'>
                <Label htmlFor='auto_bgm' className='cursor-pointer flex items-center gap-2 text-sm'>
                  <Wand2 className='h-3.5 w-3.5 text-muted-foreground' />
                  {t('home:step.audio-settings.auto_bgm')}
                </Label>
                <Switch
                  id='auto_bgm'
                  checked={autoGenBgm}
                  onCheckedChange={setAutoGenBgm}
                  className='transition-all duration-300 hover:ring-2 hover:ring-primary/50 data-[state=checked]:bg-primary'
                />
              </div>

              {/* BGM Prompt */}
              <div className='space-y-3'>
                <Label htmlFor='bgm_prompt' className='text-sm flex items-center gap-2'>
                  <Music2 className='h-3.5 w-3.5 text-muted-foreground' />
                  {t('home:step.audio-settings.bgm_prompt_label')}
                </Label>
                <Textarea
                  id='bgm_prompt'
                  value={bgmPrompt}
                  onChange={(e) => setBgmPrompt(e.target.value)}
                  disabled={!useBgm || autoGenBgm}
                  placeholder={t('home:step.audio-settings.bgm_prompt_placeholder')}
                  className={cn(
                    'min-h-[120px] resize-y rounded-lg transition-all duration-300',
                    'focus:ring-2 focus:ring-primary',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'hover:border-primary/50'
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
