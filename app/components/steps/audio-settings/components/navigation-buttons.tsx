import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Button } from '@/components/ui/button'
import { Stepper } from '@/app/hooks/use-stepper'
import { motion } from 'framer-motion'
import { ArrowLeft, Wand2 } from 'lucide-react'

interface NavigationButtonsProps {
  stepper: Stepper
  handleSubmitTask: () => void
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: "easeOut",
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.1,
      ease: "easeIn"
    }
  }
}

const childVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.15,
      ease: "easeOut"
    }
  }
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  stepper,
  handleSubmitTask,
}) => {
  const { t } = useClientTranslation()

  const handleGenerate = () => {
    stepper.next()
    handleSubmitTask()
  }

  return (
    <motion.div
      layout
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className='flex items-center justify-between sm:justify-end gap-4 px-4'
    >
      <motion.div variants={childVariants}>
        <Button
          variant='ghost'
          onClick={() => stepper.prev()}
          className='group relative overflow-hidden transition-all duration-200 hover:bg-secondary/80'
        >
          <span className='relative flex items-center gap-2'>
            <ArrowLeft className='h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5' />
            {t('home:step.prev')}
          </span>
        </Button>
      </motion.div>
      <motion.div variants={childVariants}>
        <Button
          onClick={handleGenerate}
          className='group relative overflow-hidden bg-gradient-to-br from-primary to-primary/90 transition-all duration-200 hover:from-primary/95 hover:to-primary'
        >
          <span className='relative flex items-center gap-2'>
            {t('home:step.audio-settings.generate_btn')}
            <Wand2 className='h-4 w-4 transition-transform duration-200 group-hover:rotate-12' />
          </span>
          <span className='absolute inset-0 flex items-center justify-center bg-primary/0 transition-colors duration-200 group-hover:bg-black/5' />
        </Button>
      </motion.div>
    </motion.div>
  )
}
