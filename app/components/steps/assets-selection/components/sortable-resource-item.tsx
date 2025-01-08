import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Grip, Pencil, Trash } from 'lucide-react'
import { SortableResourceItemProps } from '../types'
import { FileIcon, LinkIcon, TextIcon } from '../icons'

import { useClientTranslation } from '@/app/hooks/use-client-translation'


export const SortableResourceItem = ({
  id,
  resource,
  isEditingResource,
  onEdit,
  onDelete,
}: SortableResourceItemProps) => {
  const { t } = useClientTranslation()
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getResourceIcon = (resource: SortableResourceItemProps['resource']) => {
    switch (resource.type) {
      case 'file':
        return <FileIcon className="size-4 text-blue-500" />
      case 'url':
        return <LinkIcon className="size-4 text-emerald-500" />
      case 'text':
        return <TextIcon className="size-4 text-amber-500" />
      case 'search':
        return <LinkIcon className="size-4 text-violet-500" />
      default:
        return <FileIcon className="size-4 text-blue-500" />
    }
  }

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'file':
      return { label: t('home:step.asset-type.resource_type_file'), className: 'bg-blue-500/10 text-blue-600' }
    case 'url':
      return { label: t('home:step.asset-type.resource_type_url'), className: 'bg-emerald-500/10 text-emerald-600' }
    case 'text':
      return { label: t('home:step.asset-type.resource_type_text'), className: 'bg-amber-500/10 text-amber-600' }
    case 'search':
      return { label: t('home:step.asset-type.resource_type_search'), className: 'bg-violet-500/10 text-violet-600' }
      default:
        return { label: type, className: 'bg-primary/10 text-primary' }
    }
  }

  const typeInfo = getResourceTypeLabel(resource.type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        '@container',
        'group relative flex w-full items-start gap-2 overflow-hidden rounded-lg border bg-card/30 p-2',
        'hover:bg-card/60 hover:shadow-sm',
        'focus-within:ring-1 focus-within:ring-ring',
        isEditingResource && 'bg-card ring-1 ring-ring'
      )}
    >
      <div
        className={cn(
          'flex h-full items-center justify-center cursor-move py-1',
          'text-muted-foreground/30 hover:text-muted-foreground/60',
          'focus:outline-none'
        )}
        {...attributes}
        {...listeners}
      >
        <Grip size={12} />
      </div>

      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-1.5 flex-wrap'>
          <div className='flex items-center gap-1'>
            <span className='shrink-0'>{getResourceIcon(resource)}</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none',
              typeInfo.className
            )}>
              {typeInfo.label}
            </span>
          </div>
          {resource.meta?.provider && (
            <span className='px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full text-[10px] font-medium leading-none'>
              {t('home:step.asset-type.provider_' + resource.meta.provider.toLowerCase())}
            </span>
          )}
          <div className='flex gap-0.5 ml-auto'>
            <Button
              variant='ghost'
              size='icon'
              className={cn(
                'size-5 shrink-0 rounded-md',
                '@[400px]:(opacity-0 group-hover:opacity-100)',
                'hover:bg-muted hover:text-foreground',
                'focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring'
              )}
              onClick={() => onEdit(resource)}
            >
              <Pencil className='size-3' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className={cn(
                'size-5 shrink-0 rounded-md',
                '@[400px]:(opacity-0 group-hover:opacity-100)',
                'hover:bg-destructive/10 hover:text-destructive',
                'focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-destructive'
              )}
              onClick={() => onDelete(resource.id)}
            >
              <Trash className='size-3' />
            </Button>
          </div>
        </div>
        <div
          onClick={() => {
            if (resource.type === 'url' || resource.type === 'search') {
              window.open(resource.url || resource.content, '_blank')
            }
          }}
          className={cn(
            'text-sm text-foreground/80 break-all leading-normal mt-1',
            '@[300px]:line-clamp-2 @[200px]:line-clamp-3',
            (resource.type === 'url' || resource.type === 'search') &&
              'cursor-pointer hover:text-primary'
          )}
        >
          {resource.type === 'search' ? resource.title || resource.content : resource.content}
        </div>
        {resource.type === 'search' && resource.url && (
          <div className='mt-0.5 text-xs text-muted-foreground truncate'>
            {resource.url}
          </div>
        )}
      </div>
    </div>
  )
}
