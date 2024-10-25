import { useClientTranslation } from '@/app/hooks/use-client-translation'
import useFileUpload from '@/app/hooks/use-file-upload'
import { Stepper } from '@/app/hooks/use-stepper'
import {
  Resource,
  ResourceType,
  usePodcastInfoStore,
} from '@/app/stores/use-podcast-info-store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { logger } from '@/lib/logger'
import { isValidUrl } from '@/lib/url'
import { cn } from '@/lib/utils'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSessionStorageState } from 'ahooks'
import {
  FileIcon,
  Grip,
  LinkIcon,
  Loader2,
  Pencil,
  Text,
  Trash,
  Upload,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
interface SortableResourceItemProps {
  id: string
  resource: Resource
  isEditingResource: boolean
  onEdit: (resource: Resource) => void
  onDelete: (id: string) => void
}

const SortableResourceItem = ({
  id,
  resource,
  isEditingResource,
  onEdit,
  onDelete,
}: SortableResourceItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getResourceIcon = (resource: Resource) => {
    switch (resource.type) {
      case 'file':
        return <FileIcon className='h-4 w-4 shrink-0' />
      case 'url':
        return <LinkIcon className='h-4 w-4 shrink-0' />
      case 'text':
        return <Text className='h-4 w-4 shrink-0' />
      default:
        return <FileIcon className='h-4 w-4 shrink-0' />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'mb-2 flex w-full shrink-0 items-center space-x-2 overflow-hidden rounded border bg-background p-2 hover:bg-secondary',
        isEditingResource && 'bg-secondary'
      )}
    >
      <Grip
        className='shrink-0 cursor-move focus:outline-none'
        size={16}
        {...attributes}
        {...listeners}
      />
      {getResourceIcon(resource)}

      <div
        onClick={() => {
          if (resource.type === 'url') {
            window.open(resource.content, '_blank')
          }
        }}
        className={cn(
          'flex-1 truncate text-sm text-secondary-foreground',

          resource.type === 'url' &&
            'cursor-pointer text-primary underline decoration-primary hover:text-primary/80',
          resource.type === 'file' &&
            'text-primary underline decoration-primary'
        )}
      >
        {resource.content}
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='size-8 shrink-0 rounded-lg p-0'
        onClick={() => onEdit(resource)}
      >
        <Pencil className='h-4 w-4' />
      </Button>
      <Button
        variant='destructive'
        size='icon'
        className='size-8 shrink-0 rounded-lg p-0 hover:bg-destructive/80'
        onClick={() => onDelete(resource.id)}
      >
        <Trash className='h-4 w-4' />
      </Button>
    </div>
  )
}

