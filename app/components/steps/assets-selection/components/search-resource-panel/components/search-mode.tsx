import { useSearchStore } from '@/app/stores/use-search-store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUnifiedSearchProvider } from '@/lib/api/search'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Keyboard, Loader2 } from 'lucide-react'
import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchFunctionality } from '../hooks/use-search-functionality'
import { SearchModeProps } from '../types'
import { SearchResultItem } from './search-result-item'
import { env } from 'next-runtime-env'

export function SearchMode({ t }: Pick<SearchModeProps, 't'>) {
  const apiKey = env('NEXT_PUBLIC_API_KEY') || ''
  const searchProvider = useMemo(() => createUnifiedSearchProvider(), [])
  const availableProviders = useMemo(() => searchProvider.getAvailableProviders(), [searchProvider])

  const {
    searchDescription,
    setSearchDescription,
    searchKeywords,
    setSearchKeywords,
    selectedProviders,
    toggleProvider,
    searchResults,
    setSearchResults,
    selectedUrls,
    selectedPreview,
    setSelectedPreview,
    isGeneratingKeywords,
    isSearching,
    setIsGeneratingKeywords,
    setIsSearching,
    toggleResultSelection,
    toggleSelectAll,
    deleteUnselectedResults,
    resetSearch,
    setSelectedUrls
  } = useSearchStore()

  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])

  const selectedResults = useMemo(() => new Set(selectedUrls), [selectedUrls])

  const {
    generateKeywords,
    handleSearch
  } = useSearchFunctionality({
    searchDescription,
    searchKeywords: selectedKeywords,
    setSearchKeywords,
    selectedProviders,
    setSearchResults,
    searchProvider,
    apiKey: apiKey || '',
    t,
    setIsGeneratingKeywords,
    setIsSearching
  })

  const toggleKeyword = useCallback((keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }, [])

  const toggleAllKeywords = useCallback(() => {
    setSelectedKeywords(prev =>
      prev.length === searchKeywords.length ? [] : [...searchKeywords]
    )
  }, [searchKeywords])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement | HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isGeneratingKeywords && searchDescription) {
      e.preventDefault()
      generateKeywords()
    }

    if (e.key === 'Escape' && selectedPreview) {
      e.preventDefault()
      setSelectedPreview(null)
    }
  }, [generateKeywords, isGeneratingKeywords, searchDescription, selectedPreview, setSelectedPreview])

  // Reset search state on unmount
  useEffect(() => {
    return () => {
      resetSearch()
    }
  }, [resetSearch])

  // Clear selected URLs when search results are empty
  useEffect(() => {
    if (searchResults.length === 0) {
      setSelectedUrls([])
    }
  }, [searchResults.length, setSelectedUrls])

  useEffect(() => {
    setSelectedKeywords([])
  }, [searchKeywords])

  const handleToggleSelection = useCallback((url: string) => {
    toggleResultSelection(url);
  }, [toggleResultSelection]);


  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    if (searchResults.length > 0) {
      setIsExpanded(false)
    }
  }, [searchResults.length])

  return (
    <div className="flex flex-col gap-2 h-full w-full overflow-hidden">
      {/* Search Panel */}
      <div className="flex-shrink-0 flex flex-col bg-card rounded-lg border shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <Label className="text-sm font-medium">
            {t('home:step.asset-type.search_description_label')}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 gap-1 hover:bg-muted/50"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="text-xs text-muted-foreground">
              {isExpanded ? t('home:step.asset-type.collapse') : t('home:step.asset-type.expand')}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Expandable Content */}
        <div className={cn(
          "flex flex-col gap-3 px-3",
          isExpanded ? "py-3" : "hidden"
        )}>
          {/* Search Input Section */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  className="flex-1 h-8 text-sm"
                  value={searchDescription}
                  onChange={(e) => setSearchDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('home:step.asset-type.search_description_placeholder')}
                />
                <Button
                  className="h-8 text-xs px-3 min-w-[80px] shrink-0"
                  onClick={handleSearch}
                  disabled={(!searchDescription && selectedKeywords.length === 0) || !selectedProviders.length || isSearching}
                >
                  {isSearching && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                  {t('home:step.asset-type.search_button')}
                </Button>
              </div>
              <Button
                variant="outline"
                className="h-8 text-xs whitespace-nowrap shrink-0"
                onClick={generateKeywords}
                disabled={!searchDescription || isGeneratingKeywords}
              >
                {isGeneratingKeywords && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {t('home:step.asset-type.generate_keywords_button')}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground pl-1">
              {selectedKeywords.length > 0
                ? t('home:step.asset-type.search_mode_keywords')
                : t('home:step.asset-type.search_mode_description')
              }
            </div>

            <div className="flex flex-col gap-1.5">
              {isGeneratingKeywords && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{t('home:step.asset-type.generating_keywords')}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                <Keyboard className="h-3 w-3 shrink-0" />
                <span>{t('home:step.asset-type.keyboard_shortcuts_info')}</span>
              </div>
            </div>
          </div>

          {/* Keywords and Providers Section */}
          <div className="space-y-2.5">
            {/* Keywords */}
            {searchKeywords.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t('home:step.asset-type.generated_keywords_label')}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllKeywords}
                    className="h-5 text-xs hover:bg-muted/50"
                  >
                    {selectedKeywords.length === searchKeywords.length
                      ? t('home:step.asset-type.deselect_all')
                      : t('home:step.asset-type.select_all')}
                  </Button>
                </div>
                <div className="w-full flex flex-wrap gap-1 p-1.5 bg-muted/50 rounded-md border max-h-20 overflow-y-auto">
                  {searchKeywords.map((keyword, index) => (
                    <button
                      key={`${keyword}-${index}`}
                      onClick={() => toggleKeyword(keyword)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs whitespace-nowrap transition-colors",
                        selectedKeywords.includes(keyword)
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Providers */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t('home:step.asset-type.search_providers_label')}:
              </Label>
              <div className="flex flex-wrap gap-1">
                {availableProviders.map((provider) => (
                  <div key={provider} className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded-md">
                    <Checkbox
                      id={provider}
                      checked={selectedProviders.includes(provider)}
                      onCheckedChange={() => toggleProvider(provider)}
                      className="h-3 w-3"
                    />
                    <Label htmlFor={provider} className="text-xs cursor-pointer">
                      {t('home:step.asset-type.provider_' + provider.toLowerCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="flex flex-col flex-1 min-h-0 border rounded-lg shadow-sm bg-card">
        {/* Results Header */}
        <div className="flex-shrink-0 px-2.5 py-2 border-b flex flex-wrap justify-between items-center gap-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="h-6 px-2 text-xs whitespace-nowrap"
            >
              {searchResults.every(r => selectedResults.has(r.url))
                ? t('home:step.asset-type.deselect_all')
                : t('home:step.asset-type.select_all')}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t('home:step.asset-type.selected_count', { count: selectedResults.size })}
            </span>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={deleteUnselectedResults}
              className="h-6 px-2 text-xs whitespace-nowrap"
            >
              {t('home:step.asset-type.delete_unselected')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetSearch}
              className="h-6 px-2 text-xs"
            >
              {t('home:step.asset-type.reset')}
            </Button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-2.5 space-y-2">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center h-28 gap-1.5">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    {t('home:step.asset-type.searching')}
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-28 gap-1.5 text-center">
                  <p className="text-sm text-muted-foreground font-medium">
                    {t('home:step.asset-type.no_results')}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {t('home:step.asset-type.try_adjusting_search')}
                  </p>
                </div>
              ) : (
                <>
                  {searchResults.map((result, index) => (
                    <SearchResultItem
                      key={`${result.url}-${index}`}
                      result={result}
                      isSelected={selectedResults.has(result.url)}
                      isPreview={selectedPreview === result.url}
                      onSelect={handleToggleSelection}
                      onPreview={setSelectedPreview}
                      t={t}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
