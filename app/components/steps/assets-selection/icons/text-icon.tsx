import { cn } from '@/lib/utils'
import { Text as LucideTextIcon } from 'lucide-react'

export const TextIcon = ({ className }: { className?: string }) => {
  return <LucideTextIcon className={cn('h-4 w-4 shrink-0', className)} />
}
