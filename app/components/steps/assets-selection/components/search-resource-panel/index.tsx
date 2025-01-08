import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { useSearchStore } from '@/app/stores/use-search-store'
import { useCallback, useEffect, useRef } from 'react'
import { EditMode } from './components/edit-mode'
import { PreviewDialog } from './components/preview-dialog'
import { SearchMode } from './components/search-mode'
import { SearchResourcePanelProps } from './types'

export function SearchResourcePanel({
  onAddResources,
  isLoadingContent,
  editingResource,
  onResourceSelect,
}: SearchResourcePanelProps) {
  const { t } = useClientTranslation()
  const selectedUrls = useSearchStore(state => state.selectedUrls)
  const prevSelectedUrlsRef = useRef<string[]>([])

  useEffect(() => {
    const prevSelectedUrls = prevSelectedUrlsRef.current
    const hasChanged = selectedUrls.length !== prevSelectedUrls.length ||
      selectedUrls.some((url, index) => url !== prevSelectedUrls[index])

    if (hasChanged && onResourceSelect) {
      prevSelectedUrlsRef.current = selectedUrls
      onResourceSelect(selectedUrls)
    }
  }, [selectedUrls, onResourceSelect])

  const handleEditModeResourceSelect = useCallback((urls: string[], content?: string) => {
    if (onResourceSelect) {
      onResourceSelect(urls, content)
    }
  }, [onResourceSelect])

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      {editingResource?.type === 'search' ? (
        <EditMode
          editingResource={editingResource}
          onResourceSelect={handleEditModeResourceSelect}
          t={t}
        />
      ) : (
        <SearchMode t={t} />
      )}

      <PreviewDialog t={t} />
    </div>
  )
}
