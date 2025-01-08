import { useSearchStore } from '@/app/stores/use-search-store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PreviewDialogProps } from '../types'

export function PreviewDialog({ t }: PreviewDialogProps) {
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isPreviewError, setIsPreviewError] = useState(false)
  const [previewErrorMessage, setPreviewErrorMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { selectedPreview, setSelectedPreview } = useSearchStore(state => ({
    selectedPreview: state.selectedPreview,
    setSelectedPreview: state.setSelectedPreview
  }))

  useEffect(() => {
    if (selectedPreview) {
      console.log('Setting preview URL for:', selectedPreview)
      setIsPreviewLoading(true)
      setIsPreviewError(false)
      const newPreviewUrl = `/api/preview?url=${encodeURIComponent(selectedPreview)}`
      console.log('New preview URL:', newPreviewUrl)
      setPreviewUrl(newPreviewUrl)
    }
  }, [selectedPreview])

  return (
    <Dialog
      open={!!selectedPreview}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedPreview(null)
          setPreviewUrl(null)
          setIsPreviewLoading(false)
          setIsPreviewError(false)
          setPreviewErrorMessage('')
        } else {
          setSelectedPreview(selectedPreview)
        }
      }}
    >
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('home:step.asset-type.preview_title')}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 relative">
          {selectedPreview && previewUrl && (
            <>
              {/* Loading State */}
              {isPreviewLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('home:step.asset-type.loading_preview')}
                  </p>
                </div>
              )}

              {/* Error State */}
              {isPreviewError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                  <div className="flex flex-col items-center justify-center p-4 text-center max-w-md">
                    <p className="text-sm font-medium text-destructive mb-2">
                      {previewErrorMessage}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedPreview, '_blank')}
                    >
                      {t('home:step.asset-type.open_in_new_tab')}
                    </Button>
                  </div>
                </div>
              )}

              <iframe
                key={previewUrl}
                src={previewUrl}
                className="w-full h-full min-h-[60vh] rounded-md"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                onError={() => {
                  console.log('iframe error event triggered')
                  setIsPreviewLoading(false)
                  setIsPreviewError(true)
                  setPreviewErrorMessage(t('home:step.asset-type.failed_to_load_preview'))
                }}
                onLoad={(e) => {
                  console.log('iframe load event triggered')
                  const iframe = e.target as HTMLIFrameElement

                  try {
                    if (!iframe.contentWindow) {
                      throw new Error('No content window')
                    }

                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document

                    // Check if there's content
                    const hasContent = iframeDoc &&
                      iframeDoc.documentElement &&
                      iframeDoc.documentElement.innerHTML.trim() !== ''

                    if (!hasContent) {
                      throw new Error('Empty content')
                    }

                    setIsPreviewLoading(false)
                    setIsPreviewError(false)
                  } catch (err) {
                    console.error('Preview error:', err)
                    setIsPreviewLoading(false)
                    setIsPreviewError(true)
                    setPreviewErrorMessage(t('home:step.asset-type.preview_access_error'))
                  }
                }}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
