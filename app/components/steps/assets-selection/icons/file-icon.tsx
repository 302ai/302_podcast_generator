import { cn } from '@/lib/utils'
import { FileIcon as LucideFileIcon } from 'lucide-react'

export const FileIcon = ({ className }: { className?: string }) => {
  return <LucideFileIcon className={cn('h-4 w-4 shrink-0', className)} />
}
