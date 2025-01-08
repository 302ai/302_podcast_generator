import { Switch } from '@/components/ui/switch'
import { SwitchItemProps } from '../types'
import { motion } from 'framer-motion'

const itemVariants = {
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

export const SwitchItem: React.FC<SwitchItemProps> = ({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  icon,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className='flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30 transition-colors duration-300 hover:bg-secondary/50 disabled:opacity-50 disabled:hover:bg-secondary/30'
    >
      <div className='flex-1 space-y-1.5'>
        <div className='flex items-center gap-2'>
          {icon}
          <label
            htmlFor={id}
            className='text-sm font-medium leading-none cursor-pointer'
          >
            {label}
          </label>
        </div>
        <p className='text-sm text-muted-foreground leading-relaxed'>{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className='transition-all duration-300 hover:ring-2 hover:ring-primary/50 data-[state=checked]:bg-primary disabled:opacity-50 disabled:hover:ring-0'
      />
    </motion.div>
  )
}
