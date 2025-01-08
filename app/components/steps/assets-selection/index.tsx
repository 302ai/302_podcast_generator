import { useClientTranslation } from '@/app/hooks/use-client-translation'
import useFileUpload from '@/app/hooks/use-file-upload'
import { Resource, ResourceType, usePodcastInfoStore } from '@/app/stores/use-podcast-info-store'
import { useSearchStore } from '@/app/stores/use-search-store'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createWebsiteReader } from '@/lib/api/reader'
import { logger } from '@/lib/logger'
import { isValidUrl } from '@/lib/url'
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSessionStorageState } from 'ahooks'
import { Loader2, Menu, Upload, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { SearchResourcePanel } from './components/search-resource-panel'
import { SortableResourceItem } from './components/sortable-resource-item'
import { AssetsSelectionPanelProps } from './types'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export const AssetsSelectionPanel = ({ stepper }: AssetsSelectionPanelProps) => {
  const { t } = useClientTranslation()
  const [showSidebar, setShowSidebar] = useState(false)

  const [isEditingResource, setIsEditingResource] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingUrls, setPendingUrls] = useState<string[]>([])

  const [newResource, setNewResource] = useSessionStorageState<Partial<Resource>>('newResource', {
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

  const {
    selectedUrls,
    searchResults,
    setSearchResults,
    searchKeywords,
    setSearchKeywords,
    selectedProviders,
    setSelectedProviders,
    searchDescription,
    setSearchDescription,
    resetSearch
  } = useSearchStore()

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
    if (!newResource) {
      toast.error(t('home:step.asset-type.resource_empty_error'))
      return
    }

    if (newResource.type !== 'search' && !newResource.content) {
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

    setResources(
      resources.map((r) =>
        r.id === newResource.id
          ? {
              ...r,
              ...newResource,
              id: r.id,
              content: newResource.content || r.content
            } as Resource
          : r
      )
    )

    setIsEditingResource(false)
    setNewResource({ type: 'text', content: '' })
    toast.success(t('home:step.asset-type.resource_edit_success'))
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

  const handleAddSearchResources = async (urls: string[]) => {
    await processAddResources(urls)
  }

  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 })
  const [currentProcessingUrl, setCurrentProcessingUrl] = useState('')
  const [processedResults, setProcessedResults] = useState<{
    success: string[];
    failed: string[];
  }>({ success: [], failed: [] });

  const processAddResources = async (urls: string[]) => {
    const reader = createWebsiteReader()
    const existingUrls = new Set(resources.map(r => r.url))
    const uniqueUrls = urls.filter(url => !existingUrls.has(url))

    if (uniqueUrls.length === 0) return

    setIsLoadingContent(true)
    const newResources: Resource[] = []
    const successUrls: string[] = []
    const failedUrls: string[] = []
    const total = uniqueUrls.length
    setProcessProgress({ current: 0, total })
    setProcessedResults({ success: [], failed: [] })

    try {
      for (let i = 0; i < uniqueUrls.length; i++) {
        const url = uniqueUrls[i]
        setProcessProgress(prev => ({ ...prev, current: i + 1 }))
        setCurrentProcessingUrl(url)

        try {
          const searchResult = searchResults.find(r => r.url === url)
          const content = await reader.readToMarkdown(url)
          if (content && searchResult) {
            newResources.push({
              id: Date.now().toString() + Math.random(),
              type: 'search',
              content,
              url,
              title: searchResult.title,
              meta: {
                provider: searchResult.meta?.provider || selectedProviders[0],
                keywords: searchResult.meta?.keywords || searchKeywords,
                searchDescription
              }
            })
            successUrls.push(url)
            setProcessedResults(prev => ({
              ...prev,
              success: [...prev.success, url]
            }))
          }
        } catch (error) {
          console.error(`Failed to read content from ${url}:`, error)
          failedUrls.push(url)
          setProcessedResults(prev => ({
            ...prev,
            failed: [...prev.failed, url]
          }))
        }
      }

      if (newResources.length > 0) {
        setResources([...resources, ...newResources])
        toast.success(t('home:step.asset-type.resource_add_success'))
      }

      if (failedUrls.length > 0) {
        const failedTitles = failedUrls.map(url => {
          const result = searchResults.find(r => r.url === url);
          return result?.title || url;
        });
        toast.error(t('home:step.asset-type.resource_read_error_with_titles', {
          count: failedUrls.length,
          titles: failedTitles.join(', ')
        }))
      }

      // toast.success(t('home:step.asset-type.processing_complete'))
    } finally {
      setIsLoadingContent(false)
      setNewResource({ type: 'search', content: '' })
      resetSearch()
      setProcessProgress({ current: 0, total: 0 })
      setCurrentProcessingUrl('')
      setTimeout(() => {
        setProcessedResults({ success: [], failed: [] })
      }, 5000)
    }
  }

  const renderProgress = () => {
    if (!isLoadingContent || processProgress.total === 0) return null;

    const progress = (processProgress.current / processProgress.total) * 100;
    const currentSearchResult = searchResults.find(r => r.url === currentProcessingUrl);
    const currentTitle = currentSearchResult?.title || currentProcessingUrl;

    return (
      <div className="fixed bottom-24 right-4 z-50 w-96 bg-card p-4 rounded-lg border shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-medium">{t('home:step.asset-type.processing_title')}</h3>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            {t('home:step.asset-type.processing_resources', {
              current: processProgress.current,
              total: processProgress.total
            })}
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground truncate">
            {t('home:step.asset-type.processing_resource', { url: currentTitle })}
          </div>
        </div>

        {(processedResults.success.length > 0 || processedResults.failed.length > 0) && (
          <div className="space-y-2 pt-2 border-t">
            {processedResults.success.length > 0 && (
              <div className="text-xs text-green-500">
                {t('home:step.asset-type.processed_success_count', { count: processedResults.success.length })}
              </div>
            )}
            {processedResults.failed.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-red-500">
                  {t('home:step.asset-type.processed_failed_count', { count: processedResults.failed.length })}
                </div>
                <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                  {processedResults.failed.map((url, index) => {
                    const result = searchResults.find(r => r.url === url);
                    return (
                      <div key={index} className="truncate">
                        {result?.title || url}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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

  const handleSearchResourceSelect = async (urls: string[], content?: string) => {
    if (isEditingResource) {
      const selectedResource = resources.find(r => r.url === urls[0])
      setNewResource(prev => ({
        ...prev,
        type: 'search',
        url: urls[0],
        content: content || selectedResource?.content || prev?.content || '',
        title: selectedResource?.title,
        meta: selectedResource?.meta
      }))
    } else {
      const selectedResource = searchResults.find(r => r.url === urls[0])
      if (selectedResource) {
        setNewResource(prev => ({
          ...prev,
          type: 'search',
          url: urls[0],
          content: content || selectedResource.snippet || '',
          title: selectedResource.title,
          meta: {
            provider: selectedResource.meta?.provider || selectedProviders[0],
            keywords: selectedResource.meta?.keywords || searchKeywords,
            searchDescription
          }
        }))
      }
    }
  }

  const handleAddClick = () => {
    if (isEditingResource) {
      handleUpdateResource()
    } else if (newResource?.type === 'search') {
      if (selectedUrls.length === searchResults.length) {
        processAddResources(selectedUrls)
      } else {
        setPendingUrls(selectedUrls)
        setShowConfirmDialog(true)
      }
    } else {
      handleAddResource()
    }
  }

  return (
    <>
      <div className='flex flex-1 flex-col min-h-0 overflow-hidden relative'>
        {renderProgress()}
        {/* Mobile sidebar toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-50"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile sidebar overlay */}
        {showSidebar && (
          <div
            className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <div className="flex flex-1 min-h-0 p-2">
          {/* Desktop resizable panels */}
          <div className="hidden md:block w-full h-[calc(100vh-13rem)]">
            <PanelGroup direction="horizontal" className="h-full">
              <Panel defaultSize={30} minSize={20} maxSize={50}>
                <div className={cn(
                  'h-full',
                  'flex flex-col overflow-hidden border bg-card shadow-sm rounded-xl'
                )}>
                  <div className="p-4 border-b flex-shrink-0">
                    <h2 className='text-lg font-semibold'>
                      {t('home:step.asset-type.resource_list_title')}
                    </h2>
                  </div>
                  <div className='flex-1 overflow-y-auto p-4'>
                    {resources.length === 0 ? (
                      <div className='flex h-full items-center justify-center'>
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
                          <div className="space-y-2">
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
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="w-4 flex items-center justify-center">
                <div className="w-1 h-16 rounded-full bg-border hover:bg-border/90 transition-colors cursor-col-resize" />
              </PanelResizeHandle>

              <Panel minSize={50}>
                <div className='h-full'>
                  {/* Right panel: Resource editor */}
                  <div className='flex flex-col h-full overflow-hidden border bg-card shadow-sm rounded-xl'>
                    <div className="p-4 border-b flex-shrink-0">
                      <h2 className='text-lg font-semibold'>
                        {isEditingResource
                          ? t('home:step.asset-type.resource_edit_title')
                          : t('home:step.asset-type.resource_add_title')}
                      </h2>
                    </div>
                    <div className='flex-1 overflow-y-auto p-4'>
                      <div className='flex flex-col h-full gap-4'>
                        <div className='flex flex-col gap-2 flex-shrink-0'>
                          <Label htmlFor='asset-type' className='self-start'>
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
                              <SelectItem value='search'>
                                {t('home:step.asset-type.resource_type_search')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='flex-1 flex flex-col min-h-0'>
                          {newResource?.type === 'search' ? (
                            <div className='flex-1 min-h-0 overflow-auto'>
                              <SearchResourcePanel
                                onAddResources={handleAddSearchResources}
                                isLoadingContent={isLoadingContent}
                                editingResource={isEditingResource ? newResource as Resource : undefined}
                                onResourceSelect={handleSearchResourceSelect}
                              />
                            </div>
                          ) : newResource?.type === 'text' && (
                            <div className='flex flex-col flex-1 gap-2'>
                              <Label htmlFor='resource-text' className='flex-shrink-0'>
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
                            </div>
                          )}
                          {newResource?.type === 'file' && (
                            <div
                              {...getRootProps()}
                              className={cn(
                                'flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                                isDragActive
                                  ? 'border-primary bg-primary/10'
                                  : 'border-muted-foreground/30 hover:border-primary'
                              )}
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
                            <div className='flex flex-col flex-1 gap-2'>
                              <Label htmlFor='resource-url' className='flex-shrink-0'>
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
                            </div>
                          )}
                        </div>
                        <div className='flex w-full justify-end gap-2 flex-shrink-0'>
                          {isEditingResource && (
                            <Button variant='outline' onClick={handleCancelEditResource}>
                              {t('home:step.asset-type.resource_cancel_button')}
                            </Button>
                          )}
                          <Button
                            variant='default'
                            onClick={handleAddClick}
                            disabled={
                              isLoading ||
                              isLoadingContent ||
                              (!isEditingResource && newResource?.type === 'search' && selectedUrls.length === 0) ||
                              (!isEditingResource && newResource?.type !== 'search' && !newResource?.content)
                            }
                          >
                            {isLoadingContent ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                {t('home:step.asset-type.processing_content')}
                              </>
                            ) : (
                              isEditingResource
                                ? t('home:step.asset-type.resource_edit_button')
                                : t('home:step.asset-type.resource_add_button')
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </div>

          {/* Mobile sidebar */}
          <div className={cn(
            'md:hidden fixed inset-y-0 left-0 z-40 w-80 bg-background transform transition-transform duration-200 ease-in-out',
            'flex flex-col overflow-hidden shadow-lg',
            'h-full',
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          )}>
            <div className="px-4 py-3 border-b bg-muted/40 flex items-center justify-between">
              <h2 className='text-lg font-semibold'>
                {t('home:step.asset-type.resource_list_title')}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-muted"
                onClick={() => setShowSidebar(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className='flex-1 min-h-0 overflow-y-auto p-4'>
              {resources.length === 0 ? (
                <div className='flex h-full items-center justify-center'>
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
                    <div className="space-y-3">
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
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Mobile main content */}
          <div className='md:hidden flex-1 p-4 py-0 min-h-0 overflow-auto'>
            <div className='flex flex-col h-full overflow-hidden rounded-xl border bg-card p-4 shadow-sm'>
              <h2 className='shrink-0 mb-4 text-lg font-semibold'>
                {isEditingResource
                  ? t('home:step.asset-type.resource_edit_title')
                  : t('home:step.asset-type.resource_add_title')}
              </h2>
              <div className='flex flex-1 min-h-0 flex-col gap-4 overflow-hidden'>
                <div className='flex w-full flex-col gap-2 shrink-0'>
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
                      <SelectItem value='search'>
                        {t('home:step.asset-type.resource_type_search')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex w-full flex-1 min-h-0 flex-col gap-2 overflow-hidden'>
                  {newResource?.type === 'search' ? (
                    <div className='flex-1 min-h-0 overflow-auto'>
                      <SearchResourcePanel
                        onAddResources={handleAddSearchResources}
                        isLoadingContent={isLoadingContent}
                        editingResource={isEditingResource ? newResource as Resource : undefined}
                        onResourceSelect={handleSearchResourceSelect}
                      />
                    </div>
                  ) : newResource?.type === 'text' && (
                    <>
                      <Label htmlFor='resource-text' className='shrink-0'>
                        {t('home:step.asset-type.resource_text_label')}
                      </Label>
                      <Textarea
                        id='resource-text'
                        className='flex-1 min-h-[200px] resize-none z-10'
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
                <div className='flex w-full justify-end gap-2 shrink-0'>
                  {isEditingResource && (
                    <Button variant='outline' onClick={handleCancelEditResource}>
                      {t('home:step.asset-type.resource_cancel_button')}
                    </Button>
                  )}
                  <Button
                    variant='default'
                    onClick={handleAddClick}
                    disabled={
                      isLoading ||
                      isLoadingContent ||
                      (!isEditingResource && newResource?.type === 'search' && selectedUrls.length === 0) ||
                      (!isEditingResource && newResource?.type !== 'search' && !newResource?.content)
                    }
                  >
                    {isLoadingContent ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        {t('home:step.asset-type.processing_content')}
                      </>
                    ) : (
                      isEditingResource
                        ? t('home:step.asset-type.resource_edit_button')
                        : t('home:step.asset-type.resource_add_button')
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='shrink-0 mt-4 flex justify-end px-4'>
          <Button onClick={() => stepper.next()} disabled={!canNext}>
            {t('home:step.next')}
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('home:step.asset-type.confirm_add_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('home:step.asset-type.confirm_add_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('home:step.asset-type.confirm_add_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await processAddResources(pendingUrls)
                setShowConfirmDialog(false)
              }}
            >
              {t('home:step.asset-type.confirm_add_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
