import { Checkbox } from '@/components/ui/checkbox'
import { SearchResult } from '@/lib/api/search'
import { memo } from 'react'
import { UseTranslationReturnType } from '@/types/auth'

interface SearchResultItemProps {
  result: SearchResult
  isSelected: boolean
  isPreview: boolean
  onSelect: (url: string) => void
  onPreview: (url: string) => void
  t: UseTranslationReturnType
}

export const SearchResultItem = memo(function SearchResultItem({
  result,
  isSelected,
  isPreview,
  onSelect,
  onPreview,
  t
}: SearchResultItemProps) {
  return (
    <div
      className={`w-full flex items-start gap-2.5 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-all duration-200 outline-none active:scale-[0.99] ${
        isPreview ? 'bg-muted/30 ring-1 ring-primary/20 shadow-sm' : ''
      }`}
      onClick={() => onPreview(result.url)}
      tabIndex={0}
      role="button"
    >
      <div onClick={(e) => {
        e.stopPropagation()
      }}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => {
            onSelect(result.url)
          }}
          className="h-4 w-4 mt-0.5 flex-shrink-0"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium truncate max-w-full">{result.title}</h3>
          {result.meta?.provider && (
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-medium whitespace-nowrap">
              {t('home:step.asset-type.provider_' + result.meta.provider.toLowerCase())}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate max-w-full mt-1">
          {result.url}
        </p>
        {result.snippet && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 break-words">
            {result.snippet}
          </p>
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isPreview === nextProps.isPreview &&
    prevProps.result.url === nextProps.result.url &&
    prevProps.result.title === nextProps.result.title &&
    prevProps.result.snippet === nextProps.result.snippet &&
    prevProps.result.meta?.provider === nextProps.result.meta?.provider
  )
})

SearchResultItem.displayName = 'SearchResultItem'
