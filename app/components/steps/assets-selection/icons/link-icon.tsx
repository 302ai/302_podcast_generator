import { cn } from '@/lib/utils'
import { LinkIcon as LucideLinkIcon } from 'lucide-react'

export const LinkIcon = ({ className }: { className?: string }) => {
  return <LucideLinkIcon className={cn('h-4 w-4 shrink-0', className)} />
}
