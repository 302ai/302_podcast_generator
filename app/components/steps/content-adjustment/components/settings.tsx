import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { speakerNumsList } from '@/app/stores/use-podcast-info-store'
import { AudienceSettingsProps, SpeakerSettingsProps, CustomPromptSectionProps } from '../types'
import { SwitchItem } from './switch-item'
import { AnimatePresence, motion } from 'framer-motion'
import { Target, Users2, UserSquare2, PenLine } from 'lucide-react'

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

export const AudienceSettings: React.FC<AudienceSettingsProps> = ({
  audienceChoice,
  setAudienceChoice,
}) => {
  const { t } = useClientTranslation()

  return (
    <div className='space-y-6'>
      <motion.div variants={childVariants} className='flex items-center gap-2'>
        <Target className='h-4 w-4 text-primary' />
        <h3 className='font-medium'>
          {t('home:step.content-adjustment.audience_settings')}
        </h3>
      </motion.div>
      <motion.div variants={childVariants} className='flex flex-col gap-2.5'>
        <Label htmlFor='audience-choice' className='text-sm flex items-center gap-2'>
          <Users2 className='h-3.5 w-3.5 text-muted-foreground' />
          {t('home:step.content-adjustment.audience_choice')}
        </Label>
        <Select
          value={audienceChoice.toString()}
          onValueChange={(value) => setAudienceChoice(parseInt(value))}
        >
          <SelectTrigger className="w-full md:w-1/2 transition-all duration-300 hover:ring-2 hover:ring-primary/50">
            <SelectValue
              id='audience-choice'
              placeholder={t('home:step.content-adjustment.audience_choice_placeholder')}
            />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: "0", label: "audience_choice_none" },
              { value: "1", label: "audience_choice_children" },
              { value: "2", label: "audience_choice_elderly" },
              { value: "3", label: "audience_choice_office_workers" },
              { value: "4", label: "audience_choice_students" },
              { value: "5", label: "audience_choice_college" },
              { value: "6", label: "audience_choice_business" },
              { value: "7", label: "audience_choice_researchers" },
              { value: "8", label: "audience_choice_parents" }
            ].map(({ value, label }) => (
              <SelectItem
                key={value}
                value={value}
                className="transition-colors duration-200 hover:bg-primary/10"
              >
                {t(`home:step.content-adjustment.${label}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>
    </div>
  )
}

export const SpeakerSettings: React.FC<SpeakerSettingsProps> = ({
  speakerNums,
  setSpeakerNums,
  useSpeakerName,
  setUseSpeakerName,
  speakerNames,
  isExtract,
  handleSpeakerNameChange,
}) => {
  const { t } = useClientTranslation()

  return (
    <div className='space-y-6'>
      <motion.div variants={childVariants} className='flex items-center gap-2'>
        <Users2 className='h-4 w-4 text-primary' />
        <h3 className='font-medium'>
          {t('home:step.content-adjustment.speaker_settings')}
        </h3>
      </motion.div>

      <motion.div variants={childVariants} className='space-y-6'>
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Speaker Numbers */}
          <div className='flex flex-col gap-2.5'>
            <Label htmlFor='speaker-nums' className='text-sm flex items-center gap-2'>
              <UserSquare2 className='h-3.5 w-3.5 text-muted-foreground' />
              {t('home:step.content-adjustment.speaker_nums_label')}
            </Label>
            <Select
              value={speakerNums.toString()}
              onValueChange={(value) => setSpeakerNums(parseInt(value))}
              disabled={isExtract}
            >
              <SelectTrigger className="w-full transition-all duration-300 hover:ring-2 hover:ring-primary/50 disabled:opacity-50 disabled:hover:ring-0">
                <SelectValue
                  id='speaker-nums'
                  placeholder={t('home:step.content-adjustment.speaker_nums_placeholder')}
                />
              </SelectTrigger>
              <SelectContent>
                {speakerNumsList.map((num) => (
                  <SelectItem
                    key={num}
                    value={num.toString()}
                    className="transition-colors duration-200 hover:bg-primary/10"
                  >
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Use Speaker Name Switch */}
          <SwitchItem
            id="use-speaker-name"
            checked={useSpeakerName}
            onCheckedChange={setUseSpeakerName}
            disabled={isExtract}
            label={t('home:step.content-adjustment.use_speaker_name')}
            description={t('home:step.content-adjustment.use_speaker_name_description')}
            icon={<UserSquare2 className="h-4 w-4 text-primary" />}
          />
        </div>

        {/* Speaker Names Grid with Quick Sequential Popup Animation */}
        <AnimatePresence mode="wait">
          {useSpeakerName && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: 1,
                height: "auto",
                transition: {
                  height: {
                    duration: 0.2,
                    ease: "easeOut"
                  },
                  opacity: {
                    duration: 0.15,
                    ease: "easeOut"
                  }
                }
              }}
              exit={{
                opacity: 0,
                height: 0,
                transition: {
                  height: {
                    duration: 0.15,
                    ease: "easeIn"
                  },
                  opacity: {
                    duration: 0.1,
                    ease: "easeIn"
                  }
                }
              }}
            >
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {speakerNames.map((name, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        duration: 0.15,
                        delay: index * 0.03,
                        ease: "easeOut"
                      }
                    }}
                    exit={{
                      opacity: 0,
                      y: -10,
                      scale: 0.95,
                      transition: {
                        duration: 0.1,
                        ease: "easeIn"
                      }
                    }}
                    className='flex flex-col gap-2.5'
                  >
                    <Label
                      htmlFor={`speaker-name-${index}`}
                      className='text-sm flex items-center gap-2'
                    >
                      <UserSquare2 className='h-3.5 w-3.5 text-muted-foreground' />
                      {t('home:step.content-adjustment.speaker_name_label')}{' '}
                      {String.fromCharCode(64 + index + 1)}
                    </Label>
                    <Input
                      id={`speaker-name-${index}`}
                      placeholder={t('home:step.content-adjustment.speaker_name_placeholder')}
                      value={name}
                      onChange={(e) => handleSpeakerNameChange(index, e.target.value)}
                      className="transition-all duration-300 hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export const CustomPromptSection: React.FC<CustomPromptSectionProps> = ({
  genDialogPrompt,
  setGenDialogPrompt,
}) => {
  const { t } = useClientTranslation()

  return (
    <div className='space-y-6'>
      <motion.div variants={childVariants} className='flex items-center gap-2'>
        <PenLine className='h-4 w-4 text-primary' />
        <h3 className='font-medium'>
          {t('home:step.content-adjustment.custom_prompt')}
        </h3>
      </motion.div>
      <motion.div variants={childVariants}>
        <Textarea
          id='custom_prompt'
          placeholder={t('home:step.content-adjustment.custom_prompt_placeholder')}
          value={genDialogPrompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGenDialogPrompt(e.target.value)}
          className='min-h-[120px] resize-y rounded-lg transition-all duration-300 hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary'
        />
      </motion.div>
    </div>
  )
}