export const AssetsSelectionPanel = ({ stepper }: { stepper: Stepper }) => {
  const { t } = useClientTranslation()

  const [isEditingResource, setIsEditingResource] = useState(false)
  const [newResource, setNewResource] = useSessionStorageState<
    Partial<Resource>
  >('newResource', {
    defaultValue: {
      type: 'text',
      content: '',
    },
    serializer: (value) => {
      if (value.type === 'file') {
        return JSON.stringify({ ...value, file: undefined })
      }
      return JSON.stringify(value)
    },
    deserializer: (value) => {
      return JSON.parse(value)
    },
  })

  const { resources, setResources } = usePodcastInfoStore((state) => ({
    resources: state.resources,
    setResources: state.setResources,
  }))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setResources((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleEditResource = (resource: Resource) => {
    setIsEditingResource(true)
    setNewResource(resource)
  }

  const handleUpdateResource = () => {
    if (!newResource || newResource.content === '') {
      toast.error(t('home:step.asset-type.resource_empty_error'))
      return
    }
    if (newResource.type === 'url' && !isValidUrl(newResource.content || '')) {
      toast.error(t('home:step.asset-type.resource_url_invalid_error'))
      return
    }
    if (newResource.type === 'file' && !newResource.url) {
      toast.error(t('home:step.asset-type.resource_file_empty_error'))
      return
    }
    if (newResource.content) {
      setResources(
        resources.map((r) =>
          r.id === newResource.id
            ? ({ ...newResource, id: r.id } as Resource)
            : r
        )
      )
      setIsEditingResource(false)
      setNewResource({ type: 'text', content: '' })
      toast.success(t('home:step.asset-type.resource_edit_success'))
    }
  }

  const handleCancelEditResource = () => {
    setIsEditingResource(false)
    setNewResource({ type: 'text', content: '' })
  }

  const handleAddResource = () => {
    if (!newResource || newResource.content === '') {
      toast.error(t('home:step.asset-type.resource_empty_error'))
      return
    }
    if (newResource.type === 'url' && !isValidUrl(newResource.content || '')) {
      toast.error(t('home:step.asset-type.resource_url_invalid_error'))
      return
    }
    if (newResource.type === 'file' && !newResource.url) {
      toast.error(t('home:step.asset-type.resource_file_empty_error'))
      return
    }
    if (newResource.content) {
      const resource = { ...newResource, id: Date.now().toString() } as Resource
      setResources([...resources, resource])
      setNewResource((prev) => ({ ...prev, content: '', url: undefined }))
      toast.success(t('home:step.asset-type.resource_add_success'))
    }
  }

  const handleDeleteResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id))
  }

  const { upload, isLoading } = useFileUpload()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        try {
          const res = await upload({ prefix: 'podcast', file })
          if (!res) {
            toast.error(t('home:step.asset-type.resource_file_upload_error'))
            return
          }
          const {
            data: { url },
          } = res
          if (url) {
            setNewResource({
              ...newResource,
              type: 'file',
              content: file.name,
              url,
            })
          }
        } catch (error) {
          logger.error(error)
          toast.error(t('home:step.asset-type.resource_file_upload_error'))
        }
      }
    },
    [newResource, setNewResource, upload, t]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const canNext = useMemo(() => resources.length > 0, [resources])

  return (
    <div className='flex flex-1 flex-col'>
      <div className='grid h-full w-full flex-1 grid-cols-1 grid-rows-2 gap-4 space-y-2 overflow-hidden p-4 md:h-auto md:grid-cols-[1fr_2fr] md:grid-rows-1 md:space-y-0'>
        <div className='flex flex-col overflow-y-auto rounded border p-4'>
          <h2 className='mb-4 text-lg font-semibold'>
            {t('home:step.asset-type.resource_list_title')}
          </h2>
          {resources.length === 0 ? (
            <div className='flex flex-1 items-center justify-center'>
              <p className='text-center text-muted-foreground'>
                {t('home:step.asset-type.resource_list_empty_description')}
              </p>
            </div>
          ) : (
            <DndContext
              onDragEnd={handleDragEnd}
              sensors={sensors}
              collisionDetection={closestCenter}
            >
              <SortableContext
                items={resources}
                strategy={verticalListSortingStrategy}
              >
                {resources.map((resource) => (
                  <SortableResourceItem
                    key={resource.id}
                    id={resource.id}
                    resource={resource as Resource}
                    isEditingResource={
                      isEditingResource && newResource?.id === resource.id
                    }
                    onEdit={handleEditResource}
                    onDelete={handleDeleteResource}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className='flex flex-col overflow-y-auto rounded border p-4'>
          <h2 className='mb-4 text-lg font-semibold'>
            {isEditingResource
              ? t('home:step.asset-type.resource_edit_title')
              : t('home:step.asset-type.resource_add_title')}
          </h2>
          <div className='flex flex-1 flex-col items-center justify-start gap-4'>
            <div className='flex w-full flex-col gap-2'>
              <Label htmlFor='asset-type' className='shrink-0 self-start'>
                {t('home:step.asset-type.resource_type_label')}
              </Label>
              <Select
                value={newResource?.type || 'text'}
                onValueChange={(value) => {
                  setNewResource({
                    type: value as ResourceType,
                  })
                }}
                disabled={isEditingResource}
              >
                <SelectTrigger id='asset-type' className='w-full'>
                  <SelectValue
                    placeholder={t(
                      'home:step.asset-type.resource_type_placeholder'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='text'>
                    {t('home:step.asset-type.resource_type_text')}
                  </SelectItem>
                  <SelectItem value='file'>
                    {t('home:step.asset-type.resource_type_file')}
                  </SelectItem>
                  <SelectItem value='url'>
                    {t('home:step.asset-type.resource_type_url')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex w-full flex-1 flex-col gap-2'>
              {newResource?.type === 'text' && (
                <>
                  <Label htmlFor='resource-text'>
                    {t('home:step.asset-type.resource_text_label')}
                  </Label>
                  <Textarea
                    id='resource-text'
                    className='flex-1 resize-none'
                    value={newResource?.content || ''}
                    onChange={(e) =>
                      setNewResource((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                  />
                </>
              )}
              {newResource?.type === 'file' && (
                <div
                  {...getRootProps()}
                  className={`flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/10'
                      : 'border-muted-foreground/30 hover:border-primary'
                  }`}
                >
                  <input
                    {...getInputProps({
                      accept:
                        'application/pdf,text/html,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/jpg,image/webp',
                    })}
                  />
                  {isLoading ? (
                    <Loader2 className='mx-auto h-12 w-12 animate-spin text-muted-foreground' />
                  ) : (
                    <Upload className='mx-auto h-12 w-12 text-muted-foreground' />
                  )}
                  <p className='mt-2 text-sm text-muted-foreground'>
                    {t('home:step.asset-type.resource_file_upload_description')}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {t('home:step.asset-type.resource_file_upload_support')}
                  </p>
                  {newResource.url && (
                    <p className='mt-2 text-sm text-primary'>
                      {newResource.content}
                    </p>
                  )}
                </div>
              )}
              {newResource?.type === 'url' && (
                <>
                  <Label htmlFor='resource-url'>
                    {t('home:step.asset-type.resource_url_label')}
                  </Label>
                  <Textarea
                    id='resource-url'
                    className='flex-1 resize-none'
                    value={newResource?.content || ''}
                    onChange={(e) =>
                      setNewResource((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                  />
                </>
              )}
            </div>
            <div className='flex w-full justify-end gap-2'>
              {isEditingResource && (
                <Button variant='outline' onClick={handleCancelEditResource}>
                  {t('home:step.asset-type.resource_cancel_button')}
                </Button>
              )}
              {!isEditingResource && (
                <Button
                  variant='default'
                  onClick={handleAddResource}
                  disabled={isLoading}
                >
                  {t('home:step.asset-type.resource_add_button')}
                </Button>
              )}
              {isEditingResource && (
                <Button
                  variant='default'
                  onClick={handleUpdateResource}
                  disabled={isLoading}
                >
                  {t('home:step.asset-type.resource_edit_button')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className='mb-4 flex justify-end'>
        <Button onClick={() => stepper.next()} disabled={!canNext}>
          {t('home:step.next')}
        </Button>
      </div>
    </div>
  )
}
