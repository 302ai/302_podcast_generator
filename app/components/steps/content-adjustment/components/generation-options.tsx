import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe, Loader2, Sparkles, Wand2, X } from 'lucide-react'
import ISO6391 from 'iso-639-1'
import { languageList } from '@/app/stores/use-podcast-info-store'
import { SwitchItem } from './switch-item'
import { GenerationModeProps, LanguageSelectorProps, GenerateButtonProps } from '../types'
import { motion } from 'framer-motion'

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

export const GenerationModeSwitch: React.FC<GenerationModeProps> = ({
  isExtract,
  setIsExtract,
  isLongGenerating,
  setIsLongGenerating,
  disabled,
}) => {
  const { t } = useClientTranslation()

  const handleExtractChange = (checked: boolean) => {
    setIsExtract(checked)
    if (checked) {
      setIsLongGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <motion.div variants={childVariants}>
        <SwitchItem
          id="extract_dialogue"
          checked={isExtract}
          onCheckedChange={handleExtractChange}
          label={t('home:step.content-adjustment.extract_dialogue')}
          description={t('home:step.content-adjustment.extract_dialogue_description')}
          icon={<Sparkles className="h-4 w-4 text-primary" />}
        />
      </motion.div>
      <motion.div variants={childVariants}>
        <SwitchItem
          id="long_generating"
          checked={isLongGenerating}
          onCheckedChange={setIsLongGenerating}
          disabled={disabled || isExtract}
          label={t('home:step.content-adjustment.long_generating')}
          description={t('home:step.content-adjustment.long_generating_description')}
          icon={<Wand2 className="h-4 w-4 text-primary" />}
        />
      </motion.div>
    </div>
  )
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  outputLang,
  setOutputLang,
  disabled,
}) => {
  const { t } = useClientTranslation()

  return (
    <div className='flex flex-col gap-2.5'>
      <motion.div variants={childVariants}>
        <Label
          htmlFor='output-language'
          className="text-sm flex items-center gap-2"
        >
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          {t('home:step.content-adjustment.output_language_label')}
        </Label>
      </motion.div>
      <motion.div variants={childVariants}>
        <Select
          value={outputLang}
          onValueChange={setOutputLang}
          disabled={disabled}
        >
          <SelectTrigger
            className="w-full transition-all duration-300 hover:ring-2 hover:ring-primary/50 disabled:opacity-50 disabled:hover:ring-0"
          >
            <SelectValue
              id='output-language'
              placeholder={t('home:step.content-adjustment.output_language_placeholder')}
            />
          </SelectTrigger>
          <SelectContent>
            <div className="max-h-[300px] overflow-y-auto">
              {languageList.map((lang) => (
                <SelectItem
                  key={lang}
                  value={lang}
                  className="transition-colors duration-200 hover:bg-primary/10"
                >
                  {ISO6391.getNativeName(lang)}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </motion.div>
    </div>
  )
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  isGenerating,
  dialogueItems,
  onClick,
  onCancel,
}) => {
  const { t } = useClientTranslation()

  return (
    <motion.div variants={childVariants} className="flex gap-2">
      <Button
        className="flex-1 group relative overflow-hidden bg-gradient-to-br from-primary to-primary/90 transition-all duration-300 hover:from-primary/95 hover:to-primary disabled:from-gray-400 disabled:to-gray-400/90"
        onClick={onClick}
        disabled={isGenerating}
      >
        <span className="relative flex items-center justify-center gap-2">
          {isGenerating ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              {t('home:step.content-adjustment.generating_btn')}
            </>
          ) : (
            <>
              {dialogueItems.length > 0
                ? t('home:step.content-adjustment.regenerate_btn')
                : t('home:step.content-adjustment.generate_btn')}
              <Wand2 className='h-4 w-4 transition-transform duration-200 group-hover:rotate-12' />
            </>
          )}
        </span>
        <span className="absolute inset-0 flex items-center justify-center bg-primary/0 transition-colors duration-300 group-hover:bg-black/5" />
      </Button>

      {isGenerating && (
        <Button
          variant="destructive"
          onClick={onCancel}
          className="group relative overflow-hidden"
        >
          <span className="relative flex items-center justify-center gap-2">
            {t('home:step.content-adjustment.cancel_btn')}
            <X className='h-4 w-4' />
          </span>
        </Button>
      )}
    </motion.div>
  )
}
